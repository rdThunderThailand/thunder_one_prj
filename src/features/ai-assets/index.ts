// Public API for the "ai-assets" feature.
// Only export what other layers (app routes / other features) are allowed to consume.
export type { Asset, AssetCategory, AssetStatus } from "./types";
export { getMockAssets } from "./services/mock-assets";
export { AssetsListPage } from "./components/AssetsListPage";
