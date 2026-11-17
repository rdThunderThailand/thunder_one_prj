// Which Asset Workspace portal a member gets (employee batch Shell spec, docs/adr/0097).
// Role code first: getSession drops role types it doesn't know (`employee`, `manager`),
// so the code is the only signal for those members. Pure, so the .check.mts can run it.
// A courtesy layer only — Core still checks every request.
import type { AssetWorkspaceRole } from "./nav/asset-workspace-roles";
import type { ResolvedRole } from "./rbac";

export type AssetWorkspaceAccess = AssetWorkspaceRole | "none";

const ADMIN_TYPES: ReadonlySet<string> = new Set(["super_admin", "company_admin", "department_admin"]);

export function resolveAssetWorkspaceRole({ roleType, roleCode }: Pick<ResolvedRole, "roleType" | "roleCode">): AssetWorkspaceAccess {
  const type: string | null = roleType;
  if (roleCode === "employee_asset" || type === "employee") return "employee";
  if (roleCode === "manager_assets" || type === "manager") return "manager";
  if (type !== null && ADMIN_TYPES.has(type)) return "asset_admin";
  // Core unreachable: same fail-open default the App had before roles; Core still guards.
  if (type === null && roleCode === null) return "asset_admin";
  return "none";
}
