import assert from "node:assert/strict";
import { selectionOutcome, singleOnlyHint, statusMenu } from "./selection-actions.ts";

const row = (status: string, condition: string | null, custody: boolean) => ({
  id: "a1", name: "Kiosk", asset_code: "AST-1", serial_number: null, asset_category_id: null, category_name: null,
  location_id: null, location_name: null, status, condition,
  custody: custody ? { type: "person" as const, id: "p1", name: "Somchai" } : null,
  purchase_date: null, created_at: "", updated_at: "", status_since: "", thumbnail_url: null, current_warranty: null,
});
const href = (outcome: ReturnType<typeof selectionOutcome>) => ("href" in outcome ? outcome.href : outcome.alternative?.href);

// Available, no holder: Assign and Move open their pages; Transfer offers Assign instead.
assert.equal(href(selectionOutcome(row("Available", "Good", false), "assign")), "/asset-workspace/assets/a1/assign");
assert.equal(href(selectionOutcome(row("Available", "Good", false), "move-location")),
  "/asset-workspace/assets/a1?tab=location&action=move-location");
const transfer = selectionOutcome(row("Available", "Good", false), "transfer");
assert.ok(!("href" in transfer) && transfer.alternative?.label === "Assign instead");

// Assigned: Assign is blocked with Transfer instead; Transfer opens.
const assign = selectionOutcome(row("Assigned", "Good", true), "assign");
assert.ok(!("href" in assign) && assign.alternative?.href === "/asset-workspace/assets/a1/transfer");
assert.equal(href(selectionOutcome(row("Assigned", "Fair", true), "transfer")), "/asset-workspace/assets/a1/transfer");

// Damaged holder: Return instead. Unknown condition: view the asset first.
assert.equal(href(selectionOutcome(row("Assigned", "Damaged", true), "transfer")), "/asset-workspace/assets/a1/return");
assert.equal(href(selectionOutcome(row("Assigned", null, true), "transfer")), "/asset-workspace/assets/a1");

// Disposed can't move; status menu keeps the profile's reasons.
assert.ok(!("href" in selectionOutcome(row("Disposed", null, false), "move-location")));
assert.deepEqual(statusMenu(row("Retired", null, false)).map((item) => item.reason), [null, "Already retired", null]);
assert.equal(statusMenu(row("Assigned", "Good", true))[1].reason, "Return asset first");
assert.equal(singleOnlyHint("status"), "Select only one asset to update its status");
console.log("selection-actions ok");
