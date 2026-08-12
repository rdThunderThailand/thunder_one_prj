import assert from "node:assert";
import { resolveDraftStatus } from "./resolve-draft-status.ts";

// New row, plain draft save — must be explicitly created as a draft.
assert.strictEqual(resolveDraftStatus(null, false), "draft");

// New row, create-and-activate in one call.
assert.strictEqual(resolveDraftStatus(null, true), "active");

// Existing row, draft save — status MUST be omitted so the RPC preserves whatever
// the row already is. Returning "draft" here would demote a published playlist.
assert.strictEqual(resolveDraftStatus("11111111-1111-1111-1111-111111111111", false), undefined);

// Existing row, final submit.
assert.strictEqual(resolveDraftStatus("11111111-1111-1111-1111-111111111111", true), "active");

console.log("resolve-draft-status.check.mts OK");
