import { LocationTabHeader } from "@/features/asset-workspace/components/locations/LocationHero";
import { NotAvailable } from "@/features/asset-workspace/components/reports/ReportWidgets";

// Core route is on develop (#329); the FE KPIs + table are slice 2 (docs/location checklist §4).
export default function LocationHistoryTab() {
  return (
    <div className="space-y-3">
      <LocationTabHeader
        title="History"
        subtitle="Changes and activity related to this location."
      />
      <NotAvailable />
    </div>
  );
}
