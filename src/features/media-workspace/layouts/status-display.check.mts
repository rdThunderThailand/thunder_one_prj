/** Run: node src/features/media-workspace/layouts/status-display.check.mts */
import assert from "node:assert/strict";
import { statusBadge } from "./status-display.ts";

assert.deepEqual(statusBadge("active"), { color: "green", label: "Active" });
assert.deepEqual(statusBadge("inactive"), { color: "zinc", label: "Inactive" });

console.log("status-display.check.mts — all assertions passed");
