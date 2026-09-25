import test from "node:test";
import assert from "node:assert/strict";
import { findFirstVisibleLink, normalizeSearchEngineUrl } from "../src/client/searchEngine.ts";

test("trims and preserves a valid HTTP search engine URL", () => {
  assert.equal(
    normalizeSearchEngineUrl("  https://www.bing.com/search?q=  "),
    "https://www.bing.com/search?q="
  );
});

test("rejects dangerous, missing-scheme, and unparseable engine URLs", () => {
  assert.equal(normalizeSearchEngineUrl("javascript:alert(1)"), undefined);
  assert.equal(normalizeSearchEngineUrl("www.bing.com/search?q="), undefined);
  assert.equal(normalizeSearchEngineUrl("not a url"), undefined);
  assert.equal(normalizeSearchEngineUrl("ftp://example.invalid/search?q="), undefined);
});

test("local search enter opens the first visible link", () => {
  const first = findFirstVisibleLink([
    {
      id: "work",
      name: "工作",
      description: "",
      sort_order: 0,
      links: [],
      children: [
        {
          id: "standards",
          name: "标准",
          description: "",
          sort_order: 0,
          links: [
            {
              id: "standards-1",
              title: "标准一",
              url: "https://example.invalid/standards",
              description: "",
              backup_url: "",
              sort_order: 0,
              status: "",
            },
          ],
          children: [],
        },
      ],
    },
  ]);

  assert.equal(first?.id, "standards-1");
});
