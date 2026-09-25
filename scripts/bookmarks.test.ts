import test from "node:test";
import assert from "node:assert/strict";
import {
  extractBookmarkLinkAttributes,
  parseJsonBookmarks,
  renderBookmarkHtml,
  toNavData,
} from "../src/client/bookmarks.ts";
import type { Category } from "../src/client/types.ts";

function fixture(): Category[] {
  return [
    {
      id: "top",
      name: "工具",
      description: "顶级描述",
      sort_order: 1,
      links: [
        {
          id: "tool-out-of-order",
          title: "第二链接",
          url: "https://example.invalid/second",
          description: "第二描述",
          backup_url: "https://backup.invalid/second",
          sort_order: 1,
          status: "ok",
        },
        {
          id: "tool-first",
          title: "第一链接",
          url: "https://example.invalid/first",
          description: "第一描述",
          backup_url: "",
          sort_order: 0,
          status: "fail",
        },
      ],
      children: [
        {
          id: "child",
          name: "镜像加速",
          description: "",
          sort_order: 3,
          links: [],
          children: [
            {
              id: "grandchild",
              name: "容器加速",
              description: "第三级描述",
              sort_order: 2,
              links: [
                {
                  id: "grandchild-link",
                  title: "容器文档",
                  url: "https://example.invalid/container?x=1&y=2",
                  description: "容器 <描述>",
                  backup_url: "https://backup.invalid/container",
                  sort_order: 4,
                  status: "pending",
                },
              ],
              children: [],
            },
          ],
        },
      ],
    },
  ];
}

test("JSON export preserves nested categories, order, metadata, and drops runtime fields", () => {
  const exported = toNavData(fixture());
  const exportedText = JSON.stringify(exported);

  assert.equal(exported.length, 1);
  assert.equal(exported[0]?.sort_order, 1);
  assert.deepEqual(exported[0]?.links.map(link => link.title), ["第一链接", "第二链接"]);
  assert.equal(exported[0]?.children[0]?.children[0]?.name, "容器加速");
  assert.equal(exported[0]?.children[0]?.children[0]?.description, "第三级描述");
  assert.equal(exported[0]?.children[0]?.children[0]?.links[0]?.backup_url, "https://backup.invalid/container");
  assert.equal(exportedText.includes('"id"'), false);
  assert.equal(exportedText.includes('"status"'), false);
});

test("HTML export preserves nested categories and Pin metadata", () => {
  const html = renderBookmarkHtml(fixture(), new Date("2026-09-24T00:00:00Z"));

  assert.match(html, /<H3>容器加速<\/H3>/);
  assert.match(html, /DATA-PIN-DESCRIPTION="容器 &lt;描述&gt;"/);
  assert.match(html, /DATA-PIN-BACKUP-URL="https:\/\/backup\.invalid\/container"/);
  assert.match(html, /DATA-PIN-SORT="4"/);
  assert.match(html, /HREF="https:\/\/example\.invalid\/container\?x=1&amp;y=2"/);
});

test("HTML import prefers Pin metadata attributes", () => {
  const attributes = extractBookmarkLinkAttributes(
    {
      getAttribute(name: string) {
        return {
          "data-pin-description": "容器 <描述>",
          "data-pin-backup-url": "https://backup.invalid/container",
          "data-pin-sort": "4",
          description: "旧描述",
        }[name] ?? null;
      },
    },
    9
  );

  assert.deepEqual(attributes, {
    description: "容器 <描述>",
    backup_url: "https://backup.invalid/container",
    sort_order: 4,
  });
});

test("HTML import falls back to legacy description and position", () => {
  const attributes = extractBookmarkLinkAttributes(
    {
      getAttribute(name: string) {
        return name === "description" ? "旧描述" : null;
      },
    },
    7
  );

  assert.deepEqual(attributes, {
    description: "旧描述",
    backup_url: "",
    sort_order: 7,
  });
});

test("JSON import retains nested categories and sanitizes link fields", () => {
  const parsed = parseJsonBookmarks(JSON.stringify({
    categories: [
      {
        name: "工具",
        children: [
          {
            name: "镜像加速",
            children: [
              {
                name: "容器加速",
                links: [{ title: "", url: "" }],
              },
            ],
          },
        ],
      },
    ],
  }));

  assert.equal(parsed.categories[0]?.children[0]?.children[0]?.links[0]?.title, "未命名");
  assert.equal(parsed.categories[0]?.children[0]?.children[0]?.links[0]?.url, "about:blank");
});
