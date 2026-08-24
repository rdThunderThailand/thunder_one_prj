/** Run: node src/features/publications/publication-status.check.mts */
import assert from "node:assert/strict";
import {
  isPastPublication,
  publicationDisplayStatus,
  publicationStatusColor,
} from "./publication-status.ts";

assert.equal(isPastPublication({ status: "draft", effective_status: "draft" }), false);
assert.equal(isPastPublication({ status: "active", effective_status: "scheduled" }), false);
assert.equal(isPastPublication({ status: "active", effective_status: "active" }), false);
assert.equal(isPastPublication({ status: "active", effective_status: "ended" }), true);
assert.equal(isPastPublication({ status: "cancelled" }), true);
assert.equal(isPastPublication({ status: "cancelled", effective_status: "active" }), true);

assert.equal(publicationDisplayStatus({ status: "active", effective_status: "ended" }), "ended");
assert.equal(publicationDisplayStatus({ status: "draft" }), "draft");

assert.equal(publicationStatusColor("ended"), "zinc");
assert.equal(publicationStatusColor("cancelled"), "red");
assert.equal(publicationStatusColor(undefined), "zinc");

console.log("ok");
