# asset-intelligence/assets

Asset registry for Asset Intelligence — organization-wide physical assets (laptops, printers, NAS, and media-player hardware), owned end-to-end (register/track/manage/assign) by the Asset/IT Manager role. Not to be confused with `src/features/assets` (Media Workspace's reusable media files) — see `CONTEXT.md` at the repo root and `docs/adr/0023-asset-intelligence-feature-namespacing.md` for why both are named `Asset`.

> R&D placeholder — structure only, mock data. No Thunder_Core sync yet (see `docs/asset-intelligence/questions-thunder-core-contract.md`).

- `components/` —
  - `AssetOverviewPage` — Asset/IT Manager's landing page. Owns the "+ Add Asset" (AM-02) toggle as a client component so the header button and the form below it can share state; composes `AssetOverviewDashboard` + `AssetsListPage`.
  - `AssetsListPage` — all-assets table. Its Department column doubles as the AM-04 "Pass to Department" action for any asset with `departmentId: null` — real, working local state (select a department, confirm), not persisted (see `DepartmentCell`'s own comment for why).
  - `AssetOverviewDashboard` — stat tiles, attention required, work status, team workload
  - `AddAssetForm` — AM-02's form (tag/category/location/vendor/value/warranty), with real duplicate-tag validation against `services/mock-assets.ts`
  - `LocationsPage` (AM-05, flat list — not the doc's hierarchical tree, future work), `MaintenancePage` (AM-03, Maintenance Agreements + expiry status), `InspectionsPage` (AM-07), `WorkOrdersPage` (AM-06, org-wide — reads `thunder-care/work-orders`'s `getMockWorkOrders`/`WorkOrderCard` directly rather than duplicating them), `AnalyticsPage` (AM-08, category donut + summary tiles), `ReportsPage` (AM-08, org-wide category/value table, no export — same as every other role's un-exportable Reports page)
  - `MyAssetsPage` (Employee/User's "My Assets" view — filters the same `Asset` registry by `assigneeId`, per the repo mapping doc §5 which places this view inside this feature rather than a separate one), `RegisterAssetPage` (Employee's simulated Scan QR → confirm receipt flow, EMP-01)
- `hooks/` — feature-scoped React hooks (e.g. data fetching, local state)
- `services/` — data access for this feature; `mock-assets.ts` stands in until the Thunder_Core sync contract exists
- `types/` — `Asset` and its `category`/`status`/`lifecycleStatus` taxonomies (see `docs/adr/0024-asset-device-cross-reference-model.md` for the `category: "media_player_device"` / `externalRef` cross-reference to Media Workspace's Device; `lifecycleStatus` covers `active`/`pending_department_ack` (DM-01)/`pending_acknowledgement` (EMP-01) — a partial slice of the full onboarding state machine in the requirement doc §5.1)
- `mock-data.ts` — Asset/IT Manager overview dashboard widgets, derived from `services/mock-assets.ts` where possible
- `mock-reference-data.ts`, `mock-maintenance.ts`, `mock-inspections.ts` — locations/departments, Maintenance Agreements, and Inspections — each its own small placeholder dataset, no backend yet. `mockDepartments` is exported via `index.ts` too — `mission-control`'s Insights/Reports pages read it directly for cross-department rollups.

"Who is the current employee" (for `MyAssetsPage`/`RegisterAssetPage`, and for `asset-intelligence/issues`/`asset-intelligence/requests`) lives in `src/config/current-employee.ts`, not here — it's used by more than one feature.

**Known gap, confirmed 2026-08-18, not this sprint**: `RegisterAssetPage`'s Scan QR flow is simulated (pre-filled, no camera). Real registration must scan the physical QR code displayed on the asset — needs camera access, a QR-decode library, and a way to generate/print a per-asset QR label, none of which exist in this codebase yet. See that component's own comment and the Decision Log in the Obsidian requirement doc (§8).
