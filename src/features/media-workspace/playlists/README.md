# playlists

An ordered sequence of Assets, with per-item duration and transition settings. Scheduling and targeting (Channel, timing) live in Publications, not here — see `CONTEXT.md` at the repo root.

UI: an overview (`/media-workspace/playlists`) plus a single editor page
(`/media-workspace/playlists/create` for a new one, `/media-workspace/playlists/<id>` to edit) —
the four-step wizard it replaced is gone (ADR 0060). See
`docs/playlists/v1/design-guideline-playlist-editor.md` and
`docs/adr/0010-playlist-settings-in-metadata.md` for why some playback settings write fields no
player reads yet.

- `components/` — `PlaylistsListPage` (overview + detail panel), `PlaylistEditorPage` (a thin
  3-pane shell) with `PlaylistItemsPane` (left) / `PlaylistTimelinePane` + `PlaylistPlaybackSettings`
  (centre) / `PlaylistPropertiesPane` (right Item|Playlist tabs) / `AddItemDrawer` (#35),
  `form.tsx` (shared field primitives). The editor holds its working copy in memory; the row
  is created on the first Save Draft, not on page entry (ADR 0060 §1). The centre pane embeds
  the shared `preview/PreviewStage` live (ADR 0061 one-Zone case).
- `use-undoable-state.ts` / `playlist-editor-state.ts` / `use-playlist-preview-handoff.ts` —
  the editor's undo/redo, pure state helpers, and the `BroadcastChannel` handoff that opens
  the full-screen preview (ADR 0061)
- `metadata.ts` — encode/decode for the `metadata` jsonb envelope, plus cover resolution
- `draft-from-detail.ts` — maps a fetched `PlaylistDetail` into editor state
- `duration.ts` — total-duration and `HH:MM:SS` formatting
- `services/playlists-api.ts` — list, get, create, update, set-items
- `types/` — this feature's domain types

`MediaThumb`, `usePreviewUrls` and the shared media API client used to live in
`features/publications` and were promoted to `src/components/ui`, `src/hooks` and
`src/lib/api` respectively so both features could use them without cross-feature imports.
