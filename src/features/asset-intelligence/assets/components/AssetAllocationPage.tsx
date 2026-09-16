import { AllocationDetailPanel } from "./AllocationDetailPanel";
import { AllocationFilterBar } from "./AllocationFilterBar";
import { AllocationStatTilesRow } from "./AllocationStatTilesRow";
import { AllocationTable } from "./AllocationTable";
import { AllocationTableControls } from "./AllocationTableControls";
import { AllocationTabs } from "./AllocationTabs";
import { AssetAllocationHeader } from "./AssetAllocationHeader";

// The Asset/IT Manager ("Asset Admin") asset-allocation view, matching the
// reference mockup exactly (Nie, 2026-08-26) — a master/detail layout
// (table + a selected-row detail panel), new to this feature.
export function AssetAllocationPage() {
  return (
    <div className="flex flex-col gap-6">
      <AssetAllocationHeader />
      <AllocationStatTilesRow />
      <AllocationTabs>
        <div className="flex flex-col gap-4">
          <AllocationFilterBar />
          <AllocationTableControls />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div className="lg:col-span-3">
              <AllocationTable />
            </div>
            <AllocationDetailPanel />
          </div>
        </div>
      </AllocationTabs>
    </div>
  );
}
