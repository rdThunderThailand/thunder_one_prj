# SESSIONLOG — #37 per-item playback intent, Phase 5 + 6

Date: 2026-09-03
Branches: `fix/playlist` (both `thunder_one_prj` and `Thunder_Core`)

## Starting point

Handoff `/private/tmp/HANDOFF-issue37-playback-intent-2026-09-03.md` said Phase 5/6
not started. That was stale — Phase 5 frontend code was already written on the branch
(uncommitted) and Steps 1–7 of its browser verification were run by the user this
session (all PASS, report `issue37_per_item_intent_report.md`).

## What this session did

### Phase 5 — confirmed complete, committed

Frontend code was already in the working tree; verified and committed as
`301fe0a feat(playlists): per-item playback overrides in the editor (#37)`.

- `PlaylistPropertiesPane.tsx` Item tab: transition-duration / fit / background / notes
  controls, empty = inherit, Playlist value as placeholder.
- `DraftItem` + `draft-from-detail.ts` (hydrate) + `usePlaylistEditorRow.ts` (save) +
  `playlists-api.ts` (`PlaylistItemPayload`, `duplicatePlaylist`) + `domain.ts`
  (`PlaylistItem`) thread the four fields. Empty round-trips as key-omitted (spread
  conditional), never `null`.
- `metadata.ts` unchanged — confirmed, no new key needed.
- `draft-from-detail.check.mts` extended with the #37 round-trip assertions — passes.
- `tsc` clean on changed files.

### Phase 6 — contract doc + prod migration, done

- `docs/layouts/contract-v2-zones.md` §"Per-item playback overrides" — documents
  `transition_duration_seconds` / `fit` / `background_color` as flat slot keys, their
  units/vocabulary/fallbacks, and that a player may ignore any of them. `notes` not in
  payload by design.
- **Applied all four migrations to PROD** (`sfiefevtxalqjizdkcsw` "ThunderCore") via
  Supabase MCP `apply_migration`, in order:
  1. `playlist_items_per_item_intent` — 4 nullable columns on `media_core.playlist_items`
  2. `playlist_items_intent_write_path` — `media_playlist_set_items` / `media_playlist_get`
  3. `snapshot_items_intent_resolution` — 4 columns on `publication_snapshot_items`
     (first two `NOT NULL`), `media_publication_activate` resolves on both paths
  4. `poll_payload_item_intent` — `media_job_poll` emits the three flat keys
- Auto-mode classifier blocked the MCP writes twice; user switched auto-mode off, then
  they went through.
- Pre-flight checks: prod migration history matched local up to
  `20260902164012_playlists_list_item_kinds` (prod == develop before these), all four
  function signatures matched (CREATE OR REPLACE, no overload), prod had none of the
  new columns.
- Post-apply verification (`execute_sql` against prod):
  - `playlist_items`: 4 cols present, all nullable.
  - `publication_snapshot_items`: `transition_duration_seconds` + `fit` `NOT NULL`,
    `background_color` + `notes` nullable — matches ADR §5a.
  - `media_job_poll` def contains the three flat keys, contains no `notes`.
  - `media_publication_activate` def has the `fit` COALESCE chain and `cut → 0` CASE.
  - `media_playlist_get` def emits `fit`.

### Commits

- `Thunder_Core` `89dc582 feat(media): per-item playback intent reaches the poll payload`
- `thunder_one_prj` `301fe0a feat(playlists): per-item playback overrides in the editor (#37)`
- `thunder_one_prj` `dfb0019 docs(playlists): browser verify checklist for playback settings (#36)`

## Also this session — #37 and #36 closed

- **#37** commented with the full phase summary and closed.
- **#36 (playback settings + timeline)** — no code change needed; `PlaylistPlaybackSettings`,
  its wiring in `PlaylistEditorPage`, and the `metadata.ts` play_mode/repeat/start_from
  whitelist were already on the branch. Verified code-level (all 13 playlist checks pass,
  tsc clean) and browser-level (checklist
  `docs/playlists/v1/verify-36-playback-settings-browser-checklist.md`, user ran it,
  A–E 14/14 PASS incl. the core persist-across-save-reload AC). E (poll payload carries
  the playback object) confirmed only at the `metadata.ts` + `media_publication_activate`
  level, not from a live device poll — noted in the issue. Closed.

## Known consequence now live in prod

Stored `metadata.playback.transition_duration` values begin taking effect for the
first time. Measured 2026-09-02: 7 of 86 Playlists carry the key; 17 of 133 items
across 8 Playlists resolve to a transition other than `cut`. Only newly-activated (or
re-activated) Publications materialize new snapshots — existing snapshots are untouched.

## Not done

- HTTP-layer verification of the prod poll payload (the "AC that bites" per the plan)
  was already done on `develop` in the prior session and cleaned up; not repeated
  against prod. Backend deploys from `develop`, and `media_job_poll` on prod now
  carries the keys, but no live prod device poll was captured this session.
- PR not opened — per the playlist v1 epic, one PR covers the whole epic once every
  ticket is done.
- `prosrc` full textual diff against the migration files was spot-checked (key
  resolution lines present), not a line-by-line dump-and-diff.
