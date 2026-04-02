import axios from "axios";

const OPEN_LIBRARY_SEARCH_URL = "https://openlibrary.org/search.json";
const OPEN_LIBRARY_TIMEOUT_MS = 8000;
const OPEN_LIBRARY_SEARCH_FIELDS = [
  "key",
  "title",
  "author_name",
  "cover_i",
  "first_publish_year",
  "isbn",
].join(",");
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
  isbn?: string;
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
  num_found?: number;
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

const getPrimaryIsbn = (isbns?: string[]) => {
  if (!Array.isArray(isbns) || isbns.length === 0) {
    return undefined;
  }

  return isbns.find((isbn) => typeof isbn === "string" && isbn.trim().length > 0)?.trim();
};

const getOpenLibraryNumFound = (data: OpenLibraryApiResponse) => {
  if (typeof data.numFound === "number") {
    return data.numFound;
  }

  if (typeof data.num_found === "number") {
    return data.num_found;
  }

  return 0;
};

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

  // Guard: avoid spamming Open Library with very short queries
  if (finalQuery.length < 3) {
    return {
      results: [],
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        numFound: 0,
      },
    };
  }

  try {
    const response = await axios.get<OpenLibraryApiResponse>(OPEN_LIBRARY_SEARCH_URL, {
      timeout: OPEN_LIBRARY_TIMEOUT_MS,
      params: {
        q: finalQuery,
        page: normalizedPage,
        limit: normalizedLimit,
        fields: OPEN_LIBRARY_SEARCH_FIELDS,
      },
      headers: {
        Accept: "application/json",
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
      isbn: getPrimaryIsbn(doc.isbn),
    }));

    return {
      results,
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        numFound: getOpenLibraryNumFound(data),
      },
    };
  } catch (error: any) {
    const upstreamMessage = typeof error?.response?.data === "string"
      ? error.response.data
      : error?.response?.data?.message;

    console.error("Open Library search failed", {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
      query: finalQuery,
      page: normalizedPage,
      limit: normalizedLimit,
      upstreamMessage,
    });

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