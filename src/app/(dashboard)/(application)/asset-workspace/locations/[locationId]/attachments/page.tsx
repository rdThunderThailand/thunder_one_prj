import { LocationTabHeader } from "@/features/asset-workspace/components/locations/LocationHero";
import { NotAvailable } from "@/features/asset-workspace/components/reports/ReportWidgets";

// Core routes are on develop (#344); the FE table + Upload is slice 2 (docs/location checklist §4).
export default function LocationAttachmentsTab() {
  return (
    <div className="space-y-3">
      <LocationTabHeader
        title="Attachments"
        subtitle="Files and documents related to this location."
      />
      <NotAvailable />
    </div>
  );
}
