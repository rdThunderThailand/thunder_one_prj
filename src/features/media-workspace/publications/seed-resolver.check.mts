// Run: node src/features/media-workspace/publications/seed-resolver.check.mts
import assert from "node:assert/strict";
import { resolveSeed } from "./seed-resolver.ts";

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

console.log("ok");
