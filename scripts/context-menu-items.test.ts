import test from "node:test";
import assert from "node:assert/strict";
import { buildContextMenuItems } from "../src/client/contextMenuItems.ts";
import type { Link } from "../src/client/types.ts";

function link(overrides: Partial<Link> = {}): Link {
  return {
    id: "l1",
    title: "t",
    url: "https://example.com",
    description: "",
    backup_url: "",
    sort_order: 0,
    status: "",
    ...overrides,
  };
}

test("menu lists open, copy, qr, edit and danger delete in order", () => {
  const ids = buildContextMenuItems(link()).map((item) => item.id);
  assert.deepEqual(ids, [
    "open",
    "divider-1",
    "copy",
    "qr",
    "divider-2",
    "edit",
    "delete",
  ]);
});

test("backup link entry only appears when a backup url exists", () => {
  assert.ok(
    !buildContextMenuItems(link()).some((item) => item.id === "open-backup")
  );
  const ids = buildContextMenuItems(
    link({ backup_url: "https://backup.example.com" })
  ).map((item) => item.id);
  assert.deepEqual(ids, [
    "open",
    "open-backup",
    "divider-1",
    "copy",
    "qr",
    "divider-2",
    "edit",
    "delete",
  ]);
});

test("dividers are separators and delete is marked danger", () => {
  const items = buildContextMenuItems(link());
  const dividers = items.filter((item) => item.divider);
  assert.equal(dividers.length, 2);
  assert.ok(dividers.every((item) => item.title === undefined));
  const del = items.find((item) => item.id === "delete");
  assert.equal(del?.danger, true);
});
