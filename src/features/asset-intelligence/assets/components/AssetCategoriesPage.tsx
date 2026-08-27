import { AssetCategoriesHeader } from "./AssetCategoriesHeader";
import { CategoryDetailPanel } from "./CategoryDetailPanel";
import { CategoryFilterBar } from "./CategoryFilterBar";
import { CategoryStatTilesRow } from "./CategoryStatTilesRow";
import { CategoryTable } from "./CategoryTable";

// The Asset/IT Manager ("Asset Admin") asset-categories view, matching the
// reference mockup exactly (Nie, 2026-08-26). Simpler than
// Allocation/Return/Transfer/Count (one status filter, pagination inside
// the table card, no top-level tabs) but keeps the same master/detail
// shape — the detail panel here has its own internal Details/Assets tabs.
export function AssetCategoriesPage() {
  return (
    <div className="flex flex-col gap-6">
      <AssetCategoriesHeader />
      <CategoryStatTilesRow />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <CategoryFilterBar />
          <CategoryTable />
        </div>
        <CategoryDetailPanel />
      </div>
    </div>
  );
}
