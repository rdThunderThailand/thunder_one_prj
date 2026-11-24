import { PageHeader } from "@/components/layout/PageHeader";
import { AssignedPage } from "@/features/thunder-care/work-orders";

// Technician — "Assigned" (requirement doc §4.4 TC-01): every work order
// assigned to the technician, not just today's.
export default function AssignedRoute() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Assigned" subtitle="Every work order assigned to you." />
      <AssignedPage />
    </div>
  );
}
