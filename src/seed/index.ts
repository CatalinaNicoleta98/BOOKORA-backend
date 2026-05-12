import { connect, disconnect } from "../config/db";
import { demoBooks } from "./data/demoBooks";
import { demoFollows } from "./data/demoFollows";
import { demoUserLibraries } from "./data/demoLibrary";
import { DEMO_SEED_PASSWORD, demoUsers } from "./data/demoUsers";
import { resolveSeedBooks } from "./generators/bookResolver";
import { getSeedConfig } from "./services/seedConfig";
import { createDemoFollows } from "./services/seedFollowService";
import { createDemoLibraryEntries } from "./services/seedLibraryService";
import { clearDemoSeedData } from "./services/seedResetService";
import { logSeedSummary } from "./services/seedSummaryService";
import { createDemoUsers } from "./services/seedUserService";

async function runSeed(): Promise<void> {
  const seedConfig = getSeedConfig();

  await connect();

  if (seedConfig.mode === "clear") {
    await clearDemoSeedData();
    console.log("Cleared Bookora demo seed data.");
    return;
  }

  await clearDemoSeedData();

  const [resolvedBooksByKey, userIdsByKey] = await Promise.all([
    resolveSeedBooks(demoBooks),
    createDemoUsers(demoUsers)
  ]);

  await createDemoFollows(demoFollows, userIdsByKey);
  await createDemoLibraryEntries(demoUserLibraries, userIdsByKey, resolvedBooksByKey);

  console.log("Bookora demo seed completed.");
  logSeedSummary(resolvedBooksByKey, DEMO_SEED_PASSWORD);
}

void runSeed()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.stack || error.message : String(error);
    console.error("Bookora demo seed failed:", message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnect();
  });
