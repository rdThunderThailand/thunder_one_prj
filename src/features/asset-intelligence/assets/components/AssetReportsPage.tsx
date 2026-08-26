import { AssetReportsHeader } from "./AssetReportsHeader";
import { CategoryDistributionCard } from "./CategoryDistributionCard";
import { ExpiringWarrantyCard } from "./ExpiringWarrantyCard";
import { PopularReportsCard } from "./PopularReportsCard";
import { PurchaseTrendCard } from "./PurchaseTrendCard";
import { RecentReportsCard } from "./RecentReportsCard";
import { ReportFilterBar } from "./ReportFilterBar";
import { ReportStatTilesRow } from "./ReportStatTilesRow";
import { UsageStatusCard } from "./UsageStatusCard";
import { ValueByLocationCard } from "./ValueByLocationCard";

// The Asset/IT Manager ("Asset Admin") reports/analytics dashboard — a full
// redesign matching the reference mockup exactly (Nie, 2026-08-26),
// replacing the earlier ReportsPage (a plain 3-stat + flat table summary).
// ReportsPage itself is untouched and still exported — this route just
// stopped rendering it.
export function AssetReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <AssetReportsHeader />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <ReportStatTilesRow />
          <ReportFilterBar />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <CategoryDistributionCard />
            <UsageStatusCard />
            <ValueByLocationCard />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <PurchaseTrendCard />
            <ExpiringWarrantyCard />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <PopularReportsCard />
          <RecentReportsCard />
        </div>
      </div>
    </div>
  );
}
