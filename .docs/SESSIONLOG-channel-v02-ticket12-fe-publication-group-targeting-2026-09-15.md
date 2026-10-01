# SESSIONLOG — Channel v02 ticket 12: FE — Publication targets Channel Groups

Date: 2026-09-15
Branch: `feat/channel` (uncommitted — part of the running tickets 07-12 batch, commit deferred)

## Ticket

`docs/channels/v02/tickets/12-fe-publication-group-targeting.md`, GitHub #110. Blocked by
tickets 05 and 10 (both done). ADR: `docs/adr/0074-channel-one-player-and-channel-group.md` §5
(sync guard), §6 (Group intent/snapshot/drift).

## What was built

- **Target step "Channel Groups" tab** — `src/features/media-workspace/publications/components/GroupsStep.tsx`
  (new): fetches `/media/channel-groups` (via `channel-groups/services/channel-groups-api.ts`'s
  `fetchChannelGroups`), filters to `status === "active"` (ADR 0074 §5 — disabled Groups are hidden
  from this picker), search + checklist, toggles the wizard's existing `groupIds`/`groupNamesById`
  store fields. `WhereToPlayPanel.tsx` wires it into the existing "Groups" tab slot (relabeled
  "Channel Groups") and enables it — it was built disabled by ticket 07-10, with the removable
  chips in `ChannelsStep.tsx` as the only prior UI. The `group_ids` intent round-trip
  (`draft-mapping.ts` → save, `detail-mapping.ts` ← load) already existed from an earlier ticket;
  this ticket only needed the picker to *add* a Group, since only removal existed before.
- **`via_groups` on the delivery table** — `DeliveryDeviceTable.tsx` shows "via <Group name(s)>"
  under the device name when `target.via_groups` is non-empty, same convention as the Channel
  detail panel's Now Playing card (ticket 07).
- **Group drift finding** — `publication-drift.ts`: added `PublicationDriftGroup`/
  `PublicationDriftGroupChannel` types and a `"group"` `DriftFinding` level, matching the backend's
  `drift_check.groups: [{group_id, name, added[], removed[]}]` (ADR 0074 §6, confirmed against
  `Thunder_Core/supabase/migrations/20260914010000_..._group_drift.sql` lines 480-531 — every
  Group listed there is a real change, no `hasChanged` gate needed for it, unlike the
  composition/layout/zone levels). `PublicationDetailPage.tsx`'s `describeDrift` gained the
  `"group"` case; the existing Republish button/flow needed no changes since it already re-reads
  `publicationDrift()`'s output list.
- **Activation refusal, no generic swallowing** — `src/lib/api/api-error.ts`: added
  `isIncompleteSyncGroupTarget` matched *before* the generic `"Invalid input:"` catch-all (same
  pattern as `isDuplicateName`/`isConflict`), so `media_publication_activate`'s two ADR 0074 §5
  guard messages — "synchronized group target is incomplete — S (missing: C2)" and "cannot
  activate a direct device target inside a synchronized group — ..." — reach the operator
  verbatim instead of the generic Thai "ข้อมูลที่กรอกยังไม่ครบ" text, which would otherwise erase
  the Group name and the missing Channels.
- **`.check.mts` coverage**: `publication-drift.check.mts` (group-added, group-removed, a flat
  Publication drifting on Group membership alone), `api-error.check.mts` (both guard messages
  reach the UI unmodified).

## Two real bugs found by browser verification (not by the checks above — both fixed)

1. **Step 3 / Publish-eligibility gate rejected a Group-only target.** `step-validation.ts` and
   `publish-eligibility.ts` both gated "at least one target" on `channelIds.length > 0` alone —
   written before Groups were a selectable target, never updated when `groupIds` was added to the
   store. Selecting only a Channel Group and clicking Next threw "กรุณาเลือกช่องทางอย่างน้อย 1
   ช่องทาง" even though a Group is a complete, independent target intent (ADR 0074 §6). Fixed both
   to accept `channelIds.length > 0 || groupIds.length > 0`; added regression cases to
   `next-transition.check.mts` and `publish-eligibility.check.mts`. Also fixed `ReviewStep.tsx`'s
   "Where to Play" summary, which showed "No channel selected" for a Group-only target — cosmetic,
   found in the same pass, same root cause (write code assumed direct Channels were the only
   target shape).
2. **`publicationDrift()` crashed on a flat Publication's Group-only drift.** `PublicationDriftCheck.composition_revision`
   and `.layout_updated_at` are `null` outright on a flat (non-composition) Publication's snapshot
   — the backend SQL only builds those as objects `WHEN pub.composition_id IS NOT NULL`. The old
   type declared them as always-an-object-with-nullable-fields, which was harmless *before* this
   ticket because a flat Publication's `drift_check` was always `null` entirely (no Group intent
   ever produced snapshot rows). This ticket is what first lets a flat Publication get a non-null
   `drift_check` (via Group snapshot rows with no Composition), and the very first live test of
   that path threw `Cannot read properties of null (reading 'recorded')` — a Next.js error overlay
   on the Publication detail page. My own `.check.mts` test for this case used the wrong mocked
   shape (`{recorded: null, live: null}` instead of bare `null`), so it passed despite the bug —
   caught only because CLAUDE.md's real-browser-verification requirement surfaced it. Fixed the
   type to `{...} | null`, guarded both call sites in `publicationDrift()`, and corrected the
   `.check.mts` mock to the real null shape.

## Verified in browser (asked first, per CLAUDE.md §3 — user chose "run it yourself")

Built the ADR 0074 §5/ticket-04b scenario against live dev data (`:3000` → Core v2 `:3001`,
`develop` Supabase branch), logged in as `piyapat@thunder.co.th`:

1. Group **S** = the pre-existing "Channel for Screen 3-4" (Synchronized, 2 members: Screen 03,
   Screen 04). Created test Group **A** (Independent) and added Screen 03 to it too (via ticket
   11's D9 modal), so Screen 03 sits in both S and A.
2. New Publication, Target step → "Channel Groups" tab (new) → picked Group A only. Publish →
   activation refused, verbatim: *"Invalid input: synchronized group target is incomplete —
   Channel for Screen 3-4 (missing: Channel for Screen 3-4 – ThunderOne Screen 04)"*.
3. Switched target to Group S (both members) → Publish → succeeded (status `active`, 2 devices).
   Delivery table showed **"via Channel for Screen 3-4"** under both device rows.
4. Added a third channel ("Channel for Screen 2") to Group S via D9 → reloaded the Publication
   detail page → drift banner: *"Group "Channel for Screen 3-4" เปลี่ยนสมาชิกหลังเผยแพร่:
   +Channel for Screen 2"* with a Republish button.
5. Republish → banner cleared, delivery table now lists 3 devices, all still "via Channel for
   Screen 3-4".
6. Cleanup: cancelled the test Publication, removed Screen 2 from Group S, deleted test Group A.
   Channel Groups page back to its pre-session state (1 group, 2 channels in it).

`tsc --noEmit`, `eslint`, and every touched `.check.mts` (`publication-drift`,
`publish-eligibility`, `next-transition`, `api-error`, plus the pre-existing
`channel-groups-api-contract`) are clean. Repo-wide `tsc` still carries its unrelated pre-existing
baseline count.

## Deviations from the ticket text (documented, not asked — R1/R2 judgment calls)

- **No "All Channels" tab.** ADR 0074 §6's design-evidence line quotes the mockup's tab labels as
  "Channels / Channel Groups / All Channels", and the ticket's closing condition copies that
  phrase. The plan doc's own Phase 5 scope (`docs/channels/v02/plan-channel-v02.md` §2 Phase 5
  item 1) only asks to build the "Channel Groups" tab; "All Channels" isn't described anywhere
  beyond the mockup citation, and the existing wizard already has a third, disabled "Screens" tab
  (direct-device targeting) that this ticket doesn't touch. Left "Screens" as-is rather than
  guessing at undefined "All Channels" behavior.

## Files touched

- `src/features/media-workspace/publications/components/GroupsStep.tsx` (new)
- `src/features/media-workspace/publications/components/WhereToPlayPanel.tsx`
- `src/features/media-workspace/publications/components/DeliveryDeviceTable.tsx`
- `src/features/media-workspace/publications/components/PublicationDetailPage.tsx`
- `src/features/media-workspace/publications/components/ReviewStep.tsx`
- `src/features/media-workspace/publications/publication-drift.ts` (+ `.check.mts`)
- `src/features/media-workspace/publications/step-validation.ts`
- `src/features/media-workspace/publications/publish-eligibility.ts` (+ `.check.mts`)
- `src/features/media-workspace/publications/next-transition.check.mts`
- `src/lib/api/api-error.ts` (+ `.check.mts`)

## Next

This was the last ticket in the batch handed off for this session (07-12). Nothing further queued
— next step is the user's call: commit/PR for the whole batch, or start a new ticket.
