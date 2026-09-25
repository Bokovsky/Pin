import test from "node:test";
import assert from "node:assert/strict";
import { resolveQuailUiTheme } from "../src/client/quailTheme.ts";

test("explicit light and dark themes pass through to Quail UI", () => {
  assert.equal(resolveQuailUiTheme("light"), "light");
  assert.equal(resolveQuailUiTheme("dark"), "dark");
});
