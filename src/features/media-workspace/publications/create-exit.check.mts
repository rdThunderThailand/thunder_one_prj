/**
 * Runnable check for the Create wizard's Cancel (ADR 0124):
 *
 *     node src/features/media-workspace/publications/create-exit.check.mts
 */
import assert from "node:assert/strict";
import { createExitPlan } from "./create-exit.ts";

// Empty, or saved with nothing pending: leave without asking or reporting.
assert.deepEqual(createExitPlan({ isDirty: false, hasServerDraft: false }), { confirm: null, toast: null });
assert.deepEqual(createExitPlan({ isDirty: false, hasServerDraft: true }), { confirm: null, toast: null });

// Saved with unsaved edits: the resume prompt's discard wording, never a claim about the Programs list.
const savedEdits = createExitPlan({ isDirty: true, hasServerDraft: true });
assert.match(savedEdits.confirm ?? "", /ส่วนที่บันทึกไว้แล้วไม่ถูกแตะ/);
assert.equal(savedEdits.toast, "ทิ้งการแก้ไขที่ยังไม่บันทึกแล้ว");
assert.doesNotMatch(`${savedEdits.confirm} ${savedEdits.toast}`, /Programs/);

// Never saved: everything typed is lost.
const neverSaved = createExitPlan({ isDirty: true, hasServerDraft: false });
assert.match(neverSaved.confirm ?? "", /กู้คืนไม่ได้/);
assert.equal(neverSaved.toast, "ทิ้ง draft แล้ว");

console.log("create-exit.check: ok");
