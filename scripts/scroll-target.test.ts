import test from "node:test";
import assert from "node:assert/strict";
import { scrollContentToTop } from "../src/client/scrollTarget.ts";

test("return-to-top scrolls the content panel instead of the window", () => {
  let received: ScrollToOptions | undefined;
  let fallbackCalls = 0;

  const scrolled = scrollContentToTop(
    {
      querySelector: () => ({
        scrollTo: (options: ScrollToOptions) => { received = options; },
        scrollHeight: 200,
        clientHeight: 100,
      }),
    },
    () => { fallbackCalls += 1; }
  );

  assert.equal(scrolled, true);
  assert.deepEqual(received, { top: 0, behavior: "smooth" });
  assert.equal(fallbackCalls, 0);
});

test("return-to-top falls back when the content panel has no overflow", () => {
  let fallbackCalls = 0;

  const scrolled = scrollContentToTop(
    {
      querySelector: () => ({
        scrollTo: () => { throw new Error("content scroller should not be used"); },
        scrollHeight: 100,
        clientHeight: 100,
      }),
    },
    () => { fallbackCalls += 1; }
  );

  assert.equal(scrolled, false);
  assert.equal(fallbackCalls, 1);
});

test("return-to-top falls back to the window when the content panel is absent", () => {
  let fallbackCalls = 0;

  const scrolled = scrollContentToTop(
    { querySelector: () => null },
    () => { fallbackCalls += 1; }
  );

  assert.equal(scrolled, false);
  assert.equal(fallbackCalls, 1);
});
