import mongoose from "mongoose";
import type { ActivityBookSnapshot, ActivityType } from "../interfaces/activity";
import type { ReadingStatus } from "../interfaces/libraryEntry";
import { activityModel, type ActivityDocument } from "../models/activityModel";
import type { LibraryEntryDocument } from "../models/libraryEntryModel";

type LibraryEntryActivityTarget = Pick<
  LibraryEntryDocument,
  | "_id"
  | "bookSource"
  | "externalBookId"
  | "customBook"
  | "title"
  | "author"
  | "cover"
  | "publishedYear"
  | "status"
  | "rating"
  | "reviewText"
  | "isSpoiler"
  | "readingSessions"
  | "updatedAt"
  | "createdAt"
>;

interface DetectedLibraryEntryActivity {
  type: ActivityType;
  rating?: number;
  reviewText?: string;
  isSpoiler?: boolean;
  status?: ReadingStatus;
  previousStatus?: ReadingStatus;
  readingSessionCount?: number;
  occurredAt: Date;
}

interface CreateActivityFromLibraryEntryChangeInput {
  actorUserId: string;
  before: LibraryEntryActivityTarget | null;
  after: LibraryEntryActivityTarget;
}

const STARTED_STATUSES: ReadingStatus[] = ["currently_reading", "currently_listening"];
const FINISHED_STATUSES: ReadingStatus[] = ["finished_reading", "finished_listening"];

const getComparableDate = (value?: Date) => value?.toISOString();

const getReadingSessionCount = (entry: LibraryEntryActivityTarget | null): number => {
  if (!entry?.readingSessions) {
    return 0;
  }

  return entry.readingSessions.filter(
    (session) => Boolean(session?.dateStarted) || Boolean(session?.dateFinished)
  ).length;
};

const getComparableState = (entry: LibraryEntryActivityTarget | null) => {
  if (!entry) {
    return null;
  }

  return {
    bookSource: entry.bookSource,
    externalBookId: entry.externalBookId?.trim() || undefined,
    title: (entry.customBook?.title || entry.title).trim(),
    author: (entry.customBook?.author || entry.author)?.trim() || undefined,
    cover: (entry.customBook?.cover || entry.cover)?.trim() || undefined,
    publishedYear: entry.customBook?.publishedYear || entry.publishedYear,
    status: entry.status,
    rating: entry.rating,
    reviewText: getTrimmedReviewText(entry),
    isSpoiler: entry.isSpoiler ?? false,
    readingSessionCount: getReadingSessionCount(entry),
    latestSessionStartedAt:
      entry.readingSessions && entry.readingSessions.length > 0
        ? getComparableDate(entry.readingSessions[entry.readingSessions.length - 1]?.dateStarted)
        : undefined,
    latestSessionFinishedAt:
      entry.readingSessions && entry.readingSessions.length > 0
        ? getComparableDate(entry.readingSessions[entry.readingSessions.length - 1]?.dateFinished)
        : undefined
  };
};

const hasMeaningfulPublicChanges = (
  before: LibraryEntryActivityTarget | null,
  after: LibraryEntryActivityTarget
) => {
  if (!before) {
    return true;
  }

  return JSON.stringify(getComparableState(before)) !== JSON.stringify(getComparableState(after));
};

export const buildActivityBookSnapshot = (
  entry: LibraryEntryActivityTarget
): ActivityBookSnapshot => {
  return {
    source: entry.bookSource,
    title: entry.customBook?.title || entry.title,
    author: entry.customBook?.author || entry.author,
    cover: entry.customBook?.cover || entry.cover,
    publishedYear: entry.customBook?.publishedYear || entry.publishedYear
  };
};

export const getTrimmedReviewText = (
  entry: Pick<LibraryEntryActivityTarget, "reviewText"> | null
): string | undefined => {
  const trimmedValue = entry?.reviewText?.trim();
  return trimmedValue ? trimmedValue : undefined;
};

export const detectLibraryEntryActivity = (
  before: LibraryEntryActivityTarget | null,
  after: LibraryEntryActivityTarget
): DetectedLibraryEntryActivity | null => {
  if (!hasMeaningfulPublicChanges(before, after)) {
    return null;
  }

  const previousStatus = before?.status;
  const currentStatus = after.status;
  const previousReviewText = getTrimmedReviewText(before);
  const currentReviewText = getTrimmedReviewText(after);
  const previousRating = before?.rating;
  const currentRating = after.rating;
  const previousSessionCount = getReadingSessionCount(before);
  const currentSessionCount = getReadingSessionCount(after);
  const occurredAt = after.updatedAt ?? after.createdAt ?? new Date();

  if (!previousReviewText && currentReviewText) {
    return {
      type: "published_review",
      rating: currentRating,
      reviewText: currentReviewText,
      isSpoiler: after.isSpoiler ?? false,
      status: currentStatus,
      previousStatus,
      readingSessionCount: currentSessionCount,
      occurredAt
    };
  }

  if (previousReviewText && currentReviewText && previousReviewText !== currentReviewText) {
    return {
      type: "updated_review",
      rating: currentRating,
      reviewText: currentReviewText,
      isSpoiler: after.isSpoiler ?? false,
      status: currentStatus,
      previousStatus,
      readingSessionCount: currentSessionCount,
      occurredAt
    };
  }

  if (currentRating !== undefined && currentRating !== previousRating) {
    return {
      type: "rated_book",
      rating: currentRating,
      status: currentStatus,
      previousStatus,
      readingSessionCount: currentSessionCount,
      occurredAt
    };
  }

  if (currentStatus !== previousStatus && FINISHED_STATUSES.includes(currentStatus)) {
    return {
      type:
        currentStatus === "finished_reading"
          ? "finished_reading"
          : "finished_listening",
      rating: currentRating,
      status: currentStatus,
      previousStatus,
      readingSessionCount: currentSessionCount,
      occurredAt
    };
  }

  if (currentStatus !== previousStatus && STARTED_STATUSES.includes(currentStatus)) {
    return {
      type: currentStatus === "currently_reading" ? "started_reading" : "started_listening",
      rating: currentRating,
      status: currentStatus,
      previousStatus,
      readingSessionCount: currentSessionCount,
      occurredAt
    };
  }

  if (before && currentSessionCount > previousSessionCount && currentSessionCount > 1) {
    return {
      type: "reread_logged",
      rating: currentRating,
      status: currentStatus,
      previousStatus,
      readingSessionCount: currentSessionCount,
      occurredAt
    };
  }

  if (!before) {
    return {
      type: "added_to_shelf",
      rating: currentRating,
      status: currentStatus,
      readingSessionCount: currentSessionCount,
      occurredAt
    };
  }

  return null;
};

export const createActivityFromLibraryEntryChange = async ({
  actorUserId,
  before,
  after
}: CreateActivityFromLibraryEntryChangeInput): Promise<ActivityDocument | null> => {
  const detectedActivity = detectLibraryEntryActivity(before, after);

  if (!detectedActivity) {
    return null;
  }

  if (!mongoose.isValidObjectId(actorUserId)) {
    throw new Error("INVALID_ACTIVITY_ACTOR");
  }

  return activityModel.create({
    actorUserId: new mongoose.Types.ObjectId(actorUserId),
    type: detectedActivity.type,
    visibility: "public",
    sourceEntryId: after._id,
    bookSource: after.bookSource,
    externalBookId: after.externalBookId,
    book: buildActivityBookSnapshot(after),
    rating: detectedActivity.rating,
    reviewText: detectedActivity.reviewText,
    isSpoiler: detectedActivity.reviewText ? detectedActivity.isSpoiler : undefined,
    status: detectedActivity.status,
    previousStatus: detectedActivity.previousStatus,
    readingSessionCount: detectedActivity.readingSessionCount,
    occurredAt: detectedActivity.occurredAt
  });
};

export type {
  CreateActivityFromLibraryEntryChangeInput,
  DetectedLibraryEntryActivity,
  LibraryEntryActivityTarget
};
