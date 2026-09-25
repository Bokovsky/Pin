import test from "node:test";
import assert from "node:assert/strict";
import { toOperationErrorMessage } from "../src/client/operationError.ts";

test("operation errors preserve the backend message", () => {
  assert.equal(toOperationErrorMessage(new Error("保存失败"), "分类操作失败"), "保存失败");
});

test("operation errors fall back when the thrown value has no message", () => {
  assert.equal(toOperationErrorMessage(undefined, "分类操作失败"), "分类操作失败");
  assert.equal(toOperationErrorMessage(new Error(""), "分类操作失败"), "分类操作失败");
});
