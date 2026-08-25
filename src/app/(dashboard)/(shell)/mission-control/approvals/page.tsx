import { PageHeader } from "@/components/layout/PageHeader";
import { requireCeoAccess, resolveRole } from "@/config/rbac";
import { getSession } from "@/features/auth/services/get-session";
import { ApprovalsPage } from "@/features/mission-control";

// CEO — "Approvals" (requirement doc CEO-04).
export default async function CeoApprovalsRoute() {
  requireCeoAccess(resolveRole(await getSession()));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Approvals" subtitle="Recommendations awaiting your decision." />
      <ApprovalsPage />
    </div>
  );
}
