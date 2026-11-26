/** Run: node src/features/media-workspace/publications/publication-status.check.mts */
import assert from "node:assert/strict";
import { isPastPublication } from "./publication-status.ts";

assert.equal(isPastPublication({ status: "draft", effective_status: "draft" }), false);
assert.equal(isPastPublication({ status: "active", effective_status: "scheduled" }), false);
assert.equal(isPastPublication({ status: "active", effective_status: "active" }), false);
assert.equal(isPastPublication({ status: "active", effective_status: "ended" }), true);
assert.equal(isPastPublication({ status: "cancelled" }), true);
assert.equal(isPastPublication({ status: "cancelled", effective_status: "active" }), true);

console.log("ok");
