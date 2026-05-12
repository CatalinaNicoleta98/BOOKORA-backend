import type { BookFormat, ReadingStatus } from "../interfaces/libraryEntry";

export interface DemoUserSeed {
  key: string;
  name: string;
  email: string;
  handle: string;
  bio: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  isProfilePublic: boolean;
}

export interface DemoBookSeed {
  key: string;
  title: string;
  author: string;
  publishedYear: number;
  genre: string;
  openLibraryQuery: {
    title: string;
    author: string;
  };
  fallbackCover?: string;
}

export interface DemoEntrySeed {
  bookKey: string;
  status: ReadingStatus;
  formats: BookFormat[];
  rating?: number;
  reviewText?: string;
  isSpoiler?: boolean;
  notes?: string;
  customLists?: string[];
  progressValue?: number;
  progressMax?: number;
  progressUnit?: "pages" | "percent" | "minutes" | "hours";
  monthsAgo: number;
  startedMonthsAgo?: number;
  finishedMonthsAgo?: number;
  pausedMonthsAgo?: number;
  shelfMonthsAgo?: number;
  updatedDaysAgo?: number;
  completedViaAudiobook?: boolean;
}

export interface DemoUserLibrarySeed {
  userKey: string;
  entries: DemoEntrySeed[];
}

export interface DemoFollowSeed {
  followerKey: string;
  followingKey: string;
}

export interface ResolvedSeedBook {
  key: string;
  source: "open_library" | "custom";
  externalBookId?: string;
  title: string;
  author: string;
  cover?: string;
  publishedYear: number;
  genre: string;
}
