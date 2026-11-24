import { PageHeader } from "@/components/layout/PageHeader";
import { InspectionsPage } from "@/features/asset-intelligence/assets";

// Asset/IT Manager — "Inspections" (requirement doc AM-07).
export default function InspectionsRoute() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Inspections" subtitle="Scheduled and completed asset inspections." />
      <InspectionsPage />
    </div>
  );
}
