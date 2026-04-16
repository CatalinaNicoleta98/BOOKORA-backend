import { Request, Response } from "express";
import { getOpenLibraryBookById, searchOpenLibraryBooks } from "../services/openLibraryService";
import LibraryEntryModel from "../models/libraryEntryModel";

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getBookById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const rawId = Array.isArray(id) ? id[0] : id;
    const normalizedBookId = rawId?.trim();

    if (!normalizedBookId) {
      return res.status(400).json({
        error: "INVALID_BOOK_ID",
        message: "Book id is required"
      });
    }

    const book = await getOpenLibraryBookById(normalizedBookId);

    return res.status(200).json({
      error: null,
      data: book
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({
        error: "BOOK_DETAILS_FAILED",
        message: error.message
      });
    }

    console.error("Book details controller error", error);

    return res.status(500).json({
      error: "BOOK_DETAILS_FAILED",
      message: "Failed to fetch book details"
    });
  }
};

export const searchBooks = async (req: Request, res: Response) => {
  try {
    const { q, author, isbn, page, limit } = req.query;

    const normalizedQuery = (q as string | undefined)?.trim();
    const normalizedPage = page ? Number(page) : 1;
    const normalizedLimit = limit ? Number(limit) : 6;

    const result = await searchOpenLibraryBooks({
      q: normalizedQuery,
      author: author as string | undefined,
      isbn: isbn as string | undefined,
      page: normalizedPage,
      limit: normalizedLimit
    });

    // Supplement or replace Open Library results with local DB matches when needed
    if (normalizedQuery && normalizedQuery.length >= 3 && result.results.length < normalizedLimit) {
      const escapedQuery = escapeRegex(normalizedQuery);
      const regex = new RegExp(escapedQuery, "i");
      const existingResultKeys = new Set(
        result.results.map((entry) => entry.externalBookId || `${entry.title}-${entry.author || ""}`)
      );

      const fallbackEntries = await LibraryEntryModel.find({
        $or: [
          { title: regex },
          { author: regex },
          { "customBook.title": regex },
          { "customBook.author": regex }
        ]
      })
        .sort({ updatedAt: -1 })
        .limit(normalizedLimit * 3)
        .lean();

      const fallbackResults = fallbackEntries
        .map((entry: any) => ({
          source: entry.bookSource || "local",
          externalBookId: entry.externalBookId || entry._id.toString(),
          title: entry.customBook?.title || entry.title,
          author: entry.customBook?.author || entry.author,
          cover: entry.customBook?.cover || entry.cover,
          publishedYear: entry.customBook?.publishedYear || entry.publishedYear,
          isbn: undefined
        }))
        .filter((entry) => {
          const entryKey = entry.externalBookId || `${entry.title}-${entry.author || ""}`;

          if (existingResultKeys.has(entryKey)) {
            return false;
          }

          existingResultKeys.add(entryKey);
          return true;
        });

      const mergedResults = [...result.results, ...fallbackResults].slice(0, normalizedLimit);

      return res.status(200).json({
        error: null,
        data: {
          results: mergedResults,
          pagination: {
            page: normalizedPage,
            limit: normalizedLimit,
            numFound: mergedResults.length
          }
        }
      });
    }

    res.status(200).json({
      error: null,
      data: {
        results: result.results,
        pagination: {
          page: normalizedPage,
          limit: normalizedLimit,
          numFound: result.pagination.numFound
        }
      }
    });
  } catch (error) {
    console.error("Book search controller error", error);

    if (error instanceof Error) {
      if (error.message.includes("required")) {
        return res.status(400).json({
          error: "INVALID_SEARCH_QUERY",
          message: error.message
        });
      }
    }

    return res.status(500).json({
      error: "BOOK_SEARCH_FAILED",
      message: "Failed to search books"
    });
  }
};