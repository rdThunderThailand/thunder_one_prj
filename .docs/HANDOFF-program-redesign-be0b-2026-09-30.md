# Handoff — Program redesign, BE-0b next · 2026-09-30 (session 5)

## Intent

FE-A is **merged** (thunder_one_prj#180 → `dev`, 2026-09-30 07:06Z, merge commit `5f7821d`). Next is **BE-0b** in Thunder_Core, then BE-2 → FE-B. These touch prod-facing SQL, so this is a **design/R0 session → Opus**. Switch to Sonnet only after a spec is settled and no design fork remains (e.g. FE-B UI, once BE-2's contract is fixed).

## Read first (in this order)

1. `docs/program/progress-program.md` — BE-0 note on **BE-0b**, then BE-2.
2. `docs/program/plan-program-redesign.md` — §1 table (BE-0b/BE-2 rows), §5 open risks.
3. `docs/adr/0080-published-programs-are-edited-in-place.md` — "Prerequisite" (newest-Job rule) and §2-4 (the update-in-place flow BE-2 implements).
4. `.docs/SESSIONLOG-fea-programs-list-2026-09-30.md`, `.docs/SESSIONLOG-be0-poll-newest-job-2026-09-30.md`.

## State

- **thunder_one_prj**: `feat/program-redesign` is merged; checkout is still on it. `git checkout dev && git pull` before any new branch. FE-A code is on `dev`, **not on `main`**.
- **Thunder_Core**: local checkout is on `feat/program-list-read` (merged) — `git checkout develop && git pull` first. BE-1 route + RPC are on `develop` and applied to develop + prod DB; **prod `main` route is still the old one**, so the new list page cannot work on production until `develop → main` is promoted (R0, own decision). `docs/adr/0014-…` is untracked there and belongs to BE-3.
- **develop DB fixtures:** `zz-ux-66-guard-test` was **Ended** during FE-A verification (cannot restart) — tests that needed a Live Program must create one. Its old test-device setup for BE-0 no longer exists. Every other `zz-*` row is untouched.
- Dev servers :3000 / :3001 may still be running; Core :3001 sits on the old feature branch (same code as `develop` now).

## What to do next (recommended order)

1. **BE-0b** (own issue + Draft PR → Core `develop`, branch off `develop`). Move to the newest-Job rule: `media_now_next_get` (feeds FE-B preview) and `media_schedule_conflicts` (edit-in-place removes devices, so stale Job rows would raise false conflicts). Low priority, separate issue: `media_screen_get`, `airtime_explain`, `retry_targets`.
   - Dump live function source with `pg_get_functiondef` from develop and edit that, not an old migration file. `DROP FUNCTION IF EXISTS <old signature>` first if a parameter changes; re-`REVOKE … FROM PUBLIC` / `GRANT` to the original roles after (CREATE FUNCTION grants PUBLIC).
   - **R0 gates:** show what a real diff changes (rows/devices affected) before applying to develop, again before prod. Compare `prosrc` md5 with the file after applying. Supabase MCP writes may be denied in auto mode — stop and ask, don't route around.
   - Verify via HTTP, not only SQL.
2. **BE-2** `media_publication_update_published` (plan §1; checklist in progress-program.md). This defines a **public API contract** (PATCH vs POST route, error mapping, `expected_revision` semantics) → grill it (`grill-with-docs`) and record in ADR if any fork appears, before writing SQL.
3. **FE-B** Edit page (frames 03/04) after BE-2 — replaces FE-A's temporary Open/View links that point to the old detail page.

Not urgent but decide soon: **promote Core `develop → main`** and **FE `dev → main` (v0.5.0?)** so the new list works on prod — the two must ship together (release rules in `docs/agents/versioning.md`; tag push is R0).

## Facts to carry

- FE-A files live in `src/features/media-workspace/publications/`: `publication-list-query.ts`, `publication-list-display.ts` (+ `*.check.mts`), `components/Publications{ListPage,Table,FilterBar}.tsx`, `PublicationRowActions.tsx`, `PublicationKpiCards.tsx`.
- **Draft has no Duplicate**: `media_publication_duplicate` returns 400 for a draft (plan §2 listed it; deviation is documented in the PR and progress doc). If FE-B/BE-2 wants Duplicate on Drafts, that is a backend change + design call.
- **Created by filter is hidden**: no user list readable by this role; API supports `created_by`. Follow-up only if wanted.
- Row payload has no recurrence, so the list shows date range only (no daily time / all-day). FE-B/FE-E get full schedule from the detail read.
- Radix `Select`/`DropdownMenu` do not open on a synthetic click in browser automation — dispatch `PointerEvent('pointerdown')` on the trigger, then `pointerdown/pointerup/click` on the option. Client-side nav (`window.next.router.push`) instead of hard-nav (memory `thunder-one-hard-nav-empty-main-bug`). The component keeps filter state across same-route pushes.
- Not verified in FE-A (listed in the PR): Publishing/Scheduled badges on real rows, Target = Group with results, Layout row placeholder, run against the *deployed* backend, mobile/tablet viewports.
- `.docs/` is gitignored — session logs and handoffs stay local.

## Constraints / working agreement reminders

- UI says Program; code/API/schema say Publication. Files ≤ 300 lines, no `any`, JSX one element per line, Media Workspace uses `globals.css` tokens + `src/components/ui/lovable/` primitives only.
- Every push, prod write, and tag push is R0: list it, wait for yes. **Ask before every browser verification** (run it / checklist / skip). Unverified → PR stays Draft; the user marks ready. Ask Thai/English before opening a PR. Commit only when told; check the branch before every commit; no AI attribution in commits/PRs.
- Core tsc is never clean (gate on changed files); Thunder One `tsc` should be clean.
- Open follow-ups: rotate the JWT/app key pasted in chat earlier (user skipped); Layout Publish Changes through the UI untested; `describePublishChangesError` has no check file.

## Later in the plan (unchanged)

FE-C (Change Playlist/Layout) and FE-D (Change Target) after FE-B; BE-3 (custom-dates recurrence, Core ADR 0014) → FE-E (Edit Schedule).
