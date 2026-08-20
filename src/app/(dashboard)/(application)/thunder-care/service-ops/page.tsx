import { PageHeader } from "@/components/layout/PageHeader";
import { ServiceOpsPage } from "@/features/thunder-care/service-ops";

// Thunder Care — "Service Operations" (requirement doc §4.6).
export default function ServiceOpsRoute() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Customer Health" subtitle="Work queue, SLA status, and customer health." />
      <ServiceOpsPage />
    </div>
  );
}
