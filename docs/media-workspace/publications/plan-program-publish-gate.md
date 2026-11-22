# One Program publish gate for the wizard and the Edit page — plan

> Executor: implement task by task in one run. Do not commit, push or open a PR. On any design fork (a choice
> this plan does not settle that would be costly to undo), stop and report instead of choosing.

**Goal:** The create wizard and the Program Edit page decide "can this Program be published" with the same pure
function, `computeEligibility`. A Draft that the wizard would not let through can no longer be published from the
Edit page either.

**Why:** ADR 0002 says every flow that asks "is this publishable" must call `computeEligibility`, but its input is the
wizard's storage shape (`DraftFields`), so the Edit page cannot call it. Today the Edit page enables a Draft's Publish
on `name.trim() && !busy` alone (`components/PublicationEditPage.tsx`, `canPublish`). Two gaps follow:
- **Targets / content:** a Draft with no target (118 of 146 Drafts on prod, 2026-11-22) or no content can be pressed.
  Core refuses it only after the confirm dialog.
- **Past start:** Core gives every Draft a schedule when it is first saved: start = creation time, no end
  (`media_publication_upsert`). Every Draft on prod therefore starts in the past. The wizard blocks that
  (`validateDraft`, "start must be today or later", ADR 0090). The Edit page lets it through, and Core activates it,
  so the Program airs at once and indefinitely, on a schedule nobody chose.

**Base:** branch `feat/program-publish-gate` from `origin/dev`. This plan shares no file with PR #450. Run
`git fetch origin dev` first.

**Tech:** Next.js client components, plain-node checks (`node <file>.check.mts`, no test runner by design). `@/`
aliases do not resolve under plain node. Any file a check loads must use relative imports, with the `.ts` extension
on value imports.

All paths are relative to `src/features/media-workspace/publications/` unless they start with `src/` or `docs/`.
Run every command from the repo root.

## Decisions (settled with the owner, do not re-open)

1. The gate takes the **wire shape**, the subset of `ProgramEditState` (`program-edit.ts`) below. The wizard adapts
   through one pure function, `programGateInputFromDraft`, built from converters that already exist.
2. **Schedule rule.** The gate's own schedule check is presence only (`schedule !== null`). Each caller decides what it
   passes:
   - **Draft Publish, both pages: strict.** The caller passes `null` unless the schedule passes the wizard's rules
     (`validateDraft`, including no past start).
     - Wizard: `isDraftValid(schedule)` in the adapter, which is today's behaviour.
     - Edit page: `strictWireSchedule` (Task 1), which round-trips the saved wire schedule through `scheduleToDraft`
       and `validateDraft`.
   - **Publish changes on a Scheduled or Live Program: presence only.** It passes `state.schedule` as is. A Live
     Program's start is in the past by definition. Its schedule modal already enforces the ADR 0090 end rule, and Core
     decides.
3. **No new schedule-ended check.** The wizard keeps its click-time pre-check in `publishNow` unchanged. The Edit page
   already gets the `schedule-ended` cause, with its fix button, from Core's refusal (`src/lib/api/publish-cause.ts`,
   `classifyPublishCause`, via `useProgramEdit`'s `run()`).
4. Both Edit-page publish buttons use the gate: Draft **Publish** and **Publish changes**. When the gate blocks, the
   button is disabled and its `title` tooltip names the first failing check. This is the same pattern as the Layout
   gate (`publishBlock`). There is no new checklist UI.
5. **The Edit page's Save button does not use the gate.** It keeps `name.trim() && !busy`, because a Draft must save
   while incomplete. Saving a corrected schedule is how the operator unblocks Publish.
6. The basic-info check comes from the caller as `basicInfoOk`:
   - The wizard passes `validateStep(2, draft).valid`, as today.
   - The Edit page passes "name is not empty after trim". Length is enforced by the input's `maxLength` in
     `components/edit/ProgramDetailsCard.tsx`.
7. `assets: MediaAsset[] | null`. With `null` (the Edit page), the content check passes on "has items" without a
   lookup. A trashed asset is still refused by Core with its ADR 0114 cause.
8. The conflict inputs are optional. Without them (the Edit page), the `conflicts` check is `"unknown"`. Conflicts are
   advisory (ADR 0068) and never affect `canPublish`.
9. `useLayoutPublishBlock` stays a separate hook. Each button combines the two in one expression, and the tooltip
   shows the gate's reason first.
10. Tooltip strings are in English, to match the Edit page's copy. Only the Edit page shows them.
11. ADR 0002 gets a dated amendment, not a new ADR.
12. Out of scope: the wizard's Review checklist UI (it keeps rendering `checks`), the save path, and file length.
    `PublicationEditPage.tsx` (310 lines) and `usePublishDraft.ts` (417) are already over 300. Change them only where
    this plan says, and report their line counts before and after.

## Review Focus

These are the inputs most likely to break. Each is pinned by the step named after the arrow.

- **The wizard must not change.** For every `DraftFields` case in today's check, run through the adapter, `canPublish`
  and every `checks` status stay the same. This includes the invalid-schedule case and the Group-only case.
  → Task 1.
- **Content by type.** A composition Program passes on `compositionId` with empty `items`. A playlist Program passes
  on `playlistId`. Every other type (image, video, html, dynamic) passes on items. → Task 1.
- **The Edit page's strict rule must not reject a schedule the wizard accepts.** A wire schedule that starts today or
  later, in each mode (continuous with and without an end, weekly, monthly, dates), must survive the
  `scheduleToDraft` round trip as valid. → Task 1 `strictWireSchedule` cases.
- **A past-start Draft.** It is blocked on the Edit page with the schedule reason. Setting a start of today or later
  and saving unblocks it. → checklist 1.
- **A Live Program.** Its past start does not block "Publish changes". Clearing its targets does. → checklist 3.

---

### Task 1: the gate takes the wire shape; wizard adapter; strict wire schedule

**Files:** modify `publish-eligibility.ts` and `hooks/usePublishDraft.ts`. Test: `publish-eligibility.check.mts`.

**Produces, in `publish-eligibility.ts`:**
```ts
export type ProgramGateInput = Pick<ProgramEditState, "name" | "targets" | "schedule"> & {
  content: Pick<ProgramContent, "type" | "playlistId" | "compositionId"> & { items: { media_asset_id: string }[] };
};
export function programGateInputFromDraft(draft: DraftFields, channels: ChannelListItem[]): ProgramGateInput;
/** The saved schedule if it passes the wizard's rules on `today`/`nowTime` in its own timezone, else null. */
export function strictWireSchedule(
  schedule: PublicationSchedule | null,
  today: string,
  nowTime: string,
): PublicationSchedule | null;
export function computeEligibility(params: {
  program: ProgramGateInput;
  basicInfoOk: boolean;
  assets: MediaAsset[] | null;
  loadingRefs: boolean;
  conflicts?: ScheduleConflict[];
  conflictsError?: string | null;
  checkingConflicts?: boolean;
}): EligibilityResult;
```
- **`programGateInputFromDraft`** builds:
  - `name`: `basicInfo.name`
  - `content`: `{ type: basicInfo.publicationType, playlistId, compositionId, items: assetItems }`
  - `targets`: `targetsFromSelection(channelIds, groupIds, groupNamesById, channels)` from `./draft-mapping.ts`
  - `schedule`: `isDraftValid(schedule) ? draftToSchedule(schedule) : null`
- **`strictWireSchedule`** returns `null` for `null`. Otherwise, with `tz = schedule.timezone || DEFAULT_TIMEZONE`, it
  returns `schedule` when `validateDraft(scheduleToDraft(schedule, today, tz), today, nowTime)` has no keys, and
  `null` when it has any. The caller passes `nowIn(tz)`'s `date` and `time`. Keeping them as parameters is what makes
  it testable.
- **`EligibilityResult`** gains `blockReason: string | null`.
  - It holds the first failing gating check, in this order: basic info, content, targets, schedule.
  - It is `null` when `canPublish` is true, and also when the only blockers are `loadingRefs` or a content check that
    is `"unknown"`.
  - Strings:
    - basic info: `"Give this Program a name before publishing."`
    - content: `"Choose content for this Program before publishing."`
    - targets: `"Choose at least one Channel or Channel Group before publishing."`
    - schedule: `"Set a schedule that starts today or later before publishing."`
- **The checks:**
  - **content:**
    - playlist: passes on `content.playlistId`
    - composition: passes on `content.compositionId`
    - any other type: `items.length > 0`. When `assets !== null`, every item must also resolve in `assets`;
      otherwise the check is `"unknown"` (today's rule).
  - **targets:** `targets.length > 0`
  - **schedule:** `schedule !== null`
  - **policy** and **conflicts:** today's rules. A missing conflict input reads as `"unknown"`.
- **`canPublish`** = `basicInfoOk && !loadingRefs && isAllGatingPassed(checks)`. This is today's formula.
- **Imports:**
  - `import type` from `./program-edit.ts`, `./types/index.ts`, `./store/usePublicationDraftStore.ts`,
    `../channels/types/index.ts`.
  - Values from `./schedule-preset.ts` (`isDraftValid`, `draftToSchedule`, `scheduleToDraft`, `validateDraft`),
    `./schedule.ts` (`DEFAULT_TIMEZONE`) and `./draft-mapping.ts` (`targetsFromSelection`).
  - Drop `validateStep` from this file if nothing uses it any more.
- **`hooks/usePublishDraft.ts`** is the only caller today.
  - Hoist the inline draft object into `const draft = { … }`.
  - Call `computeEligibility({ program: programGateInputFromDraft(draft, channels), basicInfoOk: validateStep(2, draft).valid, assets, conflicts, conflictsError, loadingRefs: …unchanged…, checkingConflicts })`.
  - Add `import { validateStep } from "../step-validation"` and remove any imports left unused.
  - Net budget: about +3 lines.

Steps:
- [ ] In `publish-eligibility.check.mts`, keep the existing `DraftFields` fixtures. Route every existing case through
  `computeEligibility({ program: programGateInputFromDraft(draft, channels), basicInfoOk: validateStep(2, draft).valid, … })`.
  - `channels` is a small `ChannelListItem[]` fixture modelled on `channels-logic.check.mts`.
  - **Every existing expected value stays the same.**
- [ ] Add wire-shape cases:
  - `targets: []` → `canPublish` is false, the targets check is `"fail"`, and `blockReason` is the targets string.
  - Composition with `compositionId: "c1"` and `items: []` → content passes. With `compositionId: null` → content
    fails.
  - `type: "html"` with one item → content passes.
  - `assets: null` with one item → content is `"pass"`.
  - `schedule: null` → the schedule check fails, with the schedule string.
  - `basicInfoOk: false` → `blockReason` is the basic-info string, even when targets are also empty (order check).
  - No conflict inputs → conflicts is `"unknown"`, and `canPublish` is still true.
  - `loadingRefs: true` with everything else passing → `canPublish` is false and `blockReason` is `null`.
  - `assets: []` with one item (content `"unknown"`) → `blockReason` is `null`.
- [ ] Add adapter cases:
  - A draft with an invalid schedule (`startDate: ""`) → `schedule === null`.
  - `channelIds: ["a"]` with `groupIds: ["g"]` → 2 targets, one of each type.
- [ ] Add `strictWireSchedule` cases, with a fixed `today = "2026-11-22"` and `nowTime = "10:00"`:
  - A schedule that starts on `2026-11-10` → `null`.
  - Each of these, starting `2026-11-23`, is returned unchanged: continuous without an end, continuous with an end,
    weekly, monthly, dates. Build each one with `draftToSchedule(defaultScheduleDraft("2026-11-23"))` and the presets
    that the existing schedule checks use, so the shape matches what the UI saves.
  - `null` → `null`.
- [ ] `node src/features/media-workspace/publications/publish-eligibility.check.mts` → FAIL before the change.
- [ ] Implement.
- [ ] Run the check again → passes. If a valid future schedule comes back `null` in any mode, stop and report: the
  round trip loses information, and that is a design fork, not something to patch around.

### Task 2: the Edit page uses the gate

**Files:** modify `components/PublicationEditPage.tsx`.

- After the `!state` early return:
  ```ts
  const tz = state.schedule?.timezone || DEFAULT_TIMEZONE;
  const now = nowIn(tz);
  const gate = computeEligibility({
    program: { ...state, schedule: isDraft ? strictWireSchedule(state.schedule, now.date, now.time) : state.schedule },
    basicInfoOk: state.name.trim().length > 0,
    assets: null,
    loadingRefs: false,
  });
  ```
  This uses the existing `isDraft`, so place the block after it. `ProgramEditState` satisfies `ProgramGateInput`
  structurally. If `tsc` disagrees, stop and report rather than casting.
- Rename the existing `canPublish` to `canSave`, keeping the same expression. Then:
  - **Save:** `disabled={!canSave || !isDirty}`
  - Draft **Publish:** `disabled={!canSave || !gate.canPublish || publishBlock !== null}`,
    `title={gate.blockReason ?? publishBlock ?? undefined}`
  - **Publish changes:** `disabled={!canSave || !gate.canPublish || !isDirty}`,
    `title={gate.blockReason ?? undefined}`
- Net budget for this file: about +9 lines.

Steps:
- [ ] Implement.
- [ ] `npx tsc --noEmit -p .` → exit 0.

### Task 3: ADR 0002 amendment

**Files:** modify `docs/adr/0002-publish-eligibility.md`.

- [ ] Append `## Amendment — 2026-11-22 (Edit page)`, with one short paragraph for each of these:
  - **Input:** the gate now takes the wire shape `ProgramGateInput` plus `basicInfoOk`, so the Edit page can call it.
    The wizard adapts through `programGateInputFromDraft`.
  - **`blockReason`:** added to the result.
  - **Schedule:** the gate checks presence only. Draft Publish on both pages passes a strict schedule (the wizard's
    rules, including no past start; ADR 0090), because Core gives every Draft a default schedule that starts at
    creation. Publish changes on a published Program passes its saved schedule as is.
  - **Schedule-ended:** stays the wizard's click-time pre-check. The Edit page relies on Core's `schedule-ended` cause
    (ADR 0114).
  - **Save:** Save on the Edit page stays outside the gate.
- [ ] Leave the original Decision text unchanged.

### Task 4: verify, then report

- [ ] `find src/features/media-workspace/publications -name '*.check.mts' -print0 | xargs -0 -n1 node > /dev/null`
  → exit 0.
- [ ] `npx tsc --noEmit -p .` → exit 0.
- [ ] `npx eslint --max-warnings 0` on every changed source file → exit 0. Report any pre-existing warning instead of
  fixing it.
- [ ] Report `git diff --stat`, each command result, and the `wc -l` of `PublicationEditPage.tsx` and
  `usePublishDraft.ts` before and after.
- [ ] **Do not run the browser checklist.** The owner decides how it runs.

**Browser checklist** (localhost:3000, proxy → develop Core). Reach the Edit page by pressing **Open** in the Programs
list, and the wizard by pressing **Edit**. Never confirm a Publish. Only read the button state and its tooltip.

1. **Past-start Draft, no targets: `zz-fixgc-group-only`** (62c14c75-a47f-4064-9aeb-f941222ccebb, a Playlist Draft
   with content, no targets, and Core's default schedule).
   - Publish is disabled. The tooltip is the targets string.
   - Add a Channel without saving. The tooltip changes to the schedule string, because the start is in the past.
   - Set the schedule to start tomorrow (schedule card → modal → Apply). Publish enables.
   - Do not save. Leave with Discard.
2. **Save unaffected.** On the same Draft, change the name. Save enables even though Publish is disabled. Leave with
   Discard.
3. **Live Program.** Open any Live Program and change its name.
   - "Publish changes" enables, despite its past start.
   - Clear its targets. The button disables with the targets tooltip.
   - Leave with Discard.
4. **Wizard unchanged.** Open `zz-fixgc-group-only` by Edit and go to the Review step.
   - The targets and schedule rows fail.
   - The Publish button on the last step is disabled, as it is today.
   - Leave without saving.
