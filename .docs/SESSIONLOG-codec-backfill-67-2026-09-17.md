# SESSIONLOG — Thunder_Core#67 backfill applied to prod — 2026-09-17

Epic: codec gate (ADR 0069 + 0070). Living status: `docs/media-library/plan-codec-gate.md`.

## Done

1. Pulled the 3 prod Asset UUIDs from the 2026-09-17 post-#65 report and re-checked them on prod
   via read-only SQL: all `ready`, `metadata = {}`, 0 airing Publications. The session-test Asset
   in that report (`prod-test-high.mp4`) was already deleted and is not in the list.
2. Parallel read-only audit (subagent) of every `probe_verdict` / `status = 'failed'` reader in
   both repos: readers use only `code` + `profile`; no poll/activation SQL filters on
   `media_assets.status` → the backfill cannot pull anything off air.
3. Wrote `Thunder_Core/supabase/migrations/20260917074618_media_codec_backfill_67_prod.sql` on new
   branch `feat/codec-backfill-67` (off `develop`). Rollback is a commented block in the same file
   (repo convention). Deviations from the ticket's literal text, both deliberate: forward UPDATE has
   `AND status = 'ready'`; rollback also does `metadata - 'probe_verdict'`.
4. Rehearsed on `develop` (project `ftfmokgphewzyxzwjitv`) with 2 stand-in refused Assets
   (`3d496d8f…`, `668fb43d…`; the third candidate `5a668e27…` had been deleted): apply →
   `ready 9→7, failed 2`, `media_asset_get` returns verdict + `failed` → rollback → `ready 9,
   failed 0`. Done via `execute_sql`, so develop's migration history is untouched.
5. Prod apply (`sfiefevtxalqjizdkcsw`) via MCP `apply_migration` after explicit R0 "apply".
   Auto-mode classifier denied it twice ("Production Deploy", then unnamed); user switched
   permission mode; third call succeeded. Recorded as version `20260917074618`; local file renamed
   to match.
6. Post-apply verify (SQL): video `ready 25→22`, `failed 0→3` = exactly the 3 UUIDs with the
   verdict; total non-deleted Assets 26 unchanged; `media_asset_get` returns `failed`.
7. Updated `plan-codec-gate.md` status row, frontier, session-log row.

## Update — after user's next message

8. Committed + pushed `feat/codec-backfill-67` on Thunder_Core, opened
   [PR #74](https://github.com/rdThunderThailand/Thunder_Core/pull/74) (Thai body, Draft — pending
   Media Detail UI verify), posted apply results on #67, closed #67 (all AC met, real-player AC
   vacuous — 0 airing).
9. Audited the rest of the epic's tickets against GitHub state vs. their own AC checklists:
   - #64 had a real gap (final 2026-09-17 count never posted on thunder_one_prj#119) — posted it,
     user confirmed the report itself was already delivered to the player team → closed.
   - #65: plan doc says done; no dedicated `.docs` evidence file found for the `\df`/`prosrc`/
     privilege AC items (likely verified in an earlier, undocumented session) — user said close,
     closed on the strength of the living plan doc.
   - #66: real, named AC gap (real-player verification) — flagged explicitly, user accepted the
     risk and said close — closed with that caveat stated in the close comment.
   - thunder_one_prj#120: PR #124 already merged, all 4 cases verified in a prior session — closed.
10. Updated `plan-codec-gate.md` status table to CLOSED for #64/#65/#66/#67/#120, committed on
    `feat/converter` (not pushed — not asked).

## Not done / open

- Browser verify of Media Detail on prod for one of the 3 Assets — blocked mid-session: dev server
  requires login and this session has no credentials (auto-mode also blocked reading
  `document.cookie`). User was asked to sign in in the fronted browser tab; still pending as this
  file was last touched.
- PR #74 stays Draft until that UI verify happens (per working agreement — never flip Draft→Ready
  without it).
- `thunder_one_prj` working tree still carries unrelated branding edits (`favicon.ico`, `icon.svg`,
  `media-workspace-sidebar.tsx`) from a concurrent session — left untouched, not staged.
- Develop deliberately not backfilled (4 of 6 refused Assets airing = the unverified #66 leg).
- Held: thunder_one_prj#121 (WebP intake closure, needs a human-scheduled prod write).
