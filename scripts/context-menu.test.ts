import test from "node:test";
import assert from "node:assert/strict";
import { clampContextMenuPosition } from "../src/client/contextMenuPosition.ts";

test("context menu stays inside the viewport near the bottom-right corner", () => {
  const position = clampContextMenuPosition({
    position: { x: 790, y: 590 },
    menuSize: { width: 160, height: 220 },
    viewport: { width: 800, height: 600 },
  });

  assert.deepEqual(position, { x: 632, y: 372 });
});

test("context menu never moves outside the top-left edge", () => {
  const position = clampContextMenuPosition({
    position: { x: 2, y: 3 },
    menuSize: { width: 160, height: 220 },
    viewport: { width: 800, height: 600 },
  });

  assert.deepEqual(position, { x: 8, y: 8 });
});
