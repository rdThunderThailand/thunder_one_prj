# Program Edit subtitle and Date range calendar — 2026-10-05

## Scope and decisions

- Owner approved the standalone proposal, then authorized read-only browser acceptance for this verification point.
- Branch: `codex/program-edit-date-range`, based on freshly fetched `origin/dev` after #215.
- Keep Lovable primitives and existing application tokens. No dependency, API, schema, business-rule, or publication-flow changes.
- Add the staged Layout/Playlist name or media item count and direct Channel/Group/Device counts to the existing topbar subtitle. Do not invent categories or infer Group membership totals.
- Keep the single Publish action, existing Channel initials, and existing Change Target layout.
- Add a two-month inclusive Date range calendar only to Program Edit. An opt-in prop defaults off for the shared Create wizard caller. Retain native date inputs and existing validation/daily time fields.
- Reuse the existing custom-date month generation/navigation logic through `calendar-month.ts`.
- First calendar click creates a one-day range so `presetOf` does not switch to Every day and unmount the calendar. Second click completes a range in either order. Calendar clicks retain the visible month pair; keyboard edits to the start input recenter it.

## Executed checks

- `node src/features/media-workspace/publications/calendar-month.check.mts`: passed. Covers leap/non-leap February, Monday-first padding, year boundaries, reverse/same-day range selection, and keeping the Date range preset after the first click.
- Negative control: temporarily expected 28 days for February 2024; the same check exited 1 with `29 !== 28`. Restored the assertion and reran successfully.
- `node src/features/media-workspace/publications/program-edit.check.mts`: passed, including new staged subtitle assertions for Playlist, changed Layout, no targets, and plural Devices.
- `node src/features/media-workspace/publications/schedule-preset.check.mts`: passed.
- `node src/features/media-workspace/publications/schedule.check.mts`: passed.
- Targeted ESLint and `pnpm exec tsc --noEmit`: passed.
- `git diff --check`: passed.
- Initial sandbox `pnpm build` failed fetching Google Fonts. Network-enabled retry and the final build after preserving the visible month pair both passed (exit 0, 107 pages generated).

## Authenticated localhost browser evidence

Chrome artDev, `http://localhost:3000/media-workspace/program/f641d235-1bb4-4d80-b8f4-5a5d626befd3/edit`.

- Topbar showed `Layout: Test Layout 1 · 1 Channel` from the existing Program.
- Change Target retained its existing facets/list/selected-summary layout. Adding Channel for Screen 1 and applying only to local form state updated the subtitle to `Layout: Test Layout 1 · 2 Channels`. Go Back → Discard returned to the list. Reopening showed the original one-Channel subtitle.
- Date range displayed October/November 2026. Selecting November 3 first retained the visible pair and Date range preset; pressing Enter on October 12 completed October 12–November 3 with 23 selected days.
- Start-date keyboard edits updated the calendar to October/November 2027. An end before start displayed validation and disabled Apply Schedule.
- At viewport 390×844, the two months stacked with the same x coordinate. Dialog `clientWidth` and `scrollWidth` both measured 388px. Restored the viewport override afterward.
- Cancel closed the schedule dialog without changing the main form; Publish changes remained disabled.
- Browser tool `fill()` changed the native date field's DOM value without updating React state in this run. It is not counted as input acceptance; actual keyboard ArrowUp/ArrowRight/Tab changes were verified instead.
- Screenshots: `docs/program/acceptance/program-edit-date-range/desktop.jpg` and `docs/program/acceptance/program-edit-date-range/mobile.jpg` (copies of the browser captures in `/private/tmp`).
- No Save, Publish, activation, fixture creation, cleanup, or shared Playlist/Layout edits were performed. Local target application and Discard used the existing form-only handlers. No network interception or DB fingerprint proof was collected in this round.

## Remaining limits

- Create wizard opt-out and Custom days compatibility are traced in source/model checks, not newly browser-tested end to end.
- Full screen-reader/touch acceptance, publication persistence/activation, production deployment, and physical Player playback are not claimed.
- Owner subsequently authorized committing and opening a Draft PR into `dev`, including this SESSIONLOG and screenshot evidence. No version bump, tag, or deployment performed in this scope.
