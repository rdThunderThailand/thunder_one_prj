import { AssetAdminDashboardHeader } from "./AssetAdminDashboardHeader";
import { AssetAllocationCard } from "./AssetAllocationCard";
import { AssetStatusCard } from "./AssetStatusCard";
import { DashboardActionBar } from "./DashboardActionBar";
import { DashboardActivityCard } from "./DashboardActivityCard";
import { DashboardNotificationsCard } from "./DashboardNotificationsCard";
import { DashboardQuickActionsCard } from "./DashboardQuickActionsCard";
import { HeroStatTilesRow } from "./HeroStatTilesRow";
import { LifecycleStatusCard } from "./LifecycleStatusCard";
import { PendingRequestsCard } from "./PendingRequestsCard";

// The Asset/IT Manager's ("Asset Admin") redesigned landing page at
// /asset-intelligence/assets — replaces the earlier "Asset Overview"
// dashboard, matching the reference mockup exactly (Nie, 2026-08-26). The
// asset list that used to live on this route moved to ./assets/all
// (AssetsListPage, unchanged) once this page became a dashboard rather
// than a list-plus-stats page.
export function AssetAdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <AssetAdminDashboardHeader />

      <HeroStatTilesRow />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AssetStatusCard />
        <AssetAllocationCard />
        <PendingRequestsCard />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <LifecycleStatusCard />
        <DashboardQuickActionsCard />
        <DashboardActivityCard />
        <DashboardNotificationsCard />
      </div>

      <DashboardActionBar />
    </div>
  );
}
