import test from "node:test";
import assert from "node:assert/strict";
import {
  createDataLoadState,
  failDataRefresh,
  finishDataRefresh,
  startDataRefresh,
} from "../src/client/loadingState.ts";

test("initial refresh uses the loading state", () => {
  const state = createDataLoadState();

  startDataRefresh(state, "initial");

  assert.equal(state.initialLoading, true);
  assert.equal(state.refreshing, false);
  assert.equal(state.error, "");
});

test("background refresh preserves content instead of showing the initial skeleton", () => {
  const state = createDataLoadState();

  startDataRefresh(state, "background");

  assert.equal(state.initialLoading, false);
  assert.equal(state.refreshing, true);
  assert.equal(state.error, "");
});

test("failed refresh reports the error and clears both loading states", () => {
  const state = createDataLoadState();
  startDataRefresh(state, "background");

  failDataRefresh(state, "background", new Error("加载失败"));

  assert.equal(state.initialLoading, false);
  assert.equal(state.refreshing, false);
  assert.equal(state.error, "加载失败");
});

test("successful refresh clears the active loading state", () => {
  const state = createDataLoadState();
  startDataRefresh(state, "background");

  finishDataRefresh(state, "background");

  assert.equal(state.refreshing, false);
});
