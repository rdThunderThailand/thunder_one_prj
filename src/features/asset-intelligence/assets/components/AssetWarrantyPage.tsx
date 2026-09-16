import { WarrantyDetailPanel } from "./WarrantyDetailPanel";
import { WarrantyFilterBar } from "./WarrantyFilterBar";
import { WarrantyHeader } from "./WarrantyHeader";
import { WarrantyStatTilesRow } from "./WarrantyStatTilesRow";
import { WarrantyTable } from "./WarrantyTable";
import { WarrantyTabs } from "./WarrantyTabs";

// The Asset/IT Manager ("Asset Admin") warranty & lifecycle view, matching
// the reference mockup exactly (Nie, 2026-08-26) — same master/detail
// shape as the other Asset Admin tables, with its own top-level tab row
// (Overview/Warranty/Contracts/Claims/Lifecycle) and the detail panel's own
// internal tabs (Details/Warranty/Claims). Only the two tabs active in the
// mockup carry real content.
export function AssetWarrantyPage() {
  return (
    <div className="flex flex-col gap-6">
      <WarrantyHeader />
      <WarrantyStatTilesRow />
      <WarrantyTabs>
        <div className="flex flex-col gap-4">
          <WarrantyFilterBar />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div className="lg:col-span-3">
              <WarrantyTable />
            </div>
            <WarrantyDetailPanel />
          </div>
        </div>
      </WarrantyTabs>
    </div>
  );
}
