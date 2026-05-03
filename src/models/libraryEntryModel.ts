import mongoose, { Schema, Document } from "mongoose";
import type {
  BookSource,
  ReadingStatus,
  BookFormat,
  CustomBookData
} from "../interfaces/libraryEntry";

export interface LibraryEntryDocument extends Document {
  userId: mongoose.Types.ObjectId;

  bookSource: BookSource;

  externalBookId?: string;

  customBook?: CustomBookData;

  title: string;
  author?: string;
  cover?: string;
  publishedYear?: number;

  status: ReadingStatus;
  format?: BookFormat; // legacy single format, kept temporarily for backward compatibility
  formats?: BookFormat[];
  customLists?: string[];

  rating?: number;
  reviewText?: string;
  isSpoiler?: boolean;
  notes?: string;

  dateStarted?: Date;
  dateFinished?: Date;

  // Progress tracking
  progressValue?: number; // current page, %, minutes, or hours
  progressMax?: number;   // total pages, 100, total minutes/hours
  progressUnit?: "pages" | "percent" | "minutes" | "hours";

  createdAt: Date;
  updatedAt: Date;
}

const CustomBookSchema = new Schema<CustomBookData>(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, trim: true },
    cover: { type: String, trim: true },
    publishedYear: { type: Number }
  },
  { _id: false }
);

const LibraryEntrySchema = new Schema<LibraryEntryDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
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

    customBook: {
      type: CustomBookSchema
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
    },

    status: {
      type: String,
      enum: [
        "want_to_read",
        "currently_reading",
        "currently_listening",
        "finished_reading",
        "finished_listening",
        "on_break",
        "did_not_finish"
      ],
      required: true,
      default: "want_to_read"
    },

    format: {
      type: String,
      enum: ["physical", "ebook", "audiobook"]
    },

    formats: {
      type: [String],
      enum: ["physical", "ebook", "audiobook"],
      default: []
    },

    customLists: {
      type: [String],
      default: [],
      set: (values: string[]) =>
        Array.isArray(values)
          ? values.map((value) => value.trim()).filter(Boolean)
          : []
    },

    rating: {
      type: Number,
      min: 0.5,
      max: 5,
      validate: {
        validator: (value: number) => value * 2 === Math.floor(value * 2),
        message: "Rating must be in 0.5 increments"
      }
    },

    reviewText: {
      type: String,
      trim: true,
      maxlength: 5000
    },

    isSpoiler: {
      type: Boolean,
      default: false
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 5000
    },

    dateStarted: {
      type: Date
    },

    dateFinished: {
      type: Date
    },

    // Progress tracking
    progressValue: {
      type: Number,
      min: 0
    },

    progressMax: {
      type: Number,
      min: 0
    },

    progressUnit: {
      type: String,
      enum: ["pages", "percent", "minutes", "hours"]
    }
  },
  {
    timestamps: true
  }
);

const LibraryEntryModel = mongoose.model<LibraryEntryDocument>(
  "LibraryEntry",
  LibraryEntrySchema
);

export default LibraryEntryModel;
