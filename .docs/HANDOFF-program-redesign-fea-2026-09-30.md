# Handoff — Program redesign, FE-A next · 2026-09-30 (session 4)

## Intent

BE-1 is done and live (develop + prod DB; route merged to `develop`). Next session starts at **FE-A** — the Programs list page (mockup 01/02). There is **no open design fork**: the contract is settled, so this is an execute session → **Sonnet**. Switch to Opus only for a new fork (e.g. a mockup/contract conflict) or any R0.

## Read first (in this order)

1. `docs/program/progress-program.md` — FE-A checklist (BE-1 is `[x]`).
2. `docs/program/plan-program-redesign.md` — §1 "BE-1 list contract" (params + response), §2 "Programs list (FE-A)" (badges, KPI, actions by status, what is disabled/hidden), §0 fixed rules.
3. `docs/adr/0080-published-programs-are-edited-in-place.md` — Display status rules (the FE only *displays* `display_status`; never recompute it).
4. `.docs/SESSIONLOG-be1-publications-list-2026-09-30.md` — facts, gotchas, open items.
5. Mockups: `docs/program/figma-mockup/Program 01- Media Workspace.jpg` (list) and `02` (lifecycle/actions).
6. `AGENTS.md` "Media Workspace styling" + "Porting from Lovable" (tokens from `globals.css`, primitives in `src/components/ui/lovable/` — copy, don't recreate; ADR 0075/0076).

## State

- **Thunder_Core**: PR #136 merged into `develop` (2026-09-30). Migration applied to develop **and prod**. The prod `main` route is still the old one — promote `develop → main` separately. Local checkout is on `feat/program-list-read` (merged) — `git checkout develop && git pull` before anything new. `docs/adr/0014-…` is untracked there and belongs to BE-3.
- **thunder_one_prj**: `feat/program-redesign` has **7 unpushed docs commits** and is **3 behind `origin/dev`** (FE #179: 3 small files, no overlap). Merge or rebase `origin/dev`, then push (R0 — show the command, wait for yes). FE-A code goes on this branch.
- Dev servers: Thunder One :3000 and Core :3001 may still be running; Core :3001 was on `feat/program-list-read` (develop DB). Check with `lsof -a -p <pid> -d cwd -Fn` + `git branch --show-current`. `.env.local` has `CORE_API_URL=http://localhost:3001`; after `develop` is pulled the deployed develop backend also has the new route, so the URL can point there instead.

## FE-A — what to build (plan §2 + BE-1 contract)

Existing code to extend, not replace:
- `src/features/media-workspace/publications/components/PublicationsListPage.tsx` (333 lines — over the 300 cap already; split when adding) served at `src/app/(dashboard)/(application)/media-workspace/publications/manage/page.tsx`.
- `src/features/media-workspace/publications/services/publications-api.ts` — `fetchPublications(status?)` currently returns a bare array and is also used by `PlaylistPanelTabs.tsx` (no args) and `OverviewDashboard.tsx` (`"active"`). **Keep that signature working** or migrate the three callers together; add a new `fetchPublicationsPage(params)` returning `{ publications, total, counts_by_status }` rather than changing the old return type.
- `PublicationListItem` in `src/features/media-workspace/publications/types/index.ts:50` — add `display_status`, `content_name`, `thumbnail_url`, `next_airing_at`, `delivery`, and a `PublicationsPage` type. The API no longer returns `thumbnail_storage_key`/`thumbnail_bucket_name`.
- Checklist (progress-program.md FE-A): API client + types · 5 KPI cards (Total, Live, Publishing, Scheduled, Draft — no Paused, no % change) · filter bar (search, Status, Target, Tag, Created by, Sort; More filters **disabled**) · table · status-aware actions with confirm on destructive · pagination 10/page · Import Program + grid toggle **disabled** ("เร็วๆ นี้") · browser check vs frame 01 · Draft PR → `dev`.

## Facts to carry (do not re-derive)

- `GET /media/publications` query: `status`, `display_status` (`draft|publishing|scheduled|live|ended`), `channel_id` (direct or via Group), `group_id`, `tag_id`, `created_by`, `search` (name or content name, ≤200), `sort` (`updated_desc` default | `name_asc` | `starts_desc` | `created_desc`), `page` (≥1), `limit` (1–100). No `limit` → every row (old callers). Bad values → 400 `Invalid input: …`.
- Response: `{ success, data: { publications[], total, counts_by_status: { draft, publishing, scheduled, live, ended } } }`. `total` is after all filters; `counts_by_status` ignores only `display_status` (so KPI cards stay stable while a badge filter is on).
- Per row new fields: `display_status`, `content_name`, `thumbnail_url` (signed, 1 h, may be `null`), `next_airing_at` (ISO string or null), `delivery` (`{ total, stage3_done, offline, failed }` from the newest Job, `null` for a Program that never had a Job). Existing fields are unchanged.
- **Composition (Layout) rows have `thumbnail_url: null`** — no cover column exists; show a placeholder. Hide numbers that cannot be computed, never fake them.
- Badge rules, for copy only: Publishing = "due on screen but not there yet" (window open + an online device still waiting); Live = airing now; Scheduled = not started or between airings ("Next airing …" from `next_airing_at`); Ended = ended or cancelled. Publishing is gated on the playback window because prod players send no download report.
- Filter option sources: Target → existing Channels/Groups fetchers (check `channels` feature); Tag → existing tags service; Created by → `created_by.id` from rows or the users endpoint (check what exists; hide the filter if nothing joins cleanly — plan §2).
- develop's largest tenant `22222222-2222-2222-2222-222222222222` has 124 Programs (114 ended, 9 draft, 1 live `zz-ux-66-guard-test` — a pre-existing fixture, do not clean up). prod's largest has 34.
- Frontend proxies to the deployed backend unless `CORE_API_URL` is set and the dev server restarted. Hard-navigating to a nested route renders an empty main (memory `thunder-one-hard-nav-empty-main-bug`) — click through the sidebar.
- Core tsc is never clean; Thunder One `tsc` should be — gate on changed files anyway.
- Frontend test style: `*.check.mts` with `node:assert`, run `node <file>.check.mts`, no runner. Only add one for non-trivial pure logic (e.g. query-param building, row→badge/actions mapping).

## Constraints / working agreement reminders

- UI says Program; code/API/schema say Publication. Routes stay under `/media-workspace/publications`.
- Files ≤ 300 lines, no `any`, JSX one element per line, Server Component default and `'use client'` only at leaves (AGENTS.md / CLAUDE.md §8).
- Every push and prod write is R0: stop and list it. **Ask before every browser verification** (run it / checklist for the user / skip). Unverified → PR stays Draft; the user marks ready. Ask Thai/English before opening a PR (Core PRs so far: Thai). Commit only when told; check the branch before every commit; no AI attribution in commits or PRs.
- New dependency → propose and wait for a yes.

## Later in the plan (unchanged)

BE-0b (`now_next_get`, `schedule_conflicts` newest-Job rule) after BE-1 and before BE-2/FE-B; then BE-2 → FE-B → FE-C/FE-D, BE-3 → FE-E. Open follow-ups: rotate the JWT/app key pasted in chat (skipped by the user for now); Layout Publish Changes through the UI is untested; `describePublishChangesError` has no check file.
