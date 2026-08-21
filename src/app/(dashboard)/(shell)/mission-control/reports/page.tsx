import { PageHeader } from "@/components/layout/PageHeader";
import { ReportsPage } from "@/features/mission-control";

// CEO — "Reports" (requirement doc CEO-05).
export default function CeoReportsRoute() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reports" subtitle="Asset value and risk, by department." />
      <ReportsPage />
    </div>
  );
}
