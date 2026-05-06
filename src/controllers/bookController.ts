import { Request, Response } from "express";
import { getOpenLibraryBookById, searchOpenLibraryBooks } from "../services/openLibraryService";
import LibraryEntryModel from "../models/libraryEntryModel";
import { userModel } from "../models/userModel";
import { ensureUserHandle } from "../services/userHandleService";

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

interface CommunityRatingAggregate {
  averageRating: number;
  ratingsCount: number;
}

interface PublicReviewAggregate {
  _id: unknown;
  rating?: number;
  reviewText?: string;
  isSpoiler?: boolean;
  updatedAt?: Date;
  createdAt?: Date;
  user?: {
    id?: unknown;
    name?: string;
    avatarUrl?: string;
    handle?: string;
    handleLower?: string;
  };
}

interface PublicReviewAuthor {
  id?: string;
  name: string;
  avatarUrl?: string;
  handle?: string;
}

const normalizeAggregateId = (value: unknown): string | undefined => {
  if (!value) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && value !== null && "toString" in value) {
    return value.toString();
  }

  return undefined;
};

const getBookCommunityRating = async (externalBookId: string) => {
  const [ratingSummaries, reviewsCount] = await Promise.all([
    LibraryEntryModel.aggregate<CommunityRatingAggregate>([
      {
        $match: {
          bookSource: "open_library",
          externalBookId,
          rating: { $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          ratingsCount: { $sum: 1 }
        }
      }
    ]),
    LibraryEntryModel.countDocuments({
      bookSource: "open_library",
      externalBookId,
      reviewText: { $regex: /\S/ }
    })
  ]);

  const ratingSummary = ratingSummaries[0];

  return {
    average: ratingSummary?.averageRating ?? 0,
    ratingsCount: ratingSummary?.ratingsCount ?? 0,
    reviewsCount
  };
};

const getBookCommunityReviews = async (externalBookId: string) => {
  const reviews = await LibraryEntryModel.aggregate<PublicReviewAggregate>([
    {
      $match: {
        bookSource: "open_library",
        externalBookId,
        reviewText: { $regex: /\S/ }
      }
    },
    {
      $sort: {
        updatedAt: -1,
        createdAt: -1
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user"
      }
    },
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        _id: 1,
        rating: 1,
        reviewText: 1,
        isSpoiler: 1,
        updatedAt: 1,
        createdAt: 1,
        user: {
          id: "$user._id",
          name: "$user.name",
          avatarUrl: "$user.avatarUrl",
          handle: "$user.handle",
          handleLower: "$user.handleLower"
        }
      }
    }
  ]);

  const usersMissingHandle = reviews
    .map((review) => normalizeAggregateId(review.user?.id))
    .filter((userId): userId is string => typeof userId === "string" && Boolean(userId))
    .filter((userId, index, userIds) => userIds.indexOf(userId) === index);

  const hydratedUsers = await userModel.find({
    _id: { $in: usersMissingHandle }
  });

  const userMap = new Map(
    hydratedUsers.map((user) => [user._id.toString(), user])
  );

  const reviewAuthors = new Map<string, PublicReviewAuthor>();

  for (const review of reviews) {
    const reviewUserId = normalizeAggregateId(review.user?.id);

    if (!reviewUserId || reviewAuthors.has(reviewUserId)) {
      continue;
    }

    const hydratedUser = userMap.get(reviewUserId);

    if (hydratedUser) {
      const ensuredUser = await ensureUserHandle(hydratedUser);

      reviewAuthors.set(reviewUserId, {
        id: ensuredUser._id.toString(),
        name: ensuredUser.name.trim() || "Bookora Reader",
        avatarUrl: ensuredUser.avatarUrl,
        handle: ensuredUser.handle
      });
      continue;
    }

    reviewAuthors.set(reviewUserId, {
      id: reviewUserId,
      name: review.user?.name?.trim() || "Bookora Reader",
      avatarUrl: review.user?.avatarUrl,
      handle: review.user?.handle
    });
  }

  return reviews.map((review) => {
    const reviewUserId = normalizeAggregateId(review.user?.id);
    const author = reviewUserId ? reviewAuthors.get(reviewUserId) : undefined;

    return {
      author,
    id: String(review._id),
    userName: author?.name || review.user?.name?.trim() || "Bookora Reader",
    avatarUrl: author?.avatarUrl || review.user?.avatarUrl,
    handle: author?.handle ?? review.user?.handle,
    rating: typeof review.rating === "number" ? review.rating : 0,
    content: review.reviewText?.trim() || "",
    createdAt: (review.updatedAt || review.createdAt || new Date()).toISOString(),
    source: "bookora" as const,
    isSpoiler: review.isSpoiler ?? false
    };
  });
};

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
    const [communityRating, communityReviews] = await Promise.all([
      getBookCommunityRating(book.externalBookId),
      getBookCommunityReviews(book.externalBookId)
    ]);

    return res.status(200).json({
      error: null,
      data: {
        ...book,
        communityRating,
        reviews: communityReviews,
        reviewsCount: communityReviews.length
      }
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
