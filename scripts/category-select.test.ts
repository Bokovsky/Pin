import test from "node:test";
import assert from "node:assert/strict";
import {
  findCategorySelectItem,
  toCategorySelectItems,
} from "../src/client/categorySelect.ts";

const categories = [
  { id: "c1", label: "临时" },
  { id: "c2", label: "工作 / 子项" },
];

test("category options map to dropdown items with title and value", () => {
  assert.deepEqual(toCategorySelectItems(categories), [
    { title: "临时", value: "c1" },
    { title: "工作 / 子项", value: "c2" },
  ]);
});

test("selected dropdown item follows the current category id", () => {
  const items = toCategorySelectItems(categories);
  assert.deepEqual(findCategorySelectItem(items, "c2"), {
    title: "工作 / 子项",
    value: "c2",
  });
});

test("missing category id selects nothing so the placeholder shows", () => {
  const items = toCategorySelectItems(categories);
  assert.equal(findCategorySelectItem(items, ""), null);
  assert.equal(findCategorySelectItem(items, "unknown"), null);
});
