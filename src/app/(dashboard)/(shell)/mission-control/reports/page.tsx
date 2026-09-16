import { PageHeader } from "@/components/layout/PageHeader";
import { requireCeoAccess, resolveRole } from "@/config/rbac";
import { getSession } from "@/features/auth/services/get-session";
import { ReportsPage } from "@/features/mission-control";

// CEO — "Reports" (requirement doc CEO-05).
export default async function CeoReportsRoute() {
  requireCeoAccess(resolveRole(await getSession()));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reports" subtitle="Asset value and risk, by department." />
      <ReportsPage />
    </div>
  );
}
