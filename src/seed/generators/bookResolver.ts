import { searchOpenLibraryBooks } from "../../services/openLibraryService";
import type { DemoBookSeed, ResolvedSeedBook } from "../types";

function normalizeBookText(value: string): string {
  return value.trim().toLowerCase();
}

function toFallbackBook(book: DemoBookSeed): ResolvedSeedBook {
  return {
    key: book.key,
    source: "custom",
    title: book.title,
    author: book.author,
    cover: book.fallbackCover,
    publishedYear: book.publishedYear,
    genre: book.genre
  };
}

export async function resolveSeedBooks(books: DemoBookSeed[]): Promise<Map<string, ResolvedSeedBook>> {
  const resolvedBooks = new Map<string, ResolvedSeedBook>();

  for (const book of books) {
    try {
      const searchResponse = await searchOpenLibraryBooks({
        q: book.openLibraryQuery.title,
        author: book.openLibraryQuery.author,
        page: 1,
        limit: 5
      });

      const exactMatch = searchResponse.results.find((result) => {
        return (
          normalizeBookText(result.title) === normalizeBookText(book.title) &&
          normalizeBookText(result.author || "") === normalizeBookText(book.author)
        );
      });

      const firstResult = exactMatch || searchResponse.results[0];

      if (!firstResult?.externalBookId) {
        resolvedBooks.set(book.key, toFallbackBook(book));
        continue;
      }

      resolvedBooks.set(book.key, {
        key: book.key,
        source: "open_library",
        externalBookId: firstResult.externalBookId,
        title: firstResult.title || book.title,
        author: firstResult.author || book.author,
        cover: firstResult.cover || book.fallbackCover,
        publishedYear: firstResult.publishedYear || book.publishedYear,
        genre: book.genre
      });
    } catch {
      resolvedBooks.set(book.key, toFallbackBook(book));
    }
  }

  return resolvedBooks;
}
