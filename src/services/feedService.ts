import mongoose, { type HydratedDocument } from "mongoose";
import { activityModel, type ActivityDocument } from "../models/activityModel";
import { followModel } from "../models/followModel";
import { userModel } from "../models/userModel";
import { ensureUserHandle } from "./userHandleService";
import type { User } from "../interfaces/user";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const FEED_BATCH_MULTIPLIER = 3;

export interface FeedActor {
  id: string;
  handle: string;
  name: string;
  avatarUrl?: string;
}

export interface FeedBookSnapshot {
  source: "open_library" | "custom";
  externalBookId?: string;
  title: string;
  author?: string;
  cover?: string;
  publishedYear?: number;
}

export interface FeedItem {
  id: string;
  type: ActivityDocument["type"];
  createdAt: string;
  actor: FeedActor;
  book: FeedBookSnapshot;
  rating?: number;
  reviewText?: string;
  isSpoiler?: boolean;
  status?: ActivityDocument["status"];
  previousStatus?: ActivityDocument["previousStatus"];
}

export interface FeedPageInfo {
  nextCursor?: string;
  hasMore: boolean;
}

export interface HomeFeedResponseData {
  items: FeedItem[];
  pageInfo: FeedPageInfo;
  meta: {
    followingCount: number;
    includeSelf: boolean;
  };
}

export interface HomeFeedQuery {
  limit?: number;
  cursor?: string;
  includeSelf?: boolean;
}

interface FeedCursorPayload {
  createdAt: string;
  id: string;
}

const clampLimit = (value?: number) => {
  if (!Number.isFinite(value) || !value || value < 1) {
    return DEFAULT_LIMIT;
  }

  return Math.min(MAX_LIMIT, Math.floor(value));
};

const decodeCursor = (cursor?: string): FeedCursorPayload | null => {
  if (!cursor) {
    return null;
  }

  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as Partial<FeedCursorPayload>;

    if (
      typeof parsed.createdAt !== "string" ||
      Number.isNaN(Date.parse(parsed.createdAt)) ||
      typeof parsed.id !== "string" ||
      !mongoose.isValidObjectId(parsed.id)
    ) {
      return null;
    }

    return {
      createdAt: parsed.createdAt,
      id: parsed.id
    };
  } catch {
    return null;
  }
};

const encodeCursor = (payload: FeedCursorPayload) =>
  Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");

const buildCursorFilter = (cursor?: string): Record<string, unknown> => {
  const decodedCursor = decodeCursor(cursor);

  if (!decodedCursor) {
    return {};
  }

  const createdAt = new Date(decodedCursor.createdAt);
  const objectId = new mongoose.Types.ObjectId(decodedCursor.id);

  return {
    $or: [
      { createdAt: { $lt: createdAt } },
      { createdAt, _id: { $lt: objectId } }
    ]
  };
};

const buildActorMap = async (actorIds: string[]) => {
  if (actorIds.length === 0) {
    return new Map<string, FeedActor>();
  }

  const users = await userModel.find({
    _id: { $in: actorIds },
    isProfilePublic: true
  });

  const actorMap = new Map<string, FeedActor>();

  for (const user of users) {
    const safeUser = await ensureUserHandle(user as HydratedDocument<User>);

    if (!safeUser.isProfilePublic || !safeUser.handle) {
      continue;
    }

    actorMap.set(safeUser._id.toString(), {
      id: safeUser._id.toString(),
      handle: safeUser.handle,
      name: safeUser.name,
      avatarUrl: safeUser.avatarUrl
    });
  }

  return actorMap;
};

const toFeedItem = (
  activity: ActivityDocument,
  actor: FeedActor
): FeedItem => {
  return {
    id: activity._id.toString(),
    type: activity.type,
    createdAt: activity.createdAt.toISOString(),
    actor,
    book: {
      source: activity.book.source,
      externalBookId: activity.externalBookId,
      title: activity.book.title,
      author: activity.book.author,
      cover: activity.book.cover,
      publishedYear: activity.book.publishedYear
    },
    rating: activity.rating,
    reviewText: activity.reviewText,
    isSpoiler: activity.isSpoiler,
    status: activity.status,
    previousStatus: activity.previousStatus
  };
};

export async function getHomeFeed(
  actorUserId: string,
  query: HomeFeedQuery
): Promise<HomeFeedResponseData> {
  if (!mongoose.isValidObjectId(actorUserId)) {
    throw new Error("INVALID_FEED_ACTOR");
  }

  const includeSelf = query.includeSelf !== false;
  const limit = clampLimit(query.limit);
  const followRelations = await followModel
    .find({ followerId: actorUserId })
    .select("followingId")
    .sort({ createdAt: -1 });

  const followedIds = followRelations.map((relation) => relation.followingId.toString());
  const followingCount = followedIds.length;
  const actorIds = includeSelf
    ? Array.from(new Set([...followedIds, actorUserId]))
    : Array.from(new Set(followedIds));

  if (actorIds.length === 0) {
    return {
      items: [],
      pageInfo: {
        hasMore: false
      },
      meta: {
        followingCount,
        includeSelf
      }
    };
  }

  const actorObjectIds = actorIds.map((id) => new mongoose.Types.ObjectId(id));
  const items: FeedItem[] = [];
  const visitedActivityIds = new Set<string>();
  let hasMore = false;
  let activeCursor = query.cursor;

  while (items.length < limit) {
    const batchLimit = Math.max(limit - items.length + 1, limit) * FEED_BATCH_MULTIPLIER;
    const activities = await activityModel
      .find({
        actorUserId: { $in: actorObjectIds },
        visibility: "public",
        ...buildCursorFilter(activeCursor)
      })
      .sort({ createdAt: -1, _id: -1 })
      .limit(batchLimit);

    if (activities.length === 0) {
      break;
    }

    const batchActorIds = activities.map((activity) => activity.actorUserId.toString());
    const actorMap = await buildActorMap(batchActorIds);

    for (const activity of activities) {
      const activityId = activity._id.toString();

      if (visitedActivityIds.has(activityId)) {
        continue;
      }

      visitedActivityIds.add(activityId);

      const actor = actorMap.get(activity.actorUserId.toString());

      if (!actor) {
        continue;
      }

      if (items.length < limit) {
        items.push(toFeedItem(activity, actor));
      } else {
        hasMore = true;
        break;
      }
    }

    const lastActivity = activities[activities.length - 1];

    if (!lastActivity || hasMore || activities.length < batchLimit) {
      break;
    }

    activeCursor = encodeCursor({
      createdAt: lastActivity.createdAt.toISOString(),
      id: lastActivity._id.toString()
    });
  }

  let nextCursor: string | undefined;

  if (hasMore && items.length > 0) {
    const lastReturnedItem = items[items.length - 1];
    nextCursor = encodeCursor({
      createdAt: lastReturnedItem.createdAt,
      id: lastReturnedItem.id
    });
  }

  return {
    items,
    pageInfo: {
      nextCursor,
      hasMore
    },
    meta: {
      followingCount,
      includeSelf
    }
  };
}
