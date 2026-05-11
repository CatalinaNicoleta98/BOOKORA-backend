import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./src/tests",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  reporter: "list",
});
