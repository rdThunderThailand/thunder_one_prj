import { ReturnDeliveryHeader } from "./ReturnDeliveryHeader";
import { ReturnDetailPanel } from "./ReturnDetailPanel";
import { ReturnFilterBar } from "./ReturnFilterBar";
import { ReturnStatTilesRow } from "./ReturnStatTilesRow";
import { ReturnTable } from "./ReturnTable";
import { ReturnTableControls } from "./ReturnTableControls";
import { ReturnTabs } from "./ReturnTabs";

// The Asset/IT Manager ("Asset Admin") return & delivery view, matching
// the reference mockup exactly (Nie, 2026-08-26) — same master/detail
// shape as AssetAllocationPage, own dedicated data and components.
export function ReturnDeliveryPage() {
  return (
    <div className="flex flex-col gap-6">
      <ReturnDeliveryHeader />
      <ReturnStatTilesRow />
      <ReturnTabs>
        <div className="flex flex-col gap-4">
          <ReturnFilterBar />
          <ReturnTableControls />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div className="lg:col-span-3">
              <ReturnTable />
            </div>
            <ReturnDetailPanel />
          </div>
        </div>
      </ReturnTabs>
    </div>
  );
}
