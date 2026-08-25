/** Run: node src/features/communication/layouts/status-display.check.mts */
import assert from "node:assert/strict";
import { describeSaveError, statusBadge } from "./status-display.ts";

assert.deepEqual(statusBadge("active"), { color: "green", label: "Active" });
assert.deepEqual(statusBadge("inactive"), { color: "zinc", label: "Inactive" });

assert.equal(
  describeSaveError("Invalid input: a layout may not have more than 4 zones"),
  "บันทึกไม่ได้ — Layout มีได้สูงสุด 4 Zone"
);
assert.equal(
  describeSaveError("Invalid input: a layout needs at least one zone"),
  "บันทึกไม่ได้ — ต้องมีอย่างน้อย 1 Zone"
);
assert.equal(
  describeSaveError("Invalid input: zones 1 and 2 overlap"),
  "บันทึกไม่ได้ — Zone ซ้อนทับกัน กรุณาปรับขนาดหรือตำแหน่งใหม่"
);
assert.equal(
  describeSaveError('duplicate key value violates unique constraint "layouts_tenant_id_name_key"'),
  "บันทึกไม่ได้ — มี Layout ชื่อนี้อยู่แล้ว"
);
// Unrecognised message degrades to the generic string rather than leaking the body.
assert.equal(
  describeSaveError("permission denied for table layouts"),
  "บันทึก Layout ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
);

console.log("status-display.check.mts — all assertions passed");
