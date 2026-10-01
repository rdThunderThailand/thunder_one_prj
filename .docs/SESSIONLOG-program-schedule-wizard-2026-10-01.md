# Session log — #194 PR 2 verification + PR (2026-10-01, s15)

Continues `/tmp/HANDOFF-program-schedule-2026-10-01-s14.md`.

## Done
- Verified the Create wizard on the shared schedule model through the browser (localhost:3000 → Core :3001 → develop DB `ftfmokgphewzyxzwjitv`).
  - Overlap warning: Channel for Screen 2 (live Programs). Count follows the preset (4/4/3/3/none/3/3/4); Review lists the same overlaps.
  - All 8 presets walked; rail and Review fine. Weekends renders "Sun, Sat".
  - Real Publish, Custom days: `zz-wizard-dates` (`e54a8857-ed2e-4cf8-8ae8-c86a4c9bf9d4`), recurrence `{freq: dates, dates: [2026-11-03, 2026-11-10, 2026-11-25], daily 00:00–23:59}`, `ends_at` 26 Nov 00:00 BKK. Detail page "Ends At" = 2026-11-25.
  - Save → re-open from the server (localStorage cleared) for all 8 presets on draft `zz-wizard-roundtrip` (`d9e6a78d-0190-4fc1-94e5-b200e1ccc5ed`): DB shape correct, preset re-highlighted. A repeat Save updates the same draft.
- Opened #199 (step 3 redesign, empty summary preview for Layout, draft resume landing on step 1).
- Pushed `feat/schedule-shared-model-wizard`, Draft PR #200 → `dev` (Thai, `Closes #194`).

## Findings
- Step 3 is too tight: at 1440px each column is ~222px, Schedule Preview rows are 244px (22px overflow, name chip clipped); at 1024px calendar day numbers overlap. Left for #199.
- Program Summary rail has no preview for a Layout (step 2 does). Left for #199.
- Opening a saved draft lands on Step 1; once it landed on Step 5. Left for #199.
- Detail page: Starts At prints `11/3/2026, 12:00:00 AM`, Ends At prints `2026-11-25` — cosmetic mismatch, not filed.
- Test-harness trap: acting on a re-opened draft before the server hydrates overwrites nothing but reads stale local state. Wait for hydration before reading or clicking.
- Browser quirk: `form_input` still skips time inputs; JS `.click()` on preset radios and calendar days works.

## Not verified
- Mobile viewport; fast clicking while a draft is still loading.
- Publish (not just Save) for presets other than Custom days; Detail "Ends At" with other presets (only `schedule-describe.check.mts`).
- No Lovable comparison for the wizard.

## Open / left for the user
- develop test rows, cleanup state after PR #200 merged:
  - Deleted via the app (drafts only): `zz-wizard-roundtrip` (`d9e6a78d…`) and draft `bf579a5b…`.
  - `zz-wizard-dates` (`e54a8857…`): ended (status `cancelled`) through "End program". The app offers no Delete for non-draft Programs (Ended rows only offer Duplicate), so the row stays; delete by SQL only if wanted (R0, list FKs first).
  - `zz-138-layout-a` (`0e0ba676…`) / `zz-138-layout-b` (`f641d235…`): left Live on purpose — they are the repro fixtures for #201. Delete by SQL after #201 is fixed.
  - Keep fixture `a2b2c262…` (same name as the deleted draft — always address by id) and `zz-monthly-ui-19`.
  - Decided not to file an issue for "no Delete on non-draft Programs": ending is the supported path and the row is kept as history.
- Filed #201 (`media_publication_airtime_explain` same-tier gap).
- Base-handoff items 6 (Edit-page edge cases) and 7 (Figma deltas) untouched. Core worktrees `-prefix` / `-be3` unverified as merged.
- claude-mem observer is failing (org disabled subscription access; needs an API key in `~/.claude-mem/settings.json`).
