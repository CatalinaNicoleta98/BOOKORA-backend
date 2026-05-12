import type { HydratedDocument } from "mongoose";
import mongoose from "mongoose";
import LibraryEntryModel, { type LibraryEntryDocument } from "../../models/libraryEntryModel";
import { activityModel } from "../../models/activityModel";
import type { ActivityDocument } from "../../models/activityModel";
import { createActivityFromLibraryEntryChange } from "../../services/activityService";
import { monthsAgo } from "../generators/dateGenerator";
import type {
  DemoEntrySeed,
  DemoUserLibrarySeed,
  ResolvedSeedBook
} from "../types";

interface CreateSeedEntryInput {
  userId: string;
  entrySeed: DemoEntrySeed;
  resolvedBook: ResolvedSeedBook;
  referenceDate: Date;
}

function getLegacyFormat(formats: DemoEntrySeed["formats"]) {
  return formats[0];
}

function buildCreatePayload(entrySeed: DemoEntrySeed, resolvedBook: ResolvedSeedBook) {
  return {
    bookSource: resolvedBook.source,
    externalBookId: resolvedBook.externalBookId,
    customBook:
      resolvedBook.source === "custom"
        ? {
            title: resolvedBook.title,
            author: resolvedBook.author,
            cover: resolvedBook.cover,
            publishedYear: resolvedBook.publishedYear
          }
        : undefined,
    title: resolvedBook.title,
    author: resolvedBook.author,
    cover: resolvedBook.cover,
    publishedYear: resolvedBook.publishedYear,
    status: "want_to_read" as const,
    format: getLegacyFormat(entrySeed.formats),
    formats: entrySeed.formats,
    customLists: entrySeed.customLists,
    notes: entrySeed.notes
  };
}

async function setDocumentTimestamps(
  collectionName: "libraryentries" | "activities",
  documentId: string,
  timestamps: { createdAt: Date; updatedAt: Date }
): Promise<void> {
  const collection = collectionName === "libraryentries"
    ? LibraryEntryModel.collection
    : activityModel.collection;

  await collection.updateOne(
    { _id: new mongoose.Types.ObjectId(documentId) },
    {
      $set: {
        createdAt: timestamps.createdAt,
        updatedAt: timestamps.updatedAt
      }
    }
  );
}

async function syncActivityTimestamp(
  activity: ActivityDocument | null,
  occurredAt: Date
): Promise<void> {
  if (!activity) {
    return;
  }

  await activityModel.collection.updateOne(
    { _id: activity._id },
    {
      $set: {
        occurredAt,
        createdAt: occurredAt,
        updatedAt: occurredAt
      }
    }
  );
}

async function updateEntryState(
  entry: HydratedDocument<LibraryEntryDocument>,
  updates: Partial<LibraryEntryDocument>,
  occurredAt: Date,
  actorUserId: string
): Promise<HydratedDocument<LibraryEntryDocument>> {
  const before = entry.toObject();

  entry.set(updates);
  await entry.save();
  await setDocumentTimestamps("libraryentries", entry._id.toString(), {
    createdAt: entry.createdAt,
    updatedAt: occurredAt
  });
  entry.updatedAt = occurredAt;

  const activity = await createActivityFromLibraryEntryChange({
    actorUserId,
    before,
    after: entry
  });

  await syncActivityTimestamp(activity, occurredAt);

  return entry;
}

function buildFinishedStatus(entrySeed: DemoEntrySeed) {
  if (entrySeed.completedViaAudiobook) {
    return "finished_listening" as const;
  }

  return "finished_reading" as const;
}

function buildInProgressStatus(entrySeed: DemoEntrySeed) {
  if (entrySeed.status === "currently_listening") {
    return "currently_listening" as const;
  }

  return "currently_reading" as const;
}

function buildFinalStatus(entrySeed: DemoEntrySeed) {
  if (entrySeed.status === "finished_reading" && entrySeed.completedViaAudiobook) {
    return "finished_listening" as const;
  }

  return entrySeed.status;
}

async function createTimelineDrivenEntry({
  userId,
  entrySeed,
  resolvedBook,
  referenceDate
}: CreateSeedEntryInput): Promise<void> {
  const derivedShelfMonthsAgo = Math.max(
    entrySeed.shelfMonthsAgo ?? 0,
    entrySeed.monthsAgo + 0.2,
    (entrySeed.startedMonthsAgo ?? 0) + 0.1,
    (entrySeed.finishedMonthsAgo ?? 0) + 0.1,
    (entrySeed.pausedMonthsAgo ?? 0) + 0.1
  );
  const shelfDate = monthsAgo(derivedShelfMonthsAgo, referenceDate);
  const createdEntry = await LibraryEntryModel.create({
    userId,
    ...buildCreatePayload(entrySeed, resolvedBook)
  });

  await setDocumentTimestamps("libraryentries", createdEntry._id.toString(), {
    createdAt: shelfDate,
    updatedAt: shelfDate
  });

  createdEntry.createdAt = shelfDate;
  createdEntry.updatedAt = shelfDate;

  const shelfActivity = await createActivityFromLibraryEntryChange({
    actorUserId: userId,
    before: null,
    after: createdEntry
  });

  await syncActivityTimestamp(shelfActivity, shelfDate);

  const startedDate = entrySeed.startedMonthsAgo !== undefined
    ? monthsAgo(entrySeed.startedMonthsAgo, referenceDate)
    : undefined;

  if (startedDate) {
    await updateEntryState(
      createdEntry,
      {
        status: buildInProgressStatus(entrySeed),
        dateStarted: startedDate,
        readingSessions: [{ dateStarted: startedDate }]
      },
      startedDate,
      userId
    );
  }

  const finishedDate = entrySeed.finishedMonthsAgo !== undefined
    ? monthsAgo(entrySeed.finishedMonthsAgo, referenceDate)
    : undefined;

  if (finishedDate) {
    const sessions = startedDate
      ? [{ dateStarted: startedDate, dateFinished: finishedDate }]
      : undefined;

    await updateEntryState(
      createdEntry,
      {
        status: buildFinishedStatus(entrySeed),
        dateStarted: startedDate,
        dateFinished: finishedDate,
        readingSessions: sessions
      },
      finishedDate,
      userId
    );
  }

  const finalDate = entrySeed.updatedDaysAgo !== undefined
    ? new Date(referenceDate.getTime() - entrySeed.updatedDaysAgo * 24 * 60 * 60 * 1000)
    : monthsAgo(entrySeed.monthsAgo, referenceDate);

  const finalStatus = buildFinalStatus(entrySeed);
  const finalReadingSessions =
    entrySeed.status === "currently_reading" || entrySeed.status === "currently_listening"
      ? startedDate
        ? [{ dateStarted: startedDate }]
        : undefined
      : finishedDate
        ? [{ dateStarted: startedDate, dateFinished: finishedDate }]
        : startedDate
          ? [{ dateStarted: startedDate }]
          : undefined;

  await updateEntryState(
    createdEntry,
    {
      status: finalStatus,
      format: getLegacyFormat(entrySeed.formats),
      formats: entrySeed.formats,
      rating: entrySeed.rating,
      reviewText: entrySeed.reviewText,
      isSpoiler: entrySeed.isSpoiler,
      notes: entrySeed.notes,
      customLists: entrySeed.customLists,
      dateStarted: startedDate,
      dateFinished: finishedDate,
      readingSessions: finalReadingSessions,
      progressValue: entrySeed.progressValue,
      progressMax: entrySeed.progressMax,
      progressUnit: entrySeed.progressUnit
    },
    finalDate,
    userId
  );

  await setDocumentTimestamps("libraryentries", createdEntry._id.toString(), {
    createdAt: shelfDate,
    updatedAt: finalDate
  });
}

export async function createDemoLibraryEntries(
  libraries: DemoUserLibrarySeed[],
  userIdsByKey: Map<string, string>,
  resolvedBooksByKey: Map<string, ResolvedSeedBook>,
  referenceDate = new Date()
): Promise<void> {
  for (const library of libraries) {
    const userId = userIdsByKey.get(library.userKey);

    if (!userId) {
      throw new Error(`Missing user for library seed ${library.userKey}`);
    }

    for (const entrySeed of library.entries) {
      const resolvedBook = resolvedBooksByKey.get(entrySeed.bookKey);

      if (!resolvedBook) {
        throw new Error(`Missing book seed for ${entrySeed.bookKey}`);
      }

      await createTimelineDrivenEntry({
        userId,
        entrySeed,
        resolvedBook,
        referenceDate
      });
    }
  }
}
