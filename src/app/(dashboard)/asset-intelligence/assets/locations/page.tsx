import { PageHeader } from "@/components/layout/PageHeader";
import { LocationsPage } from "@/features/ai-assets";

// Asset/IT Manager — "Locations" (requirement doc AM-05).
export default function LocationsRoute() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Locations" subtitle="Where assets are, org-wide." />
      <LocationsPage />
    </div>
  );
}
