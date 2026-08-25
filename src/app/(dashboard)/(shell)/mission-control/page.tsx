import { EmployeeMissionControlPage, ManagerMissionControlPage } from "@/features/asset-intelligence/departments";
import { requireShellAccess, resolveShellVariant, resolveRole } from "@/config/rbac";
import { getSession } from "@/features/auth/services/get-session";
import { MissionControlPage } from "@/features/mission-control";

// The dashboard layout already gates this route on tenant access; the
// session is re-fetched here for the greeting's display name and for the
// access gate + variant below, matching getSession's own "nothing is
// trusted to a single check" philosophy.
export default async function MissionControlRoute() {
  const session = await getSession();
  const resolved = resolveRole(session);
  requireShellAccess(resolved);

  const variant = resolveShellVariant(resolved);
  if (variant === "manager") {
    return <ManagerMissionControlPage />;
  }
  if (variant === "employee") {
    return <EmployeeMissionControlPage />;
  }

  const userName = session === "forbidden" ? "Account" : session.userName;
  return <MissionControlPage userName={userName} />;
}
