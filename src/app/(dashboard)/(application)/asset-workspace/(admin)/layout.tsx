import { requireAssetWorkspacePortal } from "@/config/asset-workspace-guard";
import { resolveRole } from "@/config/rbac";
import { getSession } from "@/features/auth/services/get-session";

// Admin and manager pages; employees go to My Assets (config/asset-workspace-guard.ts).
export default async function AssetWorkspaceAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  requireAssetWorkspacePortal(resolveRole(await getSession()), "admin");
  return children;
}
