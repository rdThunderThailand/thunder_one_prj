import { requireShellAccess, resolveShellVariant, resolveRole } from "@/config/rbac";
import { getSession } from "@/features/auth/services/get-session";
import { EmployeeWorkspacesPage, ManagerWorkspacesPage, WorkspacesPage } from "@/features/workspaces";

export default async function WorkSpaceRoute() {
  const resolved = resolveRole(await getSession());
  requireShellAccess(resolved);

  const variant = resolveShellVariant(resolved);
  if (variant === "manager") {
    return <ManagerWorkspacesPage />;
  }
  if (variant === "employee") {
    return <EmployeeWorkspacesPage />;
  }

  return <WorkspacesPage />;
}
