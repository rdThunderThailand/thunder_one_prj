# ai-assets

Asset registry for Asset Intelligence — organization-wide physical assets (laptops, printers, NAS, and media-player hardware), owned end-to-end (register/track/manage/assign) by the Asset/IT Manager role. Not to be confused with `src/features/assets` (Media Workspace's reusable media files) — see `CONTEXT.md` at the repo root and `docs/adr/0017-asset-intelligence-feature-namespacing.md` for why both are named `Asset`.

> R&D placeholder — structure only, mock data. No Thunder_Core sync yet (see `docs/asset-intelligence/questions-thunder-core-contract.md`).

- `components/` — feature-scoped UI components
- `hooks/` — feature-scoped React hooks (e.g. data fetching, local state)
- `services/` — data access for this feature; `mock-assets.ts` stands in until the Thunder_Core sync contract exists
- `types/` — `Asset` and its `category`/`status` taxonomies (see `docs/adr/0018-asset-device-cross-reference-model.md` for the `category: "media_player_device"` / `externalRef` cross-reference to Media Workspace's Device)
