import { PageHeader } from "@/components/layout/PageHeader";
import { requireCeoAccess, resolveRole } from "@/config/rbac";
import { getSession } from "@/features/auth/services/get-session";
import { InsightsPage } from "@/features/mission-control";

// CEO — "Insights" (requirement doc CEO-05).
export default async function InsightsRoute() {
  requireCeoAccess(resolveRole(await getSession()));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Insights" subtitle="Trends and cross-department benchmarks." />
      <InsightsPage />
    </div>
  );
}
