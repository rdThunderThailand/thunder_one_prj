# Plan — Codec gate (ADR 0069 + ADR 0070, no backfill)

**Living document.** Update the status table every time a ticket moves, and paste this file's
path into the handoff at the start of every new session on this work. Spec of record:
[thunder_one_prj#119](https://github.com/rdThunderThailand/thunder_one_prj/issues/119).
ADRs: `docs/adr/0069-*.md`, `docs/adr/0070-*.md` (branch `feat/converter`). ADR 0071 is out of
scope and has no ticket.

## The problem in one paragraph

An operator uploads an `.mp4`; the backend checks only the extension and MIME type and writes
`ready`; the Android player refuses H.264 High / HEVC before playback; the screen goes black and
nobody is told. Nobody knows how many such files the library holds today either. After this plan:
every new video is probed on intake and refused with a readable reason, the reason is visible in
the Upload Queue and on Media Detail, publication activation refuses a non-ready Asset by name, and
a read-only report says how many existing files are affected so the backfill can be decided on
evidence.

## Status

Legend: `todo` · `in progress` · `in review` (PR open, Draft until verified) · `done` · `held`

| # | Ticket | Repo | Blocked by | Status | PR | Last touched |
|---|---|---|---|---|---|---|
| 1 | [Thunder_Core#63](https://github.com/rdThunderThailand/Thunder_Core/issues/63) MP4 codec parser + fixtures | Thunder_Core | — | done — merged to `develop` and prod | [#68](https://github.com/rdThunderThailand/Thunder_Core/pull/68) | 2026-09-17 |
| 2 | [Thunder_Core#64](https://github.com/rdThunderThailand/Thunder_Core/issues/64) ADR 0069 read-only report | Thunder_Core | #63 | code merged to `develop` and prod; report still not handed to player team | [#69](https://github.com/rdThunderThailand/Thunder_Core/pull/69), landed via [#71](https://github.com/rdThunderThailand/Thunder_Core/pull/71) | 2026-09-17 |
| 3 | [Thunder_Core#65](https://github.com/rdThunderThailand/Thunder_Core/issues/65) intake admission (2 RPCs + route) | Thunder_Core | #63 | done — migration applied + schema-verified on `develop` and prod; HTTP re-verified end-to-end on `develop` only (prod HTTP blocked all session by an unrelated prod-only app-key gap, fixed but not yet re-tested against prod HTTP) | [#70](https://github.com/rdThunderThailand/Thunder_Core/pull/70), landed via [#71](https://github.com/rdThunderThailand/Thunder_Core/pull/71) | 2026-09-17 |
| 4 | [#120](https://github.com/rdThunderThailand/thunder_one_prj/issues/120) Upload Queue + Media Detail show the refusal | thunder_one_prj | Thunder_Core#65 on `develop` | in review (Draft) — code done, all 4 browser cases verified on `develop` | opening now | 2026-09-17 |
| 5 | [Thunder_Core#66](https://github.com/rdThunderThailand/Thunder_Core/issues/66) activation guard | Thunder_Core | Thunder_Core#65 | done — merged to `develop` and prod; UI-verified except one sub-case (see below) | [Thunder_Core#73](https://github.com/rdThunderThailand/Thunder_Core/pull/73), [thunder_one_prj#123](https://github.com/rdThunderThailand/thunder_one_prj/pull/123) — both MERGED | 2026-09-17 |
| 6 | [Thunder_Core#67](https://github.com/rdThunderThailand/Thunder_Core/issues/67) backfill existing Assets | Thunder_Core | #64, #65, #66 + human "go" | held | — | 2026-09-16 |
| 7 | [#121](https://github.com/rdThunderThailand/thunder_one_prj/issues/121) close WebP intake | both | human schedules it (prod writes) | held | — | 2026-09-16 |
| 8 | [Thunder_Core#72](https://github.com/rdThunderThailand/Thunder_Core/pull/72) `requireAppKey` error split (bugfix found this session, not in the original 7 tickets) | Thunder_Core | — | in review (Draft) | [#72](https://github.com/rdThunderThailand/Thunder_Core/pull/72) | 2026-09-17 |

**Frontier right now:** #63/#64/#65/#66 are all merged into `develop` and prod. **#120 is code
done and verified on `develop`, PR opening now (Draft, targets `dev`)** — nothing left to build in
this epic besides the held tickets. #67 still waits on a human "go" against the #64 count (9 of 32
refused, 3 airing, posted 2026-09-16) and #121 is independent/held.
**Order:** ~~63 → (64 ∥ 65) → 66~~ done → ~~120~~ in review → 67 after a "go". 121 is independent.

**#66 loose end:** every UI-checkable acceptance criterion passed (single-file refusal, two-zone
composition refusal naming both files, save-with-quarantined-asset, remove-then-activate-succeeds,
schema checks on both environments). The one sub-case not verified is "an already-active
Publication keeps playing on a **real player** after its Asset turns `failed`" — confirmed only by
reading `media_job_poll`'s body (no `media_assets.status` predicate exists in it), no physical/
software player was available. Not a blocker for #120; pick it up if a real player becomes
reachable. Full detail: `.docs/SESSIONLOG-activation-guard-66-2026-09-17.md`.

**#64 count (2026-09-16, both environments read-only, no rows written):** 9 of 32 video Assets are
refused today — 6 of 9 on `develop`, 3 of 23 on prod — 3 of those 9 are airing (all on `develop`).
Every refusal is H.264 High profile; no HEVC, no unreadable files in either environment. This is
the number #67 (backfill) will be sized against once a human says "go".

## What each ticket delivers, and when it is closed

Full acceptance criteria live on the tickets; this is the plain reading.

1. **Parser (#63)** — one pure function: MP4 bytes in, verdict out (`unsupported_profile` /
   `unreadable` → `failed`; `unverified_preset` for Main → `ready` flagged; Baseline → `ready`).
   Reads only box headers + `moov`, follows `moov` to the tail when there is no `faststart`.
   *Closed when* its `*.check.mts` passes on two committed fixtures (same clip, `moov` at head and
   at tail) and a truncated tail makes the check fail loudly.
2. **Report (#64)** — run the parser over every existing Asset, write nothing, produce a file:
   codec, profile, verdict class, and **airing** (= referenced by an active Publication, window
   ignored). *Closed when* the file is with the player team, the headline count is a comment on
   #119, and `git status` is clean.
3. **Intake (#65)** — register route probes the uploaded object and passes the verdict to
   `media_video_register`; `media_asset_get` returns `probe_verdict`. *Closed when* five HTTP cases
   pass on `develop`, both RPCs have one overload and are closed to `anon`/`authenticated`, and
   the migration is applied to `develop` and prod.
4. **Frontend (#120)** — queue item goes red with a sentence, Media Detail shows codec + reason,
   Main shows a caveat. Done 2026-09-17 — all four cases (High/Main/Baseline/no-verdict) verified
   in a real browser against `develop`, `verdict-message.check.mts` passes. PR opening (Draft).
5. **Activation guard (#66)** — Playlist with a failed Asset still saves; activating a Publication
   is refused naming every bad file; already-active Publications keep playing. Done and merged
   2026-09-17 — every criterion UI-verified except the real-player leg (code-verified only, no
   player device available).
6. **Backfill (#67)** — literal-UUID migration + literal rollback. *Closed when* a human wrote
   "go" with the #64 number, and apply/rollback were rehearsed on `develop` before prod.
7. **WebP (#121)** — bucket drops `image/webp`, `upload-limits` drops it, two files replaced through
   the normal flow, old ones not deleted. *Closed when* the inventory was posted before any write
   and every prod write was approved.

## Facts every session must know (verified 2026-09-16 — the ADRs point at older files)

- `media_publication_activate` latest: `20260914010000_channel_v02_sync_guard_grandfather_group_drift.sql`
  (m2_cleanup only mentions it in a comment). Guard goes after `v_item_count` validation, before
  `SET status = 'active'`, once.
- `media_video_register` (13 params) and `media_asset_get` latest: `20260902140000_media_asset_tags.sql`.
- Thunder_Core has **no HTTP-level check convention** — `*.check.mts` files are zod-only. HTTP and
  UI verification is a manual checklist; ask before driving the browser (working agreement §3).
- Thunder_Core deploys from `develop`; MCP migrations are live the moment they apply. Frontend on
  localhost talks to deployed `develop` unless `CORE_API_URL` is set.
- Signature change ⇒ `DROP FUNCTION IF EXISTS <old sig>` first, then `CREATE`, then re-`REVOKE`
  from `PUBLIC, anon, authenticated` + `GRANT` to `service_role`. Both are working-agreement traps.
- Prod migration apply and any prod write are R0: stop and ask, show what will change.

## Handoff template (copy into the first message of a new session)

```
Continue codec-gate work. Read docs/media-library/plan-codec-gate.md first, then the ticket
in "Frontier right now". Repo: <Thunder_Core | thunder_one_prj>. Branch: <name>.
Last session log: .docs/SESSIONLOG-codec-gate-<date>.md
Open questions carried over: <none | list>
```

Before ending a session: update the Status table (status, PR link, date), set "Frontier right
now", write `.docs/SESSIONLOG-codec-gate-<date>.md`, and note anything the next session must not
rediscover in the Facts section above.

## Decisions already made — do not reopen

- No picker hiding of non-ready Assets (courtesy, not control; the guard is on activation).
- No browser-side pre-probe (parser must live in Thunder_Core anyway for the report).
- WebP closure is its own ticket, not part of the codec gate.
- Main profile is admitted and flagged, not quarantined (player team, 2026-09-09).
- Backfill waits for the #64 number; it is not built speculatively.
- ADR 0071 (transcode) stays gated on a hardware campaign that does not exist.

## Session log

| Date | Session | What moved |
|---|---|---|
| 2026-09-16 | spec + tickets | #119 written after scrutinize; 7 tickets opened; this plan created |
| 2026-09-16 | #63 parser | `probe.ts` (box-walk → moov → stsd → avcC), 3 committed MP4 fixtures (ffmpeg-generated, not a Thunder_Core dep), `probe.check.mts` passes; `tsc` clean on `probe.ts`; committed locally, not pushed |
| 2026-09-16 | #64 report | `scripts/media-codec-report.ts` ran read-only against develop (6/9 refused, 3 airing) and prod (3/23 refused, 0 airing) with the operator's own prod key; headline count posted as [#119 comment](https://github.com/rdThunderThailand/thunder_one_prj/issues/119#issuecomment-5698594585); report JSON handed to the operator, not yet to the player team; committed locally on `feat/codec-report-64`, not pushed |
| 2026-09-16/17 | #65 intake | Migration (`media_video_register` +`p_probe_verdict`, `media_asset_get` +`probe_verdict`) applied to develop via MCP; route ranges-reads under an 8MB ceiling and never throws past the probe (falls back to `unreadable`). Verified with real HTTP against a local dev server bound to develop: Baseline/no-faststart/High/Main/PNG all matched acceptance criteria exactly; `\df`, privilege checks and `prosrc` diff all clean; test rows cleaned up after. Prod apply/deploy deliberately deferred — user chose to stop at develop for now. All three branches pushed and Draft PRs opened: [#68](https://github.com/rdThunderThailand/Thunder_Core/pull/68), [#69](https://github.com/rdThunderThailand/Thunder_Core/pull/69), [#70](https://github.com/rdThunderThailand/Thunder_Core/pull/70) |
| 2026-09-17 | #68/#69/#70 merge + prod migration | #68/#69/#70 showed GitHub state MERGED but only #68 had actually reached `develop` — #69 merged into `feat/codec-parser-63` and #70 into `feat/codec-report-64`, neither of which was ever merged into `develop` (GitHub does not auto-retarget a stacked PR's base unless the old branch is deleted). Opened [#71](https://github.com/rdThunderThailand/Thunder_Core/pull/71) (`feat/codec-report-64` → `develop`, contains all of #63+#64+#65) and merged it with approval; stale branch `feat/codec-parser-63` deleted. Prod service-role key rotated (user) and the #65 migration applied to prod (`sfiefevtxalqjizdkcsw`/`main`) via MCP `apply_migration`, then schema-verified (`pg_get_function_identity_arguments`, `has_function_privilege`: single 14-arg overload, grants correct). |
| 2026-09-17 | prod login investigation | Login via thunder_one_prj → Thunder_Core gateway (`/api/core/v1/auth/login`) 401'd on prod even after the key rotation + Vercel redeploy the user did. Root cause was unrelated to the rotation: `requireAppKey` looks up the caller's `x-api-key` in `public.applications`, and the "ThunderOne" row thunder_one_prj's local `.env.local` key pointed at only ever existed on the `develop` Supabase branch (`ftfmokgphewzyxzwjitv`) — prod (`sfiefevtxalqjizdkcsw`) has its own "ThunderOne" row seeded 2026-09-10 under a **different** `api_key`. User updated `.env.local` with the correct prod key themselves; login now works. Also fixed [Thunder_Core#72](https://github.com/rdThunderThailand/Thunder_Core/pull/72) (Draft, not yet merged): `requireAppKey` was throwing the same "invalid app API key" message for both "lookup query itself failed" and "lookup succeeded but no active row" — split into two messages so this class of bug is diagnosable from the error text next time, without needing a service-role-key rotation to be the first suspect. |
| 2026-09-17 | #66 activation guard | Migration `20260917100000_activation_guard_quarantined_assets.sql` — guard on `media_publication_activate` refuses activation of a snapshot containing a non-`ready` Asset, naming every offending file, `failed` vs `processing` worded separately. Found and fixed a real frontend bug while UI-testing: `classifyApiError` was swallowing the new RPC's `Invalid input:`-prefixed message into a generic bucket that drops the file names — added `isQuarantinedAsset` classifier (`thunder_one_prj`). UI-verified on `develop` (local Thunder_Core `:3001`) with throwaway test fixtures, all cleaned up after: single-file refusal, two-zone composition refusal naming both files, save-with-quarantined-asset succeeds, remove-then-activate succeeds. Applied + schema-verified (prosrc md5 match) on both `develop` and prod. Draft PRs [Thunder_Core#73](https://github.com/rdThunderThailand/Thunder_Core/pull/73) and [thunder_one_prj#123](https://github.com/rdThunderThailand/thunder_one_prj/pull/123) opened, cross-linked, and merged same day. Real-player leg of the guard (already-active Publication keeps playing) verified only by reading `media_job_poll`'s body — no player device available. Full detail: `.docs/SESSIONLOG-activation-guard-66-2026-09-17.md` |
| 2026-09-17 | #120 frontend | `RegisteredVideo`/`MediaAsset` gained `probe_verdict` (confirmed against the actual Thunder_Core route, which returns it from register too, not just detail — ADR 0070 text undersold this). New pure helper `verdict-message.ts` + `verdict-message.check.mts` (4 cases: unsupported_profile/unreadable/unverified_preset/absent). `useUploadQueue` branches on `registered.status` instead of assuming resolve = success; `UploadItem` gained `warning` for a completed-with-caveat row, styled amber, separate from the red `error` field. Media Detail badge turns red on `failed`, reason/caveat sentence renders under it. `tsc`/`eslint` clean on touched files. Verified with real ffmpeg-generated MP4 fixtures (High/Main/Baseline profiles, confirmed via `ffprobe`) uploaded through the actual UI against `develop` (local Thunder_Core `:3001`) by injecting `File` via `input.files` + a `change` event (the Browser tool cannot click through a native OS file dialog) — all 4 acceptance-criteria cases passed, including a pre-existing Asset with no `probe_verdict` rendering unchanged. Test rows (`test-high.mp4`, `test-main.mp4`, `test-baseline.mp4`) left on `develop` — `window.confirm` on Trash is auto-cancelled by the browser tool, delete by hand if needed. Also found and fixed, unrelated: `memberships.position_code`/`level_role` and `users.first_name_th`/`last_name_th` migration (`20260916100000_people_position_and_thai_name_fields.sql`) existed in the checked-out Thunder_Core code but was never applied to `develop`, 500ing every member-search request; applied via MCP and schema-verified. |
