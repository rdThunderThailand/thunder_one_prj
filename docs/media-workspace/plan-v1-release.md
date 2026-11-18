# Plan — ThunderOne v1.0 release (One + Core)

Written 2026-11-18. Decisions grilled 2026-11-17, owner: "as recommended" on every question. P0 items are in
`plan-v1-p0.md` (all shipped in One v0.22.0). Session notes: `.docs/SESSIONLOG-v1-p1-probe-2026-11-17.md`.

**v1.0 =** ThunderOne (One) `1.0.0` on `main`, running against Thunder_Core `v0.26.0` on prod. Core keeps its own
`0.x` numbering because it also serves Asset Workspace (Core's `versioning.md`: 1.0.0 needs an ADR there too).
Player updates stay checksum-only on the `pilot` ring (release note from v0.22.0).

## Facts already confirmed — do not re-derive

- Core `v0.26.0` is live: #401/#402 merged, tag on `ca3cb9b`, #403 (row) and #404 (back-merge) merged. Prod has
  88 migrations; md5 of `media_composition_fork_layout`, `media_composition_duplicate`, `asset_ws_settings_read`,
  `asset_ws_update_settings` equal develop. Layout copy keeps `canvas_mode` on prod (thunder_qa, test copy trashed).
  The admin client is no longer logged (code), Vercel log check after deploy is weak evidence.
- Core's two Asset WS settings migrations are on prod (ADR 0025 forced them); their route/lib code is still
  develop-only. Nothing calls them on prod.
- One `main` = `0.22.0`. Waiting for `1.0.0`: #388 (Draft One #400, `55c557ca`) and the UAT #404 fix (Draft One #405,
  ADR 0116: editor Save & Activate, picker lists drafts, Publish button default, publish-prep dialog).
- One `docs/agents/versioning.md` says: stay on `0.x` "until the frontend has a stable contract against
  Thunder_Core. Do not bump to `1.0.0` without an ADR." Next One ADR number: **0115**.
- Probe on prod 2026-11-17 (read-only): 602 live videos have no verdict and no Rendition (556 created in Nov),
  165 on air; 1,873 `playback_stalled` in 7 days, all Windows, 1,569 of them `a092c3df` on one Windows 26200
  device. 582 videos have no poster, 161 on air. Android 7.1.2 / 9 devices send no playback logs.

## Gate to v1.0 (in order)

Decided 2026-11-18: QA runs UAT on prod now (prod already is v1.0 in function), `1.0.0` is tagged only after UAT
passes; UAT bugs are fixed on `dev` and ship in the same `1.0.0`. Checklist: `uat-v1-checklist.md` (section B
runs after step 5).

| # | Repo | Step | Who | Tag |
|---|---|---|---|---|
| 0 | One | QA runs round 1 of `uat-v1-checklist.md` (rows tagged R1) on prod v0.22.0 (thunder_qa, `zz-uat-` names); steps 1–4 run in parallel | QA | prod writes in test tenant only |
| 1 | One | Merge #400 (#388) and #405 (UAT #404 fix) into `dev` | owner | — |
| 2 | One | ADR 0115 "ThunderOne goes 1.0.0" (see below) + `versioning.md` edit, Draft PR → `dev` | Claude writes, owner merges | design fork (decided, ADR records it) |
| 3 | One | Verify `dev`: `pnpm install --frozen-lockfile`, `tsc --noEmit`, `next build`, all exit 0 | Claude | R2 |
| 4 | One | Release-prep `release/v1.0.0` → `dev`: `package.json` `1.0.0`, Draft | Claude, owner merges | R2 |
| 4b | One | UAT result: every ❌ in A/C fixed on `dev` or accepted by the owner as a known gap | owner | gate |
| 5 | One | Release PR `dev → main` "release v1.0.0: promote dev → main (#26 — v1.0)", Draft. Body: changes since `v0.22.0` (#388, ADR 0115), Core dependency `v0.26.0`, "merge = deploy to production immediately" | Claude opens, owner marks ready + merges | R0 (owner) |
| 6 | One | After the merge deploys: QA runs round 2 (rows tagged R2: the #405 flows, B1) on prod; re-run of any item fixed after round 1; then clean up `zz-uat-` rows (list shown first) | QA, Claude | delete = R0 |
| 7 | One | Tag `v1.0.0` on the merge commit, then versioning row PR | Claude, after yes | R0 |
| 8 | Both | Release note to the team (Thai): what v1.0 is, Player updates checksum-only, known gaps below | Claude drafts, owner sends | outward = ask |

Nothing in Core blocks steps 1–8.

### ADR 0115 content (step 2)

- Decision: One `1.0.0` marks the first release for every tenant; the Media Workspace contract with Core
  `/api/core/v1/media/*` is treated as stable. Breaking it from now on means a MAJOR bump on One.
- Core stays `0.x` (Asset WS v2 API still moving); One pins nothing, it calls the deployed Core.
- Rejected: bump both to 1.0.0 (Core would need its own ADR and Asset WS is not stable); keep `0.23.0` and
  call it "v1.0" only in marketing (number and product would disagree).
- `versioning.md`: replace the "stay on 0.x" paragraph with MAJOR/MINOR/PATCH rules from 1.0.0 on; keep the
  promotion count table.

## Core work queue (none blocks v1.0)

| Order | Item | State | Next step |
|---|---|---|---|
| 1 | Re-search Vercel prod logs for `adminClient` | weak evidence | Claude in browser, 2026-11-18 or later |
| 2 | Core #292 / ADR 0102 Playback Risk | P1, decision: keep P1 until re-probe | Owner runs `.docs/RUNBOOK-reprobe-no-verdict-videos-2026-11-17.md`; Claude counts High/HEVC × on-air × Android. P0 if any High/HEVC is on air on Android or fails |
| 3 | Comments: close Core #291 (objects on prod), re-scope #292 to ADR 0102 (Asset ids `5dd89f90`, `cdc185ca`, not file ids) | drafted in plan only | Claude drafts text, owner OKs, then post |
| 4 | Player team: `a092c3df` stalls on one Windows 10.0.26200 device, fine on 17763 | not sent | Claude drafts, owner sends |
| 5 | Aurora-migrate writes a verdict (Core #295) | reopened, after re-probe | decide from re-probe result |
| 6 | #231 Edit Program cover: `thumbnail_url` on publication detail from `publication_cover` | decided (Core read model) | Core migration + route, then One; next Core release |
| 7 | Core #181 `playback_logs` retention | after v1.0 | start from the untracked draft `docs/adr/0030-playback-logs-keep-90-days-behind-a-daily-rollup.md` in the Core checkout (not ours, ask whose) |
| 8 | Asset WS settings code (#393, #397–#400) | develop only | next Core release, normal promotion |

## One work queue after v1.0

| Item | Decision |
|---|---|
| #236 poster on upload | P1; backfill 161 on-air posters later (script = prod Storage write, R0) |
| #237 Calendar Live | waits for PO wording (DICS card) |
| #261 delete Channel | needs ADR (reverses ADR 0038) and 4 owner answers |
| #231 | after Core item 6 |
| ADR 0114 known gap (duplicate Program after another tab published) | open an issue, ask first |

## Housekeeping

- Remove worktrees `../Thunder_Core-release-v0.26.0` and `../Thunder_Core-release-v0.26.0-main` (the second holds
  copied `.env` files): `git -C ~/Desktop/Thunder/project/Thunder_Core worktree remove …` — ask first.
- One checkout is on `fix/channels-pagination-label-388`; move to `dev` after #400 merges.

## Done when

- `main` of One is `1.0.0`, tagged `v1.0.0`, deployed, and the prod check in step 6 passed (or what was not
  checked is written down).
- ADR 0115 merged; `versioning.md` no longer says "stay on 0.x".
- The team release note is sent.
- Core queue items 1–4 each have an owner-approved next step recorded on their issue.
