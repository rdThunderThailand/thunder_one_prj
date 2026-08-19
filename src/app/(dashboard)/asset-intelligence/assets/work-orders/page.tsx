import { PageHeader } from "@/components/layout/PageHeader";
import { WorkOrdersPage } from "@/features/ai-assets";

// Asset/IT Manager — "Work Orders" (requirement doc AM-06): every work
// order, org-wide.
export default function AssetManagerWorkOrdersRoute() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Work Orders" subtitle="Every work order, across every technician." />
      <WorkOrdersPage />
    </div>
  );
}
