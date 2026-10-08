// Run: node src/features/media-workspace/publications/seed-resolver.check.mts
import assert from "node:assert/strict";
import { publicationSeedFromParams, resolveSeed } from "./seed-resolver.ts";

// The four rows from ticket #78 / plan Phase 0 item 4.

// draft empty at hydration → apply immediately (choice not yet made)
assert.equal(
  resolveSeed({ seedPresent: true, isEditMode: false, draftHasUnfinishedWork: false, choice: null }),
  "apply",
);

// draft has content, operator picks Continue → discard the seed
assert.equal(
  resolveSeed({ seedPresent: true, isEditMode: false, draftHasUnfinishedWork: true, choice: "continue" }),
  "discard",
);

// draft has content, operator picks Start fresh → apply (caller clears first)
assert.equal(
  resolveSeed({ seedPresent: true, isEditMode: false, draftHasUnfinishedWork: true, choice: "fresh" }),
  "apply",
);

// arriving with ?id= (edit mode) → never seed
assert.equal(
  resolveSeed({ seedPresent: true, isEditMode: true, draftHasUnfinishedWork: false, choice: null }),
  "discard",
);

// draft has content, choice not made yet → wait for the prompt
assert.equal(
  resolveSeed({ seedPresent: true, isEditMode: false, draftHasUnfinishedWork: true, choice: null }),
  "wait",
);

// no seed in the URL → nothing to do
assert.equal(
  resolveSeed({ seedPresent: false, isEditMode: false, draftHasUnfinishedWork: true, choice: null }),
  "discard",
);

assert.deepEqual(
  publicationSeedFromParams({ assetId: null, playlistId: "playlist-1", compositionId: null }),
  { kind: "playlist", id: "playlist-1" },
);
assert.deepEqual(
  publicationSeedFromParams({ assetId: null, playlistId: null, compositionId: "composition-1" }),
  { kind: "composition", id: "composition-1" },
);
assert.deepEqual(
  publicationSeedFromParams({ assetId: "asset-1", playlistId: null, compositionId: null }),
  { kind: "asset", id: "asset-1" },
);

assert.equal(publicationSeedFromParams({ assetId: null, playlistId: null, compositionId: null }), null);
assert.deepEqual(
  publicationSeedFromParams({ assetId: "asset-1", playlistId: "playlist-1", compositionId: "composition-1" }),
  { kind: "composition", id: "composition-1" },
);

// Each editor seed uses the same gate: clean saved draft applies, unfinished waits.
for (const kind of ["asset", "playlist", "composition"] as const) {
  const params = {
    assetId: kind === "asset" ? "seed-1" : null,
    playlistId: kind === "playlist" ? "seed-1" : null,
    compositionId: kind === "composition" ? "seed-1" : null,
  };
  const seedPresent = publicationSeedFromParams(params) !== null;
  assert.equal(resolveSeed({ seedPresent, isEditMode: false, draftHasUnfinishedWork: false, choice: null }), "apply", kind);
  assert.equal(resolveSeed({ seedPresent, isEditMode: false, draftHasUnfinishedWork: true, choice: null }), "wait", kind);
  assert.equal(resolveSeed({ seedPresent, isEditMode: false, draftHasUnfinishedWork: true, choice: "fresh" }), "apply", kind);
  assert.equal(resolveSeed({ seedPresent, isEditMode: false, draftHasUnfinishedWork: true, choice: "continue" }), "discard", kind);
  assert.equal(resolveSeed({ seedPresent, isEditMode: true, draftHasUnfinishedWork: true, choice: "fresh" }), "discard", kind);
}

console.log("seed-resolver.check.mts — all assertions passed");
