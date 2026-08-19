/** Run: node src/features/playlists/status-display.check.mts */
import assert from "node:assert/strict";
import { describeDeleteError, statusBadge } from "./status-display.ts";

assert.deepEqual(statusBadge("active"), { color: "green", label: "Active" });
assert.deepEqual(statusBadge("draft"), { color: "yellow", label: "Draft" });
assert.deepEqual(statusBadge("inactive"), { color: "zinc", label: "Inactive" });

// The count survives; the raw RPC wording does not.
assert.equal(
  describeDeleteError("Invalid input: playlist is used by 3 publication(s)"),
  "ลบไม่ได้ — playlist นี้ถูกใช้อยู่ใน 3 publication กรุณาลบหรือยกเลิก publication เหล่านั้นก่อน"
);
assert.match(
  describeDeleteError("Invalid input: this playlist belongs to a publication and cannot be deleted on its own"),
  /ลบที่ publication แทน$/
);
// Anything unrecognised degrades to a generic retry message rather than leaking the body.
assert.equal(describeDeleteError("permission denied for table playlists"), "ลบ playlist ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");

console.log("status-display.check.mts — all assertions passed");
