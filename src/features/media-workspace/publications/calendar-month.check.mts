import assert from "node:assert/strict";
import { addMonths, monthCells, selectDateRange } from "./calendar-month.ts";
import { applyPreset, presetOf, scheduleToDraft } from "./schedule-preset.ts";

assert.equal(addMonths("2026-12-01", 1), "2027-01-01");
assert.equal(addMonths("2026-01-01", -1), "2025-12-01");
assert.equal(monthCells("2024-02-01").filter(Boolean).length, 29);
assert.equal(monthCells("2026-02-01").filter(Boolean).length, 28);
assert.equal(monthCells("2026-10-01").indexOf("2026-10-01"), 3);

const first = selectDateRange(null, "2026-11-03");
assert.deepEqual(first, { startDate: "2026-11-03", endDate: "2026-11-03", anchor: "2026-11-03" });
assert.deepEqual(selectDateRange(first.anchor, "2026-10-12"), {
  startDate: "2026-10-12", endDate: "2026-11-03", anchor: null,
});
assert.deepEqual(selectDateRange("2026-10-12", "2026-10-12"), {
  startDate: "2026-10-12", endDate: "2026-10-12", anchor: null,
});
assert.equal(selectDateRange("2026-10-12", "2026-11-03").endDate, "2026-11-03");

// The first click must keep the Date range preset mounted, rather than switching to Every day.
const draft = applyPreset(scheduleToDraft(null, "2026-10-05", "Asia/Bangkok"), "date-range", "2026-10-05");
assert.equal(presetOf({ ...draft, startDate: first.startDate, endDate: first.endDate }), "date-range");
console.log("calendar month/range checks passed");
