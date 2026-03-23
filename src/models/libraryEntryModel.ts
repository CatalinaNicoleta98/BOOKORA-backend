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
  format?: BookFormat;

  rating?: number;
  notes?: string;

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

    rating: {
      type: Number,
      min: 0.5,
      max: 5,
      validate: {
        validator: (value: number) => value * 2 === Math.floor(value * 2),
        message: "Rating must be in 0.5 increments"
      }
    },

    notes: {
      type: String,
      trim: true
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
