import { expect, test } from "@playwright/test";
import axios from "axios";
import { getOpenLibraryBookById } from "./openLibraryService";

const originalAxiosGet = axios.get;

const createAxiosGetMock = (responses: Record<string, unknown>) => {
  return async (url: string, config?: { params?: Record<string, unknown> }) => {
    if (url === "https://openlibrary.org/search.json") {
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

test.afterEach(() => {
  axios.get = originalAxiosGet;
});

test.describe("edition key contract", () => {
  test("requesting an edition preserves requested edition identity", async () => {
    axios.get = createAxiosGetMock({
      "https://openlibrary.org/books/OL123M.json": {
        key: "/books/OL123M",
        title: "Test Edition",
        publish_date: "2001",
        publishers: ["Edition House"],
        works: [{ key: "/works/OL999W" }],
      },
      "https://openlibrary.org/works/OL999W.json": {
        key: "/works/OL999W",
        title: "Parent Work",
        description: "Work description",
        first_publish_date: "2000",
        subjects: [],
        authors: [],
      },
      'https://openlibrary.org/search.json?{"q":"key:/works/OL999W","fields":"number_of_pages_median,edition_count,publisher,publish_place,language","limit":1}':
        { docs: [{ edition_count: 2 }] },
      "https://openlibrary.org/works/OL999W/editions.json": {
        entries: [
          {
            key: "/books/OL123M",
            title: "Test Edition",
            publish_date: "2001",
            publishers: ["Edition House"],
          },
          {
            key: "/books/OL124M",
            title: "Other Edition",
            publish_date: "2005",
            publishers: ["Second House"],
          },
        ],
      },
    }) as typeof axios.get;

    const result = await getOpenLibraryBookById("OL123M");

    expect(result.requestedKey).toBe("OL123M");
    expect(result.workKey).toBe("OL999W");
    expect(result.externalBookId).toBe("OL999W");
    expect(result.editionKey).toBe("OL123M");
    expect(result.selectedEdition).toMatchObject({
      editionKey: "OL123M",
      workKey: "OL999W",
      title: "Test Edition",
    });
    expect(result.title).toBe("Test Edition");
  });

  test("other editions include both editionKey and workKey without collapsing to the current work", async () => {
    axios.get = createAxiosGetMock({
      "https://openlibrary.org/works/OL999W.json": {
        key: "/works/OL999W",
        title: "Parent Work",
        description: "Work description",
        first_publish_date: "2000",
        subjects: [],
        authors: [],
      },
      'https://openlibrary.org/search.json?{"q":"key:/works/OL999W","fields":"number_of_pages_median,edition_count,publisher,publish_place,language","limit":1}':
        { docs: [{ edition_count: 2 }] },
      "https://openlibrary.org/works/OL999W/editions.json": {
        entries: [
          {
            key: "/books/OL123M",
            title: "First Edition",
            publish_date: "2001",
          },
          {
            key: "/books/OL124M",
            title: "Second Edition",
            publish_date: "2005",
          },
        ],
      },
    }) as typeof axios.get;

    const result = await getOpenLibraryBookById("OL999W");

    expect(result.editions).toHaveLength(2);
    expect(result.editions?.map((edition) => edition.editionKey)).toEqual(["OL123M", "OL124M"]);
    expect(result.editions?.every((edition) => edition.workKey === "OL999W")).toBeTruthy();
    expect(result.editions?.every((edition) => edition.editionKey !== result.workKey)).toBeTruthy();
  });
});
