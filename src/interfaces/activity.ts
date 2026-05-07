import type { BookSource, ReadingStatus } from "./libraryEntry";

export type ActivityType =
  | "added_to_shelf"
  | "started_reading"
  | "started_listening"
  | "finished_reading"
  | "finished_listening"
  | "rated_book"
  | "published_review"
  | "updated_review"
  | "reread_logged";

export type ActivityVisibility = "public";

export interface ActivityBookSnapshot {
  source: BookSource;
  title: string;
  author?: string;
  cover?: string;
  publishedYear?: number;
}

export interface ActivityMetadata {
  rating?: number;
  reviewText?: string;
  isSpoiler?: boolean;
  status?: ReadingStatus;
  previousStatus?: ReadingStatus;
  readingSessionCount?: number;
}

export interface Activity extends ActivityMetadata {
  actorUserId: string;
  type: ActivityType;
  visibility: ActivityVisibility;
  sourceEntryId: string;
  bookSource: BookSource;
  externalBookId?: string;
  book: ActivityBookSnapshot;
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
