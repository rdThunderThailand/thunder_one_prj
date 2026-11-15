import assert from "node:assert/strict";
import { maintenanceDays, maintenancePeriods } from "./maintenance-periods.mts";

const row = (id: string, at: string, fromStatus: string | null, toStatus: string | null) =>
  ({ id, at, fromStatus, toStatus, reason: `r${id}`, actorName: `u${id}` });

// AST-000093 shape on develop: Assigned → In Maintenance → (condition change) → Available, newest first from the API.
const periods = maintenancePeriods([
  row("4", "2026-11-12T13:29:00Z", "In Maintenance", "Available"),
  row("3", "2026-11-12T12:00:00Z", "In Maintenance", "In Maintenance"),
  row("2", "2026-11-12T11:05:00Z", "Assigned", "In Maintenance"),
  row("1", "2026-11-10T15:32:00Z", null, "Assigned"),
  row("5", "2026-11-14T09:00:00Z", "Available", "In Maintenance"),
]);
assert.equal(periods.length, 2);
assert.deepEqual(periods[0], { id: "5", startedAt: "2026-11-14T09:00:00Z", startedBy: "u5", reason: "r5", endedAt: null, endedBy: null, returnedTo: null });
assert.deepEqual(periods[1], {
  id: "2", startedAt: "2026-11-12T11:05:00Z", startedBy: "u2", reason: "r2",
  endedAt: "2026-11-12T13:29:00Z", endedBy: "u4", returnedTo: "Available",
});
assert.deepEqual(maintenancePeriods([row("1", "2026-11-10T00:00:00Z", "In Maintenance", "Available")]), []);
assert.equal(maintenanceDays("2026-11-12T11:05:00Z", "2026-11-12T13:29:00Z"), 1);
assert.equal(maintenanceDays("2026-11-01T00:00:00Z", null, Date.parse("2026-11-04T01:00:00Z")), 4);
console.log("Maintenance period checks passed");
