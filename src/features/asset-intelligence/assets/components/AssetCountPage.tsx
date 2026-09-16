import { AssetCountHeader } from "./AssetCountHeader";
import { CountDetailPanel } from "./CountDetailPanel";
import { CountFilterBar } from "./CountFilterBar";
import { CountStatTilesRow } from "./CountStatTilesRow";
import { CountTable } from "./CountTable";
import { CountTableControls } from "./CountTableControls";
import { CountTabs } from "./CountTabs";

// The Asset/IT Manager ("Asset Admin") asset-count view, matching the
// reference mockup exactly (Nie, 2026-08-26) — same master/detail shape as
// Allocation/Return/Transfer, but the detail panel centers on a
// found/missing/extra/pending result donut, so it's its own dedicated data
// and components.
export function AssetCountPage() {
  return (
    <div className="flex flex-col gap-6">
      <AssetCountHeader />
      <CountStatTilesRow />
      <CountTabs>
        <div className="flex flex-col gap-4">
          <CountFilterBar />
          <CountTableControls />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div className="lg:col-span-3">
              <CountTable />
            </div>
            <CountDetailPanel />
          </div>
        </div>
      </CountTabs>
    </div>
  );
}
