import test from "node:test";
import assert from "node:assert/strict";
import { shouldRefitBackdrop } from "../src/client/asciiViewport.ts";

const size = (width: number, height: number, dpr = 1) => ({ width, height, dpr });

test("first observation never forces a refit", () => {
  assert.equal(shouldRefitBackdrop(null, size(1920, 1080)), false);
});

test("identical viewport needs no refit", () => {
  assert.equal(
    shouldRefitBackdrop(size(1920, 1080, 2), size(1920, 1080, 2)),
    false
  );
});

test("width, height or dpr changes request a refit", () => {
  assert.equal(shouldRefitBackdrop(size(1920, 1080), size(1600, 1080)), true);
  assert.equal(shouldRefitBackdrop(size(1920, 1080), size(1920, 900)), true);
  assert.equal(shouldRefitBackdrop(size(1920, 1080, 1), size(1920, 1080, 2)), true);
});
