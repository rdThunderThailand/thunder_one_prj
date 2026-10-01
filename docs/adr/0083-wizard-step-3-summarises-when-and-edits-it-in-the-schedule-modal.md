# 0083 — Wizard step 3 summarises "When" and edits it in the Edit Schedule modal

Status: accepted (2026-10-01, grilling session on #199; plan reviewed twice). Amends ADR 0082 §1 (the wizard renders the schedule fields inline) and **supersedes ADR 0082 §6** (Playback Pattern stays out of the wizard). Plan: `docs/program/plan-wizard-step3-summary-modal.md`.

## Context

Create wizard step 3 ("Program") is three equal columns — Where / When / How — plus the 19rem Program Summary rail (Figma frame 3, `plan-frame3.md`). Since ADR 0082 the When column renders the same `SchedulePresetList` / `ScheduleConfigFields` / `SchedulePreviewPane` as the Edit Schedule modal, which lays them out as `14rem | 1fr | 22rem` in a `max-w-6xl` dialog (~1150px). In the wizard the column is ~222px at a 1440px viewport. Measured on `localhost` (#199):

- Schedule Preview rows are 244px in the 222px column (22px overflow, name chip clipped).
- The Custom days weekday header runs together ("MonTue WedThu"); at 1024px the day numbers overlap.
- "How to Play" is nearly empty for a Layout or Playlist ("ตามการตั้งค่าของ …" + a link to the editor).

The owner also wants a Playlist's playback pattern changeable on this step instead of leaving the wizard for the Playlist editor.

Facts about the playback pattern:

- Sequential / Shuffle is the bound Playlist's own `play_mode`, not a Program field. `setPlaylistPlayMode` writes it to the Playlist; the Edit page does this on Apply through `PlaybackPatternField` (ADR 0080 §6).
- `GET /media/playlists/{id}/affected-programs` counts the **active or scheduled** Programs using the Playlist; drafts are not counted.
- Other Programs pick the new pattern up on their next Publish Changes (ADR 0078), not immediately.

## Decision

1. **Step 3 keeps three boxes and the rail; the boxes are unequal.** Where is the widest (about `1.4fr | 1fr | 1fr`), because choosing Channels is the step's main task and stays inline. The three boxes sit side by side only from 1400px; below it they stack in one column. With the 19rem rail and the sidebar open, three columns measure ~110–155px at 1024px and 186px at 1280px (the When box overflows by 5px), against 233px at 1440px (measured on `localhost`).
2. **When is a read-only summary with an Edit button.** The box shows the schedule through `describeSchedule` (the formatter the rail, Review and the Edit page already use), keeps the priority-conflict banner, and shows the `validateDraft` messages when the draft is invalid. **Edit** opens `EditScheduleModal`, the same dialog the Edit page uses; Apply writes the result back to the draft. The preset list, fields and preview live only in the modal.
3. **The modal starts from the wizard's `ScheduleDraft`, not only from a stored schedule**, so an invalid draft (for example a resumed One-time draft whose date has passed) opens with its own values and errors instead of a fresh default. Apply returns the stored schedule and the wizard reads it back through `scheduleToDraft` — the same normalisation a Save → re-open already applies, so a same-day Continuous becomes One-time at Apply (ADR 0082 §4) and the summary, the modal's preset, the rail and Review always agree.
4. **Playback Pattern is editable in the wizard, in the How to Play box, for a Playlist Program.** It reuses `PlaybackPatternField` with its own Apply. Apply writes the Playlist's `play_mode` immediately, as on the Edit page:
   - The affected-Program count is **fetched again at Apply**, not reused from when the field loaded. 0 → write; more than 0 → a confirmation naming the count; the count request fails → show an error and do not write. This narrows, but does not close, the window between the check and the write; Core offers no atomic check-and-write and none is added here.
   - The radios and Apply are locked from the count request until the write settles; the write uses the Playlist id and mode captured when Apply was pressed.
   - Next to Apply, always (also when no dialog appears): the change is saved to the Playlist immediately and is not undone by abandoning this draft.
   - After a successful write the step's content preview reloads the Playlist, so the rail plays the new pattern without leaving the step.
   - Layout and Media Programs are unchanged.
5. **The modal opened from the wizard hides its Playback Pattern section**, so the pattern has one place to change in the wizard.
6. **Layout Programs: each Zone's play mode is editable in How to Play** (added 2026-10-01, second grilling round). How to Play lists every Zone read-only — name, cycle length, play mode, repeat, own media fit, muted — and each Zone bound to content gets a Sequential / Shuffle choice. One **Apply** for the whole Layout:
   - Same rule as item 4: a fresh `affected-programs` count for the Composition, a confirmation when it is above 0, no write when the count fails, the "saved immediately, not undone by abandoning this draft" note.
   - The write re-reads the Composition (`fetchComposition`) at Apply, changes only the play mode of the Zones the operator changed, and saves through `setCompositionZones` with the revision it just read. A revision conflict is reported and nothing is overwritten.
   - Zone playback lives on the Composition's Zone binding and wins over the Zone Playlist's own (`activate` copies `composition_zones.playback` into the snapshot), so this writes the Layout only, never a Playlist.
   - Repeat, start from, media fit and muted stay read-only here; they remain in the Layout editor.

## Rejected

- **Rows instead of columns** (Where, When and How each full width, rail sticky; built and reviewed on `localhost`): fixes the widths, but the page becomes a long scroll, which the owner did not want.
- **Tabs or accordion for Where / When / How**: hides the other sections' state and needs per-tab validation state.
- **Rows with no rail on step 3**: loses the content preview while scheduling; the rail was just fixed to preview every content type.
- **Keep Figma frame 3's equal columns and only tune widths**: three equal columns in ~820px stay under ~260px each, so the overflow stays.
- **Playback Pattern kept in the draft and written on Publish Now**: needs a new draft field (a localStorage key bump), the server has nowhere to keep it, so a draft re-opened from the Programs list loses it, and other Programs are still changed at Publish — the same effect, later.
- **A per-Program play mode that overrides the Playlist's**: the real fix for "change only this Program", but a Thunder_Core change (column, RPCs, player) outside #199.
- **Playback Pattern in both the modal and How to Play**: two controls for one value.
- **Return the draft from the modal unchanged (`onApplyDraft`)**: keeps a same-day Continuous as Continuous until Save, but the summary, rail and Review format the stored shape and would already say One-time — two labels for one draft until Save normalises it anyway.
- **Reuse the affected-Program count loaded with the field**: stale by Apply time; a Program published meanwhile would skip the confirmation.
- **Layout How to Play read-only** (built first): the owner wanted the change on this step, like the Playlist.
- **Apply per Zone**: `set_zones` replaces every Zone at once, so per-Zone Apply means several writes and revisions racing each other.
- **Write with the revision loaded with the preview**: would overwrite edits made in the Layout editor since the step opened.
- **Every Zone playback field editable**: grows the wizard into a Layout editor; play mode matches what the Playlist side offers.

## Consequences

- An unpublished draft can now change a shared Playlist. Mitigations: explicit Apply, a fresh count with a confirmation when it is above 0, a permanent "saved immediately" note, and published Programs only take the new pattern when a Publish Changes covers them (the Playlist editor's bulk Publish Changes republishes every affected Program, including those reaching the Playlist through Layout Zones). Abandoning the draft does not undo a pattern already applied.
- `ScheduleStep` shrinks to the summary; the modal gains two optional props (initial draft, hide Playback Pattern). The Edit page's use of the modal is unchanged.
- The Apply decision (fresh count → write / confirm / refuse, cancel, failure keeps the selection) lives in one React-free function with a runnable check, like `attemptNext`.
- Wizard step 3 still does not match Figma frame 3 (already noted in ADR 0082).
- A Layout Apply rewrites every bound Zone's playback (the RPC full-replaces). Zones whose stored playback is null are written with the defaults Core already applies (`sequential`, `loop`, `first`, `fit`, not muted) — the same as any Layout editor save — so what airs does not change for Zones the operator did not touch.
- No Core change and no localStorage shape change.
