import test from "node:test";
import assert from "node:assert/strict";
import { buildContainerLinkOrder, canStartLinkDrag } from "../src/client/linkReorder.ts";
import { applyLinkMove, applyReorder } from "../src/server/linkMoves.ts";
import type { NavData } from "../src/server/data.ts";

function moveFixture(): NavData {
  return {
    categories: [
      {
        id: "work",
        name: "工作",
        description: "",
        sort_order: 0,
        links: [
          { id: "work-1", title: "工作一", url: "https://example.com/1", description: "", backup_url: "", sort_order: 0, status: "" },
          { id: "work-2", title: "工作二", url: "https://example.com/2", description: "", backup_url: "", sort_order: 1, status: "" },
        ],
        children: [
          {
            id: "standards",
            name: "标准",
            description: "",
            sort_order: 0,
            links: [
              { id: "standards-1", title: "标准一", url: "https://example.com/3", description: "", backup_url: "", sort_order: 0, status: "" },
            ],
            children: [],
          },
        ],
      },
    ],
  };
}

test("same-container reorder only changes that container", () => {
  assert.deepEqual(buildContainerLinkOrder(["work-1", "work-2"], 0, 1), ["work-2", "work-1"]);
});

test("stored reorder follows the submitted array order", () => {
  const moved = applyReorder(moveFixture(), [
    { id: "work-2", sort_order: 0 },
    { id: "work-1", sort_order: 1 },
  ]);

  assert.deepEqual(moved.categories[0]?.links.map(link => link.id), ["work-2", "work-1"]);
  assert.deepEqual(moved.categories[0]?.links.map(link => link.sort_order), [0, 1]);
  assert.deepEqual(moved.categories[0]?.children[0]?.links.map(link => link.id), ["standards-1"]);
});

test("filtered search disables link dragging", () => {
  assert.equal(canStartLinkDrag(""), true);
  assert.equal(canStartLinkDrag("  "), true);
  assert.equal(canStartLinkDrag("标准"), false);
});

test("cross-category move preserves the link and renumbers both containers", () => {
  const moved = applyLinkMove(moveFixture(), {
    linkId: "work-1",
    targetCategoryId: "standards",
    targetIndex: 1,
  });

  assert.deepEqual(moved.categories[0]?.links.map(link => link.id), ["work-2"]);
  assert.deepEqual(moved.categories[0]?.links.map(link => link.sort_order), [0]);
  assert.deepEqual(moved.categories[0]?.children[0]?.links.map(link => link.id), ["standards-1", "work-1"]);
  assert.deepEqual(moved.categories[0]?.children[0]?.links.map(link => link.sort_order), [0, 1]);
  assert.equal(moved.categories[0]?.children[0]?.links[1]?.title, "工作一");
});

test("same-category move on the server keeps order contiguous", () => {
  const moved = applyLinkMove(moveFixture(), {
    linkId: "work-1",
    targetCategoryId: "work",
    targetIndex: 1,
  });

  assert.deepEqual(moved.categories[0]?.links.map(link => link.id), ["work-2", "work-1"]);
  assert.deepEqual(moved.categories[0]?.links.map(link => link.sort_order), [0, 1]);
});

test("missing link or category rejects the move", () => {
  assert.throws(() => applyLinkMove(moveFixture(), {
    linkId: "missing",
    targetCategoryId: "standards",
    targetIndex: 0,
  }));
  assert.throws(() => applyLinkMove(moveFixture(), {
    linkId: "work-1",
    targetCategoryId: "missing",
    targetIndex: 0,
  }));
});
