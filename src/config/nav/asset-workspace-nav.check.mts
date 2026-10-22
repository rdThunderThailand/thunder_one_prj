/** Run: node src/config/nav/asset-workspace-nav.check.mts */
import assert from "node:assert/strict";
import { sectionsForRole, type AssetWorkspaceRole } from "./asset-workspace-roles.ts";

// The pinned Overview (or My Assets for Employees) plus every section item.
const visible = (role: AssetWorkspaceRole) => [
  role === "employee" ? "My Assets" : "Overview",
  ...sectionsForRole(role).flatMap((section) => section.items.map((item) => item.label)),
];

assert.deepEqual(visible("asset_admin"), [
  "Overview",
  "Assets",
  "Assignments",
  "Inventory",
  "Categories",
  "Locations",
  "Lifecycle & Warranty",
  "Reports",
  "Settings",
]);
assert.deepEqual(visible("manager"), ["Overview", "Assets", "Assignments", "Inventory", "Reports"]);
assert.deepEqual(visible("employee"), ["My Assets"]);

assert.deepEqual(
  sectionsForRole("asset_admin").map((section) => section.label),
  ["Asset Management", "Asset Structure", "Management"],
);
// Manager never sees an empty section header (Asset Structure has nothing for them).
assert.deepEqual(
  sectionsForRole("manager").map((section) => section.label),
  ["Asset Management", "Management"],
);

// Every Asset Admin item links to its ADR 0097 route.
assert.deepEqual(
  sectionsForRole("asset_admin").flatMap((section) => section.items.map((item) => item.href)),
  [
    "/asset-workspace/assets",
    "/asset-workspace/assignments",
    "/asset-workspace/inventory",
    "/asset-workspace/categories",
    "/asset-workspace/locations",
    "/asset-workspace/lifecycle-warranty",
    "/asset-workspace/reports",
    "/asset-workspace/settings",
  ],
);

const all = sectionsForRole("asset_admin").flatMap((section) => section.items.map((item) => item.label));
assert.ok(!all.includes("Transfers"), "Transfer is a controlled action, not a menu (02 §4.2)");
assert.ok(!all.some((label) => /device|provisioning/i.test(label)), "Connected Devices are Phase 2 (02 §2.3)");

console.log("asset-workspace-nav: ok");
