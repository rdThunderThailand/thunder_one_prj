/** Run: node src/features/media-workspace/layouts/create-seed.check.mts */
import assert from "node:assert/strict";
import { seedCanvasSettings, takeCreateSeed, writeCreateSeed, type CreateSeed } from "./create-seed.ts";

const values = new Map<string, string>();
Object.defineProperty(globalThis, "sessionStorage", {
  value: {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => values.set(key, value),
  },
});

const seed: CreateSeed = {
  kind: "scratch",
  details: {
    name: "Lobby",
    folderId: "folder-1",
    tags: ["Corporate", "News"],
    referenceResolution: "1920x1080",
    background: "#0a0e14",
  },
};

writeCreateSeed(seed);
assert.deepEqual(takeCreateSeed(), seed);
assert.equal(takeCreateSeed(), null);

const portraitPreset: CreateSeed = {
  kind: "preset",
  presetKey: "70-30-portrait",
  aspectRatio: "9:16",
  referenceResolution: "1080x1920",
  details: {
    name: "Portrait menu",
    folderId: null,
    tags: [],
    referenceResolution: "1080x1920",
    background: "#123456",
  },
};
assert.deepEqual(seedCanvasSettings(portraitPreset), {
  aspectRatio: "9:16",
  referenceResolution: "1080x1920",
  background: "#123456",
});

writeCreateSeed(portraitPreset);
assert.deepEqual(takeCreateSeed(), portraitPreset);

console.log("create-seed.check.mts — all assertions passed");
