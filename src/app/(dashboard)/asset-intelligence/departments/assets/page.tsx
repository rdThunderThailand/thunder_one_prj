import { PageHeader } from "@/components/layout/PageHeader";
import { DepartmentAssetsPage } from "@/features/ai-departments";

// Department Manager — "Assets" (requirement doc §4.3): every asset in the department.
export default function DepartmentAssetsRoute() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Assets" subtitle="Every asset in your department." />
      <DepartmentAssetsPage />
    </div>
  );
}
