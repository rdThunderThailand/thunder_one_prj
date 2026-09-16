# Plan — ver02 Create wizard

Design source: `docs/publications/ver02/design/` (8 frames).
Decisions: `docs/adr/0072-the-create-wizard-reshapes-the-steps-not-the-publication.md`.

The wizard is re-cut in place in `src/features/media-workspace/publications/`. Two other features are
touched as well — see **Blast radius** at the bottom; "everything lands in `publications/`" is not
true.

## How to read the tables

**Disposition** — what happens to a control the design draws:

| | meaning |
|---|---|
| **SHIP** | operator can change it, it is written to the draft |
| **READ-ONLY** | rendered, derived from something else, not editable |
| **DISABLED** | rendered greyed with a "not built yet" title (the precedent is `ScheduleStep.tsx:400-467`) |
| **DROP** | not rendered at all |

**Code** — what the implementation costs:

| | meaning |
|---|---|
| **REUSE** | import and pass props, no change to the component |
| **ADAPT** | exists but cannot be dropped in: unbind from `usePublicationDraftStore`, extract from a large file, or add props |
| **NEW** | does not exist |

The rule for any control not listed below: **a field describing the file is READ-ONLY, a field
describing this program is SHIP, anything that would write to the Asset is DROP** (ADR 0072 §4).

---

## Control disposition matrix

### Frame 1 — Choose Content

| Control | Disposition | Source of truth | Code |
|---|---|---|---|
| Branch cards Media / Playlist / Layout | SHIP | `basicInfo.publicationType` | ADAPT — confirmation before clearing content (ADR 0072 §3) |
| Drag-and-drop upload area | SHIP | new Assets → `assetItems` | NEW `<Dropzone>` (drag-drop exists only inline in `assets/upload/UploadQueuePage.tsx`); upload via `useAssetUpload`, limits in `upload-limits.ts` |
| Upload from computer | SHIP | as above | REUSE `useAssetUpload` |
| Choose from Media Library | SHIP | opens frame 1.1 | ADAPT |
| Choose existing Playlist / Layout | SHIP | opens frames 1.2 / 1.3 | ADAPT |
| Create new Playlist / Layout | SHIP | navigates out to the editor | NEW — editor-side Publish action + seed param |
| Supported-formats chips, guidance rail, tip bar | READ-ONLY | static copy | NEW (markup only) |

### Frame 1.1 — Media Picker

| Control | Disposition | Source of truth | Code |
|---|---|---|---|
| Modal shell, footer "n selected", Cancel / Select | SHIP | local until Select | REUSE `ui/Modal.tsx` (`size="xl"`) |
| Search, type filter, folder + tag rail | SHIP | picker-local filter state | ADAPT `playlists/components/AssetPicker.tsx` — it owns `query`/`kind`/`folderId`/`tagId` in local state and draws its own filter bar (`AssetPicker.tsx:35-38`, `:54+`); the ver02 frame puts filters in a left rail, so either lift the filter state to props or extract the grid. Leaving it as-is yields two filter bars. Rails themselves: REUSE `content-library/FeatureFolderRail.tsx`, `TagsRail.tsx` |
| Grid / list toggle, asset cards, multi-select | SHIP | `assetItems` on Select | REUSE `AssetCard.tsx`; multi-select stays (ADR 0072, Q8) |
| Status filter (Active / Draft / Archived / Expired) | SHIP | asset status | NEW — no picker has it |
| Resolution filter, duration min/max filter | SHIP | asset metadata | NEW |
| Pagination | SHIP | picker-local | ADAPT `ui/Pagination.tsx` (list-page only today) |
| Selected-item detail panel + usage stats | READ-ONLY | asset metadata | NEW read-only detail panel; `SelectedAssetList.tsx` remains the picked-item editor for Frame 2. Usage stats (Programs / Screens / Play time) → **DROP**, no such aggregate exists |
| Tags on the detail panel | READ-ONLY | asset tags | REUSE — editing them here would write the Asset |
| Open Media Library ↗ | SHIP | new tab | NEW (link) |

### Frame 1.2 — Playlist Picker

| Control | Disposition | Source of truth | Code |
|---|---|---|---|
| Search, status filter, creator filter, tag filter | SHIP | picker-local | REUSE `playlists/components/PlaylistsFilters.tsx` |
| Category filter | SHIP | playlist category | NEW — does not exist on Playlist |
| Duration min/max | SHIP | playlist duration | NEW |
| Rows: thumbnail, duration, item count, status, tags | READ-ONLY | playlist record | REUSE `PlaylistsTable.tsx`, `status-display.ts`, `duration.ts` |
| Grid view toggle | SHIP | picker-local | NEW — playlist card tile does not exist, rows only |
| Preview + details panel, "see all 18 items" | READ-ONLY | playlist detail | REUSE `PlaylistSidePanel.tsx`, `preview/PlaylistPreviewPanel.tsx` |
| Single-select + Select | SHIP | `playlistId` | ADAPT |
| Create new Playlist ↗ | SHIP | navigates to editor | NEW (shared with frame 1) |

### Frame 1.3 — Layout Picker

| Control | Disposition | Source of truth | Code |
|---|---|---|---|
| Search, status, orientation, aspect-ratio filters | SHIP | picker-local | REUSE `layouts/template-picker.ts` (`PickerFilters`, `filterEntries`, `groupEntries`) |
| Category filter | SHIP | composition category | NEW — does not exist |
| Zone wireframe tiles | READ-ONLY | layout geometry | REUSE `LayoutWireframe.tsx`; real media per zone via `compositions/components/CompositionLibraryPreview.tsx` |
| Details panel (aspect, orientation, zone count) + "zone details (2)" | READ-ONLY | layout + composition | REUSE |
| Single-select + Select | SHIP | `compositionId` | ADAPT `CompositionPicker.tsx` (no props, reads the store) |
| Create new Layout ↗ | SHIP | navigates to editor | NEW (shared with frame 1) |

### Frame 2 — Prepare Content

| Control | Disposition | Source of truth | Code |
|---|---|---|---|
| Content Name (required) | SHIP | `basicInfo.name` — **Publication, never the Asset** | ADAPT `BasicInfoForm.tsx` |
| Description, char counter | SHIP | `basicInfo.description` | ADAPT |
| Tags | SHIP | `basicInfo.tags` | NEW tag-chip input (only `PlaylistTagsDialog.tsx` has one) |
| Campaign, Language | DROP | — | removed; `campaign_id` is optional in every payload type, so no API change |
| **Type** | READ-ONLY | asset MIME | ADR 0072 §4 |
| **Resolution** | READ-ONLY | asset metadata | ADR 0072 §4 |
| **Duration** — video | READ-ONLY | file duration | ADR 0072 §4 |
| **Duration** — image | SHIP | `DraftAssetItem.duration_seconds` (default 10s) | REUSE `SelectedAssetList.tsx:104-123` — keeps an existing capability |
| **Add Poster** | DROP | — | Asset-level artwork, no Publication field; listed under *Deliberately not in ver02* |
| Change Content | SHIP | returns to step 1 | ADAPT (same nav as the stepper) |
| Preview (media / playlist / layout), geometry selector, expand | READ-ONLY | content | REUSE `preview/PreviewStage.tsx`, `PlaylistPreviewPanel.tsx`, `composition-preview.ts` |
| Open full preview (separate tab) | SHIP | — | ADAPT — routes exist; mirror `playlists/use-playlist-preview-handoff.ts` for the publication source |
| Content Info rail | READ-ONLY | asset metadata | REUSE `assets/components/AssetCard.tsx` exports `formatBytes`, `formatResolution` |
| Checklist — file size within limits | DROP as a checklist row; file size is **stated in Content Info** | `formatBytes` on the asset record | `rejectUploadReason` takes one browser `File` (`upload-limits.ts:41`) and its own comment says Core and the `media` bucket already enforce the ceiling (ADR 0059) — a stored Asset has passed it by definition, and there is no validator at all for a Playlist's or a Composition's constituent assets |
| Resolution and duration | READ-ONLY, **stated in the Content Info rail, not a checklist tick** | Media: asset metadata · Playlist: `computePlaylistTotals` (carries `isPartial`, and no single resolution) · Composition: `reference_resolution` + a duration per Zone | ADAPT — branch-specific rendering; one tick across three shapes would assert what it never checked |
| Checklist — resolution / aspect fits the target | MOVED to frame 4 | needs Channels, chosen at step 3 | see the note below |
| Checklist — file is playable | DROP (slot kept) | needs the codec probe of ADR 0069/0070, docs only today | — |
| Checklist — no audio noise | DROP | nothing measures it | — |
| Quick Edit Tools: Edit / Overlay / Advanced | DISABLED | — | markup only |
| Need Help / View Guide | READ-ONLY | static | NEW (link) |

**Frame 2 ships no readiness checklist at all.** Every row the design draws turns out to be either
unmeasurable (playable, audio noise), already enforced upstream and therefore vacuous (file size),
or dependent on targets that step 3 has not collected yet (resolution/aspect fit). What remains is
the Content Info rail stating facts — type, size, resolution, duration — and the real gate stays
where the evidence is, on frame 4. An empty checklist is the honest outcome, not a gap to fill.

**Why the fit check cannot live at step 2.** `summarizeGeometryFit(channels, channelIds,
aspectRatio)` returns `{ unfitting: [], unprofiled: [] }` immediately when `aspectRatio` is null —
its own comment says "no Composition is selected, so there is nothing to fit against" — and
otherwise iterates only the *selected* Channels (`channels-logic.ts:98-112`). At step 2
`channelIds` is still empty, so both paths return nothing, and a checklist row fed by them would
render green having measured nothing, which ADR 0072 §9 forbids. The row therefore moves to frame 4,
after step 3 has supplied targets. Loose media and Playlists are additionally unmeasured by this
function today (it needs a Composition aspect ratio); the frame-4 row states *unknown* for them
rather than inventing a verdict.

### Frame 3 — Program

| Control | Disposition | Source of truth | Code |
|---|---|---|---|
| Where: Screens tab | DISABLED | `target_type: "device"` is typed but never emitted | — |
| Where: Channels tab — search, category grouping, cards, selected panel, status bars | SHIP | `channelIds` | ADAPT `ChannelsStep.tsx` (+ `channels-logic.ts`, already pure) |
| Where: Groups tab | DISABLED | entity does not exist | — |
| Where: the "All Types / All Status / All Locations" selects | DROP | already dead controls in the current code | delete rather than port |
| When: Play Mode Always / Schedule | SHIP | `scheduleForm.schedule_type` | ADAPT `ScheduleStep.tsx` |
| When: Play Mode Event | DISABLED | no event source | — |
| When: Date Range + no-end-date | SHIP | `scheduleForm` | ADAPT — extract `DateRangeField` from the 701-line file |
| When: Time window + all-day | SHIP | `scheduleForm.daily_start/daily_end` | ADAPT — extract `TimeWindowField` |
| When: weekday chips (inside Advanced Schedule) | SHIP | `scheduleForm.days` | ADAPT — extract `WeekdayChips` |
| When: timezone | SHIP | `scheduleForm.timezone` | ADAPT — extract `TimezoneSelect`; logic stays in `schedule.ts` |
| Load from Template | DISABLED | no such entity | — |
| How: item order — **loose media only** | SHIP | `assetItems` order | REUSE `SelectedAssetList.tsx:136-160` |
| How: Transition `cut`/`fade` per item — **loose media only** | SHIP | `DraftAssetItem.transition` | REUSE `SelectedAssetList.tsx:125-135` — already sent to the API, the wizard just never passes `setAssetTransition` |
| How: Play Order, Repeat — **loose media only** | READ-ONLY | the player's effective defaults (`sequential` / `loop` / from first), labelled as such | see the persistence note below |
| How: Transition duration ("2 sec") | DISABLED | no field on `DraftAssetItem` | — |
| How: inherited settings, Playlist / Layout branches | READ-ONLY | the Playlist's or Zone's own values (ADR 0064) | NEW — small: render source values + link to its editor |
| How: Audio toggle + volume slider | DISABLED | stored intent no player reads (ADR 0010) | — |
| Additional: Priority | SHIP | `basicInfo.priorityId` | ADAPT — moves here from step 1 |
| Additional: Playback behaviour when offline | DISABLED | no player-contract field | — |
| Program Summary rail | READ-ONLY | draft | ADAPT `PreviewPanel.tsx` / `ContentSummaryPanel.tsx` |

**Persistence note — why Play Order and Repeat are read-only for loose media.** There is nowhere to
put them without a backend change: `DraftFields` carries no playback state
(`usePublicationDraftStore.ts:29-45`), `DraftAssetItem` is `media_asset_id` + `duration_seconds` +
`transition` only, `draftItemsToContentItems` sends exactly those (`draft-mapping.ts:66-73`), and
Core creates the machine-owned Playlist as `INSERT INTO media_core.playlists (tenant_id, name,
status, kind)` with no `metadata`
(`Thunder_Core/.../20260826140000_publication_type_composition.sql:467`) — so the player resolves
play mode and repeat to its own defaults regardless of what the form collected. Shipping the
controls as editable would accept input that is silently discarded.

Making them editable is a four-part change, not a UI change: a field on `DraftAssetItem` or
`DraftFields`, the payload in `draft-mapping.ts`, the Core RPC writing `playlists.metadata`, and a
migration. That is a separate piece of work with its own blast radius, deliberately not taken here.
On the Playlist and Composition branches these values already have a real home and are shown
read-only with a link to their editor (ADR 0072 §7).

### Frame 4 — Review

| Control | Disposition | Source of truth | Code |
|---|---|---|---|
| Four summary cards (Content / Where / When / How) | READ-ONLY | draft | ADAPT — split out of `ReviewPublishStep.tsx` (603 lines) |
| Per-card validity ticks | READ-ONLY | see checklist mapping below | ADAPT `publish-eligibility.ts` |
| Edit Program | SHIP | jumps to step 3 | ADAPT |
| Preview on Screen | READ-ONLY | content | REUSE `PublicationPlaybackPreviewButton.tsx` → `PlaybackPreviewModal.tsx` |
| Timeline — our content | READ-ONLY | `scheduleForm` | NEW |
| Timeline — "Other content" | READ-ONLY | conflict payload | NEW, imprecise by design: conflicts carry `starts_at`/`ends_at`/`name`/`priority` but **no daily window**, so other programs render as full-width shaded bands |
| Conflicts & warnings | READ-ONLY | `publish-eligibility.ts`, `MiniCalendar.tsx` | REUSE |
| Review Summary rail | READ-ONLY | draft | ADAPT |

**Checklist row → validator** (ADR 0072 §9 — no row without a validator, no implicit green):

| Row in the frame | Validator | Ships as |
|---|---|---|
| Content is ready to play | `contentCheckStatus` (`publish-eligibility.ts` — all assets found + approved) | SHIP, may be `unknown` |
| Targets are selected | `channelsCheckStatus` = `validateStep(3, draft)` | SHIP |
| Schedule is valid | `scheduleCheckStatus` = `validateStep(4, draft)` | SHIP |
| Playback settings are complete | none — and after ADR 0072 §7 there is nothing to check on the Playlist/Layout branches | **DROP** |
| Content complies with policy | `policyCheckStatus`, hardcoded `"unknown"` | READ-ONLY as *unknown*, never green |
| Resolution / aspect fits the target *(moved here from frame 2)* | `summarizeGeometryFit(channels, channelIds, aspectRatio)` | SHIP; *unknown* whenever `aspectRatio` is null (loose media, Playlists) or a Device reports no geometry — advisory, never a block (ADR 0055) |
| No higher-priority Publication overrides this | `conflictsCheckStatus` (advisory per ADR 0068) | SHIP |

### Frame 5 — Publish

| Control | Disposition | Source of truth | Code |
|---|---|---|---|
| Ready banner, Publish Summary rail, "see full details" | READ-ONLY | draft | ADAPT — second half of `ReviewPublishStep.tsx` |
| Publish Now | SHIP | `usePublishDraft.ts#publishNow` | REUSE |
| Schedule Publish + its own Start Date & Time | DROP | one start time, owned by step 3 (ADR 0072 §6) | render the step-3 schedule read-only instead |
| Notifications: email, system | DISABLED | — | — |
| Permissions: allow editing / lock after publish | DISABLED | republish-in-place is ADR 0053 | — |
| Save as draft (steps 2–5) | SHIP | `usePublishDraft.ts#saveDraft` | REUSE |
| Live View link, post-publish hint | READ-ONLY | static | NEW (link) |

---

## Phase 0 — Shell, and the seed/resume contract

1. Re-cut the step boundaries (old `Basic Info → Content → Channels → Schedule → Review` becomes the
   ver02 five), update `step-validation.ts` (`WizardStepId` is `1|2|3|4` today), bump the persist key
   `…create-draft.v9 → v10` (migrations here are drop-not-migrate).
2. Drop `campaignId` and `language` from `BasicInfoState`.
3. Stepper: green ticks on completed steps, click-to-return on completed steps only. **This changes
   `src/components/ui/WizardSteps.tsx`, which three `people/add-person` wizards also use** — add
   optional props, keep the current behaviour as the default.
4. **Seed/resume contract.** Today `CreatePublicationPage.tsx:143-155` applies `?compositionId=` to
   whatever draft is already hydrated, with a comment saying that is deliberate, while the resume
   prompt is only computed at line 345. Generalizing it as-is would mutate a draft the operator then
   chooses to *continue* — which ADR 0072 §3 forbids. The seed becomes **pending** until the choice
   is made:

   | situation | behaviour |
   |---|---|
   | draft is empty at hydration | apply the seed immediately, go to step 2 |
   | draft has content, operator picks **Continue** | discard the seed, stay on the resumed draft |
   | draft has content, operator picks **Start fresh** | clear the draft, then apply the seed, go to step 2 |
   | arriving with `?id=` (edit mode) | never prompt, never seed |

   Consume the query parameter after applying, so a refresh does not re-seed.

   Leaves one runnable check (`*.check.mts`, `node:assert`, per CLAUDE.md §3) over the pure
   resolver — `resolveSeed({ hasDraftContent, choice, seed })` — covering all four rows.

## Phases 1–5

Work the matrix frame by frame, in this order. Each phase is verifiable in the browser on its own.

1. **Frame 1 + 1.1** — picker shell and the Media branch end to end. Every other branch is measured
   against it.
2. **Frames 1.2 + 1.3** — Playlist and Layout pickers on the same shell.
3. **Frame 2** — the prepare frame with all three preview panes and a Content Info rail stating
   branch-specific facts. No checklist on this frame; the fit check belongs to frame 4.
4. **Frame 3** — extract the four schedule fields first, then targeting, then How to Play.
5. **Frames 4 + 5** — split `ReviewPublishStep.tsx` in two; wire the checklist rows to their
   validators.
6. **Editor → wizard handoff** — the Publish action in the Playlist and Composition editors, once
   step 2 accepts a seed.

Verification follows CLAUDE.md §3: ask before each browser verify point, and report per layer.

---

## Weight

Grouped implementation work packages, deduplicated from the matrix — **not** a count of the `NEW`
and `ADAPT` cells (the Code column has more rows than this, because one package covers several rows
and static markup and links are not packages).

- **New product UI (11 packages):** dropzone, tag-chip input, status filter, resolution filter, duration
  filter, playlist grid card, playlist category filter, layout category filter, inherited-settings
  read-only view, review timeline, stepper back-navigation.
- **Adaptation / extraction (20 packages):** lifting `AssetPicker`'s filter state to props (or
  extracting its grid) so the left rail owns the filters; branch-specific resolution/duration facts
  in the Content Info rail; unbinding `AssetLibraryStep`, `ChannelsStep`, `CompositionPicker`,
  `BasicInfoForm`, `SelectedAssetList` call sites, `ContentSummaryPanel`, `PreviewPanel`; extracting
  `DateRangeField`, `TimeWindowField`, `WeekdayChips`, `TimezoneSelect` from the 701-line
  `ScheduleStep`; splitting the 603-line `ReviewPublishStep` into frames 4 and 5; pagination inside a
  picker; full-preview handoff for the publication source; `summarizeGeometryFit` and aspect-ratio
  checklist wiring; step re-cut + validation; the seed/resume resolver.
- **Cross-feature (3):** `ui/WizardSteps.tsx` (shared with `people/add-person` ×3), Playlist editor
  Publish action, Composition editor Publish action.
- **Deferred, rendered as DISABLED (11) or DROP (10 controls — Campaign, Language, Add Poster, the
  three frame-2 checklist rows, the three dead targeting selects counted as one control, the
  "playback settings are complete" review row, Schedule Publish's own date/time, and the media
  picker's usage stats):** all enumerated below. Counted as controls, not matrix rows — one row can
  carry two controls (Campaign and Language) and one drop rides inside a READ-ONLY row (usage stats).

Genuinely drop-in with no change: the whole `preview/*` set, `schedule.ts`, `LayoutTemplatePicker` +
`LayoutWireframe` + `template-picker.ts`, `FeatureFolderRail` + `TagsRail`, `PlaylistsTable` +
`PlaylistSidePanel` + `PlaylistsFilters`, `MiniCalendar`, `usePublishDraft`, the draft store's
persistence/locking/idempotency, and `src/components/ui/*` **except `WizardSteps` and `Pagination`**,
which this plan changes.

Removed from that list on review: `AssetPicker` (owns its filter state, see frame 1.1) and
`PlaylistPlaybackSettings` — an editable form, and after the persistence note above there is nothing
editable left for it to drive, so ver02 does not use it at all.

## Blast radius

`src/features/media-workspace/publications/` (most of it) · `src/components/ui/WizardSteps.tsx` and
`Pagination.tsx` (shared) · `src/features/media-workspace/playlists/` and `compositions/` (a Publish
action each) · `src/features/media-workspace/assets/upload/` (extracting the dropzone). No backend
change, no migration, no schema change.

## Deliberately not in ver02

**DISABLED (rendered, inert):** Quick Edit Tools (Edit / Overlay / Advanced) · Play Mode: Event ·
Load from Template · Playback behaviour when offline · Audio toggle + volume · Notifications (email,
system) · Permissions (allow editing / lock after publish) · Screens targeting tab · Groups
targeting tab · Transition duration on loose media.

**DROP (not rendered):** Add Poster · Schedule Publish's own date/time · frame 2's readiness
checklist in its entirety — the "file is playable", "no audio noise" and "file size" rows · the "playback settings are complete" review row · asset usage
stats in the media picker · Campaign and Language · the three dead filter selects on the targeting
step.

**Deferred with a declared landing place:** editable play order / repeat on loose media (needs a
draft field, the payload, a Core RPC writing `playlists.metadata`, and a migration) · codec-probe
checklist row (ADR 0069/0070) · direct
Screen targeting (`target_type: "device"` is already typed) · per-conflict daily windows in the
timeline (a Thunder_Core change) · the Program terminology sweep across list, detail, Now & Next and
validation messages (ADR 0072 §1 scopes the word to the Create flow only).
