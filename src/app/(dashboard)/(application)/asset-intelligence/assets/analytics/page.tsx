import { PageHeader } from "@/components/layout/PageHeader";
import { AnalyticsPage } from "@/features/asset-intelligence/assets";

// Asset/IT Manager — "Analytics" (requirement doc AM-08).
export default function AnalyticsRoute() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Analytics" subtitle="Cost, health, and category breakdown." />
      <AnalyticsPage />
    </div>
  );
}
