# asset-intelligence/assets

Asset registry for Asset Intelligence — organization-wide physical assets (laptops, printers, NAS, and media-player hardware), owned end-to-end (register/track/manage/assign) by the Asset/IT Manager role. Not to be confused with Media Workspace's reusable media files (`src/features/media-workspace/assets`) — see `CONTEXT.md` at the repo root and `docs/adr/0023-asset-intelligence-feature-namespacing.md` for why both are named `Asset`.

> Partly real, partly placeholder. The "All assets" list and the asset detail page read from Thunder_Core, and `AddAssetForm` creates assets there. Most other pages (dashboard, allocation, transfer, count, warranty, borrow/return, categories, locations, knowledge base, analytics, reports, maintenance, inspections, My Assets) still run on mock data — see `docs/asset-intelligence/questions-thunder-core-contract.md` for the open contract questions.

- `services/` —
  - `asset-list-api.ts` — server-side Core reads under `/tenants/{id}/assets`: `getAssetList`, `getAssetSummary` (also used by the shell's mission-control page), `getAssetFilters`, `getAsset`, `getAssetActivity`, `getAssetAttachments`
  - `assets-api.ts` — client-side writes: `createAsset` (`POST /tenants/{id}/assets`), `updateAsset`, `uploadAssetAttachment`, `deleteAssetAttachment`. See each function's own comment for which Core routes are confirmed
  - `mock-assets.ts` — the mock registry the placeholder pages still read
- `components/` — one `*Page` per route under `/asset-intelligence/assets/**` (`app/(dashboard)/(application)/asset-intelligence/`), each with its own header, stat-tiles row, filter bar, table/tabs and detail panel components:
  - Real data: `AllAssetsPage` (registry table, filters, summary tiles), `AssetDetailPage` (identity, lifecycle, warranty, activity history, related documents/attachments cards), `AddAssetForm`, `EditAssetModal`
  - Mock data: `AssetAdminDashboardPage`, `AssetAllocationPage`, `AssetTransferPage`, `AssetCountPage`, `AssetWarrantyPage`, `ReturnDeliveryPage`, `AssetCategoriesPage`, `AssetLocationsPage`, `KnowledgeBasePage`, `AnalyticsPage`, `AssetReportsPage`/`ReportsPage`, `MaintenancePage`, `InspectionsPage`, `LocationsPage`, `AssetsListPage` (its Department column's "Pass to Department" action is local state only)
  - `WorkOrdersPage` — org-wide, reads `thunder-care/work-orders`'s `getMockWorkOrders`/`WorkOrderCard` directly rather than duplicating them
  - `MyAssetsPage` (Employee/User's "My Assets" view — filters the same `Asset` registry by `assigneeId`), `RegisterAssetPage` (Employee's simulated Scan QR → confirm receipt flow, EMP-01)
- `types/` — `Asset` and its `category`/`status`/`lifecycleStatus` taxonomies (see `docs/adr/0024-asset-device-cross-reference-model.md` for the `category: "media_player_device"` / `externalRef` cross-reference to Media Workspace's Device), plus the Core-shaped list/detail/create/update types
- `asset-status-display.ts` — status labels/colours for the list and detail views
- `mock-data.ts`, `mock-reference-data.ts`, `mock-maintenance.ts`, `mock-inspections.ts` — placeholder datasets (dashboard widgets, locations/departments, Maintenance Agreements, Inspections). `mockDepartments` is exported via `index.ts` too — `mission-control`'s Insights/Reports pages read it directly for cross-department rollups.

"Who is the current employee" (for `MyAssetsPage`/`RegisterAssetPage`, and for `asset-intelligence/issues`/`asset-intelligence/requests`) lives in `src/config/current-employee.ts`, not here — it's used by more than one feature.

**Known gap, confirmed 2026-08-18, not this sprint**: `RegisterAssetPage`'s Scan QR flow is simulated (pre-filled, no camera). Real registration must scan the physical QR code displayed on the asset — needs camera access, a QR-decode library, and a way to generate/print a per-asset QR label, none of which exist in this codebase yet. See that component's own comment and the Decision Log in the Obsidian requirement doc (§8).
