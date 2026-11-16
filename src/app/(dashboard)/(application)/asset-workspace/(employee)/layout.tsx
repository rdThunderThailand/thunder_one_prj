import { redirect } from "next/navigation";
import { NoAccess } from "@/components/ui/NoAccess";
import { resolveAssetWorkspaceRole } from "@/config/asset-workspace-access";
import { resolveRole } from "@/config/rbac";
import { getSession } from "@/features/auth/services/get-session";

// Employee portal. Admins and managers go back to the admin portal; other roles get NoAccess.
export default async function AssetWorkspaceEmployeeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const role = resolveAssetWorkspaceRole(resolveRole(await getSession()));
  if (role === "asset_admin" || role === "manager") redirect("/asset-workspace");
  if (role === "none") {
    return (
      <div className="p-6">
        <NoAccess />
      </div>
    );
  }
  return children;
}
