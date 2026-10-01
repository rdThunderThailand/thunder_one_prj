# Handoff — Program redesign, BE-1 next · 2026-09-30 (session 2)

## Intent

BE-0 is done and live. Next session starts at **BE-1** (list read), which begins with a **design fork**: the API contract. Start on **Opus** to settle the contract, then switch to **Sonnet** to execute BE-1 → FE-A. Switch back to Opus on any new design fork or R0.

## Read first (in this order)

1. `docs/program/progress-program.md` — checklist; BE-0 `[x]`, BE-0b and the BE-1 newest-Job rule are recorded there.
2. `docs/program/plan-program-redesign.md` — BE-1 and FE-A scope, what is disabled/hidden.
3. `docs/adr/0080-published-programs-are-edited-in-place.md` — display-status table (BE-1 must match it), poll prerequisite, "Companion guard".
4. `.docs/SESSIONLOG-be0-poll-newest-job-2026-09-30.md` — what BE-0 did, facts, gotchas, open items.
5. Mockups: `docs/program/figma-mockup/Program 01- Media Workspace.jpg` (list) and `02` (lifecycle/actions).

## State

- **Thunder_Core**: PRs #133 (poll) and #135 (activate guard) merged into `develop`. Migrations applied to develop **and prod**; rollback files in `supabase/rollback/`. The local checkout is still on the merged branch `fix/activate-zero-devices` — `git checkout develop && git pull` first. `docs/adr/0014-custom-dates-recurrence-on-publication-schedules.md` is untracked there; it belongs on the BE-3 branch, never with BE-1.
- **thunder_one_prj**: `feat/program-redesign` has **4 unpushed docs commits** (`b908a7c`, `cdbb03f`, `1521057`, `83eb40a`) on top of the old `dev` (`b657314`). `origin/dev` has since moved (FE #179 merged): `git rev-list` shows 3 behind / 4 ahead. Merge or rebase `origin/dev` before pushing; the docs files do not overlap with #179.
- FE #179 (error copy for "target has no screens") is merged into `dev`, **not yet on `main`**.
- Dev servers: Thunder One on :3000 and Core on :3001 were left running. The Core one was started on the develop DB (`.env`); check its branch (`lsof -p <pid> -d cwd` + `git branch --show-current`) before trusting it.
- No test rows left on develop (`zz-134-*` all deleted). `zz-ux-66-guard-test` and its device `d995d6e8…` (`test-unit`) are pre-existing fixtures — do not clean up.

## BE-1 — what the contract must settle (design fork, recommend an answer for each)

Scope (plan §1): extend `media_publications_list` with server filters (display status per ADR 0080 table, channel/group target, tag, created_by, search), sort, page/limit, `counts_by_status`, thumbnail, delivery summary (`stage3Done/total`, offline, failed), next airing, content name. Route `GET /media/publications` passes the new params.

Questions to settle with 2–3 options + trade-off each (write the rejected ones into the ADR/plan):
1. Display status and counts computed in **SQL** vs in the route.
2. Pagination: offset/limit vs cursor (mockup shows numbered pages, 10/page).
3. `counts_by_status`: one query with FILTER vs separate query; must ignore the status filter but respect the others.
4. Current signature is `media_publications_list(p_tenant_id uuid, p_status varchar)` — adding parameters means `DROP FUNCTION IF EXISTS <old signature>` first, or the old call becomes ambiguous. Re-GRANT afterwards (see memory `create-function-grants-public`).
5. `EXPLAIN` on the largest tenant before merge.

## Facts to carry (do not re-derive)

- **Delivery must be counted from the newest Job only.** `media_publication_get` already does. `media_publications_list` currently has **no** delivery data, so nothing to migrate.
- `media_publication_effective_status(status, starts_at, ends_at)` exists; the ADR 0080 table is stricter (Publishing waits only for online devices; Live uses `recurrence_matches`).
- Every Job is created by `media_publication_activate` with the full current device set; republish/Publish Changes go through it in one transaction.
- Live poll `prosrc` md5 `042084e5…`, activate `3e562f00…` (develop = prod). Older migration files do not match live functions: **edit from `pg_get_functiondef`, never from a migration file.** Write the migration, apply to develop only after approval, dump `prosrc` back and compare.
- `api-utils` maps "not found"/"already" to 404/409 and "Invalid"/"required" to 400 — pick error wording accordingly.
- Core `tsc` is never clean (~127 pre-existing errors): gate on changed files.
- Core Vercel check fails on every PR (Git author lacks Vercel access) — pre-existing, not code.
- Frontend proxies to the deployed backend unless `CORE_API_URL` is set and the dev server restarted (`.env.local` currently has `http://localhost:3001`).
- HTTP testing from the sandbox: plain `curl` is redirected by a hook; use `ctx_execute` (JS `fetch`) with headers `x-api-key`, `authorization: Bearer <user JWT>`, `x-tenant-id`. Ask the user for a fresh develop JWT + app key; the ones from session 2 were pasted in chat and **still need rotating** (JWT expires ~2026-10-01).
- Multi-statement `execute_sql` returns only the last result; run separate calls. Run a test and its cleanup as separate steps (batching once ran the delete before a denied curl).

## Later in the plan (unchanged)

BE-0b (`now_next`, `schedule_conflicts` to the newest-Job rule) goes after BE-1 and before BE-2/FE-B; `screen_get`, `airtime_explain`, `retry_targets` are a low-priority separate issue. Then BE-2 → FE-B → FE-C/FE-D, BE-3 → FE-E.

## Constraints / working agreement reminders

- UI says Program; code/API/schema say Publication. Routes stay under `/media-workspace/publications`.
- Media Workspace UI: `src/components/ui/lovable/` primitives + `globals.css` tokens only (ADR 0075/0076). Not-built UI → disabled with "เร็วๆ นี้"; uncomputable numbers → hidden, never faked.
- Every migration apply, prod write and push is R0: stop and list what will change. Ask before every browser/HTTP verification with data writes; unverified → PR stays Draft. Ask Thai/English before opening a PR (Core PRs so far: Thai). Commit only when told; check the branch before every commit.
- Open follow-ups: rotate the pasted app key/JWT; Layout Publish Changes through the UI is untested; `describePublishChangesError` has no check file.
