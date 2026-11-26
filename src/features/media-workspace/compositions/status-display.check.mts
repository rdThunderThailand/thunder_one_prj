/** Run: node src/features/media-workspace/compositions/status-display.check.mts */
import assert from "node:assert/strict";
import { layoutPublishBlock, saveAction, statusBadge } from "./status-display.ts";

assert.deepEqual(statusBadge("draft"), { color: "zinc", label: "Draft" });
assert.deepEqual(statusBadge("active"), { color: "green", label: "Active" });
assert.deepEqual(statusBadge("inactive"), { color: "zinc", label: "Inactive" });
assert.deepEqual(saveAction("draft"), { label: "Save Layout", canActivate: true });
assert.deepEqual(saveAction("active"), { label: "Save", canActivate: false });
assert.deepEqual(saveAction("inactive"), { label: "Save", canActivate: false });

assert.equal(layoutPublishBlock("active"), null);
assert.ok(layoutPublishBlock("draft")?.includes("Activate"));
assert.ok(layoutPublishBlock("inactive")?.includes("ปิดใช้งาน")); // Core refuses Inactive too, not only Draft

console.log("status-display.check.mts — all assertions passed");
