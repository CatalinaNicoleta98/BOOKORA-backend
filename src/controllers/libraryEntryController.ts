import { Response } from "express";
import mongoose from "mongoose";
import LibraryEntryModel from "../models/libraryEntryModel";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";

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
      format,
      rating,
      notes
    } = req.body;

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
      rating,
      notes
    });

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: "Failed to create library entry", error });
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

    res.status(200).json(entries);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch library", error });
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

    const entry = await LibraryEntryModel.findOneAndUpdate(
      { _id: id, userId },
      req.body,
      { new: true }
    );

    if (!entry) {
      return res.status(404).json({ message: "Library entry not found" });
    }

    res.status(200).json(entry);
  } catch (error) {
    res.status(500).json({ message: "Failed to update entry", error });
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
    res.status(500).json({ message: "Failed to delete entry", error });
  }
};