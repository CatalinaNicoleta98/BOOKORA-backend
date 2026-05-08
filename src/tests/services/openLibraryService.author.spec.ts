import { expect, test } from "@playwright/test";
import axios from "axios";
import { getOpenLibraryAuthorById } from "../../services/openLibraryService";

const originalAxiosGet = axios.get;

const createAxiosGetMock = (responses: Record<string, unknown>) => {
  return async (url: string) => {
    if (!(url in responses)) {
      throw new Error(`Missing mocked response for ${url}`);
    }

    return { data: responses[url] };
  };
};

test.afterEach(() => {
  axios.get = originalAxiosGet;
});

test.describe("author grouping", () => {
  test("groups only strong series matches for the author", async () => {
    axios.get = createAxiosGetMock({
      "https://openlibrary.org/authors/OLAUTH1A.json": {
        key: "/authors/OLAUTH1A",
        name: "Test Author",
      },
      "https://openlibrary.org/authors/OLAUTH1A/works.json?limit=40": {
        entries: [
          { key: "/works/OL1W", title: "Strong Match 1" },
          { key: "/works/OL2W", title: "Strong Match 2" },
        ],
      },
      "https://openlibrary.org/works/OL1W.json": {
        key: "/works/OL1W",
        title: "Strong Match 1",
        first_publish_date: "2001",
        authors: [],
        series: "Stormlight Archive",
        series_position: "1",
      },
      "https://openlibrary.org/works/OL2W.json": {
        key: "/works/OL2W",
        title: "Strong Match 2",
        first_publish_date: "2003",
        authors: [],
        series: "Stormlight Archive",
        series_position: "2",
      },
      "https://openlibrary.org/works/OL1W/editions.json": { entries: [] },
      "https://openlibrary.org/works/OL2W/editions.json": { entries: [] },
    }) as typeof axios.get;

    const result = await getOpenLibraryAuthorById("OLAUTH1A");

    expect(result.seriesGroups).toHaveLength(1);
    expect(result.seriesGroups[0]).toMatchObject({
      seriesKey: "stormlight-archive",
      seriesTitle: "Stormlight Archive",
    });
    expect(result.seriesGroups[0].books.map((book) => book.key)).toEqual(["OL1W", "OL2W"]);
    expect(result.standaloneBooks).toHaveLength(0);
  });

  test("keeps ambiguous books in standaloneBooks instead of forcing a series group", async () => {
    axios.get = createAxiosGetMock({
      "https://openlibrary.org/authors/OLAUTH2A.json": {
        key: "/authors/OLAUTH2A",
        name: "Another Author",
      },
      "https://openlibrary.org/authors/OLAUTH2A/works.json?limit=40": {
        entries: [
          { key: "/works/OL3W", title: "Ambiguous Work" },
          { key: "/works/OL4W", title: "Clear Standalone" },
        ],
      },
      "https://openlibrary.org/works/OL3W.json": {
        key: "/works/OL3W",
        title: "Ambiguous Work",
        first_publish_date: "2007",
        authors: [],
      },
      "https://openlibrary.org/works/OL4W.json": {
        key: "/works/OL4W",
        title: "Clear Standalone",
        first_publish_date: "2010",
        authors: [],
      },
      "https://openlibrary.org/works/OL3W/editions.json": {
        entries: [
          { key: "/books/OL31M", title: "Collector Edition", series: ["Fantasy Favourites"] },
          { key: "/books/OL32M", title: "Library Edition", series: ["Popular Picks"] },
        ],
      },
      "https://openlibrary.org/works/OL4W/editions.json": { entries: [] },
    }) as typeof axios.get;

    const result = await getOpenLibraryAuthorById("OLAUTH2A");

    expect(result.seriesGroups).toHaveLength(0);
    expect(result.standaloneBooks.map((book) => book.key)).toEqual(["OL3W", "OL4W"]);
  });

  test("deduplicates repeated work entries by work key before building author groups", async () => {
    axios.get = createAxiosGetMock({
      "https://openlibrary.org/authors/OLAUTH3A.json": {
        key: "/authors/OLAUTH3A",
        name: "Duplicate Test Author",
      },
      "https://openlibrary.org/authors/OLAUTH3A/works.json?limit=40": {
        entries: [
          { key: "/works/OL10W", title: "Duplicate Match" },
          { key: "/works/OL10W", title: "Duplicate Match Again" },
        ],
      },
      "https://openlibrary.org/works/OL10W.json": {
        key: "/works/OL10W",
        title: "Duplicate Match",
        first_publish_date: "2001",
        authors: [],
        series: "Red Rising",
        series_position: "1",
      },
      "https://openlibrary.org/works/OL10W/editions.json": { entries: [] },
    }) as typeof axios.get;

    const result = await getOpenLibraryAuthorById("OLAUTH3A");

    expect(result.seriesGroups).toHaveLength(1);
    expect(result.seriesGroups[0].books.map((book) => book.key)).toEqual(["OL10W"]);
    expect(result.standaloneBooks).toHaveLength(0);
  });
});
