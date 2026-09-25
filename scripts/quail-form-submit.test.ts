import test from "node:test";
import assert from "node:assert/strict";
import { createEnterSubmitHandler } from "../src/client/utils/formSubmit.ts";

test("Enter from a Quail input submits the migrated form", () => {
  let calls = 0;
  const handleEnter = createEnterSubmitHandler(() => {
    calls += 1;
  });

  handleEnter({ key: "Enter" } as KeyboardEvent);

  assert.equal(calls, 1);
});

test("other keys do not submit the migrated form", () => {
  let calls = 0;
  const handleEnter = createEnterSubmitHandler(() => {
    calls += 1;
  });

  handleEnter({ key: "a" } as KeyboardEvent);

  assert.equal(calls, 0);
});
