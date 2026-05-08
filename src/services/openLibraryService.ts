import axios from "axios";

const OPEN_LIBRARY_SEARCH_URL = "https://openlibrary.org/search.json";
const OPEN_LIBRARY_BASE_URL = "https://openlibrary.org";
const OPEN_LIBRARY_WORKS_URL = `${OPEN_LIBRARY_BASE_URL}/works`;
const OPEN_LIBRARY_BOOKS_URL = `${OPEN_LIBRARY_BASE_URL}/books`;
const OPEN_LIBRARY_AUTHORS_URL = `${OPEN_LIBRARY_BASE_URL}/authors`;
const OPEN_LIBRARY_TIMEOUT_MS = 3000;
const OPEN_LIBRARY_DETAIL_TIMEOUT_MS = 8000;
const OPEN_LIBRARY_RETRY_ATTEMPTS = 2;
const OPEN_LIBRARY_DETAIL_FALLBACK_FIELDS = [
  "key",
  "title",
  "author_name",
  "cover_i",
  "first_publish_year",
  "subject",
  "edition_count",
].join(",");
const OPEN_LIBRARY_SIMILAR_BOOK_FIELDS = [
  "key",
  "title",
  "author_name",
  "cover_i",
].join(",");
const OPEN_LIBRARY_SEARCH_FIELDS = [
  "key",
  "title",
  "author_name",
  "author_key",
  "cover_i",
  "first_publish_year",
  "isbn",
].join(",");
const OPEN_LIBRARY_SERIES_SEARCH_FIELDS = [
  "key",
  "title",
  "author_name",
  "author_key",
  "cover_i",
  "first_publish_year",
].join(",");
const DEFAULT_SEARCH_PAGE = 1;
const DEFAULT_SEARCH_LIMIT = 12;
const MIN_SEARCH_PAGE = 1;
const MIN_SEARCH_LIMIT = 1;
const MAX_SEARCH_LIMIT = 50;
const SERIES_SEARCH_LIMIT = 50;
const SERIES_SEARCH_MAX_PAGES = 3;

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
  authorKey?: string;
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

export interface BookDetailCommunityRating {
  average: number;
  ratingsCount: number;
  reviewsCount: number;
}

export interface SimilarBookSummary {
  id: string;
  title: string;
  coverUrl?: string;
  authors?: string[];
}

export interface BookDetailEdition {
  editionKey: string;
  workKey: string;
  title: string;
  coverUrl?: string;
  format?: string;
  publishDate?: string;
  publishedYear?: number;
  publisher?: string;
  language?: string;
}

export interface BookDetailAuthorDetails {
  id: string;
  name: string;
  bio?: string;
  photoUrl?: string;
  topWorks?: SimilarBookSummary[];
}

export interface AuthorBookCard {
  key: string;
  title: string;
  coverUrl?: string;
  firstPublishYear?: number;
  description?: string;
  seriesTitle?: string;
  seriesPosition?: string | number;
}

export interface AuthorSeriesGroup {
  seriesKey: string;
  seriesTitle: string;
  books: AuthorBookCard[];
}

export interface AuthorDetailsResponse {
  key: string;
  name: string;
  photoUrl?: string;
  bio?: string;
  birthDate?: string;
  deathDate?: string;
  topSubjects: string[];
  links: {
    openLibrary?: string;
    wikipedia?: string;
  };
  seriesGroups: AuthorSeriesGroup[];
  standaloneBooks: AuthorBookCard[];
}

export interface SeriesBookAuthor {
  key?: string;
  name: string;
}

export interface SeriesBookResponse {
  key: string;
  title: string;
  coverUrl?: string;
  firstPublishYear?: number;
  description?: string;
  authors: SeriesBookAuthor[];
  position?: string | number;
}

export interface SeriesDetailsResponse {
  key: string;
  title: string;
  description?: string;
  bookCount: number;
  books: SeriesBookResponse[];
}

export interface BookDetailReview {
  id: string;
  userName: string;
  rating: number;
  content: string;
  createdAt: string;
}

export interface BookDetailResponse {
  source: "open_library";
  requestedKey: string;
  workKey: string;
  editionKey?: string;
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
  communityRating?: BookDetailCommunityRating;
  reviews?: BookDetailReview[];
  selectedEdition?: BookDetailEdition;
  authorDetails?: BookDetailAuthorDetails;
  editions?: BookDetailEdition[];
  similarBooks?: SimilarBookSummary[];
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

interface OpenLibraryReference {
  key?: string;
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
  bio?: string | OpenLibraryTextValue;
  photos?: number[];
  name?: string;
  birth_date?: string;
  death_date?: string;
  wikipedia?: string;
  links?: Array<{
    title?: string;
    url?: string;
  }>;
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

interface OpenLibraryWorkEditionEntry {
  key: string;
  title?: string;
  covers?: number[];
  physical_format?: string;
  publish_date?: string;
  publishers?: string[];
  series?: string[] | string;
  languages?: Array<{
    key?: string;
  }>;
}

interface OpenLibraryWorkEditionsResponse {
  entries?: OpenLibraryWorkEditionEntry[];
}

interface OpenLibraryEditionResponse {
  works?: OpenLibraryReference[];
  key?: string;
  title?: string;
  subtitle?: string;
  covers?: number[];
  physical_format?: string;
  publish_date?: string;
  publishers?: string[];
  languages?: Array<{
    key?: string;
  }>;
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
  author_key?: string[];
  cover_i?: number;
  first_publish_year?: number;
  isbn?: string[];
}

interface OpenLibrarySeriesWorkCandidate {
  doc: OpenLibrarySearchDoc;
  work: OpenLibraryWorkResponse;
}

interface OpenLibraryApiResponse {
  docs?: OpenLibrarySearchDoc[];
  numFound?: number;
  num_found?: number;
}

interface OpenLibraryAuthorWorkEntry {
  key: string;
  title: string;
  covers?: number[];
}

interface OpenLibraryAuthorWorksResponse {
  entries?: OpenLibraryAuthorWorkEntry[];
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
const getNormalizedEditionId = (key: string) => key.split("/").filter(Boolean).pop() || key;
const isEditionId = (key: string) => /^OL\d+M$/i.test(getNormalizedWorkId(key));

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

const getSeriesTitleFromKey = (seriesKey: string) =>
  seriesKey
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getNormalizedAuthorId = (key: string) => key.replace(/^\/authors\//, "").trim();

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getNormalizedStringList = (values?: string[]) => {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
};

const getNormalizedSingleString = (value?: string) => {
  const normalizedValue = value?.trim();
  return normalizedValue && normalizedValue.length > 0 ? normalizedValue : undefined;
};

const getNormalizedLanguageKey = (value?: string) =>
  getNormalizedSingleString(value?.split("/").filter(Boolean).pop());

const getFirstPublishYear = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const match = value.match(/\b(\d{4})\b/);

  if (!match?.[1]) {
    return undefined;
  }

  const year = Number.parseInt(match[1], 10);
  return Number.isFinite(year) ? year : undefined;
};

const getNormalizedExcerptList = (excerpts?: OpenLibraryExcerpt[]) => {
  if (!Array.isArray(excerpts)) {
    return [];
  }

  return excerpts
    .map((item) => getNormalizedTextValue(item.excerpt))
    .filter((value): value is string => Boolean(value));
};

const getPrimaryEditionCoverUrl = (editionEntries: OpenLibraryWorkEditionEntry[]) => {
  const coverId = editionEntries.find((edition) => Array.isArray(edition.covers) && edition.covers[0])
    ?.covers?.[0];

  return getCoverUrl(coverId);
};

const getDetailDescription = (work: OpenLibraryWorkResponse) => {
  const description = getNormalizedTextValue(work.description);

  if (description) {
    return description;
  }

  return getNormalizedExcerptList(work.excerpts)[0];
};

const getSimilarBookSubjects = (subjects?: string[]) =>
  getNormalizedStringList(subjects)
    .filter((subject) => !subject.toLowerCase().startsWith("series:"))
    .slice(0, 3);

const mapSearchDocToSimilarBookSummary = (doc: OpenLibrarySearchDoc): SimilarBookSummary => ({
  id: getNormalizedWorkId(doc.key),
  title: doc.title,
  coverUrl: getCoverUrl(doc.cover_i),
  authors: getNormalizedStringList(doc.author_name),
});

const mapAuthorWorkToSummary = (work: OpenLibraryAuthorWorkEntry): SimilarBookSummary => ({
  id: getNormalizedWorkId(work.key),
  title: work.title,
  coverUrl: getCoverUrl(work.covers?.[0]),
});

const getComparableSeriesPosition = (value?: string | number) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return Number.POSITIVE_INFINITY;
  }

  const match = value.match(/(\d+(?:\.\d+)?)/);

  if (!match?.[1]) {
    return Number.POSITIVE_INFINITY;
  }

  const numericValue = Number.parseFloat(match[1]);
  return Number.isFinite(numericValue) ? numericValue : Number.POSITIVE_INFINITY;
};

const sortAuthorBooks = (left: AuthorBookCard, right: AuthorBookCard) => {
  const leftSeriesPosition = getComparableSeriesPosition(left.seriesPosition);
  const rightSeriesPosition = getComparableSeriesPosition(right.seriesPosition);

  if (leftSeriesPosition !== rightSeriesPosition) {
    return leftSeriesPosition - rightSeriesPosition;
  }

  const leftYear = left.firstPublishYear ?? Number.POSITIVE_INFINITY;
  const rightYear = right.firstPublishYear ?? Number.POSITIVE_INFINITY;

  if (leftYear !== rightYear) {
    return leftYear - rightYear;
  }

  return left.title.localeCompare(right.title);
};

const getOpenLibraryUrl = (key?: string) => {
  if (!key) {
    return undefined;
  }

  return `${OPEN_LIBRARY_BASE_URL}${key.startsWith("/") ? key : `/${key}`}`;
};

const getWikipediaLink = (author: OpenLibraryAuthorResponse) => {
  const wikipediaUrl = getNormalizedSingleString(author.wikipedia);

  if (wikipediaUrl) {
    return wikipediaUrl;
  }

  const matchingLink = author.links?.find((link) => {
    const normalizedUrl = getNormalizedSingleString(link.url)?.toLowerCase();
    const normalizedTitle = getNormalizedSingleString(link.title)?.toLowerCase();

    return normalizedUrl?.includes("wikipedia.org") || normalizedTitle?.includes("wikipedia");
  });

  return getNormalizedSingleString(matchingLink?.url);
};

const mapAuthorNamesAndKeys = (
  authorNames?: string[],
  authorKeys?: string[]
): SeriesBookAuthor[] => {
  const normalizedNames = getNormalizedStringList(authorNames);

  return normalizedNames.map((name, index) => ({
    name,
    key: typeof authorKeys?.[index] === "string" ? getNormalizedAuthorId(authorKeys[index]) : undefined,
  }));
};

const getSeriesPositionFromEditionSeries = (
  editionSeries: string[] | string | undefined,
  seriesName: string
) => {
  const seriesValues = Array.isArray(editionSeries) ? editionSeries : editionSeries ? [editionSeries] : [];
  const normalizedSeriesName = seriesName.trim();

  if (!normalizedSeriesName) {
    return undefined;
  }

  const seriesNamePattern = new RegExp(escapeRegExp(normalizedSeriesName), "i");

  for (const rawSeriesValue of seriesValues) {
    const normalizedSeriesValue = getNormalizedSingleString(rawSeriesValue);

    if (!normalizedSeriesValue || !seriesNamePattern.test(normalizedSeriesValue)) {
      continue;
    }

    const hashMatch = normalizedSeriesValue.match(/#\s*(\d+(?:\.\d+)?)/);

    if (hashMatch?.[1]) {
      return hashMatch[1];
    }

    const bookMatch = normalizedSeriesValue.match(/\bbook\s+(\d+(?:\.\d+)?)\b/i);

    if (bookMatch?.[1]) {
      return bookMatch[1];
    }

    const trailingNumberMatch = normalizedSeriesValue.match(/(?:^|[^\d])(\d+(?:\.\d+)?)\s*$/);

    if (trailingNumberMatch?.[1]) {
      return trailingNumberMatch[1];
    }
  }

  return undefined;
};

const getSeriesPositionFromEditions = (
  editions: OpenLibraryWorkEditionEntry[],
  seriesName: string | undefined
) => {
  if (!seriesName) {
    return undefined;
  }

  for (const edition of editions) {
    const seriesPosition = getSeriesPositionFromEditionSeries(edition.series, seriesName);

    if (seriesPosition) {
      return seriesPosition;
    }
  }

  return undefined;
};

const delay = async (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const isRetriableOpenLibraryError = (error: unknown) => {
  if (!isOpenLibraryRequestError(error)) {
    return false;
  }

  return error.code === "ECONNABORTED" || error.code === "ECONNRESET" || !error.response;
};

const withOpenLibraryRetry = async <T>(operation: () => Promise<T>): Promise<T> => {
  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      attempt += 1;

      if (attempt >= OPEN_LIBRARY_RETRY_ATTEMPTS || !isRetriableOpenLibraryError(error)) {
        throw error;
      }

      await delay(250 * attempt);
    }
  }
};

const fetchOpenLibraryJson = async <T>(url: string, timeout: number): Promise<T> => {
  const response = await withOpenLibraryRetry(() => Promise.resolve(axios.get<T>(url, {
    timeout,
    headers: {
      Accept: "application/json",
    },
  })));

  return response.data;
};

const fetchOpenLibrarySearch = async <T>(
  params: Record<string, string | number | undefined>,
  timeout: number
): Promise<T> => {
  const response = await withOpenLibraryRetry(() => Promise.resolve(axios.get<T>(OPEN_LIBRARY_SEARCH_URL, {
    timeout,
    params,
    headers: {
      Accept: "application/json",
    },
  })));

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
  const response = await fetchOpenLibrarySearch<OpenLibraryEditionLookupResponse>({
    q: `key:/works/${workId}`,
    fields: "number_of_pages_median,edition_count,publisher,publish_place,language",
    limit: 1,
  }, OPEN_LIBRARY_DETAIL_TIMEOUT_MS);

  return response.docs?.[0];
};

const getOpenLibraryWorkEditions = async (workId: string) => {
  const response = await fetchOpenLibraryJson<OpenLibraryWorkEditionsResponse>(
    `${OPEN_LIBRARY_WORKS_URL}/${workId}/editions.json`,
    OPEN_LIBRARY_DETAIL_TIMEOUT_MS
  );

  return response.entries ?? [];
};

const getOpenLibraryEditionWorkId = async (editionId: string) => {
  const response = await fetchOpenLibraryJson<OpenLibraryEditionResponse>(
    `${OPEN_LIBRARY_BOOKS_URL}/${editionId}.json`,
    OPEN_LIBRARY_DETAIL_TIMEOUT_MS
  );

  const workKey = response.works?.[0]?.key;

  return workKey ? getNormalizedWorkId(workKey) : undefined;
};

const getOpenLibraryEditionById = async (editionId: string) => {
  const response = await fetchOpenLibraryJson<OpenLibraryEditionResponse>(
    `${OPEN_LIBRARY_BOOKS_URL}/${editionId}.json`,
    OPEN_LIBRARY_DETAIL_TIMEOUT_MS
  );

  const workKey = response.works?.[0]?.key;

  return {
    edition: response,
    workKey: workKey ? getNormalizedWorkId(workKey) : undefined,
  };
};

const isOpenLibraryRequestError = (error: unknown): error is OpenLibraryRequestError =>
  typeof error === "object" && error !== null;

const shouldUseDetailFallback = (error: unknown) => {
  if (!isOpenLibraryRequestError(error)) {
    return false;
  }

  return error.code === "ECONNABORTED" || error.code === "ECONNRESET" || !error.response;
};

const getRequestErrorStatus = (error: unknown) => {
  if (!isOpenLibraryRequestError(error)) {
    return undefined;
  }

  return error.response?.status;
};

const getOpenLibraryDetailFallback = async (workId: string) => {
  const response = await fetchOpenLibrarySearch<OpenLibraryDetailFallbackResponse>({
    q: `key:/works/${workId}`,
    fields: OPEN_LIBRARY_DETAIL_FALLBACK_FIELDS,
    limit: 1,
  }, OPEN_LIBRARY_DETAIL_TIMEOUT_MS);

  return response.docs?.[0];
};

const getOpenLibraryAuthorWorks = async (authorId: string, limit = 40) => {
  const response = await fetchOpenLibraryJson<OpenLibraryAuthorWorksResponse>(
    `${OPEN_LIBRARY_AUTHORS_URL}/${authorId}/works.json?limit=${limit}`,
    OPEN_LIBRARY_DETAIL_TIMEOUT_MS
  );

  return response.entries ?? [];
};

const getPhotoUrl = (authorId: string) =>
  `https://covers.openlibrary.org/a/olid/${authorId}-M.jpg`;

const getSimilarBooksBySubjects = async (
  subjects: string[] | undefined,
  excludedWorkId: string
): Promise<SimilarBookSummary[]> => {
  const similarSubjects = getSimilarBookSubjects(subjects);

  if (similarSubjects.length === 0) {
    return [];
  }

  const similarBooks: SimilarBookSummary[] = [];
  const seenBookIds = new Set<string>([excludedWorkId]);

  for (const subject of similarSubjects) {
    try {
      const response = await fetchOpenLibrarySearch<OpenLibraryApiResponse>({
        q: `subject:${subject}`,
        fields: OPEN_LIBRARY_SIMILAR_BOOK_FIELDS,
        limit: 8,
      }, OPEN_LIBRARY_TIMEOUT_MS);

      const docs = response.docs ?? [];

      for (const doc of docs) {
        const normalizedId = getNormalizedWorkId(doc.key);

        if (seenBookIds.has(normalizedId)) {
          continue;
        }

        seenBookIds.add(normalizedId);
        similarBooks.push(mapSearchDocToSimilarBookSummary(doc));

        if (similarBooks.length >= 8) {
          return similarBooks;
        }
      }
    } catch (error: unknown) {
      console.error("Open Library similar books fetch failed", {
        message: error instanceof Error ? error.message : "Unknown error",
        workId: excludedWorkId,
        subject,
        status: getRequestErrorStatus(error),
      });
    }
  }

  return similarBooks;
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
  requestedKey: string,
  normalizedWorkId: string,
  fallbackDoc: OpenLibraryDetailFallbackDoc,
  similarBooks: SimilarBookSummary[],
  editions: BookDetailEdition[]
): BookDetailResponse => ({
  source: "open_library",
  requestedKey,
  workKey: normalizedWorkId,
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
  reviews: [],
  editions,
  similarBooks,
});

const mapEditionToSummary = (
  edition: OpenLibraryWorkEditionEntry,
  workKey: string
): BookDetailEdition => ({
  editionKey: getNormalizedEditionId(edition.key),
  workKey,
  title: getNormalizedSingleString(edition.title) ?? "Edition",
  coverUrl: getCoverUrl(edition.covers?.[0]),
  format: getNormalizedSingleString(edition.physical_format),
  publishDate: getNormalizedSingleString(edition.publish_date),
  publishedYear: getFirstPublishYear(edition.publish_date),
  publisher: getNormalizedSingleString(edition.publishers?.[0]),
  language: getNormalizedLanguageKey(edition.languages?.[0]?.key),
});

const mapEditionResponseToSummary = (
  edition: OpenLibraryEditionResponse,
  workKey: string,
  fallbackEditionKey: string
): BookDetailEdition => {
  const titleParts = [
    getNormalizedSingleString(edition.title),
    getNormalizedSingleString(edition.subtitle),
  ].filter(Boolean);

  return {
    editionKey: getNormalizedEditionId(edition.key ?? fallbackEditionKey),
    workKey,
    title: titleParts.join(": ") || "Edition",
    coverUrl: getCoverUrl(edition.covers?.[0]),
    format: getNormalizedSingleString(edition.physical_format),
    publishDate: getNormalizedSingleString(edition.publish_date),
    publishedYear: getFirstPublishYear(edition.publish_date),
    publisher: getNormalizedSingleString(edition.publishers?.[0]),
    language: getNormalizedLanguageKey(edition.languages?.[0]?.key),
  };
};

const getAuthorDetails = async (
  author: BookDetailAuthor | undefined,
  currentWorkId: string
): Promise<BookDetailAuthorDetails | undefined> => {
  if (!author?.key || !author.name) {
    return undefined;
  }

  const [authorResponse, authorWorks] = await Promise.all([
    fetchOpenLibraryJson<OpenLibraryAuthorResponse>(
      `${OPEN_LIBRARY_AUTHORS_URL}/${getNormalizedAuthorId(author.key)}.json`,
      OPEN_LIBRARY_DETAIL_TIMEOUT_MS
    ),
    getOpenLibraryAuthorWorks(author.key),
  ]);

  const topWorks = authorWorks
    .map(mapAuthorWorkToSummary)
    .filter((work) => work.id !== currentWorkId)
    .slice(0, 5);

  return {
    id: author.key,
    name: authorResponse.name?.trim() ?? author.name,
    bio: getNormalizedTextValue(authorResponse.bio),
    photoUrl: authorResponse.photos?.length ? getPhotoUrl(author.key) : undefined,
    topWorks: topWorks.length ? topWorks : undefined,
  };
};

const mapWorkToAuthorBookCard = (
  work: OpenLibraryWorkResponse,
  fallbackEntry?: OpenLibraryAuthorWorkEntry
): AuthorBookCard => {
  const seriesTitle = getFirstSeriesName(work.series) ?? getSeriesNameFromSubjects(work.subjects);
  const seriesPosition =
    typeof work.series_position === "number"
      ? work.series_position
      : getNormalizedSingleString(
          typeof work.series_position === "string" ? work.series_position : undefined
        );

  return {
    key: getNormalizedWorkId(work.key),
    title: getNormalizedSingleString(work.title) ?? fallbackEntry?.title ?? "Untitled work",
    coverUrl: getCoverUrl(work.covers?.[0] ?? fallbackEntry?.covers?.[0]),
    firstPublishYear: getFirstPublishYear(work.first_publish_date),
    description: getDetailDescription(work),
    seriesTitle,
    seriesPosition,
  };
};

const getTopAuthorSubjects = (workResponses: OpenLibraryWorkResponse[]) => {
  const subjectFrequency = new Map<string, number>();

  for (const work of workResponses) {
    for (const subject of getNormalizedStringList(work.subjects)) {
      if (subject.toLowerCase().startsWith("series:")) {
        continue;
      }

      subjectFrequency.set(subject, (subjectFrequency.get(subject) ?? 0) + 1);
    }
  }

  return [...subjectFrequency.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return left[0].localeCompare(right[0]);
    })
    .slice(0, 8)
    .map(([subject]) => subject);
};

const getSeriesSearchQueries = (seriesTitle: string) => {
  const normalizedSeriesTitle = seriesTitle.trim();

  if (!normalizedSeriesTitle) {
    return [];
  }

  return [
    `subject:"series:${normalizedSeriesTitle}"`,
    `"${normalizedSeriesTitle}"`,
  ];
};

const getOpenLibrarySeriesSearchDocs = async (seriesTitle: string) => {
  const queries = getSeriesSearchQueries(seriesTitle);

  if (queries.length === 0) {
    return [];
  }

  const responses = await Promise.all(
    queries.flatMap((query) =>
      Array.from({ length: SERIES_SEARCH_MAX_PAGES }, (_, pageIndex) =>
        fetchOpenLibrarySearch<OpenLibraryApiResponse>({
          q: query,
          fields: OPEN_LIBRARY_SERIES_SEARCH_FIELDS,
          page: pageIndex + 1,
          limit: SERIES_SEARCH_LIMIT,
        }, OPEN_LIBRARY_DETAIL_TIMEOUT_MS)
      )
    )
  );

  const seenWorkIds = new Set<string>();
  const docs: OpenLibrarySearchDoc[] = [];

  for (const response of responses) {
    for (const doc of response.docs ?? []) {
      const normalizedWorkId = getNormalizedWorkId(doc.key);

      if (seenWorkIds.has(normalizedWorkId)) {
        continue;
      }

      seenWorkIds.add(normalizedWorkId);
      docs.push(doc);
    }
  }

  return docs;
};

const mapSeriesCandidateToBook = (
  candidate: OpenLibrarySeriesWorkCandidate,
  position?: string | number
): SeriesBookResponse => ({
  key: getNormalizedWorkId(candidate.work.key),
  title: getNormalizedSingleString(candidate.work.title) ?? candidate.doc.title ?? "Untitled work",
  coverUrl: getCoverUrl(candidate.work.covers?.[0] ?? candidate.doc.cover_i),
  firstPublishYear:
    getFirstPublishYear(candidate.work.first_publish_date) ?? candidate.doc.first_publish_year,
  description: getDetailDescription(candidate.work),
  authors: mapAuthorNamesAndKeys(candidate.doc.author_name, candidate.doc.author_key),
  position,
});

export const getOpenLibrarySeriesByKey = async (seriesKey: string): Promise<SeriesDetailsResponse> => {
  const normalizedSeriesKey = getSeriesKeyFromName(seriesKey.replace(/^\/series\//, "").trim());

  if (!normalizedSeriesKey) {
    throw new Error("Series key is required.");
  }

  const seriesTitleQuery = getSeriesTitleFromKey(normalizedSeriesKey);
  const candidateDocs = await getOpenLibrarySeriesSearchDocs(seriesTitleQuery);

  if (candidateDocs.length === 0) {
    throw new Error("Series not found.");
  }

  const detailedCandidates = await Promise.allSettled(
    candidateDocs.map(async (doc) => {
      const normalizedWorkId = getNormalizedWorkId(doc.key);
      const work = await fetchOpenLibraryJson<OpenLibraryWorkResponse>(
        `${OPEN_LIBRARY_WORKS_URL}/${normalizedWorkId}.json`,
        OPEN_LIBRARY_DETAIL_TIMEOUT_MS
      );

      return {
        doc,
        work,
      };
    })
  );

  const matchingCandidates: Array<OpenLibrarySeriesWorkCandidate & { position?: string | number }> = [];
  let canonicalSeriesTitle: string | undefined;

  for (const result of detailedCandidates) {
    if (result.status !== "fulfilled") {
      console.error("Open Library series work detail fetch failed", {
        message: result.reason instanceof Error ? result.reason.message : "Unknown error",
        seriesKey: normalizedSeriesKey,
        status: getRequestErrorStatus(result.reason),
      });
      continue;
    }

    const { doc, work } = result.value;
    const seriesTitle = getFirstSeriesName(work.series) ?? getSeriesNameFromSubjects(work.subjects);

    if (!seriesTitle || getSeriesKeyFromName(seriesTitle) !== normalizedSeriesKey) {
      continue;
    }

    canonicalSeriesTitle = canonicalSeriesTitle ?? seriesTitle;

    let editionEntries: OpenLibraryWorkEditionEntry[] = [];

    try {
      editionEntries = await getOpenLibraryWorkEditions(getNormalizedWorkId(work.key));
    } catch (error: unknown) {
      console.error("Open Library series editions fetch failed", {
        message: error instanceof Error ? error.message : "Unknown error",
        seriesKey: normalizedSeriesKey,
        workKey: work.key,
        status: getRequestErrorStatus(error),
      });
    }

    const position =
      typeof work.series_position === "number"
        ? work.series_position
        : getNormalizedSingleString(
            typeof work.series_position === "string" ? work.series_position : undefined
          ) ?? getSeriesPositionFromEditions(editionEntries, seriesTitle);

    matchingCandidates.push({
      doc,
      work,
      position,
    });
  }

  if (matchingCandidates.length === 0 || !canonicalSeriesTitle) {
    throw new Error("Series not found.");
  }

  const books = matchingCandidates
    .map((candidate) => mapSeriesCandidateToBook(candidate, candidate.position))
    .sort((left, right) =>
      sortAuthorBooks(
        {
          key: left.key,
          title: left.title,
          firstPublishYear: left.firstPublishYear,
          seriesPosition: left.position,
        },
        {
          key: right.key,
          title: right.title,
          firstPublishYear: right.firstPublishYear,
          seriesPosition: right.position,
        }
      )
    );

  return {
    key: normalizedSeriesKey,
    title: canonicalSeriesTitle,
    description: undefined,
    bookCount: books.length,
    books,
  };
};

export const getOpenLibraryAuthorById = async (authorId: string): Promise<AuthorDetailsResponse> => {
  const normalizedAuthorId = getNormalizedAuthorId(authorId);

  if (!normalizedAuthorId) {
    throw new Error("Author key is required.");
  }

  const [authorResponse, authorWorks] = await Promise.all([
    fetchOpenLibraryJson<OpenLibraryAuthorResponse>(
      `${OPEN_LIBRARY_AUTHORS_URL}/${normalizedAuthorId}.json`,
      OPEN_LIBRARY_DETAIL_TIMEOUT_MS
    ),
    getOpenLibraryAuthorWorks(normalizedAuthorId),
  ]);

  const uniqueEntries = authorWorks.filter((entry, index, entries) => {
    const normalizedWorkId = getNormalizedWorkId(entry.key);

    return entries.findIndex((candidate) => getNormalizedWorkId(candidate.key) === normalizedWorkId) === index;
  });

  const detailedWorks = await Promise.allSettled(
    uniqueEntries.map(async (entry) => {
      const normalizedWorkId = getNormalizedWorkId(entry.key);
      const work = await fetchOpenLibraryJson<OpenLibraryWorkResponse>(
        `${OPEN_LIBRARY_WORKS_URL}/${normalizedWorkId}.json`,
        OPEN_LIBRARY_DETAIL_TIMEOUT_MS
      );

      return {
        entry,
        work,
      };
    })
  );

  const standaloneBooks: AuthorBookCard[] = [];
  const seriesGroupsMap = new Map<string, AuthorSeriesGroup>();
  const successfulWorkResponses: OpenLibraryWorkResponse[] = [];

  detailedWorks.forEach((result, index) => {
    if (result.status !== "fulfilled") {
      const fallbackEntry = uniqueEntries[index];

      console.error("Open Library author work detail fetch failed", {
        message: result.reason instanceof Error ? result.reason.message : "Unknown error",
        authorId: normalizedAuthorId,
        workKey: fallbackEntry?.key,
        status: getRequestErrorStatus(result.reason),
      });

      standaloneBooks.push({
        key: getNormalizedWorkId(fallbackEntry.key),
        title: fallbackEntry.title,
        coverUrl: getCoverUrl(fallbackEntry.covers?.[0]),
      });
      return;
    }

    const { entry, work } = result.value;
    successfulWorkResponses.push(work);

    const book = mapWorkToAuthorBookCard(work, entry);

    if (book.seriesTitle) {
      const seriesKey = getSeriesKeyFromName(book.seriesTitle);
      const existingGroup = seriesGroupsMap.get(seriesKey);

      if (existingGroup) {
        existingGroup.books.push(book);
      } else {
        seriesGroupsMap.set(seriesKey, {
          seriesKey,
          seriesTitle: book.seriesTitle,
          books: [book],
        });
      }

      return;
    }

    standaloneBooks.push(book);
  });

  const seriesGroups = [...seriesGroupsMap.values()]
    .map((group) => ({
      ...group,
      books: [...group.books].sort(sortAuthorBooks),
    }))
    .sort((left, right) => left.seriesTitle.localeCompare(right.seriesTitle));

  const sortedStandaloneBooks = [...standaloneBooks].sort(sortAuthorBooks);

  return {
    key: normalizedAuthorId,
    name: getNormalizedSingleString(authorResponse.name) ?? "Unknown author",
    photoUrl: authorResponse.photos?.length ? getPhotoUrl(normalizedAuthorId) : undefined,
    bio: getNormalizedTextValue(authorResponse.bio),
    birthDate: getNormalizedSingleString(authorResponse.birth_date),
    deathDate: getNormalizedSingleString(authorResponse.death_date),
    topSubjects: getTopAuthorSubjects(successfulWorkResponses),
    links: {
      openLibrary: getOpenLibraryUrl(authorResponse.key ?? `/authors/${normalizedAuthorId}`),
      wikipedia: getWikipediaLink(authorResponse),
    },
    seriesGroups,
    standaloneBooks: sortedStandaloneBooks,
  };
};


export const getOpenLibraryBookById = async (bookId: string): Promise<BookDetailResponse> => {
  const requestedBookId = getNormalizedWorkId(bookId);
  const isEditionRequest = isEditionId(requestedBookId);
  const requestedEdition = isEditionRequest
    ? await getOpenLibraryEditionById(requestedBookId)
    : undefined;
  const normalizedWorkId = isEditionRequest
    ? requestedEdition?.workKey ?? requestedBookId
    : requestedBookId;

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

    const similarBooks = await getSimilarBooksBySubjects(work.subjects, normalizedWorkId);

    let editionEntries: OpenLibraryWorkEditionEntry[] = [];
    let editions: BookDetailEdition[] | undefined;
    let selectedEdition: BookDetailEdition | undefined;

    try {
      editionEntries = await getOpenLibraryWorkEditions(normalizedWorkId);
      const mappedEditions = editionEntries
        .map((edition) => mapEditionToSummary(edition, normalizedWorkId))
        .slice(0, 8);

      editions = mappedEditions.length ? mappedEditions : undefined;

      if (requestedEdition?.edition) {
        selectedEdition = mappedEditions.find(
          (edition) => edition.editionKey === requestedBookId
        );
      }
    } catch (error: unknown) {
      console.error("Open Library editions fetch failed", {
        message: error instanceof Error ? error.message : "Unknown error",
        workId: normalizedWorkId,
        status: getRequestErrorStatus(error),
      });
    }

    if (requestedEdition?.edition && !selectedEdition) {
      selectedEdition = mapEditionResponseToSummary(
        requestedEdition.edition,
        normalizedWorkId,
        requestedBookId
      );
    }

    let authorDetails: BookDetailAuthorDetails | undefined;

    try {
      authorDetails = await getAuthorDetails(authors[0], normalizedWorkId);
    } catch (error: unknown) {
      console.error("Open Library author details fetch failed", {
        message: error instanceof Error ? error.message : "Unknown error",
        workId: normalizedWorkId,
        authorKey: authors[0]?.key,
        status: getRequestErrorStatus(error),
      });
    }

    const seriesName = getFirstSeriesName(work.series) ?? getSeriesNameFromSubjects(work.subjects);
    const series = seriesName
      ? {
          key: getSeriesKeyFromName(seriesName),
          name: seriesName,
        }
      : undefined;

    const seriesPositionFromWork =
      typeof work.series_position === "number"
        ? String(work.series_position)
        : typeof work.series_position === "string" && work.series_position.trim().length > 0
        ? work.series_position.trim()
        : undefined;
    const seriesPosition = seriesPositionFromWork ?? getSeriesPositionFromEditions(editionEntries, seriesName);

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
      requestedKey: requestedBookId,
      workKey: normalizedWorkId,
      editionKey: selectedEdition?.editionKey,
      externalBookId: normalizedWorkId,
      title: selectedEdition?.title ?? work.title,
      description: getDetailDescription(work),
      cover:
        selectedEdition?.coverUrl ??
        getCoverUrl(work.covers?.[0]) ??
        getPrimaryEditionCoverUrl(editionEntries),
      authors,
      firstPublishDate: selectedEdition?.publishDate ?? work.first_publish_date,
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
      reviews: [],
      selectedEdition,
      authorDetails,
      editions,
      rating:
        typeof ratingAverage === "number" || typeof ratingCount === "number"
          ? {
              average: ratingAverage,
              count: ratingCount,
            }
          : undefined,
      similarBooks,
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
          const similarBooks = await getSimilarBooksBySubjects(fallbackDoc.subject, normalizedWorkId);
          let editions: BookDetailEdition[] = [];

          try {
            editions = (await getOpenLibraryWorkEditions(normalizedWorkId))
              .map((edition) => mapEditionToSummary(edition, normalizedWorkId))
              .slice(0, 8);
          } catch (editionError: unknown) {
            console.error("Open Library fallback editions fetch failed", {
              message: editionError instanceof Error ? editionError.message : "Unknown error",
              workId: normalizedWorkId,
              status: getRequestErrorStatus(editionError),
            });
          }

          return mapFallbackBookDetail(requestedBookId, normalizedWorkId, fallbackDoc, similarBooks, editions);
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
      authorKey: doc.author_key?.[0] ? getNormalizedAuthorId(doc.author_key[0]) : undefined,
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
