# Session log — codec gate, Thunder_Core#65 + all three PRs opened (2026-09-16/17)

Continued in the same overall session as the #63/#64 SESSIONLOGs, after the user chose to keep
going into #65 rather than stop to push/PR first.

## What moved

- Read Thunder_Core#65 (ADR 0070 intake admission). Confirmed the live `develop` signatures of
  `media_video_register` (13 args) and `media_asset_get` (2 args) via MCP `execute_sql` matched the
  2026-09-02 migration exactly (one overload each) before writing anything, per NO MAGIC.
- Wrote `supabase/migrations/20260916110000_media_video_register_probe_verdict.sql`: DROP+CREATE
  `media_video_register` with a trailing `p_probe_verdict jsonb DEFAULT NULL` (status/codec/metadata
  now follow the verdict for a video when one is passed; unchanged behavior when null or `kind =
  'image'`), re-REVOKE/GRANT reissued since `CREATE FUNCTION` grants PUBLIC; `CREATE OR REPLACE
  media_asset_get` adds `probe_verdict` as a single `metadata` key (signature unchanged, so no
  re-grant needed — confirmed `CREATE OR REPLACE` preserves existing grants).
- First `apply_migration` attempt (develop) was denied by the Claude Code auto-mode classifier
  ("Production Deploy") even though the target was the develop branch project. Asked the user; they
  said retry and they'd approve — retry succeeded.
- Added `probeVideo()` + `boundedReader()` to
  `src/app/api/core/v1/media/videos/route.ts`: signs a Storage URL, range-reads under an 8MB ceiling
  (`// ponytail:` comment — a moov claiming more is already hostile input), and **never throws past
  itself** — any failure (signing, range read, over-budget, malformed container) becomes an
  `unreadable` verdict so the route can't hang or 500 on a bad upload. Exported `unreadable()` and
  `PREDICATE_SET` from `probe.ts` for reuse (re-ran `probe.check.mts` after — still passes).
- Generated High-profile (`profile_idc=100`) and Main-profile (`profile_idc=77`) MP4 fixtures and a
  PNG with ffmpeg (local tool only, not a dependency) to exercise every acceptance-criteria branch.
- Found a stale Thunder_Core `next dev` process on port 3001, running 9.5 hours from an earlier
  session, cwd correct but likely parked on a stale branch — the exact trap
  `composition-tags-backend-missing.md` already warned about. Killed it and started a fresh one on
  the current branch before testing, rather than trust the existing one.
- Verified every HTTP acceptance criterion for real against that dev server (bound to the develop
  DB via the repo's own `.env`): registered Baseline (both faststart and no-faststart), High, Main,
  and a PNG through the actual `/api/core/v1/media/videos` route using a real signed-in test user
  (`piyapat@thunder.co.th`, tenant `THUNDER_001`) and a real app API key pulled from the DB — not a
  mocked RPC call. All five matched the ticket's expected `status`/`probe_verdict` exactly. Confirmed
  via `GET .../videos/[id]` that the detail route returns the same verdict, and via
  `storage.objects` that the refused file's object was never deleted.
- Ran the `\df` / privilege / `prosrc`-diff checks the ticket asks for — one overload each,
  `anon`/`authenticated` EXECUTE false, `service_role` true, `prosrc` byte-for-byte matches the
  migration file.
- Cleaned up every row and Storage object the test run created (`media_assets`, `files`,
  `storage.objects` — the last needed the Storage API, direct `DELETE` on `storage.objects` is
  blocked by a trigger). Stopped the dev server afterward so it doesn't become the next stale-process
  trap.
- User asked whether prod work is actually required now. Clarified that #64's prod run was
  read-only and #65's migration only touched `develop` — nothing on prod has been written this
  session — and that stopping at "verified on develop, PRs open" is a complete, safe stopping point.
  User agreed to push and open PRs without touching prod.
- Pushed all three branches and opened three **stacked** Draft PRs against Thunder_Core, Thai body
  per the user's earlier answer on PR language:
  [#68](https://github.com/rdThunderThailand/Thunder_Core/pull/68) (`feat/codec-parser-63` → `develop`),
  [#69](https://github.com/rdThunderThailand/Thunder_Core/pull/69) (`feat/codec-report-64` → #63's branch),
  [#70](https://github.com/rdThunderThailand/Thunder_Core/pull/70) (`feat/codec-intake-65` → #64's branch).

## Verified

- All of #65's HTTP acceptance criteria, against real requests on a server bound to the real
  `develop` database — not simulated, not unit-tested in isolation.
- `git status` clean on all three branches before each commit; no stray test scripts left behind
  (`scripts/tmp-65-check.mts` / `scripts/tmp-65-cleanup.mts` were deleted after use, never committed).

## Not done this session

- **Prod migration apply for #65, and the prod route deploy** — deliberately deferred; the user
  chose to stop at "verified on develop" rather than push to prod in this session. Whoever picks
  this up next should re-ask before doing either; nothing about this session's stop implies consent
  for a future session to proceed straight to prod.
- Player team still hasn't received #64's report file (user's own action item).
- **The prod service-role key exposed on 2026-09-16 still needs rotation** — unresolved, carried
  over from the prior SESSIONLOG. Nothing in this session referenced or used that key again.
- #120 (thunder_one_prj frontend) and Thunder_Core#66 (activation guard) are still blocked — #65
  living only on `develop`'s DB with no deployed route means there's nothing on prod for either to
  react to yet, and #120 hasn't been started at all.

## Next session

- Confirm the prod key was rotated before treating `.env.production.local` as safe to leave in
  place; delete it once done.
- Ask whether to move PRs #68-#70 through review/merge before or instead of touching prod — the plan
  doc's "Order" line (63 → (64 ∥ 65) → (120 ∥ 66) → 67) still holds, but nothing forces prod timing.
- If/when the user wants prod: apply #65's migration to prod via MCP `apply_migration` (R0, ask with
  the exact SQL first — same content already in the migration file), then the route needs an actual
  deploy (push+merge to `develop`, which is what Thunder_Core deploys from), then re-run the same
  `\df`/privilege/prosrc checks against prod before calling it done.
