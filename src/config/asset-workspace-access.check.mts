/** Run: node src/config/asset-workspace-access.check.mts */
import assert from "node:assert/strict";
import { resolveAssetWorkspaceRole } from "./asset-workspace-access.ts";

type Input = Parameters<typeof resolveAssetWorkspaceRole>[0];
const role = (roleType: string | null, roleCode: string | null) =>
  resolveAssetWorkspaceRole({ roleType, roleCode } as Input);

// Employee: code wins, even when the type would say otherwise.
assert.equal(role(null, "employee_asset"), "employee");
assert.equal(role("employee", null), "employee");
assert.equal(role("company_admin", "employee_asset"), "employee");

// Manager.
assert.equal(role(null, "manager_assets"), "manager");
assert.equal(role("manager", null), "manager");

// Asset Admin.
assert.equal(role("super_admin", null), "asset_admin");
assert.equal(role("company_admin", "CEO"), "asset_admin");
assert.equal(role("department_admin", "department_asset_admin"), "asset_admin");

// Core unreachable: fail open.
assert.equal(role(null, null), "asset_admin");

// Everyone else.
assert.equal(role("operator", "operator_technician"), "none");
assert.equal(role("executive_viewer", null), "none");
assert.equal(role("viewer_auditor", null), "none");
assert.equal(role(null, "employee_media"), "none");
assert.equal(role(null, "manager_it_asset"), "none");

console.log("asset-workspace-access: ok");
