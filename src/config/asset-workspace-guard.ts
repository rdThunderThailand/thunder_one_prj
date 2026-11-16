import { redirect } from "next/navigation";
import { resolveAssetWorkspaceRole } from "@/config/asset-workspace-access";
import { resolveLandingPage, type ResolvedRole } from "@/config/rbac";

// Asset Workspace's portal gate, like requireCeoAccess in config/rbac.ts. Rules live in
// ./asset-workspace-access.ts (pure, so its .check.mts runs with plain node). Called by the
// (admin) and (employee) route-group layouts. Hiding nav is never
// authorization (ADR 0097 §4); Core still checks every request.
export function requireAssetWorkspacePortal(resolved: ResolvedRole, portal: "admin" | "employee"): void {
  const role = resolveAssetWorkspaceRole(resolved);
  if (role === "none") redirect(resolveLandingPage(resolved));
  if (portal === "admin" && role === "employee") redirect("/asset-workspace/my-assets");
  if (portal === "employee" && role !== "employee") redirect("/asset-workspace");
}
