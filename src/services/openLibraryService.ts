import axios from "axios";

const OPEN_LIBRARY_SEARCH_URL = "https://openlibrary.org/search.json";

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

export const searchOpenLibraryBooks = async (
  params: OpenLibrarySearchParams
): Promise<BookSearchResponse> => {
  const {
    q,
    author,
    isbn,
    page = 1,
    limit = 12
  } = params;

  try {
    const queryParts: string[] = [];

    if (q) queryParts.push(q);
    if (author) queryParts.push(`author:${author}`);
    if (isbn) queryParts.push(`isbn:${isbn}`);

    const finalQuery = queryParts.join(" ");

    const response = await axios.get<OpenLibraryApiResponse>(OPEN_LIBRARY_SEARCH_URL, {
      params: {
        q: finalQuery,
        page
      }
    });

    const data = response.data;

    const results: BookSearchResult[] = (data.docs || [])
      .slice(0, limit)
      .map((doc: OpenLibrarySearchDoc) => ({
        source: "open_library",
        externalBookId: doc.key,
        title: doc.title,
        author: doc.author_name?.[0],
        cover: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
          : undefined,
        publishedYear: doc.first_publish_year,
        isbn: doc.isbn
      }));

    return {
      results,
      pagination: {
        page,
        limit,
        numFound: data.numFound || 0
      }
    };
  } catch (error) {
    throw new Error("Failed to fetch books from Open Library");
  }
};