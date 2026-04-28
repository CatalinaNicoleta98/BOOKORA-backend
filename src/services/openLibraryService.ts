import axios from "axios";

const OPEN_LIBRARY_SEARCH_URL = "https://openlibrary.org/search.json";
const OPEN_LIBRARY_BASE_URL = "https://openlibrary.org";
const OPEN_LIBRARY_WORKS_URL = `${OPEN_LIBRARY_BASE_URL}/works`;
const OPEN_LIBRARY_AUTHORS_URL = `${OPEN_LIBRARY_BASE_URL}/authors`;
const OPEN_LIBRARY_TIMEOUT_MS = 3000;
const OPEN_LIBRARY_DETAIL_TIMEOUT_MS = 5000;
const OPEN_LIBRARY_DETAIL_FALLBACK_FIELDS = [
  "key",
  "title",
  "author_name",
  "cover_i",
  "first_publish_year",
  "subject",
  "edition_count",
].join(",");
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

export interface BookDetailAuthor {
  name: string;
  key?: string;
}

export interface BookDetailSeries {
  key: string;
  name: string;
}

export interface BookDetailRating {
  average?: number;
  count?: number;
}

export interface BookDetailResponse {
  source: "open_library";
  externalBookId: string;
  title: string;
  description?: string;
  cover?: string;
  authors: BookDetailAuthor[];
  firstPublishDate?: string;
  publishedYear?: number;
  subjects: string[];
  subjectPeople: string[];
  subjectPlaces: string[];
  subjectTimes: string[];
  publishers: string[];
  publishPlaces: string[];
  languages: string[];
  excerpts: string[];
  editionCount?: number;
  pageCount?: number;
  series?: BookDetailSeries;
  seriesPosition?: string;
  rating?: BookDetailRating;
}

interface OpenLibraryWorkAuthorRef {
  author?: {
    key?: string;
  };
}

interface OpenLibraryTextValue {
  value?: string;
}

interface OpenLibraryExcerpt {
  excerpt?: string | OpenLibraryTextValue;
}

interface OpenLibraryWorkResponse {
  key: string;
  title: string;
  description?: string | OpenLibraryTextValue;
  covers?: number[];
  authors?: OpenLibraryWorkAuthorRef[];
  first_publish_date?: string;
  subjects?: string[];
  subject_people?: string[];
  subject_places?: string[];
  subject_times?: string[];
  excerpts?: OpenLibraryExcerpt[];
  latest_revision?: number;
  revision?: number;
  created?: {
    value?: string;
  };
  last_modified?: {
    value?: string;
  };
  series?: string[] | string;
  series_position?: string | number;
  rating?: {
    average?: number;
    count?: number;
  };
  ratings_average?: number;
  ratings_count?: number;
}

interface OpenLibraryAuthorResponse {
  key?: string;
  name?: string;
}

interface OpenLibraryEditionDoc {
  number_of_pages_median?: number;
  edition_count?: number;
  publisher?: string[];
  publish_place?: string[];
  language?: string[];
}

interface OpenLibraryEditionLookupResponse {
  docs?: OpenLibraryEditionDoc[];
}

interface OpenLibraryDetailFallbackDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  subject?: string[];
  edition_count?: number;
}

interface OpenLibraryDetailFallbackResponse {
  docs?: OpenLibraryDetailFallbackDoc[];
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

interface OpenLibraryRequestError {
  code?: string;
  response?: {
    status?: number;
  };
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

const getCoverUrl = (coverId?: number) => {
  if (!coverId) {
    return undefined;
  }

  return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
};

const getNormalizedTextValue = (value?: string | OpenLibraryTextValue) => {
  if (!value) {
    return undefined;
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim();
    return normalizedValue.length > 0 ? normalizedValue : undefined;
  }

  const normalizedValue = value.value?.trim();
  return normalizedValue && normalizedValue.length > 0 ? normalizedValue : undefined;
};

const getFirstSeriesName = (series?: string[] | string) => {
  if (Array.isArray(series)) {
    return series.find((item) => typeof item === "string" && item.trim().length > 0)?.trim();
  }

  if (typeof series === "string") {
    const normalizedSeries = series.trim();
    return normalizedSeries.length > 0 ? normalizedSeries : undefined;
  }

  return undefined;
};

const getSeriesNameFromSubjects = (subjects?: string[]) => {
  if (!Array.isArray(subjects)) {
    return undefined;
  }

  const rawSeriesSubject = subjects.find(
    (subject) => typeof subject === "string" && subject.toLowerCase().startsWith("series:")
  );

  if (!rawSeriesSubject) {
    return undefined;
  }

  const normalizedSeriesName = rawSeriesSubject
    .slice("series:".length)
    .replace(/_/g, " ")
    .trim();

  return normalizedSeriesName.length > 0 ? normalizedSeriesName : undefined;
};

const getSeriesKeyFromName = (seriesName: string) =>
  seriesName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getNormalizedStringList = (values?: string[]) => {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
};

const getNormalizedExcerptList = (excerpts?: OpenLibraryExcerpt[]) => {
  if (!Array.isArray(excerpts)) {
    return [];
  }

  return excerpts
    .map((item) => getNormalizedTextValue(item.excerpt))
    .filter((value): value is string => Boolean(value));
};

const fetchOpenLibraryJson = async <T>(url: string, timeout: number): Promise<T> => {
  const response = await axios.get<T>(url, {
    timeout,
    headers: {
      Accept: "application/json",
    },
  });

  return response.data;
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

const getOpenLibraryEditionLookup = async (workId: string) => {
  const response = await axios.get<OpenLibraryEditionLookupResponse>(OPEN_LIBRARY_SEARCH_URL, {
    timeout: OPEN_LIBRARY_DETAIL_TIMEOUT_MS,
    params: {
      q: `key:/works/${workId}`,
      fields: "number_of_pages_median,edition_count,publisher,publish_place,language",
      limit: 1,
    },
    headers: {
      Accept: "application/json",
    },
  });

  return response.data.docs?.[0];
};

const isOpenLibraryRequestError = (error: unknown): error is OpenLibraryRequestError =>
  typeof error === "object" && error !== null;

const shouldUseDetailFallback = (error: unknown) => {
  if (!isOpenLibraryRequestError(error)) {
    return false;
  }

  return error.code === "ECONNABORTED" || !error.response;
};

const getRequestErrorStatus = (error: unknown) => {
  if (!isOpenLibraryRequestError(error)) {
    return undefined;
  }

  return error.response?.status;
};

const getOpenLibraryDetailFallback = async (workId: string) => {
  const response = await axios.get<OpenLibraryDetailFallbackResponse>(OPEN_LIBRARY_SEARCH_URL, {
    timeout: OPEN_LIBRARY_DETAIL_TIMEOUT_MS,
    params: {
      q: `key:/works/${workId}`,
      fields: OPEN_LIBRARY_DETAIL_FALLBACK_FIELDS,
      limit: 1,
    },
    headers: {
      Accept: "application/json",
    },
  });

  return response.data.docs?.[0];
};

const mapFallbackAuthorNames = (authorNames?: string[]): BookDetailAuthor[] => {
  if (!Array.isArray(authorNames)) {
    return [];
  }

  return authorNames
    .filter((authorName): authorName is string => typeof authorName === "string")
    .map((authorName) => authorName.trim())
    .filter((authorName) => authorName.length > 0)
    .map((authorName) => ({ name: authorName }));
};

const mapFallbackBookDetail = (
  normalizedWorkId: string,
  fallbackDoc: OpenLibraryDetailFallbackDoc
): BookDetailResponse => ({
  source: "open_library",
  externalBookId: normalizedWorkId,
  title: fallbackDoc.title,
  cover: getCoverUrl(fallbackDoc.cover_i),
  authors: mapFallbackAuthorNames(fallbackDoc.author_name),
  publishedYear: fallbackDoc.first_publish_year,
  subjects: getNormalizedStringList(fallbackDoc.subject),
  subjectPeople: [],
  subjectPlaces: [],
  subjectTimes: [],
  publishers: [],
  publishPlaces: [],
  languages: [],
  excerpts: [],
  editionCount: fallbackDoc.edition_count,
});


export const getOpenLibraryBookById = async (workId: string): Promise<BookDetailResponse> => {
  const normalizedWorkId = getNormalizedWorkId(workId);

  try {
    const work = await fetchOpenLibraryJson<OpenLibraryWorkResponse>(
      `${OPEN_LIBRARY_WORKS_URL}/${normalizedWorkId}.json`,
      OPEN_LIBRARY_DETAIL_TIMEOUT_MS
    );

    const authorRefs = (work.authors || [])
      .map((item) => item.author?.key)
      .filter((key): key is string => typeof key === "string" && key.trim().length > 0);

    const authorResponses = await Promise.all(
      authorRefs.map(async (authorKey) => {
        try {
          const normalizedAuthorKey = authorKey.replace(/^\/authors\//, "");
          return await fetchOpenLibraryJson<OpenLibraryAuthorResponse>(
            `${OPEN_LIBRARY_AUTHORS_URL}/${normalizedAuthorKey}.json`,
            OPEN_LIBRARY_DETAIL_TIMEOUT_MS
          );
        } catch (error: any) {
          console.error("Open Library author fetch failed", {
            message: error?.message,
            authorKey,
            status: error?.response?.status,
          });

          return undefined;
        }
      })
    );

    let editionLookup: OpenLibraryEditionDoc | undefined;

    try {
      editionLookup = await getOpenLibraryEditionLookup(normalizedWorkId);
    } catch (error: any) {
      console.error("Open Library edition lookup failed", {
        message: error?.message,
        workId: normalizedWorkId,
        status: error?.response?.status,
      });
    }

    const authors: BookDetailAuthor[] = authorResponses
      .filter((author): author is OpenLibraryAuthorResponse => Boolean(author?.name))
      .map((author) => ({
        name: author.name!.trim(),
        key: author.key ? getNormalizedWorkId(author.key) : undefined,
      }));

    const seriesName = getFirstSeriesName(work.series) ?? getSeriesNameFromSubjects(work.subjects);
    const series = seriesName
      ? {
          key: getSeriesKeyFromName(seriesName),
          name: seriesName,
        }
      : undefined;

    const seriesPosition =
      typeof work.series_position === "number"
        ? String(work.series_position)
        : typeof work.series_position === "string" && work.series_position.trim().length > 0
        ? work.series_position.trim()
        : undefined;

    const ratingAverage =
      typeof work.rating?.average === "number"
        ? work.rating.average
        : typeof work.ratings_average === "number"
        ? work.ratings_average
        : undefined;

    const ratingCount =
      typeof work.rating?.count === "number"
        ? work.rating.count
        : typeof work.ratings_count === "number"
        ? work.ratings_count
        : undefined;

    return {
      source: "open_library",
      externalBookId: normalizedWorkId,
      title: work.title,
      description: getNormalizedTextValue(work.description),
      cover: getCoverUrl(work.covers?.[0]),
      authors,
      firstPublishDate: work.first_publish_date,
      publishedYear: work.first_publish_date ? Number.parseInt(work.first_publish_date, 10) || undefined : undefined,
      subjects: getNormalizedStringList(work.subjects),
      subjectPeople: getNormalizedStringList(work.subject_people),
      subjectPlaces: getNormalizedStringList(work.subject_places),
      subjectTimes: getNormalizedStringList(work.subject_times),
      publishers: getNormalizedStringList(editionLookup?.publisher),
      publishPlaces: getNormalizedStringList(editionLookup?.publish_place),
      languages: getNormalizedStringList(editionLookup?.language),
      excerpts: getNormalizedExcerptList(work.excerpts),
      editionCount: editionLookup?.edition_count,
      pageCount: editionLookup?.number_of_pages_median,
      series,
      seriesPosition,
      rating:
        typeof ratingAverage === "number" || typeof ratingCount === "number"
          ? {
              average: ratingAverage,
              count: ratingCount,
            }
          : undefined,
    };
  } catch (error: unknown) {
    if (shouldUseDetailFallback(error)) {
      console.error("Open Library primary book detail fetch failed", {
        message: error instanceof Error ? error.message : "Unknown error",
        workId: normalizedWorkId,
        status: getRequestErrorStatus(error),
      });

      try {
        const fallbackDoc = await getOpenLibraryDetailFallback(normalizedWorkId);

        if (fallbackDoc) {
          return mapFallbackBookDetail(normalizedWorkId, fallbackDoc);
        }
      } catch (fallbackError: unknown) {
        console.error("Open Library fallback book detail fetch failed", {
          message: fallbackError instanceof Error ? fallbackError.message : "Unknown error",
          workId: normalizedWorkId,
          status: getRequestErrorStatus(fallbackError),
        });
      }
    } else {
      console.error("Open Library primary book detail fetch failed", {
        message: error instanceof Error ? error.message : "Unknown error",
        workId: normalizedWorkId,
        status: getRequestErrorStatus(error),
      });
    }

    throw new Error("Failed to fetch book details from Open Library.");
  }
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

    const results: BookSearchResult[] = (data.docs || []).map((doc) => ({
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
