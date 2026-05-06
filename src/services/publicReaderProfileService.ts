import type { ReadingStatus } from "../interfaces/libraryEntry";
import type { HydratedDocument } from "mongoose";
import LibraryEntryModel, { type LibraryEntryDocument } from "../models/libraryEntryModel";
import { followModel } from "../models/followModel";
import { userModel } from "../models/userModel";
import type { User } from "../interfaces/user";
import { ensureUserHandle } from "./userHandleService";
import { getReaderFollowers, getReaderFollowing, type PublicReaderCard } from "./followService";

const PUBLIC_ACTIVITY_LIMIT = 10;
const PUBLIC_SPOTLIGHT_LIMIT = 6;

const SHELF_STATUSES: ReadingStatus[] = [
  "want_to_read",
  "currently_reading",
  "currently_listening",
  "finished_reading",
  "finished_listening",
  "on_break",
  "did_not_finish"
];

interface PublicBookSnapshot {
  source: string;
  externalBookId?: string;
  title: string;
  author?: string;
  cover?: string;
  publishedYear?: number;
}

interface PublicReaderResponse {
  reader: {
    id: string;
    handle?: string;
    name: string;
    avatarUrl?: string;
    coverImageUrl?: string;
    bio?: string;
    isProfilePublic?: boolean;
    followerCount: number;
    followingCount: number;
    isFollowing: boolean;
    isOwnProfile: boolean;
  };
  summary: {
    booksInLibrary: number;
    finishedCount: number;
    inProgressCount: number;
    reviewsCount: number;
  };
  shelves: Record<ReadingStatus, number>;
  recentActivity: Array<{
    type: "reviewed" | "rated" | "finished" | "updated_library";
    createdAt: string;
    isSpoiler?: boolean;
    reviewText?: string;
    rating?: number;
    status: ReadingStatus;
    book: PublicBookSnapshot;
  }>;
  spotlight: Array<{
    createdAt: string;
    status: ReadingStatus;
    rating?: number;
    reviewText?: string;
    isSpoiler?: boolean;
    book: PublicBookSnapshot;
  }>;
}

function buildPublicBookSnapshot(entry: LibraryEntryDocument): PublicBookSnapshot {
  return {
    source: entry.bookSource,
    externalBookId: entry.externalBookId,
    title: entry.customBook?.title || entry.title,
    author: entry.customBook?.author || entry.author,
    cover: entry.customBook?.cover || entry.cover,
    publishedYear: entry.customBook?.publishedYear || entry.publishedYear
  };
}

function getPublicReviewText(entry: LibraryEntryDocument): string | undefined {
  const trimmedReview = entry.reviewText?.trim();
  return trimmedReview ? trimmedReview : undefined;
}

function getEntryActivityType(
  entry: LibraryEntryDocument,
  publicReviewText: string | undefined
): "reviewed" | "rated" | "finished" | "updated_library" {
  if (publicReviewText) {
    return "reviewed";
  }

  if (typeof entry.rating === "number") {
    return "rated";
  }

  if (entry.status === "finished_reading" || entry.status === "finished_listening") {
    return "finished";
  }

  return "updated_library";
}

function getEntryActivityDate(entry: LibraryEntryDocument): Date {
  return entry.updatedAt ?? entry.createdAt;
}

function isSpotlightEntry(entry: LibraryEntryDocument, publicReviewText: string | undefined): boolean {
  if (publicReviewText) {
    return true;
  }

  if (typeof entry.rating === "number") {
    return true;
  }

  return entry.status === "finished_reading" || entry.status === "finished_listening";
}

async function getPublicReaderByHandle(handle: string): Promise<HydratedDocument<User> | null> {
  const normalizedHandle = handle.trim().toLowerCase();

  if (!normalizedHandle) {
    return null;
  }

  const user = await userModel.findOne({ handleLower: normalizedHandle });

  if (!user) {
    return null;
  }

  const userWithHandle = await ensureUserHandle(user);

  if (!userWithHandle.isProfilePublic) {
    return null;
  }

  return userWithHandle;
}

function buildEmptyShelves(): Record<ReadingStatus, number> {
  return {
    want_to_read: 0,
    currently_reading: 0,
    currently_listening: 0,
    finished_reading: 0,
    finished_listening: 0,
    on_break: 0,
    did_not_finish: 0
  };
}

export async function getPublicReaderProfile(
  handle: string,
  viewerUserId?: string
): Promise<PublicReaderResponse | null> {
  const user = await getPublicReaderByHandle(handle);

  if (!user) {
    return null;
  }

  const [entries, followerCount, followingCount, viewerFollowRecord] = await Promise.all([
    LibraryEntryModel.find({ userId: user._id }).sort({ updatedAt: -1, createdAt: -1 }),
    followModel.countDocuments({ followingId: user._id }),
    followModel.countDocuments({ followerId: user._id }),
    viewerUserId
      ? followModel.findOne({ followerId: viewerUserId, followingId: user._id }).select("_id")
      : Promise.resolve(null)
  ]);
  const shelves = buildEmptyShelves();
  const isOwnProfile = viewerUserId === user._id.toString();
  const isFollowing = isOwnProfile ? false : Boolean(viewerFollowRecord);

  let finishedCount = 0;
  let inProgressCount = 0;
  let reviewsCount = 0;

  for (const status of SHELF_STATUSES) {
    shelves[status] = 0;
  }

  for (const entry of entries) {
    shelves[entry.status] += 1;

    if (entry.status === "finished_reading" || entry.status === "finished_listening") {
      finishedCount += 1;
    }

    if (entry.status === "currently_reading" || entry.status === "currently_listening") {
      inProgressCount += 1;
    }

    if (getPublicReviewText(entry)) {
      reviewsCount += 1;
    }
  }

  const recentActivity = entries
    .map((entry) => {
      const reviewText = getPublicReviewText(entry);
      return {
        type: getEntryActivityType(entry, reviewText),
        createdAt: getEntryActivityDate(entry).toISOString(),
        isSpoiler: reviewText ? entry.isSpoiler ?? false : undefined,
        reviewText,
        rating: typeof entry.rating === "number" ? entry.rating : undefined,
        status: entry.status,
        book: buildPublicBookSnapshot(entry)
      };
    })
    .slice(0, PUBLIC_ACTIVITY_LIMIT);

  const spotlight = entries
    .filter((entry) => isSpotlightEntry(entry, getPublicReviewText(entry)))
    .slice(0, PUBLIC_SPOTLIGHT_LIMIT)
    .map((entry) => {
      const reviewText = getPublicReviewText(entry);
      return {
        createdAt: getEntryActivityDate(entry).toISOString(),
        status: entry.status,
        rating: typeof entry.rating === "number" ? entry.rating : undefined,
        reviewText,
        isSpoiler: reviewText ? entry.isSpoiler ?? false : undefined,
        book: buildPublicBookSnapshot(entry)
      };
    });

  return {
    reader: {
      id: user._id.toString(),
      handle: user.handle,
      name: user.name,
      avatarUrl: user.avatarUrl,
      coverImageUrl: user.coverImageUrl,
      bio: user.bio,
      isProfilePublic: user.isProfilePublic,
      followerCount,
      followingCount,
      isFollowing,
      isOwnProfile
    },
    summary: {
      booksInLibrary: entries.length,
      finishedCount,
      inProgressCount,
      reviewsCount
    },
    shelves,
    recentActivity,
    spotlight
  };
}

export async function getPublicReaderFollowersByHandle(handle: string): Promise<PublicReaderCard[] | null> {
  const user = await getPublicReaderByHandle(handle);

  if (!user) {
    return null;
  }

  return getReaderFollowers(user._id.toString());
}

export async function getPublicReaderFollowingByHandle(handle: string): Promise<PublicReaderCard[] | null> {
  const user = await getPublicReaderByHandle(handle);

  if (!user) {
    return null;
  }

  return getReaderFollowing(user._id.toString());
}
