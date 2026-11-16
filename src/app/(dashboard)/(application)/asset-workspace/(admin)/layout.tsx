import { redirect } from "next/navigation";
import { NoAccess } from "@/components/ui/NoAccess";
import { resolveAssetWorkspaceRole } from "@/config/asset-workspace-access";
import { resolveRole } from "@/config/rbac";
import { getSession } from "@/features/auth/services/get-session";

// Admin and manager pages. Employees go to their own portal; other roles get NoAccess.
// Hiding nav is never authorization (ADR 0097 §4) — Core still checks every request.
export default async function AssetWorkspaceAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const role = resolveAssetWorkspaceRole(resolveRole(await getSession()));
  if (role === "employee") redirect("/asset-workspace/my-assets");
  if (role === "none") {
    return (
      <div className="p-6">
        <NoAccess />
      </div>
    );
  }
  return children;
}
