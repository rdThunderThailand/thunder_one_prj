# ai-assets

Asset registry for Asset Intelligence — organization-wide physical assets (laptops, printers, NAS, and media-player hardware), owned end-to-end (register/track/manage/assign) by the Asset/IT Manager role. Not to be confused with `src/features/assets` (Media Workspace's reusable media files) — see `CONTEXT.md` at the repo root and `docs/adr/0023-asset-intelligence-feature-namespacing.md` for why both are named `Asset`.

> R&D placeholder — structure only, mock data. No Thunder_Core sync yet (see `docs/asset-intelligence/questions-thunder-core-contract.md`).

- `components/` — `AssetsListPage` (all-assets table), `AssetOverviewDashboard` (Asset/IT Manager's dashboard — stat tiles, attention required, work status, team workload), `MyAssetsPage` (Employee/User's "My Assets" view — filters the same `Asset` registry by `assigneeId`, per the repo mapping doc §5 which places this view inside this feature rather than a separate one), `RegisterAssetPage` (Employee's simulated Scan QR → confirm receipt flow, EMP-01)
- `hooks/` — feature-scoped React hooks (e.g. data fetching, local state)
- `services/` — data access for this feature; `mock-assets.ts` stands in until the Thunder_Core sync contract exists
- `types/` — `Asset` and its `category`/`status`/`lifecycleStatus` taxonomies (see `docs/adr/0024-asset-device-cross-reference-model.md` for the `category: "media_player_device"` / `externalRef` cross-reference to Media Workspace's Device; `lifecycleStatus` is a minimal 2-value slice of the full onboarding state machine in the requirement doc §5.1, just enough to drive the Register flow)
- `mock-data.ts` — Asset/IT Manager dashboard widgets, derived from `services/mock-assets.ts` where possible

"Who is the current employee" (for `MyAssetsPage`/`RegisterAssetPage`, and for `ai-issues`/`ai-requests`) lives in `src/config/current-employee.ts`, not here — it's used by more than one feature.

**Known gap, confirmed 2026-08-18, not this sprint**: `RegisterAssetPage`'s Scan QR flow is simulated (pre-filled, no camera). Real registration must scan the physical QR code displayed on the asset — needs camera access, a QR-decode library, and a way to generate/print a per-asset QR label, none of which exist in this codebase yet. See that component's own comment and the Decision Log in the Obsidian requirement doc (§8).
