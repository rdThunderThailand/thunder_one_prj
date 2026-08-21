// Public API for the "asset-intelligence/assets" feature.
// Only export what other layers (app routes / other features) are allowed to consume.
export type { Asset, AssetCategory, AssetStatus, AssetLifecycleStatus } from "./types";
export { getMockAssets } from "./services/mock-assets";
export { mockDepartments, type DepartmentOption } from "./mock-reference-data";
export { AssetsListPage } from "./components/AssetsListPage";
export { AssetOverviewDashboard } from "./components/AssetOverviewDashboard";
export { AssetOverviewPage } from "./components/AssetOverviewPage";
export { MyAssetsPage } from "./components/MyAssetsPage";
export { RegisterAssetPage } from "./components/RegisterAssetPage";
export { LocationsPage } from "./components/LocationsPage";
export { MaintenancePage } from "./components/MaintenancePage";
export { InspectionsPage } from "./components/InspectionsPage";
export { WorkOrdersPage } from "./components/WorkOrdersPage";
export { AnalyticsPage } from "./components/AnalyticsPage";
export { ReportsPage } from "./components/ReportsPage";
