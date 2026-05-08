import { expect, test } from "@playwright/test";
import {
  buildSeriesKey,
  parseSeriesPositionForTitle,
  resolveSeriesMembership,
} from "./openLibraryNormalization";

test.describe("series normalization", () => {
  test("vague subjects or unrelated labels do not create a usable series group", () => {
    expect(
      resolveSeriesMembership({
        editionSeriesValues: ["Fantasy favourites", "Best sellers"],
      })
    ).toEqual({ confidence: "low" });
  });

  test("similar but different series titles are not merged and each work keeps its own position", () => {
    expect(
      resolveSeriesMembership({
        explicitSeries: "A Court of Thorns and Roses",
        explicitPosition: "2",
        editionSeriesValues: ["A Court of Thorns and Roses #2"],
      })
    ).toEqual({
      confidence: "high",
      seriesTitle: "A Court of Thorns and Roses",
      seriesKey: buildSeriesKey("A Court of Thorns and Roses"),
      seriesPosition: "2",
    });

    expect(
      resolveSeriesMembership({
        explicitSeries: "Crescent City",
        explicitPosition: "1",
        editionSeriesValues: ["Crescent City #1"],
      })
    ).toEqual({
      confidence: "high",
      seriesTitle: "Crescent City",
      seriesKey: buildSeriesKey("Crescent City"),
      seriesPosition: "1",
    });

    expect(parseSeriesPositionForTitle("A Court of Thorns and Roses #3", "Crescent City")).toBeUndefined();
  });
});
