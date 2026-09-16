# Plan — Frame 3 "Program" (issue #84)

**Spec:** the **Frame 3** section of `docs/publications/ver02/plan-create-wizard.md` (the matrix rows
are authoritative, and the persistence note under the table settles How-to-Play) ·
design `docs/publications/ver02/design/3. program.png` · decisions `docs/adr/0072-*`.

**Goal:** turn step 3 from a plain stack of `ChannelsStep` + `ScheduleStep` into the ver02 frame —
three columns "1. Where to Play" / "2. When to Play" / "3. How to Play", an Additional Settings row
that now owns Priority, and a Program Summary rail.

**Base:** `refactor/schedule-fields` (carries #83, unpushed). Rename to `feat/pubflow-frame3` before
pushing; #83 + #84 open as **one** Draft PR against `dev`.

**Frame 2 is the shape precedent** — `PrepareContentStep.tsx` is a 3-column CSS grid with a rail,
53 lines of layout over existing components. Frame 3 is the same idea with one more column.

---

## What the matrix says vs. what the code actually holds

Three rows of the matrix were written from a reading of the repo that no longer matches. Corrected
here so the executor does not go looking for things that are not there:

| Matrix says | Reality | Consequence |
|---|---|---|
| Program Summary rail: "ADAPT `PreviewPanel.tsx` / `ContentSummaryPanel.tsx`" | **`PreviewPanel.tsx` does not exist** anywhere in `src/`. **`ContentSummaryPanel.tsx` is dead code** — defined, exported, imported by nothing. | The rail is adapted from **`ScheduleStep.tsx:455-562` ("Publication Summary")**, which already carries every row the design draws. `ContentSummaryPanel.tsx` is **deleted** (§8: no dead code). |
| Transition per item: "REUSE `SelectedAssetList.tsx` — the wizard just never passes `setAssetTransition`" | `SelectedAssetList` accepts `setAssetTransition` only through its `SelectionOverride` prop. **`usePublicationDraftStore` has no such action** (`setAssetDuration` and `moveAssetItem` exist; `setAssetTransition` does not). | Task 1 adds the store action. `DraftAssetItem.transition` and `draft-mapping.ts:69` are already in place, so nothing below the store changes. |
| Where / When columns: "ADAPT `ChannelsStep` / `ScheduleStep`" | Both are **page-shaped**: their own `<h1>`, their own `lg:grid-cols-3`, and their own right rails (Selected Channels + Channel Status donut; Schedule Preview + Publication Summary). | Adapting means *un-making a page*, not adding props. Both shed their heading, grid and rails and become one column's body. |

`MiniCalendar` + the conflict detail block leave step 3 with no loss: `ReviewPublishStep.tsx:487`
already renders `MiniCalendar` and `:333-380` already renders the conflict list on frame 4. Only the
*early* signal while picking dates would be lost, so the When column keeps a one-line count banner.

---

## Decisions taken (2026-09-10)

### D1 — the four schedule-type cards stay; only their labels and styling change

The design draws **Play Mode: Always | Schedule | Event(disabled)**, which would have meant deriving
`schedule_type` from the fields instead of from a card. **Decided against.** The four cards
(`publish-now` / `schedule-later` / `recurring` / `custom-range` → `now` / `later` / `recurring` /
`range`) keep owning `scheduleForm.schedule_type` exactly as they do today. `schedule.ts`,
`draft-mapping.ts`'s `CARD_BY_SCHEDULE_TYPE` / `SCHEDULE_TYPE_BY_CARD`, and `mock-data`'s
`scheduleTypes` are **untouched by this ticket**.

What this costs: the frame does not match the design's three-button Play Mode row, and the design's
"Always" is expressed as `Publish Now` with no expiration. Accepted deliberately — the alternative
moved who computes a stored field, which is not worth it for a layout ticket.

What still happens in Task 3: the card row is restyled to fit one narrow column, the labels are
re-cut to the design's voice, and a fifth **Event** card is added DISABLED.

### D2 — "No end date" is disabled while weekdays are selected

`validateScheduleForm` requires an end for `recurring` (`schedule.ts:110-113`), and the design offers
"No end date" unconditionally. Where the two meet, the checkbox is `disabled` with a `title`
explaining why, rather than letting the operator tick it into a validation error. No business rule
changes.

In practice the collision is narrow: the Expiration toggle only renders for `now` / `later` today
(`ScheduleStep.tsx:239`), and `recurring` / `range` render a required `DateRangeField` instead. The
guard matters only if Task 3 adds a No-end-date checkbox to `range`.

Relaxing the rule so a weekly schedule can run with no end (`ends_at: null`) is a separate ticket —
`scheduleFormToPayload` would emit it, but nothing here verifies Core accepts that shape.

---

## File structure

**Create**
- `components/ProgramStep.tsx` — frame shell: 3-column grid + Additional Settings row + rail. The
  step's only export; mirrors `PrepareContentStep.tsx`.
- `components/WhereToPlayPanel.tsx` — Screens / Channels / Groups tabs; Channels renders
  `<ChannelsStep>`, the other two are DISABLED bodies.
- `components/HowToPlayPanel.tsx` — the three content branches.
- `components/ProgramSummaryRail.tsx` — the right rail.

**Modify**
- `store/usePublicationDraftStore.ts` — add `setAssetTransition`.
- `components/ScheduleStep.tsx` — page → When column (566 → ~300 lines; §8 ceiling is 300).
- `components/ChannelsStep.tsx` — page → Channels-tab body (311 → ~220).
- `components/BasicInfoForm.tsx` — remove the Priority field (store field untouched).
- `components/CreatePublicationPage.tsx:487-507` — render `<ProgramStep>`.

**Delete**
- `components/ContentSummaryPanel.tsx` — dead code, superseded by `ProgramSummaryRail`.

**Untouched by D1:** `schedule.ts`, `schedule.check.mts`, `draft-mapping.ts`, `mock-data.ts`.

Additional Settings is ~40 lines and has one caller; it lives inside `ProgramStep.tsx` rather than
in a file of its own.

## Global constraints

- Disposition vocabulary is the matrix's: SHIP / READ-ONLY / DISABLED / DROP. **DISABLED renders,
  greyed, with a `title` saying it is not built yet** — the precedent is `ScheduleStep.tsx:270-343`
  and `PrepareContentStep.tsx:87-107`.
- **No new store field, no payload change, no backend call, no migration.** Anything that seems to
  need one is a fork — stop and ask (§1).
- Files ≤ 300 lines, no `any`, no dead code, `'use client'` on leaves only (§8).
- `pnpm exec tsc` is never clean (~5 pre-existing `furthestStep` errors) — gate on changed files.
- No unit runner. Logic checks are `*.check.mts` with `node:assert`, run `node <file>`.
- Thai UI copy, English identifiers.

---

## Task 1 — `setAssetTransition` on the draft store

**Files:** modify `store/usePublicationDraftStore.ts`

- [ ] **1.1** Add to the actions interface beside `setAssetDuration` (line ~92):
  `setAssetTransition: (mediaAssetId: string, transition: "cut" | "fade") => void;`
- [ ] **1.2** Implement beside the `setAssetDuration` implementation (line ~148), mirroring it —
  map over `assetItems`, patch the matching `media_asset_id`, leave the rest untouched.
- [ ] **1.3** `pnpm exec tsc` — no new error in the changed file. Commit.

No check: it is a one-line mirror of an existing action with no branching (§ ponytail).

## Task 2 — Frame shell, and Priority moves in

The frame becomes visible here, still filled with the un-reshaped `ChannelsStep` / `ScheduleStep`.

**Files:** create `components/ProgramStep.tsx` · modify `components/BasicInfoForm.tsx`,
`components/CreatePublicationPage.tsx`

- [ ] **2.1** `ProgramStep.tsx` — same grid idiom as `PrepareContentStep.tsx:32`: three equal
  columns plus a rail (`lg:grid-cols-[repeat(3,minmax(0,1fr))_19rem]`), each column a `<Card>` with
  a numbered header ("1. Where to Play" / เลือกช่องทาง · "2. When to Play" / กำหนดช่วงเวลา ·
  "3. How to Play" / ตั้งค่าการเล่น). Below them, full width across the three columns, an
  `Additional Settings (optional)` card. Props mirror what `CreatePublicationPage` passes today
  (`channels`, `assets`, `conflicts`, `checkingConflicts`, `conflictsError`, `aspectRatio`,
  `fitCheckFailed`, `showFieldErrors`).
- [ ] **2.2** Additional Settings, inside `ProgramStep.tsx`: the Priority `<select>` lifted verbatim
  from `BasicInfoForm.tsx:106-124` (colour dot + `priorities` + `ChevronDownIcon`), reading and
  writing the same `basicInfo.priorityId`. Beside it, DISABLED **Playback Behaviour when offline** —
  three radios (Play last cached content / Show offline message / Do nothing), first one checked,
  `disabled` + `title="ยังไม่เปิดใช้งาน"`.
- [ ] **2.3** Header row: a DISABLED **Load from Template** control next to the step title.
- [ ] **2.4** Delete the Priority `FieldWrapper` from `BasicInfoForm.tsx`; drop `priorities` and
  `ChevronDownIcon` from its imports if nothing else uses them. `priorityId` stays in
  `BasicInfoState` and in the store.
- [ ] **2.5** `CreatePublicationPage.tsx:487-507` — replace the `flex flex-col gap-6` stack (and its
  comment) with `<ProgramStep … />`.
- [ ] **2.6** `pnpm exec tsc` + `pnpm exec eslint` on changed files. Commit.

## Task 3 — "2. When to Play" column

**Files:** modify `components/ScheduleStep.tsx`

- [ ] **3.1** Remove the page shell: the `<h1>Schedule Settings</h1>` block and the
  `grid lg:grid-cols-3` wrapper. What remains is one column.
- [ ] **3.2** Delete the **Schedule Preview** card (`:352-453`, `MiniCalendar` + conflict detail) and
  the **Publication Summary** card (`:455-562`). Frame 4 already renders both. Replace the conflict
  signal with one line under the fields, shown only when `conflicts.length > 0`: the count, amber,
  no detail — detail lives on frame 4. Keep the `checkingConflicts` / `conflictsError` props for
  that line; drop the now-unused imports (`Image`, `Link`, `MiniCalendar`, `usePlaylistPreview`,
  `usePreviewUrls`, `isVideoPreview`, `publicationTypeIcons`, `priorities`, `publicationTypes`,
  `summarizePriorityConflicts`) — Task 6 takes over what they fed.
- [ ] **3.3** **Play Mode (per D1: the four cards stay).** Keep `scheduleTypes`,
  `SCHEDULE_TYPE_BY_CARD` and the existing onClick verbatim. Restyle the row for a narrow column —
  `grid-cols-2` already fits — re-cut the labels to the design's voice (Thai sublabel stays), and
  append a fifth **Event** card, `disabled` with `title="ยังไม่เปิดใช้งาน"`, styled like the others
  but inert. Header the block **Play Mode** instead of *Schedule Type*.
- [ ] **3.4** Field order and copy per the design, reusing the #83 components as they are:
  `DateTimeInputs` for the start, `DateRangeField` for the end on `range` / `recurring`, and the
  Expiration toggle on `now` / `later` relabelled **No end date** (inverted: ticked = no end).
  Per **D2**, that checkbox is `disabled` with a `title` whenever `days.length > 0`.
- [ ] **3.5** **Time**: the existing `TimeWindowField` for `recurring`, prefixed by the design's
  `Every day` label, plus an **All day** checkbox that sets `daily_start`/`daily_end` to
  `00:00`/`23:59`.
- [ ] **3.6** **Advanced Schedule** — the existing `advancedOpen` disclosure, now also holding
  `WeekdayChips` and `TimezoneSelect` alongside the DISABLED Publish Order / Delay block already
  there. Default it **closed** (`useState(true)` today) so the column matches the design.
- [ ] **3.7** File is ≤ 300 lines. `tsc` + `eslint` on changed files. Commit.

## Task 4 — "1. Where to Play" column

**Files:** create `components/WhereToPlayPanel.tsx` · modify `components/ChannelsStep.tsx`

- [ ] **4.1** `WhereToPlayPanel.tsx`: three tabs — **Screens** (DISABLED, `target_type: "device"` is
  typed but never emitted), **Channels** (active), **Groups** (DISABLED, the entity does not exist).
  A disabled tab is not clickable and carries `title="ยังไม่เปิดใช้งาน"`; the body renders
  `<ChannelsStep>` unconditionally since Channels is the only reachable tab.
- [ ] **4.2** `ChannelsStep.tsx`: delete the `<h1>Select Channels</h1>` block (the column header
  replaces it) and the `grid lg:grid-cols-3` wrapper, so everything stacks in one column.
- [ ] **4.3** Delete the three dead `All Types / All Status / All Locations` selects
  (`:131-141`, `ponytail`-commented as decorative) and the inert `More Filters` button beside them —
  matrix says DROP, delete rather than port. Drop `FilterIcon` / `ChevronDownIcon` from the imports
  if unused after.
- [ ] **4.4** Delete the grid/list toggle (`:103-118`) and the `view` state with it, and render the
  cards one per row — a 4-across grid in a third of the width is not a view. The category tab row
  stays.
- [ ] **4.5** Footer per the design: `{n} channel(s) selected` with a `Clear` link, keeping the
  existing `Selected Channels` list and the `Channel Status` donut stacked below it (matrix ships
  both). The geometry-fit warning card stays where it is.
- [ ] **4.6** `tsc` + `eslint` on changed files. Commit.

## Task 5 — "3. How to Play" column

**Files:** create `components/HowToPlayPanel.tsx`

Branch on `basicInfo.publicationType` — three bodies, one component.

- [ ] **5.1** **Loose media** (image / video):
  - `<SelectedAssetList>` with a `selection` override that passes the store's `assetItems`,
    `toggleAssetItem`, `setAssetDuration`, `moveAssetItem` **and the new `setAssetTransition`** —
    that one prop is what turns on the per-item Transition select and, with the existing up/down
    arrows, is the whole of "item order + per-item transition". Pass `bare` so it does not draw a
    second card border inside the column's `<Card>`.
  - **Play Order** and **Repeat**: READ-ONLY rows stating the player's effective defaults —
    `Play in Order (เล่นตามลำดับ)` and `Repeat All (วนซ้ำทั้งหมด)` — each with a small
    `ค่าเริ่มต้นของเครื่องเล่น` label. **Not selects, not disabled selects** — rendering an
    editable-looking control for a value nothing stores is what the persistence note forbids.
  - **Transition duration** and **Audio** (toggle + volume slider): DISABLED, per the matrix.
- [ ] **5.2** **Playlist branch:** the Playlist's own play mode / repeat / transition, READ-ONLY,
  with a link to `/media-workspace/playlists/{playlistId}`. No new fetch — `usePlaylistPreview`
  already returns the whole `PlaylistDetail`, and

  ```ts
  const { playback } = decodeMetadata(playlist?.metadata); // from @/features/media-workspace/playlists
  ```

  yields `{ playMode, repeat, startFrom, defaultTransition, transitionDuration }`
  (`playlists/metadata.ts:123-131`, defaults `sequential` / `loop` / `first` / `fade` / 1 from
  `playlist-editor-state.ts:19`). Render those five values as the read-only rows.
- [ ] **5.3** **Composition branch:** per-zone values are the Zone's own (ADR 0064) — state that
  playback follows the Layout's zones and link to `/media-workspace/layouts/{compositionId}`. No
  per-zone table; frame 3 is not a Layout editor.
- [ ] **5.4** Empty state when no content is selected, matching `PrepareContentStep.tsx:52-56`'s tone.
- [ ] **5.5** `tsc` + `eslint` on changed files. Commit.

## Task 6 — Program Summary rail

**Files:** create `components/ProgramSummaryRail.tsx` · delete `components/ContentSummaryPanel.tsx`

- [ ] **6.1** Move `ScheduleStep.tsx`'s former **Publication Summary** card (thumbnail + `<dl>`) into
  `ProgramSummaryRail.tsx`, regrouped as the design draws: a preview thumbnail, then **Content**
  (name + type badge), **Where to Play** (selected channel names), **When to Play** (date range,
  daily window, all-day), **How to Play** (the same read-only values column 3 shows). Keep the
  existing Priority and Tags rows; keep the `isMismatch` warning and the conflicts row.
- [ ] **6.2** Reuse the thumbnail source the old card used (`usePreviewUrls` + `isVideoPreview` +
  `usePlaylistPreview`) — moved, not rewritten.
- [ ] **6.3** Render it as the fourth grid column in `ProgramStep.tsx`.
- [ ] **6.4** `git rm src/features/media-workspace/publications/components/ContentSummaryPanel.tsx`.
  Confirm with a grep that nothing imports it (it is currently imported by nothing).
- [ ] **6.5** `tsc` + `eslint` on changed files. Commit.

## Task 7 — Gate, verify, write up

- [ ] **7.1** `pnpm exec tsc` — compare against the ~5 pre-existing `furthestStep` errors; **no new
  error in a changed file**. If `.next/dev/types` is stale after a route change, `rm -rf` it first
  or `tsc` will lie.
- [ ] **7.2** `pnpm exec eslint` on every changed file, clean.
- [ ] **7.3** `node` each `*.check.mts` under `publications/` (none should have changed, so this is
  a regression sweep).
- [ ] **7.4** Confirm every file touched is ≤ 300 lines.
- [ ] **7.5** **Ask the user before verifying in the browser** (§3): run it via the Browser pane /
  hand over a checklist / skip. The dev server on `:3000` is the user's — open it with
  `preview_start({url})`, never `{name}`; login is the user's to do.
  Checklist when it runs: for each of the three branches (media / playlist / layout) — step 3 draws
  four columns; all four Play Mode cards still select their own `schedule_type` and the right fields
  appear for each; the No-end-date checkbox is disabled once weekdays are set; Priority is on step 3
  and gone from step 2, and its value still reaches the Review summary; on loose media the per-item
  Transition select appears and its value survives Back→Forward; every DISABLED control is inert
  with a title; the rail tracks each edit.
- [ ] **7.6** Delete the leftover test draft **"zz schedule refactor test"** (image, 0 channels,
  unpublished) from Manage Publications → Drafts, plus anything this session created.
- [ ] **7.7** `.docs/SESSIONLOG-ver02-frame3-<date>.md` (new file, `git add -f` — `.docs/` is
  gitignored and force-adding is the repo convention). Report per layer and name what was not
  verified.
- [ ] **7.8** Rename the branch to `feat/pubflow-frame3`. **Ask before pushing.** One Draft PR for
  #83 + #84 against `dev`; ask Thai vs English for the body; Claude never marks it ready. Issues
  close manually.

---

## Not in this ticket

Editable Play Order / Repeat for loose media (needs a `DraftAssetItem` field, `draft-mapping.ts`,
a Core RPC writing `playlists.metadata`, and a migration) · the Playlist / Composition **category**
filter contract · the design's three-button Play Mode row and the `schedule_type` derive it implies
(**D1**) · letting a recurring schedule run with no end date (**D2**) · direct Screen targeting ·
Groups. Each is deferred with a declared landing place — if one surfaces as a blocker, stop and
present options (§1); do not decide in-flight.
