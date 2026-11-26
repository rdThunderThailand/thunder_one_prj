import { requireAssetWorkspacePortal } from "@/config/asset-workspace-guard";
import { resolveRole } from "@/config/rbac";
import { getSession } from "@/features/auth/services/get-session";

// Employee portal; admins and managers go back to Overview (config/asset-workspace-guard.ts).
export default async function AssetWorkspaceEmployeeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  requireAssetWorkspacePortal(resolveRole(await getSession()), "employee");
  return children;
}
