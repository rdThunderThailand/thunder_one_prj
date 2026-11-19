/** Run: node --experimental-strip-types src/features/asset-workspace/domain/warranty-timing.check.mts */
import assert from "node:assert/strict";
import { warrantyEndHint, warrantyNotStarted, warrantyStartsIn } from "./warranty-timing.ts";

const today = "2026-11-19";
assert.equal(warrantyEndHint("Expiring Soon", "2027-01-03", today), "in 45 days");
assert.equal(warrantyEndHint("Expiring Soon", "2026-11-20", today), "in 1 day");
assert.equal(warrantyEndHint("Expiring Soon", today, today), "Ends today");
assert.equal(warrantyEndHint("Expired", "2026-11-16", today), "3 days ago");
assert.equal(warrantyEndHint("Active", "2027-01-03", today), null, "only Expiring Soon and Expired get a hint");
assert.equal(warrantyEndHint("Expired", null, today), null);
assert.equal(warrantyNotStarted("2028-01-01", today), true);
assert.equal(warrantyNotStarted(today, today), false, "a warranty starting today has started");
assert.equal(warrantyNotStarted(null, today), false);
assert.equal(warrantyStartsIn("2028-01-01", today), "Starts in 1 year 1 month");
assert.equal(warrantyStartsIn("2026-12-01", today), "Starts in less than a month");
assert.equal(warrantyStartsIn("2026-01-01", today), null);
console.log("Warranty end hints and not-started checks passed.");
