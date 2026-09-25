import test from "node:test";
import assert from "node:assert/strict";
import { filterCategoriesByQuery, resolveCategoryAnchorId } from "../src/client/searchFilter.ts";
import type { Category } from "../src/client/types.ts";

const categories: Category[] = [
  {
    id: "work",
    name: "工作",
    description: "",
    sort_order: 0,
    links: [
      {
        id: "work-link",
        title: "工作手册",
        url: "https://example.com/manual",
        description: "流程",
        backup_url: "",
        sort_order: 0,
        status: "",
      },
    ],
    children: [],
  },
  {
    id: "news",
    name: "资讯",
    description: "",
    sort_order: 1,
    links: [
      {
        id: "news-link",
        title: "每日新闻",
        url: "https://example.com/news",
        description: "头条",
        backup_url: "",
        sort_order: 0,
        status: "",
      },
    ],
    children: [
      {
        id: "community",
        name: "社区",
        description: "",
        sort_order: 0,
        links: [
          {
            id: "community-link",
            title: "观察记录",
            url: "https://example.com/notes",
            description: "笔记",
            backup_url: "",
            sort_order: 0,
            status: "",
          },
        ],
        children: [],
      },
    ],
  },
];

test("category-name match keeps all links under that category", () => {
  const result = filterCategoriesByQuery(categories, "工作");

  assert.equal(result.length, 1);
  assert.equal(result[0]?.id, "work");
  assert.equal(result[0]?.links.length, 1);
});

test("child-category-name match keeps its full link list", () => {
  const result = filterCategoriesByQuery(categories, "社区");

  assert.equal(result.length, 1);
  assert.equal(result[0]?.id, "news");
  assert.equal(result[0]?.links.length, 0);
  assert.equal(result[0]?.children.length, 1);
  assert.equal(result[0]?.children[0]?.links.length, 1);
});

test("link-field match preserves the ancestor path", () => {
  const result = filterCategoriesByQuery(categories, "观察");

  assert.equal(result.length, 1);
  assert.equal(result[0]?.id, "news");
  assert.equal(result[0]?.children[0]?.id, "community");
  assert.deepEqual(result[0]?.children[0]?.links.map(link => link.id), ["community-link"]);
});

test("tree node click resolves the clicked category id", () => {
  assert.equal(resolveCategoryAnchorId({ id: "community" }), "community");
  assert.equal(resolveCategoryAnchorId({ data: { id: "news" } }), "news");
  assert.equal(resolveCategoryAnchorId(null), undefined);
});
