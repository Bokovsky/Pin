import test from "node:test";
import assert from "node:assert/strict";
import { ASCII_SCENES, pickRandomScene } from "../src/client/asciiScenes.ts";

test("three backdrop scenes are registered", () => {
  assert.deepEqual(
    ASCII_SCENES.map((scene) => scene.id),
    ["aurora-fjord", "deep-reef", "night-coast"]
  );
});

test("random picker covers the full range deterministically", () => {
  assert.equal(pickRandomScene(() => 0).id, "aurora-fjord");
  assert.equal(pickRandomScene(() => 0.34).id, "deep-reef");
  assert.equal(pickRandomScene(() => 0.99).id, "night-coast");
});

test("every scene piece exposes a grid meta and a frame factory", () => {
  for (const scene of ASCII_SCENES) {
    assert.ok(scene.piece.meta.cols > 0);
    assert.ok(scene.piece.meta.rows > 0);
    const frame = scene.piece.default();
    const picture = frame(0);
    const lines = picture.split("\n");
    assert.equal(lines.length, scene.piece.meta.rows);
    assert.ok(lines.every((line) => line.length === scene.piece.meta.cols));
  }
});
