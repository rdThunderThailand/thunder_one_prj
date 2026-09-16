// Run: node src/features/media-workspace/publications/seed-resolver.check.mts
import assert from "node:assert/strict";
import { publicationSeedFromParams, resolveSeed } from "./seed-resolver.ts";

// The four rows from ticket #78 / plan Phase 0 item 4.

// draft empty at hydration → apply immediately (choice not yet made)
assert.equal(
  resolveSeed({ seedPresent: true, isEditMode: false, draftHasContent: false, choice: null }),
  "apply",
);

// draft has content, operator picks Continue → discard the seed
assert.equal(
  resolveSeed({ seedPresent: true, isEditMode: false, draftHasContent: true, choice: "continue" }),
  "discard",
);

// draft has content, operator picks Start fresh → apply (caller clears first)
assert.equal(
  resolveSeed({ seedPresent: true, isEditMode: false, draftHasContent: true, choice: "fresh" }),
  "apply",
);

// arriving with ?id= (edit mode) → never seed
assert.equal(
  resolveSeed({ seedPresent: true, isEditMode: true, draftHasContent: false, choice: null }),
  "discard",
);

// draft has content, choice not made yet → wait for the prompt
assert.equal(
  resolveSeed({ seedPresent: true, isEditMode: false, draftHasContent: true, choice: null }),
  "wait",
);

// no seed in the URL → nothing to do
assert.equal(
  resolveSeed({ seedPresent: false, isEditMode: false, draftHasContent: true, choice: null }),
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

console.log("ok");
