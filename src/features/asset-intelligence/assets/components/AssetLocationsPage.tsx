import { AssetLocationsHeader } from "./AssetLocationsHeader";
import { LocationDetailPanel } from "./LocationDetailPanel";
import { LocationFilterBar } from "./LocationFilterBar";
import { LocationStatTilesRow } from "./LocationStatTilesRow";
import { LocationTree } from "./LocationTree";

// The Asset/IT Manager ("Asset Admin") locations & areas view — a full
// redesign matching the reference mockup exactly (Nie, 2026-08-26),
// replacing the earlier LocationsPage (a flat list explicitly documented
// as a placeholder for the hierarchical tree this now is). LocationsPage
// itself is untouched and still exported — this route just stopped
// rendering it. Expand/collapse in LocationTree is real client state,
// unlike this page's other controls (search/filter/pagination), since
// tree navigation is core to what a location structure page is for.
export function AssetLocationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <AssetLocationsHeader />
      <LocationStatTilesRow />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <LocationFilterBar />
          <LocationTree />
        </div>
        <LocationDetailPanel />
      </div>
    </div>
  );
}
