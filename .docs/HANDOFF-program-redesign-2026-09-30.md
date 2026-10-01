# Handoff — Program redesign · 2026-09-30

## Intent

Design for the Program (Publication) redesign is settled. Next session starts execution at **BE-0**,
then BE-1 → FE-A. Sonnet is fine for execution; switch back to Opus on any new design fork or R0.

## Read first (in this order)

1. `docs/program/progress-program.md` — checklist; update it as items finish.
2. `docs/program/plan-program-redesign.md` — scope per sub-project, what is disabled/hidden.
3. `docs/adr/0080-published-programs-are-edited-in-place.md` — edit-in-place, display-status table, poll prerequisite.
4. `../Thunder_Core/docs/adr/0014-custom-dates-recurrence-on-publication-schedules.md` (BE-3 only).
5. Mockups: `docs/program/figma-mockup/Program NN- Media Workspace.jpg` (01 list, 02 lifecycle/actions,
   03 edit, 04 navigation flow, 05 playlist, 06 layout, 07 target, 08–12 schedule presets).

## State

- FE repo on branch `feat/program-redesign` (from `origin/dev` @ `b657314`). Docs committed as `docs(program): …` (not pushed).
  Commit `b908a7c`: `CONTEXT.md`, `.gitignore`, `docs/adr/0080-…`, `docs/program/` (plan, progress, 12 JPEGs).
- Thunder_Core checkout is on **`main`** with ADR 0014 **untracked** — do not stage it with BE-0;
  it belongs on the BE-3 branch.
- No code written, no migration applied, no DB writes.

## BE-0 — first task

- Bug (confirmed on develop via `pg_get_functiondef`): `media_job_poll` filters
  `WHERE pjt.device_id = v_asset_id` before `DISTINCT ON (pub.id) ORDER BY pj.created_at DESC`, so a
  device removed from the newest Job keeps playing an older Job's snapshot.
- Fix: newest Job per Publication first, then device membership — the rule
  `media_core.media_asset_on_air` already uses (`20260918100000_media_transcode_jobs_and_rpcs.sql:66-73`).
- Branch off Thunder_Core `develop`. Edit from the live function def, not an old migration file.
- **R0 stop before apply:** list devices/Programs that would change snapshot after the fix.
- Develop project ref `ftfmokgphewzyxzwjitv` (Core `.env` active URL); prod `sfiefevtxalqjizdkcsw`.

## Constraints / gotchas

- UI says Program; code/API/schema say Publication. Routes stay under `/media-workspace/publications`.
- Media Workspace UI: `src/components/ui/lovable/` primitives + `globals.css` tokens only (ADR 0075/0076).
- Not-built UI → disabled with "เร็วๆ นี้"; uncomputable numbers → hidden, never faked.
- BE-2: only `upsert` checks `expected_revision`; call it first or check revision at row lock.
- Frontend proxies to the deployed backend unless `CORE_API_URL` is set and the dev server restarted.
- Ask before every browser verification; unverified → PR stays Draft. Ask Thai/English before opening a PR.
