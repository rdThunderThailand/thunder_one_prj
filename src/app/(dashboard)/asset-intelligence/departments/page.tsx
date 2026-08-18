import { PageHeader } from "@/components/layout/PageHeader";
import { DepartmentPage } from "@/features/ai-departments";

// Department Manager — "My Department" (requirement doc §4.3).
export default function DepartmentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Sales Department" subtitle="My Department Assets" />
      <DepartmentPage />
    </div>
  );
}
