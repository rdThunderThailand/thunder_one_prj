// Public API for the "asset-intelligence/assets" feature.
// Only export what other layers (app routes / other features) are allowed to consume.
export type { Asset, AssetCategory, AssetStatus, AssetLifecycleStatus } from "./types";
export { getMockAssets } from "./services/mock-assets";
// Real Core-backed summary (total asset count) — exposed so mission-control's
// homepage can show a real "สินทรัพย์ทั้งหมด" org-overview tile instead of a
// fabricated one, same "share the real service instead of each feature
// hitting Core with its own copy" reasoning as people/personnel's own barrel.
export { getAssetSummary, type AssetSummary } from "./services/asset-list-api";
export { mockDepartments, type DepartmentOption } from "./mock-reference-data";
export { AssetsListPage } from "./components/AssetsListPage";
export { AllAssetsPage } from "./components/AllAssetsPage";
export { AssetAdminDashboardPage } from "./components/AssetAdminDashboardPage";
export { AssetAllocationPage } from "./components/AssetAllocationPage";
export { ReturnDeliveryPage } from "./components/ReturnDeliveryPage";
export { AssetTransferPage } from "./components/AssetTransferPage";
export { AssetCountPage } from "./components/AssetCountPage";
export { AssetCategoriesPage } from "./components/AssetCategoriesPage";
export { AssetLocationsPage } from "./components/AssetLocationsPage";
export { AssetWarrantyPage } from "./components/AssetWarrantyPage";
export { AssetReportsPage } from "./components/AssetReportsPage";
export { KnowledgeBasePage } from "./components/KnowledgeBasePage";
export { AssetDetailPage } from "./components/AssetDetailPage";
export { MyAssetsPage } from "./components/MyAssetsPage";
export { RegisterAssetPage } from "./components/RegisterAssetPage";
export { LocationsPage } from "./components/LocationsPage";
export { MaintenancePage } from "./components/MaintenancePage";
export { InspectionsPage } from "./components/InspectionsPage";
export { WorkOrdersPage } from "./components/WorkOrdersPage";
export { AnalyticsPage } from "./components/AnalyticsPage";
export { ReportsPage } from "./components/ReportsPage";
