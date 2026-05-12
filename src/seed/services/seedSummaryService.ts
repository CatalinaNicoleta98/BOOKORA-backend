import { demoUsers } from "../data/demoUsers";
import type { ResolvedSeedBook } from "../types";

export function logSeedSummary(resolvedBooksByKey: Map<string, ResolvedSeedBook>, password: string): void {
  const resolvedBooks = Array.from(resolvedBooksByKey.values());
  const openLibraryCount = resolvedBooks.filter((book) => book.source === "open_library").length;
  const customFallbackCount = resolvedBooks.length - openLibraryCount;

  console.log("Seeded demo users:");

  for (const user of demoUsers) {
    console.log(`- ${user.handle} (${user.email})`);
  }

  console.log(`Shared demo password: ${password}`);
  console.log(`Resolved ${openLibraryCount}/${resolvedBooks.length} books via Open Library.`);

  if (customFallbackCount > 0) {
    console.log(`${customFallbackCount} books fell back to local custom metadata.`);
  }
}
