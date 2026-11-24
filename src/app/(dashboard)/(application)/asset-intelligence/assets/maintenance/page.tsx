import { PageHeader } from "@/components/layout/PageHeader";
import { MaintenancePage } from "@/features/asset-intelligence/assets";

// Asset/IT Manager — "Maintenance" / Manage MA (requirement doc AM-03).
export default function MaintenanceRoute() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Maintenance" subtitle="Maintenance agreements and renewal status." />
      <MaintenancePage />
    </div>
  );
}
