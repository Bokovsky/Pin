import test from "node:test";
import assert from "node:assert/strict";
import { resolveLinkEditorMode } from "../src/client/linkEditorState.ts";

test("category-preset opens in create mode", () => {
  const mode = resolveLinkEditorMode({ _categoryId: "category-1" }, ["category-1", "category-2"]);

  assert.equal(mode.mode, "create");
  assert.equal(mode.linkId, undefined);
  assert.equal(mode.initialCategoryId, "category-1");
});

test("existing link opens in edit mode", () => {
  const mode = resolveLinkEditorMode({ id: "link-1" }, ["category-1"]);

  assert.equal(mode.mode, "edit");
  assert.equal(mode.linkId, "link-1");
  assert.equal(mode.initialCategoryId, undefined);
});

test("global add falls back to first available category", () => {
  const mode = resolveLinkEditorMode(null, ["category-1", "category-2"]);

  assert.equal(mode.mode, "create");
  assert.equal(mode.initialCategoryId, "category-1");
});

test("invalid category preset falls back to first available category", () => {
  const mode = resolveLinkEditorMode({ _categoryId: "missing" }, ["category-1", "category-2"]);

  assert.equal(mode.mode, "create");
  assert.equal(mode.initialCategoryId, "category-1");
});
