import { PageHeader } from "@/components/layout/PageHeader";
import { ReportsPage } from "@/features/ai-service-ops";

// Thunder Care — "Reports" (requirement doc §4.6): detailed view of every
// issue reported, not just the compact Work Queue list.
export default function ReportsRoute() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reports" subtitle="Every problem reported, in detail." />
      <ReportsPage />
    </div>
  );
}
