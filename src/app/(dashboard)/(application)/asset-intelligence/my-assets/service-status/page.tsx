import { PageHeader } from "@/components/layout/PageHeader";
import { MyServiceStatusPage } from "@/features/asset-intelligence/issues";

// Employee/User — "Service Status" (requirement doc EMP-04).
export default function ServiceStatusRoute() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Service Status" subtitle="Problems you've reported and their status." />
      <MyServiceStatusPage />
    </div>
  );
}
