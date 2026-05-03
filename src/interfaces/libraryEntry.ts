export type BookSource = "open_library" | "custom";

export type ReadingStatus =
  | "want_to_read"
  | "currently_reading"
  | "currently_listening"
  | "finished_reading"
  | "finished_listening"
  | "on_break"
  | "did_not_finish";

export type BookFormat =
  | "physical"
  | "ebook"
  | "audiobook";

export interface CustomBookData {
  title: string;
  author?: string;
  cover?: string;
  publishedYear?: number;
}

export interface ReadingSession {
  dateStarted?: Date;
  dateFinished?: Date;
}

export interface LibraryEntry {
  userId: string;

  bookSource: BookSource;

  externalBookId?: string;

  customBook?: CustomBookData;

  title: string;
  author?: string;
  cover?: string;
  publishedYear?: number;

  status: ReadingStatus;

  format?: BookFormat; // legacy single format, kept temporarily for backward compatibility
  formats?: BookFormat[];
  customLists?: string[];

  rating?: number; // 0.5 – 5 (half-step)

  reviewText?: string;
  isSpoiler?: boolean;
  notes?: string;

  dateStarted?: Date;
  dateFinished?: Date;
  readingSessions?: ReadingSession[];

  // Progress tracking
  progressValue?: number; // current page, %, or minutes
  progressMax?: number;   // total pages, 100%, or total minutes
  progressUnit?: "pages" | "percent" | "minutes" | "hours";

  createdAt: Date;
  updatedAt?: Date;
}
