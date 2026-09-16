import { requireShellAccess, resolveShellVariant, resolveRole } from "@/config/rbac";
import { getSession } from "@/features/auth/services/get-session";
import { EmployeeMyWorkPage, ManagerMyWorkPage, MyWorkPage } from "@/features/my-work";

export default async function MyWorkRoute() {
  const resolved = resolveRole(await getSession());
  requireShellAccess(resolved);

  const variant = resolveShellVariant(resolved);
  if (variant === "manager") {
    return <ManagerMyWorkPage />;
  }
  if (variant === "employee") {
    return <EmployeeMyWorkPage />;
  }

  return <MyWorkPage />;
}
