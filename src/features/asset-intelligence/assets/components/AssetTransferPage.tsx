import { TransferDetailPanel } from "./TransferDetailPanel";
import { TransferFilterBar } from "./TransferFilterBar";
import { TransferHeader } from "./TransferHeader";
import { TransferStatTilesRow } from "./TransferStatTilesRow";
import { TransferTable } from "./TransferTable";
import { TransferTableControls } from "./TransferTableControls";
import { TransferTabs } from "./TransferTabs";

// The Asset/IT Manager ("Asset Admin") transfer view, matching the
// reference mockup exactly (Nie, 2026-08-26) — same master/detail shape as
// Allocation/Return, but the detail panel is two-party (from/to) with a
// multi-item asset list, so it's its own dedicated data and components.
export function AssetTransferPage() {
  return (
    <div className="flex flex-col gap-6">
      <TransferHeader />
      <TransferStatTilesRow />
      <TransferTabs>
        <div className="flex flex-col gap-4">
          <TransferFilterBar />
          <TransferTableControls />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div className="lg:col-span-3">
              <TransferTable />
            </div>
            <TransferDetailPanel />
          </div>
        </div>
      </TransferTabs>
    </div>
  );
}
