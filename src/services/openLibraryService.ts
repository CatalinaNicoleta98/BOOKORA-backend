import axios from "axios";

const OPEN_LIBRARY_SEARCH_URL = "https://openlibrary.org/search.json";
const DEFAULT_SEARCH_PAGE = 1;
const DEFAULT_SEARCH_LIMIT = 12;
const MIN_SEARCH_PAGE = 1;
const MIN_SEARCH_LIMIT = 1;
const MAX_SEARCH_LIMIT = 50;

export interface OpenLibrarySearchParams {
  q?: string;
  author?: string;
  isbn?: string;
  page?: number;
  limit?: number;
}

export interface BookSearchResult {
  source: "open_library";
  externalBookId: string;
  title: string;
  author?: string;
  cover?: string;
  publishedYear?: number;
  isbn?: string[];
}

export interface BookSearchResponse {
  results: BookSearchResult[];
  pagination: {
    page: number;
    limit: number;
    numFound: number;
  };
}

interface OpenLibrarySearchDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  isbn?: string[];
}

interface OpenLibraryApiResponse {
  docs?: OpenLibrarySearchDoc[];
  numFound?: number;
}

const normalizeSearchValue = (value?: string) => value?.trim() || undefined;

const clampNumber = (value: number, minimum: number, maximum?: number) => {
  if (value < minimum) {
    return minimum;
  }

  if (typeof maximum === "number" && value > maximum) {
    return maximum;
  }

  return value;
};

const getNormalizedWorkId = (key: string) => key.split("/").filter(Boolean).pop() || key;

export const searchOpenLibraryBooks = async (
  params: OpenLibrarySearchParams
): Promise<BookSearchResponse> => {
  const normalizedQuery = normalizeSearchValue(params.q);
  const normalizedAuthor = normalizeSearchValue(params.author);
  const normalizedIsbn = normalizeSearchValue(params.isbn);
  const normalizedPage = clampNumber(
    Number.isFinite(params.page) ? Number(params.page) : DEFAULT_SEARCH_PAGE,
    MIN_SEARCH_PAGE
  );
  const normalizedLimit = clampNumber(
    Number.isFinite(params.limit) ? Number(params.limit) : DEFAULT_SEARCH_LIMIT,
    MIN_SEARCH_LIMIT,
    MAX_SEARCH_LIMIT
  );

  if (!normalizedQuery && !normalizedAuthor && !normalizedIsbn) {
    throw new Error("At least one search parameter is required.");
  }

  try {
    const queryParts: string[] = [];

    if (normalizedQuery) {
      queryParts.push(normalizedQuery);
    }

    if (normalizedAuthor) {
      queryParts.push(`author:${normalizedAuthor}`);
    }

    if (normalizedIsbn) {
      queryParts.push(`isbn:${normalizedIsbn}`);
    }

    const finalQuery = queryParts.join(" ");

    const response = await axios.get<OpenLibraryApiResponse>(OPEN_LIBRARY_SEARCH_URL, {
      timeout: 8000,
      params: {
        q: finalQuery,
        page: normalizedPage,
      },
    });

    const data = response.data;

    const results: BookSearchResult[] = (data.docs || []).slice(0, normalizedLimit).map((doc) => ({
      source: "open_library",
      externalBookId: getNormalizedWorkId(doc.key),
      title: doc.title,
      author: doc.author_name?.[0],
      cover: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : undefined,
      publishedYear: doc.first_publish_year,
      isbn: doc.isbn,
    }));

    return {
      results,
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        numFound: data.numFound || 0,
      },
    };
  } catch (error: any) {
    console.error("Open Library search failed", {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
    });

    // If timeout or network issue, return empty results instead of breaking UX
    return {
      results: [],
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        numFound: 0,
      },
    };
  }
};