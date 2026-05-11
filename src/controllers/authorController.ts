import { Request, Response } from "express";
import { getOpenLibraryAuthorById } from "../services/openLibraryService";

export const getAuthorByKey = async (req: Request, res: Response) => {
  try {
    const { authorKey } = req.params;
    const normalizedAuthorKey = Array.isArray(authorKey) ? authorKey[0]?.trim() : authorKey?.trim();

    if (!normalizedAuthorKey) {
      return res.status(400).json({
        error: "INVALID_AUTHOR_KEY",
        message: "Author key is required",
      });
    }

    const author = await getOpenLibraryAuthorById(normalizedAuthorKey);

    return res.status(200).json({
      error: null,
      data: author,
    });
  } catch (error) {
    console.error("Author details controller error", error);

    if (error instanceof Error) {
      return res.status(500).json({
        error: "AUTHOR_DETAILS_FAILED",
        message: error.message,
      });
    }

    return res.status(500).json({
      error: "AUTHOR_DETAILS_FAILED",
      message: "Failed to fetch author details",
    });
  }
};
