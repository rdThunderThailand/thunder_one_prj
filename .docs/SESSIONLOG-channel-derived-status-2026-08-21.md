# Session log — Channel status becomes derived, Draft/Create split (2026-08-21)

Continues `/tmp/HANDOFF-channel-ui-redesign-2026-08-21.md`. Branch `feat/channel` in both
`thunder_one_prj` and `Thunder_Core`; **everything is uncommitted**, as it was on arrival.

## What was asked

Three things, in the operator's words: split the Draft button from the Create button (today they are
the same button); stop activating Channels by hand — a Channel is Active only when a Publication
uses it; and fold `degraded` into `warning`, which grew during the grilling into folding the whole
`health` axis into a single three-value `Status`.

## What the investigation changed about the plan

The prior round's `docs/channels/followup-publications-by-channel.md` recorded that no Channel ↔
Publication linkage existed. Querying ThunderCore directly showed that was wrong at the DB layer:
`publication_targets.channel_id`, `media_publication_upsert`'s `target_type:'channel'` branch, and
`media_publication_activate`'s channel → device fan-out were all already deployed. The only thing
missing was a producer — wizard step 3 sent device targets, so all 86 target rows were devices.

That turned "change the Publication wizard to target Channels" from a backend round into a
frontend-only one, and it is what made deriving status possible at all. The follow-up doc has been
corrected rather than left standing.

Two forks went to the operator with recommendations attached; both were taken:

- Device reservations move from activation to **commitment** (the Create button), not to publication
  time. Ordering does the work — `channel_set_devices` already reserves for an `active` Channel, so
  create/update write the status before calling it.
- The wizard change ships **before** the derivation, so the list does not read Inactive for
  everything in the interim.

A third fork was raised by the operator mid-answer (fold health into status) and answered with a
recommendation they accepted: Status keeps three values, liveness becomes `n/m online` in the
Devices cell.

## Changes

**Phase 1 — wizard targets Channels** (`thunder_one_prj`, frontend only)
`channels-logic.ts` rewritten around `ChannelListItem` (category id mapping, device roll-up,
Draft filtered out of the picker, `selectedChannelDeviceIds` for the still-device-level
`media_schedule_conflicts`); `draft-mapping.ts` emits `target_type:'channel'`; `usePublishDraft`
reads `fetchChannels()`; `detail-mapping` rehydrates channel targets only; the persisted draft key
went **v6 → v7** because `channelIds` changed meaning. `fetchScreens()` and the `Screen` type were
deleted as dead.

**Phase 2 — `Thunder_Core/supabase/migrations/103_channel_derived_status.sql`, written, NOT applied**
`channel_rows` returns a derived `lifecycle` plus `publication_count` and no longer emits a
channel-level `health`; `media_channel_create`/`_update` gain `p_as_draft` (both old signatures
dropped first, grants re-issued); `channel_assert_committable` holds the shared preconditions.
`media_channel_activate` left deployed and simply uncalled. Route + zod schema updated to carry
`as_draft`.

**Phase 3 — Channel UI**
Header actions split into **Save as Draft** / **Create Channel**, collapsing to **Save changes** once
a Channel is committed. Activate removed from `ChannelLifecycleActions` and `activateChannel()`
removed from the API module; the missing-devices guard moved to `handleSave`, where it now fires.
`ChannelHealth`, the health filter, the health column, the `health` sort key and the four health stat
tiles are gone; Devices reads `2/3 online`, the stat row reads Total/Active/Inactive/Draft/Devices
Online/Unassigned.

**Phase 4 — docs**: ADR 0037 (supersedes parts of 0033, amends 0036), corrected follow-up ticket,
this log.

## A decision reversed mid-implementation

`publication_count` was first added to `ChannelListItem` with a parser guard cross-checking it
against `lifecycle`. Removed again: nothing in the UI reads it, and the guard would have made the
frontend throw against the currently-deployed backend, which returns neither the count nor a derived
lifecycle. The parser now reads `lifecycle` and ignores extra keys, so Phase 3 works against a
pre-`103` backend and gets more correct once `103` lands.

## Phase 5 — edit-page layout repair (reported after Phase 4)

The operator reported the edit page's inputs sitting crooked and the Delete button missing, "like
the sidebar is covering it". Traced from source; three causes, none of them the sidebar:

1. **`ChannelEditorSummary` was `xl:sticky xl:top-0`** and `ChannelLifecycleActions` is its next
   sibling in the same column. A sticky box travels down over what follows it in flow and, being
   positioned, paints above it — with an opaque Card background it hid the Delete button entirely.
   Sticky was removed rather than moved to the column wrapper: the two cards together can exceed the
   scrollport on a short screen, and a sticky element taller than its scrollport pins with its bottom
   permanently below the fold — the same defect wearing a different hat.
2. **`ChannelBasicInfoSection` used `grid gap-1 md:grid-cols-2 xl:grid-cols-4` with an
   `xl:col-span-5` Description.** Spanning five tracks in a four-track grid forces an implicit fifth
   column and throws every column width off; `gap-1` (4px) crammed the fields on top of that. Now
   `grid gap-5 md:grid-cols-2`, the idiom `ChannelDisplayExpectationSection` already used.
3. **Found while tracing:** ADR 0037 derives `inactive` for a committed Channel with no
   Publications, and neither Deactivate (active only) nor Delete (draft only) applies to it — so the
   card rendered as an empty "Lifecycle" box, which reads as a missing Delete button. It no longer
   renders when it has no actions.

**Verified by the operator in the browser, 2026-08-21:** field alignment in Basic Info, the summary
card scrolling with the form so Lifecycle and Delete are reachable, and no empty Lifecycle box on a
non-Draft Channel. All three pass.

## Verification

Ran, clean:
- `npx tsc --noEmit` · `npx eslint 'src/**/*.{ts,tsx}'` · `pnpm build`
- every `*.check.mts` under `src/features/channels` and `src/features/publications`
- `Thunder_Core` `src/app/api/core/v1/media/channels/schema.check.mts`
- `wc -l` — every touched Channel file under 300 (largest `useChannelEditor.ts`, 256)

**Not run:**
- **Only the Phase 5 layout repair has been seen in a browser.** Phases 1–3 — the wizard targeting
  Channels, the Draft/Create split actually writing, the derived status — have not been exercised
  in a running UI at all.
- **Migration `103` has not been applied.** It is R0 and needs approval with the object list first.
  Until it is applied the list will keep showing the stored status, so "Active only when published"
  cannot be observed yet.
- Six `src/features/playlists/*.check.mts` files fail with `ERR_UNSUPPORTED_DIR_IMPORT` on a
  directory import of `./types`. Pre-existing and untouched by this round.
- The 28-item checklist from the morning session is now partly obsolete — its Activate, health-filter
  and health-column rows describe a UI that no longer exists.

## Next

1. Approve and apply `103` (R0), then dump `prosrc` and diff against the file.
2. Rebuild the browser checklist against the new UI and run it — the ordering that matters is
   publish to a Channel, watch it flip to Active, cancel, watch it flip back.
3. Commit. Nothing has been committed on `feat/channel` across any session in this arc; the PR will
   cover several rounds. Ask Thai vs. English first, and open it as Draft until the browser pass is
   genuinely done.
