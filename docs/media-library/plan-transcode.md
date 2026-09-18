# Plan — Transcode v1 (ADR 0071)

**Status: CLOSED 2026-09-18.** T1–T8 all done and closed; prod live end to end (upload → probe →
`processing` → cron converts → `ready` + Rendition), backfill of the 3 pre-existing prod refusals
complete, real-player gate (T8) passed on Android and Windows. ADR of record:
`docs/adr/0071-a-quarantined-video-is-transcoded-instead-of-refused.md` (`accepted`). Spec of record:
[thunder_one_prj#127](https://github.com/rdThunderThailand/thunder_one_prj/issues/127) (closed).
Predecessor epic (ADR 0069 + 0070) is CLOSED — `plan-codec-gate.md`.

**Notable find during T7 (fixed in the same window, outside this plan's original scope):** the real
upload intake route (`videos/route.ts`) had never actually been deployed to prod with ADR 0069/0070's
probe-computation code — only the DB schema/RPCs and a one-time backfill of 3 pre-existing Assets had
reached prod via direct migration apply. Every *new* upload on prod, including High/HEVC, was
registering `ready` with no gate at all until this was caught and fixed as part of T7 (cherry-picked
the probe module, intake wiring, activation guard and the ADR-0069 backfill migration source onto
`main` alongside T2/T3 — all four were already live on prod's database, only the app code/migration
source were missing). Verified with a real end-to-end upload through the actual HTTP route before T7
continued. See Thunder_Core's `.docs/SESSIONLOG-transcode-t6-t7-t8-close-2026-09-18.md`.

## The problem in one paragraph

ADR 0070 refuses a High/HEVC upload on intake and shows the operator a format spec. That stops black
screens but puts a codec decision in front of someone whose job is scheduling content, and every
phone/CapCut export is High by default. After this plan: a High/HEVC upload registers as
`processing`, a Vercel cron in Thunder_Core re-encodes it to Constrained Baseline within minutes, the
Asset becomes `ready` with a Rendition the player poll serves, and the original is kept. Main
converts in the background without ever leaving `ready`, installing only while it is off air (ADR's
one SQL definition: latest Publish Job snapshot + Schedule window open now, incl. recurrence).

## ข้อเท็จจริงที่ยืนยันแล้ว — อย่า re-derive

- Thunder_Core is on **Vercel Pro** (user, 2026-09-17). Sub-daily cron and route-level `maxDuration`
  are available; the exact ceiling is what T1 measures.
- `vercel.json` pins `src/app/api/**` to `maxDuration: 30`; only cron is `uploads/sweep` at
  `0 18 * * *`, gated by `CRON_SECRET` + `timingSafeEqual` (`src/app/api/core/v1/media/uploads/sweep/route.ts`).
- Thunder_Core has **no** ffmpeg/ffprobe dependency today.
- `media_video_register` (`20260916110000_media_video_register_probe_verdict.sql`) maps
  `unsupported_profile` / `unreadable` → `failed`, everything else → `ready`; verdict stored at
  `metadata.probe_verdict`. Main is `ready` + `unverified_preset`.
- Activation guard (`20260917100000_activation_guard_quarantined_assets.sql`) refuses any non-`ready`
  Asset, so `processing` is already blocked from publishing.
- `media_job_poll` serves `COALESCE(fv.storage_key, f.storage_key)`; `file_versions` has 0 rows.
- Count 2026-09-17: prod 3/25 refused (0 airing), develop 6/9 (4 airing); all H.264 High.
- Library: 34 videos, 377 MB, largest 144 MB, longest 144 s. Bucket limit 5 GB (stays).
- Storage is isolated per branch (ADR 0011): a Rendition written on develop does not exist on prod.

## Tickets

Legend: `todo` · `in progress` · `in review` · `done` · `held`

| # | Ticket | Repo | Blocked by | Status | Acceptance |
|---|---|---|---|---|---|
| T1 | [Thunder_Core#76](https://github.com/rdThunderThailand/Thunder_Core/issues/76) Spike: ffmpeg/ffprobe on a Vercel **preview** deployment (manual GET only) | Thunder_Core | — | done 2026-09-17 | see below |
| T2 | [Thunder_Core#77](https://github.com/rdThunderThailand/Thunder_Core/issues/77) Worker route + recipe + validation, deployed with **no cron** | Thunder_Core | T1 | done 2026-09-17 | see below |
| T3 | [Thunder_Core#78](https://github.com/rdThunderThailand/Thunder_Core/issues/78) Migration: job table, rendition columns, RPCs, replaced functions — **no backfill** | Thunder_Core | T2 deployed on develop | done — develop 2026-09-18, prod 2026-09-18 (T7 step 3) | see below |
| T4 | [Thunder_Core#79](https://github.com/rdThunderThailand/Thunder_Core/issues/79) Enable cron `* * * * *` — cadence proof lives here | Thunder_Core | T3 | done — develop 2026-09-18, prod 2026-09-18 (T7 step 6) | see below |
| T5 | [#128](https://github.com/rdThunderThailand/thunder_one_prj/issues/128) FE: Upload Queue + Media Detail + `MediaAsset` type | thunder_one_prj | T3 (contract) | done — PR #129 merged to `dev` 2026-09-18 | see below |
| T6 | [Thunder_Core#80](https://github.com/rdThunderThailand/Thunder_Core/issues/80) Backfill migration (own file) — written and rehearsed on develop | Thunder_Core | T4, T5 | done — rehearsed on develop (0 rows, no organic target there), applied to prod 2026-09-18 (3/3 rows done) | see below |
| T7 | [Thunder_Core#81](https://github.com/rdThunderThailand/Thunder_Core/issues/81) Prod rollout, same order as develop — every step its own R0 | Thunder_Core | T6 | done 2026-09-18, all 8 steps | see below |
| T8 | [Thunder_Core#82](https://github.com/rdThunderThailand/Thunder_Core/issues/82) Real-player rollout gate → close-out | manual | T7 | done 2026-09-18 — Android + Windows confirmed playing normally | see below |

Canonical sequence: T1 → T2 → T3 → T4 → T5 → T6 (develop) → T7 (prod) → T8. **All done — plan CLOSED
2026-09-18.**

### T1 — Spike (throwaway branch, preview deployment, no DB writes)

Deploy a Thunder_Core preview with both binaries bundled and one `CRON_SECRET`-gated route that
encodes a fixture on GET. Vercel does not run crons on preview deployments, so T1 proves nothing
about cadence — that is T4. Record in the ADR:
- deployed bundle size; whether Large Functions opt-in was needed;
- the `maxDuration` the route actually received (route-level override vs. the 30 s catch-all) — the
  run must cross 30 s on purpose;
- four encodes with wall time, output size, `/tmp` peak: 144 MB file (today's largest), 4K60 source,
  a ~200 MB file, a file without `faststart` (phone recording).
Exit: the 200 MB envelope confirmed or replaced; ADR status → `accepted`. If a function cannot hold
the envelope at all, the fallback is a container running the same claim/finalize contract — the ADR
does not change shape. **R0:** pushing the spike branch (Vercel builds a preview from it) is asked
for separately.

### T2 — Worker route (Thunder_Core)

`GET /api/core/v1/media/transcode/sweep`, `CRON_SECRET`-gated like `uploads/sweep`, own
`maxDuration` in `vercel.json`, **cron entry not added**. **One invocation = three steps, no loop:**
1. `rpc media_transcode_install_ready()` — at most one install;
2. `rpc media_transcode_claim(p_lease)` — at most one job: download original to `/tmp` → ffmpeg
   (recipe in ADR) → ffprobe full validation (no-audio output allowed only when the input had no
   audio) → upload `videos/renditions/<asset>-<job>-<attempt>.mp4` → `rpc media_transcode_finalize`;
   on any error `rpc media_transcode_fail(job_id, error)`;
3. return `{ installed: 0|1, claimed: 0|1, job_id?, outcome? }`.
No "while time remains" — a second claim near `maxDuration` would burn an attempt on an encode that
never runs (ADR "One encode per invocation"). The ffmpeg invocation is a plain function of input
path → output path in its own module, not inside the route handler. `ponytail:` note naming the
original-deletion and orphan-output cleanup upgrade paths.

Deploy to develop **before T3**. Until the RPCs exist the route catches the PostgREST
"function not found" error (`PGRST202`) from the first `claim` call and returns
`{ success: true, claimed: 0, reason: 'rpc_missing' }` — no feature flag, no env var; the guard is
deleted in T4 once the migration is live everywhere.

Acceptance: manual GET on the develop deployment returns 200 with `claimed: 0, reason: 'rpc_missing'`.
**R0:** the develop deploy (push to `develop`) is asked for separately.

### T3 — Migration (Thunder_Core, apply develop first)

One migration: `media_core.media_transcode_jobs` (+ `checksum`) + partial unique index (one
unfinished job per Asset — `queued | running | ready_to_install`) · `media_assets.rendition_storage_key`,
`rendition_checksum` · **new** RPCs `media_transcode_claim(p_lease interval)` (pre-fail expired
`attempt >= 2`, CTE `FOR UPDATE SKIP LOCKED` → `UPDATE … RETURNING`, never returns `attempt > 2`),
`media_transcode_finalize(p_job_id, p_output_key, p_checksum, p_allow_active_swap default false)`
(locks job + Asset `FOR UPDATE`, on-air rule per ADR — latest Publish Job snapshot +
`media_core.publication_playback_window(...) ->> 'state' = 'open'`; `media_job_poll` is **not**
rewritten to use the helper), `media_transcode_install_ready()`
(one off-air `ready_to_install` job, no attempt change), `media_transcode_fail(p_job_id, p_error)`
(`attempt < 2` → `queued`, lease cleared, error kept, Asset untouched; `attempt >= 2` → job `failed`,
Asset `processing` → `failed`, Asset `ready` unchanged) ·
**replaced, same signature, `CREATE OR REPLACE`**: `media_video_register` (High/HEVC →
`processing` + job; Main → job, status unchanged), `media_job_poll` (two `COALESCE`),
`media_asset_get` (`rendition.present`), `media_publication_activate` (`FOR SHARE` on snapshot Asset
rows in id order). `DROP FUNCTION IF EXISTS <exact old signature>` **only** if a signature changes
(none is expected to). New functions: `REVOKE ALL FROM PUBLIC` + service-role `GRANT` (CREATE
FUNCTION grants EXECUTE to PUBLIC). After apply: dump `prosrc` and diff against the file. The
migration file is **its own commit** (T7 cherry-picks it to `main` before applying to prod).

Acceptance (HTTP on develop, route invoked by hand):
1. upload High → Asset `processing` → GET sweep → `ready`, `rendition_storage_key` set, ffprobe of
   the object passes every contract property, audio present because the input had audio;
2. upload Main → stays `ready` → sweep → Rendition installed, status still `ready`;
3. Main on air (active Publication, Schedule window open now, latest snapshot contains it) → sweep →
   job `ready_to_install`, pointer untouched → cancel the Publication (or wait for its window to
   close) → next sweep installs via `install_ready`, `attempt` unchanged;
4. fixture with a valid `moov`/`avcC` (High) but a damaged `mdat` so the byte walk admits it and
   ffmpeg fails → after sweep 1: job `queued` again, `attempt = 1`, error kept, Asset still
   `processing` → after sweep 2: job `failed`, `attempt = 2`, Asset `failed` with reason → sweep 3
   claims nothing for it; the same fixture registered as Main leaves the Asset `ready` throughout;
5. > 200 MB original → `failed` + `too_large_to_convert`, no job;
6. two concurrent GETs → exactly one claims each job (attempt never skips a number).

### T4 — Cron on (develop environment's production deployment)

Add `{ "path": "/api/core/v1/media/transcode/sweep", "schedule": "* * * * *" }` and delete T2's
`rpc_missing` guard — **one commit, so T7 can promote it as a unit**. Acceptance: three consecutive
minutes of invocations in Vercel logs; a High upload reaches `ready` without any manual GET; no job
shows two concurrent `running` leases. **R0:** push to `develop` (deploys the cron) asked for
separately.

### T5 — Frontend (thunder_one_prj)

- `MediaAsset` (`src/types/domain.ts`): add `rendition: { present: boolean }`, keep `probe_verdict`.
- Upload Queue (`useUploadQueue` branch on `RegisteredVideo.status`): `processing` renders
  "กำลังแปลงไฟล์ให้เล่นได้" instead of the refusal; `failed` keeps ADR 0070's messages. No polling.
- Media Detail (`media-detail-page.tsx`): `rendition.present` → "แปลงแล้ว" badge and the profile
  warning hidden; `processing` → "กำลังแปลง — รีเฟรชเพื่อดูสถานะ"; Main with a pending job needs no
  UI (nothing is wrong with it).
- `*.check.mts` for the status → label mapping (the one non-trivial branch).

Acceptance (browser, ask first per §3): High → queue shows converting → refresh Detail → converted,
no warning; Main → ready throughout; `failed` unreadable → unchanged refusal. **R0:** push of the FE
branch / merge to `dev` asked for separately.

### T6 — Backfill (own migration, develop)

`UPDATE media_assets SET status='processing'` for `failed` + `unsupported_profile` (develop 6) and
insert a job each; insert a job for every `ready` + `unverified_preset` (Main). No status change for
Main. Rehearse apply → verify → rollback on develop before T7 touches prod. The migration file is
**its own commit** (T7 cherry-picks it to `main` before applying to prod).

Acceptance: within the SLA derived from T1 (encode time × backlog ÷ one function per minute), every
backfilled job is terminal — `done`, `failed` with a reason, or intentionally `ready_to_install`
because the Asset is on air — and no job is `queued`/`running` past the SLA.

### T7 — Prod rollout (Thunder_Core; every step its own R0, none bundled)

By the time T7 starts, `develop` already carries T2 + T3 + T4 + T6, so a plain `develop → main`
merge cannot land "T2 only". T2, T3, T4 and T6 are therefore **single commits each** and are promoted
in pairs so that **a migration's source is on `main` before it is applied to prod** — prod schema
must never run ahead of `main`. A push deploys code; it never applies a migration:

1. **R0** cherry-pick the exact T2 commit (route, cron absent) **and** the T3 migration-source
   commit onto `main` and push — Vercel deploys the route; the migration file is now on `main`,
   unapplied;
2. manual GET on prod → `claimed: 0, reason: 'rpc_missing'`;
3. **R0** apply the T3 migration on prod (Supabase MCP), from the file now on `main` → dump
   `prosrc`, diff against it;
4. **R0** one High test upload on prod (a write to prod Storage + `media_assets`) → manual GET →
   `ready` + Rendition, ffprobe of the object passes;
5. **R0** delete that test Asset, its file, its original and Rendition objects — shown as a list
   first, as its own approval;
6. **R0** cherry-pick the exact T4 commit (cron on, guard removed) **and** the T6 backfill
   migration-source commit onto `main` and push → observe three minutes of invocations;
7. **R0** apply the T6 backfill migration on prod, from the file now on `main` — show the exact 3
   `failed` + High rows and every Main row first;
8. **R0** Thunder One: merge T5 into `dev` (its own push) in the same window.

If cherry-picking is refused by conflict, cut a release branch from `main`, merge T2+T3 then T4+T6
as two merges, and the same eight steps hold. Nothing here is "merge develop → main". T3 and T6 must
each be committed as **one commit containing only the migration file** on `develop` so the pick is
clean.

Acceptance: prod 3 Assets `ready` with a Rendition, visible on Media Detail as converted; every
backfilled job terminal per T6's rule; no test rows left on prod.

### T8 — Real-player rollout gate → close-out (manual)

A Publication carrying one converted High, one converted Main and one portrait Rendition plays on a
real Android player and a real Windows player. Record device model / OS / app version with the
result. Pass → `.docs/SESSIONLOG-*`, this plan marked CLOSED. Fail → ADR revised or superseded (not
returned to proposed); plan stays open with the finding.

## Out of scope (v2 triggers in the ADR)

ffprobe on intake · provisional ceilings as quarantine rules · admin CLI · recipe versioning ·
second Rendition per zone · deleting originals · Upload Queue job polling · proof-of-play codec
failure reporting from the player (separate contract, Q9 of 2026-09-09).
