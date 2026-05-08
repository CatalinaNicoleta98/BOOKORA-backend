import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSeriesKey,
  isEditionKey,
  normalizeEditionKey,
  normalizeWorkKey,
  parseSeriesLabel,
  parseSeriesPositionForTitle,
  resolveSeriesMembership,
} from "./openLibraryNormalization";

test("normalizeEditionKey preserves the edition identity", () => {
  assert.equal(normalizeEditionKey("/books/OL12345M"), "OL12345M");
  assert.equal(isEditionKey("/books/OL12345M"), true);
});

test("normalizeWorkKey preserves the work identity", () => {
  assert.equal(normalizeWorkKey("/works/OL67890W"), "OL67890W");
});

test("parseSeriesLabel only parses strict title-tied series labels", () => {
  assert.deepEqual(parseSeriesLabel("Harry Potter #2"), {
    seriesTitle: "Harry Potter",
    seriesKey: "harry-potter",
    seriesPosition: "2",
  });
  assert.equal(parseSeriesLabel("First published 1998"), undefined);
});

test("parseSeriesPositionForTitle ignores unrelated numeric strings", () => {
  assert.equal(parseSeriesPositionForTitle("Harry Potter #7", "Harry Potter"), "7");
  assert.equal(parseSeriesPositionForTitle("Volume 2", "Harry Potter"), undefined);
  assert.equal(parseSeriesPositionForTitle("1999", "Harry Potter"), undefined);
});

test("resolveSeriesMembership does not group vague or conflicting edition data", () => {
  assert.deepEqual(
    resolveSeriesMembership({
      editionSeriesValues: ["Fantasy favourites", "Best sellers"],
    }),
    { confidence: "low" }
  );

  assert.deepEqual(
    resolveSeriesMembership({
      editionSeriesValues: ["Crescent City #1", "A Court of Thorns and Roses #1"],
    }),
    { confidence: "low" }
  );
});

test("resolveSeriesMembership uses explicit series safely", () => {
  assert.deepEqual(
    resolveSeriesMembership({
      explicitSeries: "Harry Potter",
      explicitPosition: "2",
      editionSeriesValues: ["Harry Potter #2"],
    }),
    {
      confidence: "high",
      seriesTitle: "Harry Potter",
      seriesKey: buildSeriesKey("Harry Potter"),
      seriesPosition: "2",
    }
  );
});
