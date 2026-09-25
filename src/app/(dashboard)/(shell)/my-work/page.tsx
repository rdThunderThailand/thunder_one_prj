import { requireShellAccess, resolveShellVariant, resolveRole } from "@/config/rbac";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import { EmployeeMyWorkPage, ManagerMyWorkPage, MyWorkPage } from "@/features/my-work";
import { loadMyWork } from "@/features/my-work/load-my-work";
import type { WorkScope } from "@/features/my-work/work-items";

// All three variants read the same real `MyWork` (see
// features/my-work/work-items.ts); only the scope differs — employees get
// just what's addressed to them. loading.tsx covers the wait.
export default async function MyWorkRoute() {
  const session = await getSession();
  const resolved = resolveRole(session);
  requireShellAccess(resolved);

  const variant = resolveShellVariant(resolved);
  const scope: WorkScope = variant === "employee" ? "personal" : "admin";
  const now = new Date();
  const nowIso = now.toISOString();

  const token = await getAuthToken();
  const tenantId = session !== "forbidden" ? session.tenantId : null;
  const userId = session !== "forbidden" ? session.userId : null;

  const work = await loadMyWork(token, tenantId, userId, scope);

  if (variant === "manager") {
    return (
      <ManagerMyWorkPage
        work={work}
        nowIso={nowIso}
      />
    );
  }
  if (variant === "employee") {
    return (
      <EmployeeMyWorkPage
        work={work}
        nowIso={nowIso}
        userName={session === "forbidden" ? "there" : session.userName}
      />
    );
  }

  return (
    <MyWorkPage
      work={work}
      nowIso={nowIso}
    />
  );
}
