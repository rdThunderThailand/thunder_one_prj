# The Create wizard reshapes the steps, not the Publication

**Status:** accepted · 2026-09-10
**Extends:** `0052-merged-layout-authoring.md` §1 (operator words differ from contract words), `0064-zone-media-presentation.md` (Zone beats Playlist), `0003-draft-optimistic-locking.md`, `0045-publication-snapshot-materialization.md`
**Source:** the eight ver02 frames in `docs/publications/ver02/design/`

## Context

The ver02 design presents publishing as a five-step **Create** flow — `Choose Content → Prepare
Content → Program → Review → Publish` — with three large modal pickers hanging off step 1 (Media,
Playlist, Layout).

A working five-step wizard already exists at `/media-workspace/publications/create`, but its steps
are cut differently: `Basic Info → Content → Channels → Schedule → Review & Publish`. It carries
machinery that took real work to get right — a localStorage-persisted draft, a server draft row with
an optimistic-lock `revision`, an idempotency key, a resume prompt, step validation, schedule
recurrence and timezone arithmetic, conflict detection and publish eligibility.

The design also draws a number of things the platform has never had: a video editor, an
event-triggered play mode, program templates, offline playback behaviour, publish notifications,
a lock-after-publish permission, and an audio volume slider. Separately, it names the artifact
**Program**, while the glossary and the schema call it a **Publication**.

The question this ADR settles is which parts of the design are a new arrangement of things that
exist, and which parts are new things — and what happens to the latter.

## Decision

### 1. Program is the operator word for Publication

No new entity. `media_core.publications` is unchanged; the UI says *Program*, the schema, the API
and `CONTEXT.md` keep saying *Publication*. This is exactly the split ADR 0052 §1 already made for
Layout/Composition, and it comes with the same rule: use the operator word in UI strings, the
contract word in code, and never both in one sentence.

**The word changes inside the ver02 Create flow only.** The list page, the detail page, Now & Next
and every validation message keep saying Publication until a separate terminology sweep says
otherwise. Renaming the whole surface is a larger, independently schedulable piece of work; scoping
it here would mean the flow ships next to a list page whose labels contradict it either way, and the
narrower promise is the one this ADR can actually keep.

Routes do not move. `/media-workspace/publications` stays where it is, for the same reason
`/media-workspace/layouts` points at `compositions`: a route is where the code lives, not what the
operator reads, and moving it costs every existing link.

### 2. The new step boundaries replace the old ones in place

The wizard is re-cut inside `src/features/media-workspace/publications/`, reusing the draft store,
the API services, the validation and the publish path. No second `/create` route is introduced,
because two ways to build the same object is a synchronization debt for the life of the product.

The re-cut is a redistribution, not new state:

| ver02 step | comes from |
|---|---|
| 1 Choose Content | old step 2 (Content), split out |
| 2 Prepare Content | old step 1 (Basic Info) minus campaign/language, plus preview + Content Info; no readiness checklist (§9) |
| 3 Program | old step 3 (Channels) + old step 4 (Schedule) + priority from old step 1 |
| 4 Review | first half of old step 5 |
| 5 Publish | second half of old step 5 |

`campaign_id` and `language` are dropped from the flow. `campaign_id` is optional at every layer of
the API, so removing the control changes no contract; `language` had no reader.

The stepper is navigable backwards — a completed step can be clicked to return to it, an unreached
step cannot. This adds no path that "Change Content" in step 2 did not already open.

### 3. Creating new content leaves the wizard and comes back through a seed parameter

The three pickers are modals over the wizard, so choosing existing content never unmounts anything.
Creating *new* content is different: the Playlist editor and the Composition editor are full pages,
and neither belongs inside a modal.

So the picker's "create new" affordance navigates to the real editor, and the editor gains a
**Publish** action that returns to the wizard at step 2 with the new content already selected. The
existing `?compositionId=` seeding parameter generalizes to `?playlistId=` / `?assetId=`; no
`returnTo` round-trip is needed, because the editor's own save is the handoff.

Arriving this way with a draft already in localStorage uses the existing resume prompt: the operator
chooses between continuing that draft and starting fresh, and only a fresh start is seeded. A draft
is never overwritten silently.

Changing the content type after the fact still clears the selected content — but behind a
confirmation naming what survives ("the schedule and the selected Channels stay"), not silently as
the store does today.

### 4. Step 2 edits the Publication, never the Asset

Name, description and tags on step 2 belong to the Publication. They are the old Basic Info fields
in a new place, and step 5's "Program Name: Summer Promotion - Lobby" — which is not a filename —
confirms the reading.

Editing the underlying Asset's own title from here is refused, even though `media_asset_rename`
exists: a form that edits shared library metadata while presenting itself as this program's settings
is a trap, and one rename would silently reach every other Publication using that file.

The frame draws four more controls in the same form, and each needs its own answer, because "it is
an input in the mockup" is not a decision:

- **Type** and **Resolution** are facts about the file. They render read-only. Making them editable
  would mean either lying (the Publication claims a resolution the file does not have) or
  transcoding, which is not in ver02.
- **Duration** splits by media kind. For video it is derived from the file and read-only. For an
  image it is a real Publication-level value that already exists and is already editable
  (`DraftAssetItem.duration_seconds`, default 10s) — it stays editable, because removing it would
  drop a capability the current wizard has.
- **Add Poster** is dropped. A poster frame is Asset-level artwork with no field on the Publication
  to hold it, so implementing it means writing to the shared Asset — which §4 has just refused.

The rule the implementer follows when a control is not listed anywhere: a field that describes the
file is read-only; a field that describes this program is editable; anything that would write to the
Asset is dropped. Every control in all eight frames is enumerated with its disposition in
`docs/publications/ver02/plan-create-wizard.md` so this rule never has to be re-derived.

### 5. Where to Play ships Channels only

The design's three tabs are Screens / Channels / Groups, defaulting to Screens (a Media Device) in a
location tree. Today targeting emits `target_type: "channel"` unconditionally and groups by channel
category, and **Groups is not an entity that exists at all**.

ver02 makes the Channels tab work and renders Screens and Groups disabled. Direct device targeting
is typed for (`target_type: "device"`) but has never been emitted; promoting it needs the backend
path verified first, and it is a separate piece of work from re-cutting the wizard.

### 6. There is one start time, and step 3 owns it

The design asks for a date range in step 3 ("When to Play") and again in step 5 ("Schedule
Publish"). Those are genuinely different ideas — when the content airs, versus when the program
takes effect — but they are trivially contradictable by an operator who fills both in, and the model
has never had the second one.

Step 5 therefore offers **Publish Now** as the only action, and states the step-3 schedule
read-only. "Scheduled" publishing is what a future `starts_at` already means: activation arms it.
Adding a second time dimension to the schema to solve a problem nobody has reported is refused.

### 7. How to Play never overrides the Playlist or the Zone

When the content is a Playlist or a Composition, step 3 shows the inherited settings read-only with
a link to their real editor.

On the **loose-media branch** — the one case where no one else owns those values — only what has
somewhere to be stored is editable: item order and the per-item `cut`/`fade` transition, both of
which the draft already carries and the payload already sends. Play order, repeat and transition
duration are **not** editable, because nothing persists them: the draft has no playback state, the
content payload carries only `duration_seconds` and `transition`, and Core creates the machine-owned
Playlist with no `metadata`, so the player falls back to its own defaults whatever the form
collected. They render read-only at those defaults, labelled as such. Making them editable is a
draft-field + payload + Core-RPC + migration change, and is deliberately not part of this ADR.

Inverting this — letting the Publication win — would reverse ADR 0064 §1, which gives the Zone
precedence because the Zone is the only party that knows the shape of the frame and the presence of
sibling Zones. Nothing in ver02 supplies a new reason to reverse it. A toggle between "inherit" and
"override" is refused too: it is only usable by someone who already understands the inheritance
chain.

### 8. What the design draws but ver02 does not build

These render as disabled controls carrying a "not built yet" title, matching the existing precedent
in the Schedule step (Publish Order, Delay between channels):

- **Quick Edit Tools** (trim, overlay, advanced) — a video editor is larger than the whole wizard
- **Play Mode: Event** — no event source exists
- **Load from Template** (program templates) — no such entity
- **Playback Behaviour when offline** — the player contract carries no such field
- **Notifications** (email, system) on publish
- **Permissions: lock after publish** — republish-in-place (ADR 0053) is the current answer
- **Audio + volume** on step 3 — `CONTEXT.md` records volume as stored intent no player reads
  (ADR 0010); shipping a live-looking slider that changes nothing on a screen is worse than
  shipping nothing

### 9. The checklist shows only what is measured

Step 2 ends up with **no readiness checklist at all**, and that is the correct outcome rather than a
gap. Taking the design's five rows in turn: "file is playable" and "no audio noise" have nothing
that measures them; "resolution/aspect fit" needs targets that step 3 has not collected yet; the
standalone "resolution is suitable" row is demoted to a branch-specific fact in the Content Info
rail, because suitability is exactly the target-dependent claim the previous row already owns; and
"file size" is vacuous, because `rejectUploadReason` validates one browser `File` at upload time and
Core plus the `media` bucket already enforce the same ceiling (ADR 0059) — a stored Asset has passed
it by definition, and no validator exists for a Playlist's or a Composition's constituent assets.

What step 2 keeps is a Content Info rail stating facts — type, size, resolution, duration — rendered
per branch, since they mean different things on each (one Asset has one resolution, a Playlist has
neither a single resolution nor a guaranteed-complete duration, a Composition has a reference
resolution and a duration per Zone). Facts are not ticks, and one green tick spanning all three
branches would be asserting something it never checked.

The aspect-ratio fit check moves to step 4, after targets exist. `summarizeGeometryFit` returns an
empty result both when no Channel is selected and when there is no Composition aspect ratio to fit
against, so on step 2 it would have rendered green having measured nothing.

"File is playable" is left as a declared slot to be filled when the codec probe of ADR 0069/0070
reaches the code — it is documentation only today. "No audio noise" is dropped: nothing measures it.

A checklist that shows a green tick without having checked anything is worse than no checklist,
because operators believe it.

The same rule applies to step 4's checklist, which is where the risk actually lives today: the five
labels in `mock-data.ts` are static strings, and their statuses are assembled separately in
`publish-eligibility.ts` — where `policyCheckStatus` is the literal `"unknown"`. Every row must name
the validator that produces its state; a row with no validator is dropped, and a row whose validator
returns `unknown` renders as unknown, never as a green tick. The design's fourth row ("playback
settings are complete") has no validator today: it is dropped unless step 3 gains one, since after
§7 there is nothing for it to check on the Playlist and Composition branches anyway.

## Consequences

- The draft store keeps its shape. The re-cut needs no new persisted fields; it moves existing ones
  between steps and drops two.
- Every wizard step component except `SelectedAssetList` reads `usePublicationDraftStore` directly.
  Reusing them across the new step boundaries means following the `selection?: SelectionOverride`
  precedent that `SelectedAssetList` already set.
- The three pickers share one shell — filter rail, results, detail panel, selection footer — but the
  design asks for filters that no existing picker has (status, resolution, duration, category) and
  for pagination inside a picker, which exists only on list pages.
- Screens and Groups targeting, event play mode, offline behaviour and the codec-probe checklist row
  are each a later, independently shippable piece; none is blocked by this ADR, and each has a
  declared place to land.
- The Review timeline shows other programs on the same screen as full-width shaded bands, because
  the conflict payload carries `starts_at`/`ends_at` per Publication but no daily window. It answers
  "this screen is not free today", not "it is busy at 14:00". Making it precise is a Thunder_Core
  change, deliberately not taken now.
