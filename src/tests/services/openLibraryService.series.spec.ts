import { expect, test } from "@playwright/test";
import axios from "axios";
import { getOpenLibrarySeriesByKey } from "../../services/openLibraryService";

const originalAxiosGet = axios.get;
const SEARCH_URL = "https://openlibrary.org/search.json";
const SEARCH_FIELDS = "key,title,author_name,author_key,cover_i,first_publish_year";

const createAxiosGetMock = (responses: Record<string, unknown>) => {
  return async (url: string, config?: { params?: Record<string, unknown> }) => {
    if (url === SEARCH_URL) {
      const query = JSON.stringify(config?.params ?? {});
      const responseKey = `${url}?${query}`;

      if (!(responseKey in responses)) {
        throw new Error(`Missing mocked search response for ${responseKey}`);
      }

      return { data: responses[responseKey] };
    }

    if (!(url in responses)) {
      throw new Error(`Missing mocked response for ${url}`);
    }

    return { data: responses[url] };
  };
};

const buildSeriesSearchKey = (q: string, page: number) =>
  `${SEARCH_URL}?${JSON.stringify({
    q,
    fields: SEARCH_FIELDS,
    page,
    limit: 50,
  })}`;

test.afterEach(() => {
  axios.get = originalAxiosGet;
});

test.describe("series endpoint", () => {
  test("deduplicates repeated work keys and keeps each work's own parsed position", async () => {
    axios.get = createAxiosGetMock({
      [buildSeriesSearchKey('"stormlight archive"', 1)]: {
        docs: [
          {
            key: "/works/OL2W",
            title: "Words of Radiance",
            author_name: ["Brandon Sanderson"],
            author_key: ["OLAUTH1A"],
            first_publish_year: 2014,
          },
          {
            key: "/works/OL1W",
            title: "The Way of Kings",
            author_name: ["Brandon Sanderson"],
            author_key: ["OLAUTH1A"],
            first_publish_year: 2010,
          },
        ],
      },
      [buildSeriesSearchKey('"stormlight archive"', 2)]: { docs: [] },
      [buildSeriesSearchKey('"stormlight archive"', 3)]: { docs: [] },
      [buildSeriesSearchKey("stormlight archive", 1)]: {
        docs: [
          {
            key: "/works/OL1W",
            title: "The Way of Kings",
            author_name: ["Brandon Sanderson"],
            author_key: ["OLAUTH1A"],
            first_publish_year: 2010,
          },
          {
            key: "/works/OL9W",
            title: "Stormlight Companion",
            author_name: ["Brandon Sanderson"],
            author_key: ["OLAUTH1A"],
            first_publish_year: 2022,
          },
        ],
      },
      [buildSeriesSearchKey("stormlight archive", 2)]: { docs: [] },
      [buildSeriesSearchKey("stormlight archive", 3)]: { docs: [] },
      "https://openlibrary.org/works/OL1W.json": {
        key: "/works/OL1W",
        title: "The Way of Kings",
        first_publish_date: "2010",
        authors: [],
        series: "Stormlight Archive",
        series_position: "1",
      },
      "https://openlibrary.org/works/OL2W.json": {
        key: "/works/OL2W",
        title: "Words of Radiance",
        first_publish_date: "2014",
        authors: [],
        series: "Stormlight Archive",
        series_position: "2",
      },
      "https://openlibrary.org/works/OL9W.json": {
        key: "/works/OL9W",
        title: "Stormlight Companion",
        first_publish_date: "2022",
        authors: [],
        series: "Stormlight Companion",
        series_position: "1",
      },
      "https://openlibrary.org/works/OL1W/editions.json": { entries: [] },
      "https://openlibrary.org/works/OL2W/editions.json": { entries: [] },
      "https://openlibrary.org/works/OL9W/editions.json": { entries: [] },
    }) as typeof axios.get;

    const result = await getOpenLibrarySeriesByKey("stormlight-archive");

    expect(result.key).toBe("stormlight-archive");
    expect(result.title).toBe("Stormlight Archive");
    expect(result.bookCount).toBe(2);
    expect(result.books.map((book) => [book.key, book.position])).toEqual([
      ["OL1W", "1"],
      ["OL2W", "2"],
    ]);
  });
});
