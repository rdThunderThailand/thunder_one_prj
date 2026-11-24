import assert from "node:assert/strict";
import { actionsForComposition } from "./library-actions.ts";

assert.deepEqual(actionsForComposition({ status: "active" }, false), [
  "duplicate",
  "deactivate",
  "move",
  "trash",
]);
assert.deepEqual(actionsForComposition({ status: "draft" }, false), [
  "duplicate",
  "activate",
  "move",
  "trash",
]);
assert.deepEqual(actionsForComposition({ status: "inactive" }, false), [
  "duplicate",
  "activate",
  "move",
  "trash",
]);
assert.deepEqual(actionsForComposition({ status: "active" }, true), [
  "restore",
  "delete-forever",
]);

console.log("library-actions.check.mts OK");
