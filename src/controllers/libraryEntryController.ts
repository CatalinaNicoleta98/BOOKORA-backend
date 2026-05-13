import { Response } from "express";
import mongoose from "mongoose";
import LibraryEntryModel from "../models/libraryEntryModel";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";
import { createActivityFromLibraryEntryChange } from "../services/activityService";

const MAX_TEXT_LENGTH = 5000;

const normalizeReadingSessions = (
  readingSessions?: Array<{ dateStarted?: string; dateFinished?: string }>
) => {
  if (!Array.isArray(readingSessions)) {
    return undefined;
  }

  return readingSessions.filter(
    (session) => Boolean(session?.dateStarted) || Boolean(session?.dateFinished)
  );
};

type SanitizedTextFieldResult =
  | { ok: true; value: string | undefined }
  | { ok: false; message: string };

const sanitizeOptionalTextField = (
  fieldName: "reviewText" | "notes",
  value: unknown
): SanitizedTextFieldResult => {
  if (value === undefined) {
    return { ok: true, value: undefined };
  }

  if (typeof value !== "string") {
    return {
      ok: false,
      message: `${fieldName} must be a string`
    };
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length > MAX_TEXT_LENGTH) {
    return {
      ok: false,
      message: `${fieldName} must be ${MAX_TEXT_LENGTH} characters or fewer`
    };
  }

  return {
    ok: true,
    value: trimmedValue
  };
};

const logActivityWarning = (
  action: "create" | "update",
  userId: string,
  entryId: string,
  error: unknown
) => {
  const message = error instanceof Error ? error.message : "Unknown activity error";

  console.warn(`[activity] Failed to record library ${action} activity`, {
    userId,
    entryId,
    message
  });
};

const logLibraryError = (
  action: "create" | "read" | "update" | "delete",
  error: unknown
) => {
  console.error(`[library] Failed to ${action} library entry`, error);
};

// CREATE library entry
export const createLibraryEntry = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      bookSource,
      externalBookId,
      customBook,
      title,
      author,
      cover,
      publishedYear,
      status,
      format, // legacy
      formats,
      customLists,
      rating,
      reviewText,
      isSpoiler,
      notes,
      dateStarted,
      dateFinished,
      readingSessions,
      // progress
      progressValue,
      progressMax,
      progressUnit
    } = req.body;

    const sanitizedReviewText = sanitizeOptionalTextField("reviewText", reviewText);
    if (!sanitizedReviewText.ok) {
      return res.status(400).json({ message: sanitizedReviewText.message });
    }

    const sanitizedNotes = sanitizeOptionalTextField("notes", notes);
    if (!sanitizedNotes.ok) {
      return res.status(400).json({ message: sanitizedNotes.message });
    }

    // basic source validation
    if (bookSource === "open_library" && !externalBookId) {
      return res
        .status(400)
        .json({ message: "externalBookId is required for Open Library books" });
    }

    if (bookSource === "custom" && !customBook?.title) {
      return res
        .status(400)
        .json({ message: "customBook title is required for custom books" });
    }

    // progress validation (optional fields)
    if (progressValue != null && progressValue < 0) {
      return res.status(400).json({ message: "progressValue must be >= 0" });
    }

    if (progressMax != null && progressMax < 0) {
      return res.status(400).json({ message: "progressMax must be >= 0" });
    }

    if (
      progressUnit != null &&
      !["pages", "percent", "minutes", "hours"].includes(progressUnit)
    ) {
      return res.status(400).json({ message: "Invalid progressUnit" });
    }

    const normalizedReadingSessions = normalizeReadingSessions(readingSessions);
    const latestReadingSession =
      normalizedReadingSessions && normalizedReadingSessions.length > 0
        ? normalizedReadingSessions[normalizedReadingSessions.length - 1]
        : undefined;

    const entry = await LibraryEntryModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      bookSource,
      externalBookId,
      customBook,
      title,
      author,
      cover,
      publishedYear,
      status,
      format,
      formats,
      customLists,
      rating,
      reviewText: sanitizedReviewText.value,
      isSpoiler,
      notes: sanitizedNotes.value,
      dateStarted: latestReadingSession?.dateStarted ?? dateStarted,
      dateFinished: latestReadingSession?.dateFinished ?? dateFinished,
      readingSessions: normalizedReadingSessions,
      progressValue,
      progressMax,
      progressUnit
    });

    try {
      await createActivityFromLibraryEntryChange({
        actorUserId: userId,
        before: null,
        after: entry
      });
    } catch (activityError) {
      logActivityWarning("create", userId, entry._id.toString(), activityError);
    }

    res.status(201).json(entry);
  } catch (error) {
    logLibraryError("create", error);
    res.status(500).json({ message: "Failed to create library entry" });
  }
};

// GET my library
export const getMyLibrary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const entries = await LibraryEntryModel.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({ data: entries });
  } catch (error) {
    logLibraryError("read", error);
    res.status(500).json({ message: "Failed to fetch library" });
  }
};

// UPDATE entry
export const updateLibraryEntry = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      status,
      format, // legacy
      formats,
      customLists,
      rating,
      reviewText,
      isSpoiler,
      notes,
      dateStarted,
      dateFinished,
      readingSessions,
      progressValue,
      progressMax,
      progressUnit
    } = req.body;

    const sanitizedReviewText = sanitizeOptionalTextField("reviewText", reviewText);
    if (!sanitizedReviewText.ok) {
      return res.status(400).json({ message: sanitizedReviewText.message });
    }

    const sanitizedNotes = sanitizeOptionalTextField("notes", notes);
    if (!sanitizedNotes.ok) {
      return res.status(400).json({ message: sanitizedNotes.message });
    }

    const existingEntry = await LibraryEntryModel.findOne({ _id: id, userId });

    if (!existingEntry) {
      return res.status(404).json({ message: "Library entry not found" });
    }

    const update: Record<string, unknown> = {};
    if (status !== undefined) update.status = status;
    if (format !== undefined) update.format = format; // legacy
    if (formats !== undefined) update.formats = formats;
    if (customLists !== undefined) update.customLists = customLists;
    if (rating !== undefined) update.rating = rating;
    if (sanitizedReviewText.value !== undefined) update.reviewText = sanitizedReviewText.value;
    if (isSpoiler !== undefined) update.isSpoiler = isSpoiler;
    if (sanitizedNotes.value !== undefined) update.notes = sanitizedNotes.value;
    const normalizedReadingSessions = normalizeReadingSessions(readingSessions);
    const latestReadingSession =
      normalizedReadingSessions && normalizedReadingSessions.length > 0
        ? normalizedReadingSessions[normalizedReadingSessions.length - 1]
        : undefined;
    if (dateStarted !== undefined || latestReadingSession?.dateStarted !== undefined) {
      update.dateStarted = latestReadingSession?.dateStarted ?? dateStarted;
    }
    if (dateFinished !== undefined || latestReadingSession?.dateFinished !== undefined) {
      update.dateFinished = latestReadingSession?.dateFinished ?? dateFinished;
    }
    if (readingSessions !== undefined) update.readingSessions = normalizedReadingSessions ?? [];
    if (progressValue !== undefined) update.progressValue = progressValue;
    if (progressMax !== undefined) update.progressMax = progressMax;
    if (progressUnit !== undefined) update.progressUnit = progressUnit;

    const entry = await LibraryEntryModel.findOneAndUpdate(
      { _id: id, userId },
      update,
      { new: true }
    );

    if (!entry) {
      return res.status(404).json({ message: "Library entry not found" });
    }

    try {
      await createActivityFromLibraryEntryChange({
        actorUserId: userId,
        before: existingEntry,
        after: entry
      });
    } catch (activityError) {
      logActivityWarning("update", userId, entry._id.toString(), activityError);
    }

    res.status(200).json(entry);
  } catch (error) {
    logLibraryError("update", error);
    res.status(500).json({ message: "Failed to update entry" });
  }
};

// DELETE entry
export const deleteLibraryEntry = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const entry = await LibraryEntryModel.findOneAndDelete({ _id: id, userId });

    if (!entry) {
      return res.status(404).json({ message: "Library entry not found" });
    }

    res.status(200).json({ message: "Entry deleted" });
  } catch (error) {
    logLibraryError("delete", error);
    res.status(500).json({ message: "Failed to delete entry" });
  }
};
