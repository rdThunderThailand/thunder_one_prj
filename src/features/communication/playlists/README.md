# playlists

An ordered sequence of Assets, with per-item duration and transition settings. Scheduling and targeting (Channel, timing) live in Publications, not here — see `CONTEXT.md` at the repo root.

UI: an overview (`/communication/playlists`) plus a 4-step wizard (`/communication/playlists/create`, or `?id=<uuid>` to
edit). See `docs/playlists/plan-playlist-ui.md` for the full design and
`docs/adr/0010-playlist-settings-in-metadata.md` for why the settings step writes fields no
player reads yet.

- `components/` — `PlaylistsListPage` (overview + detail panel), `CreatePlaylistPage` and its
  four step components, `PlaylistSummary` (right-rail), `form.tsx` (shared field primitives)
- `store/` — `usePlaylistDraftStore`, the wizard's only state; the wizard makes no network call
  before the final submit
- `metadata.ts` — encode/decode for the `metadata` jsonb envelope, plus cover resolution
- `step-validation.ts` — per-step `Next` gating (mirrors `docs/adr/0001-wizard-step-contract.md`)
- `duration.ts` — total-duration and `HH:MM:SS` formatting shared by the summary and review step
- `services/playlists-api.ts` — list, get, create, update, set-items
- `types/` — this feature's domain types

`MediaThumb`, `usePreviewUrls` and the shared media API client used to live in
`features/publications` and were promoted to `src/components/ui`, `src/hooks` and
`src/lib/api` respectively so both features could use them without cross-feature imports.
