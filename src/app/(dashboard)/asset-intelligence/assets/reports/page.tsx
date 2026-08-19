import { PageHeader } from "@/components/layout/PageHeader";
import { ReportsPage } from "@/features/ai-assets";

// Asset/IT Manager — "Reports" (requirement doc AM-08).
export default function AssetManagerReportsRoute() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reports" subtitle="Asset value and category summary, org-wide." />
      <ReportsPage />
    </div>
  );
}
