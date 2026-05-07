import { Schema, model, type Document, type Types } from "mongoose";
import type {
  ActivityBookSnapshot,
  ActivityType,
  ActivityVisibility
} from "../interfaces/activity";
import type { BookSource, ReadingStatus } from "../interfaces/libraryEntry";

export interface ActivityDocument extends Document {
  actorUserId: Types.ObjectId;
  type: ActivityType;
  visibility: ActivityVisibility;
  sourceEntryId: Types.ObjectId;
  bookSource: BookSource;
  externalBookId?: string;
  book: ActivityBookSnapshot;
  rating?: number;
  reviewText?: string;
  isSpoiler?: boolean;
  status?: ReadingStatus;
  previousStatus?: ReadingStatus;
  readingSessionCount?: number;
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const activityBookSnapshotSchema = new Schema<ActivityBookSnapshot>(
  {
    source: {
      type: String,
      enum: ["open_library", "custom"],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    author: {
      type: String,
      trim: true
    },
    cover: {
      type: String,
      trim: true
    },
    publishedYear: {
      type: Number
    }
  },
  { _id: false }
);

const readingStatusEnum: ReadingStatus[] = [
  "want_to_read",
  "currently_reading",
  "currently_listening",
  "finished_reading",
  "finished_listening",
  "on_break",
  "did_not_finish"
];

const activitySchema = new Schema<ActivityDocument>(
  {
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: [
        "added_to_shelf",
        "started_reading",
        "started_listening",
        "finished_reading",
        "finished_listening",
        "rated_book",
        "published_review",
        "updated_review",
        "reread_logged"
      ],
      required: true,
      index: true
    },
    visibility: {
      type: String,
      enum: ["public"],
      default: "public",
      required: true
    },
    sourceEntryId: {
      type: Schema.Types.ObjectId,
      ref: "LibraryEntry",
      required: true,
      index: true
    },
    bookSource: {
      type: String,
      enum: ["open_library", "custom"],
      required: true
    },
    externalBookId: {
      type: String,
      trim: true
    },
    book: {
      type: activityBookSnapshotSchema,
      required: true
    },
    rating: {
      type: Number,
      min: 0.5,
      max: 5
    },
    reviewText: {
      type: String,
      trim: true,
      maxlength: 5000
    },
    isSpoiler: {
      type: Boolean
    },
    status: {
      type: String,
      enum: readingStatusEnum
    },
    previousStatus: {
      type: String,
      enum: readingStatusEnum
    },
    readingSessionCount: {
      type: Number,
      min: 0
    },
    occurredAt: {
      type: Date,
      required: true,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

activitySchema.index({ actorUserId: 1, occurredAt: -1 });
activitySchema.index({ occurredAt: -1 });
activitySchema.index({ sourceEntryId: 1, occurredAt: -1 });
activitySchema.index({ actorUserId: 1, createdAt: -1, _id: -1 });

export const activityModel = model<ActivityDocument>("Activity", activitySchema);
