import { PageHeader } from "@/components/layout/PageHeader";
import { ReportsPage } from "@/features/ai-departments";

// Department Manager — "Reports" (requirement doc DM-04).
export default function DepartmentReportsRoute() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reports" subtitle="Asset usage and value summary for your department." />
      <ReportsPage />
    </div>
  );
}
