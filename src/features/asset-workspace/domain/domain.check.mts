/** Run: node src/features/asset-workspace/domain/domain.check.mts */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { ACTIONS_BY_STATUS, actionsFor, canExport, EXPORT_STATUSES } from "./asset-actions.ts";
import { ASSET_CONDITIONS, CONDITIONS_BY_STATUS, isConditionAllowed, isTransferBlockedBy } from "./asset-condition.ts";
import { ASSET_STATUSES, canTransition, findTransition, STATUS_TRANSITIONS, type AssetStatus } from "./asset-status.ts";
import { CONDITION_TONE, STATUS_TONE } from "./status-tone.ts";
import { assignBlock, returnBlock, statusAfterReturn, transferBlock, type CustodyState } from "./custody.ts";

// §4.4 — every (from, to) pair in the 5x5 matrix: allowed exactly when it is in the spec list.
const allowed = [
  "Available>Assigned",
  "Assigned>Available",
  "Available>In Maintenance",
  "Assigned>In Maintenance",
  "In Maintenance>Available",
  "Available>Retired",
  "In Maintenance>Retired",
  "Retired>Disposed",
];
for (const from of ASSET_STATUSES) {
  for (const to of ASSET_STATUSES) {
    assert.equal(canTransition(from, to), allowed.includes(`${from}>${to}`), `${from} -> ${to}`);
  }
}
assert.equal(STATUS_TRANSITIONS.length, allowed.length);
// Assigned -> Retired must Return first; Disposed is terminal.
assert.equal(canTransition("Assigned", "Retired"), false);
assert.equal(ASSET_STATUSES.filter((to) => canTransition("Disposed", to)).length, 0);
assert.equal(findTransition("In Maintenance", "Available")?.requiresNoCustody, true);
assert.equal(findTransition("Assigned", "In Maintenance")?.requiresNoCustody, false);
assert.equal(findTransition("Available", "Assigned")?.via, "assign");
assert.equal(findTransition("Assigned", "Available")?.via, "return");

// §4.4 — condition per status, every cell.
const conditionTable: Record<AssetStatus, string[]> = {
  Available: ["Good", "Fair"],
  Assigned: ["Good", "Fair", "Damaged"],
  "In Maintenance": ["Fair", "Damaged", "Unusable"],
  Retired: ["Good", "Fair", "Damaged", "Unusable"],
  Disposed: ["Good", "Fair", "Damaged", "Unusable"],
};
for (const status of ASSET_STATUSES) {
  for (const condition of ASSET_CONDITIONS) {
    assert.equal(isConditionAllowed(status, condition), conditionTable[status].includes(condition), `${status}/${condition}`);
  }
  assert.deepEqual([...CONDITIONS_BY_STATUS[status]], conditionTable[status]);
}

// §4.3 — Return mapping lands on a status that accepts the condition.
const returnMap = { Good: "Available", Fair: "Available", Damaged: "In Maintenance", Unusable: "In Maintenance" } as const;
for (const condition of ASSET_CONDITIONS) {
  const next = statusAfterReturn(condition);
  assert.equal(next, returnMap[condition], condition);
  assert.equal(isConditionAllowed(next, condition), true, `return ${condition} -> ${next} must accept it`);
}

// §4.3 — Assign / Return / Transfer guards.
const person = { type: "person", id: "p1", label: "Somchai" } as const;
const asset = (status: AssetStatus, condition: CustodyState["condition"], held: boolean): CustodyState => ({
  status,
  condition,
  custody: held ? person : null,
});
assert.equal(assignBlock(asset("Available", "Good", false)), null);
assert.equal(assignBlock(asset("Assigned", "Good", true)), "has_custody");
for (const status of ["In Maintenance", "Retired", "Disposed"] as const) {
  assert.equal(assignBlock(asset(status, "Fair", false)), "not_assignable", status);
}
assert.equal(returnBlock(asset("Assigned", "Good", true)), null);
assert.equal(returnBlock(asset("Available", "Good", false)), "no_custody");
assert.equal(returnBlock(asset("In Maintenance", "Fair", true)), "not_assigned");
assert.equal(transferBlock(asset("Assigned", "Good", true)), null);
assert.equal(transferBlock(asset("Assigned", "Fair", true)), null);
assert.equal(transferBlock(asset("Assigned", "Damaged", true)), "condition_blocks_transfer");
assert.equal(transferBlock(asset("Available", "Good", false)), "no_custody");
assert.equal(transferBlock(asset("In Maintenance", "Fair", true)), "not_assigned");
assert.equal(isTransferBlockedBy("Unusable"), true);
assert.equal(isTransferBlockedBy("Good"), false);

// §4.11 — actions per status, every row; Export is a separate constant.
assert.deepEqual([...actionsFor("Available")], ["assign", "change_status_condition", "move_location", "retire", "print_label"]);
assert.deepEqual([...actionsFor("Assigned")], ["transfer", "return", "change_status_condition", "move_location", "print_label"]);
assert.deepEqual([...actionsFor("In Maintenance")], ["change_status_condition", "move_location", "retire", "print_label"]);
assert.deepEqual([...actionsFor("Retired")], ["dispose", "print_label"]);
assert.deepEqual([...actionsFor("Disposed")], []);
assert.deepEqual([...EXPORT_STATUSES], [...ASSET_STATUSES]);
for (const status of ASSET_STATUSES) assert.equal(canExport(status), true, status);

// The two tables agree: every move's controlled action is offered from its source status.
for (const row of STATUS_TRANSITIONS) {
  assert.ok(ACTIONS_BY_STATUS[row.from].includes(row.via), `${row.from} offers ${row.via}`);
}

// ADR 0098 §3 — every status and condition has a tone, and the table is the decided one.
assert.deepEqual(
  ASSET_STATUSES.map((status) => STATUS_TONE[status]),
  ["green", "blue", "yellow", "zinc", "zinc"],
);
assert.deepEqual(
  ASSET_CONDITIONS.map((condition) => CONDITION_TONE[condition]),
  ["green", "zinc", "yellow", "red"],
);

// AC: no React or fetch in domain/.
const dir = new URL(".", import.meta.url);
for (const file of readdirSync(dir).filter((name) => name.endsWith(".ts"))) {
  const source = readFileSync(new URL(file, dir), "utf8");
  assert.doesNotMatch(source, /from ["']react|fetch\(|["']use client["']/, file);
}

console.log("asset-workspace domain: ok");
