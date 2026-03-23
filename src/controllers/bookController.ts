

import { Request, Response } from "express";
import { searchOpenLibraryBooks } from "../services/openLibraryService";

export const searchBooks = async (req: Request, res: Response) => {
  try {
    const { q, author, isbn, page, limit } = req.query;

    const result = await searchOpenLibraryBooks({
      q: q as string | undefined,
      author: author as string | undefined,
      isbn: isbn as string | undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined
    });

    res.status(200).json({
      error: null,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      error: "BOOK_SEARCH_FAILED",
      message: "Failed to search books"
    });
  }
};