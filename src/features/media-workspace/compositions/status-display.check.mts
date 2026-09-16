/** Run: node src/features/media-workspace/compositions/status-display.check.mts */
import assert from "node:assert/strict";
import { describeActivateError, describeSaveError, saveAction, statusBadge } from "./status-display.ts";

assert.deepEqual(statusBadge("draft"), { color: "yellow", label: "Draft" });
assert.deepEqual(statusBadge("active"), { color: "green", label: "Active" });
assert.deepEqual(statusBadge("inactive"), { color: "zinc", label: "Inactive" });
assert.deepEqual(saveAction("draft"), { label: "Save Layout", canActivate: true });
assert.deepEqual(saveAction("active"), { label: "Save", canActivate: false });
assert.deepEqual(saveAction("inactive"), { label: "Save", canActivate: false });

assert.equal(
  describeSaveError('Already exists: a composition named "Menu" exists'),
  "บันทึกไม่ได้ — มี Composition ชื่อนี้อยู่แล้ว",
);
// A name collision on the `layouts` row is not the Composition's name — it is a Template's.
// Both arrive through the same save, so only the RPC's own noun tells them apart.
assert.equal(
  describeSaveError('Already exists: a layout named "T25 Layout" exists'),
  "บันทึกไม่ได้ — มี Template ชื่อนี้อยู่แล้ว กรุณาตั้งชื่ออื่น",
);
assert.equal(
  describeActivateError('Already exists: a layout named "T25 Layout" exists'),
  "บันทึกไม่ได้ — มี Template ชื่อนี้อยู่แล้ว กรุณาตั้งชื่ออื่น",
);
assert.equal(
  describeSaveError("Already modified: composition was changed elsewhere"),
  "Composition นี้ถูกแก้ไขจากที่อื่น กรุณาโหลดใหม่แล้วลองอีกครั้ง",
);
assert.equal(
  describeSaveError("Invalid input: cannot change the layout of an active composition"),
  "เปลี่ยน Layout ไม่ได้ขณะ Composition กำลัง Active",
);
assert.equal(describeSaveError("Invalid input: something else"), "บันทึก Composition ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");

// Unbound-Zone names come straight from the RPC's own message.
assert.equal(
  describeActivateError("Invalid input: cannot activate an incomplete composition — zone(s) Ticker, Main are unbound"),
  "เปิดใช้งานไม่ได้ — ยังไม่ได้ผูก Content ให้ Zone: Ticker, Main",
);
assert.equal(
  describeActivateError("Invalid input: cannot move a composition back to draft"),
  "ย้าย Composition กลับไป Draft ไม่ได้",
);
assert.equal(
  describeActivateError('Already exists: a composition named "Menu" exists'),
  "บันทึกไม่ได้ — มี Composition ชื่อนี้อยู่แล้ว",
);

console.log("status-display.check.mts — all assertions passed");
