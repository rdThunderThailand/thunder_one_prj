import { PageHeader } from "@/components/layout/PageHeader";
import { WorkQueuePage } from "@/features/thunder-care/service-ops";

// Thunder Care — "Work Queue" (requirement doc TCARE-01/02): dispatch reported
// issues to a Technician.
export default function WorkQueueRoute() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Work Queue" subtitle="Dispatch reported issues to a technician." />
      <WorkQueuePage />
    </div>
  );
}
