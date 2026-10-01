# SESSIONLOG — ver02 Create wizard design

**Date:** 2026-09-10 · **Branch:** `feat/pubflow` · **Code touched:** none (docs + GitHub issues only)

## What was asked

Design the new publishing flow from the ver02 Figma frames in
`docs/publications/ver02/design/` (8 images) and record what the existing codebase can be reused
for. Run as a grilling session (`grill-with-docs` = `grilling` + `domain-modeling`).

## How it ran

Read all eight frames, pulled the glossary from `CONTEXT.md`, and dispatched two Explore agents —
one to map the existing publication authoring flow, one to inventory reusable building blocks. Then
five rounds of grilling, 20 questions, every one with a recommended answer. The frontier emptied at
round 5.

Two corrections from the user reshaped the tree mid-session: the three step-1 pickers are **large
modals over the wizard**, not full-page routes (so the wizard never unmounts), and "create new"
navigates to the *existing* editor which gains its own Publish action back into the wizard — cheaper
than the `returnTo` round-trip originally proposed.

## What was decided (ADR 0072, nine sections)

1. **Program is the operator word for Publication**, inside the ver02 Create flow only. No new
   entity, no route move. List, detail, Now & Next and validation keep saying Publication.
2. **The wizard is re-cut in place** — same route, same store, same API. The five ver02 steps are a
   redistribution of state that already exists; `campaign` and `language` are dropped.
3. **Create-new leaves for the real editor** and returns through a seed parameter, behind the
   existing resume prompt.
4. **Step 2 edits the Publication, never the Asset.** Type and resolution are read-only facts;
   duration is read-only for video but stays editable for images (an existing capability);
   Add Poster is dropped.
5. **Where to Play ships Channels only.** Screens and Groups are disabled.
6. **One start time, owned by step 3.** Step 5's separate "Schedule Publish" date is dropped.
7. **How to Play never overrides a Playlist or a Zone** (would reverse ADR 0064).
8. **Seven designed features render disabled**, matching the repo's existing "not built yet"
   precedent.
9. **Checklists show only what is measured** — every row names its validator.

## The three findings that changed the design

Each was verified against real code before being acted on, not taken from a report:

- **Loose-media playback has nowhere to be stored.** `DraftFields` carries no playback state,
  `draftItemsToContentItems` sends only `duration_seconds` and `transition`, and Core creates the
  machine-owned Playlist as `INSERT INTO media_core.playlists (tenant_id, name, status, kind)` with
  no `metadata` — so the player falls back to its own defaults whatever the form collects. Play
  order and repeat became read-only; item order and per-item `cut`/`fade` stay editable because the
  draft already carries them.
- **Step 2 cannot measure fit.** `summarizeGeometryFit` returns an empty result both when no Channel
  is selected and when there is no Composition aspect ratio; at step 2 `channelIds` is still empty,
  so a row fed by it would render green having measured nothing. The check moved to step 4.
- **Step 2's whole checklist collapses.** "File is playable" and "no audio noise" have no validator;
  "file size" is vacuous because `rejectUploadReason` validates one browser `File` and Core plus the
  `media` bucket already enforce the ceiling (ADR 0059). Frame 2 ships no checklist and states facts
  in the Content Info rail instead.

Also caught: the seed effect at `CreatePublicationPage.tsx:143-155` applies to whatever draft is
already hydrated *before* the resume prompt is computed at line 345 — generalizing it as-is would
mutate a draft the operator then chooses to continue. The plan now specifies a pending-seed
resolver with four states and one runnable check.

## Reuse map (in `docs/publications/ver02/plan-create-wizard.md`)

A control disposition matrix covers every control in all eight frames: `SHIP / READ-ONLY / DISABLED
/ DROP`, each with its source of truth and code status `REUSE / ADAPT / NEW`.

Work packages: **11 new product UI · 20 adaptation/extraction · 3 cross-feature · 11 disabled ·
10 dropped controls.**

Drop-in with no change: the whole `preview/*` set, `schedule.ts`, `LayoutTemplatePicker` +
`LayoutWireframe` + `template-picker.ts`, the folder/tag rails, the playlist table and side panel,
`MiniCalendar`, `usePublishDraft`, and the draft store's persistence, locking and idempotency.

Cross-feature blast radius, which the first draft of the plan missed: `ui/WizardSteps.tsx` (three
`people/add-person` wizards use it), `ui/Pagination.tsx`, and a Publish action in each of the
Playlist and Composition editors.

## Output

- `docs/adr/0072-the-create-wizard-reshapes-the-steps-not-the-publication.md`
- `docs/publications/ver02/plan-create-wizard.md`
- `CONTEXT.md` — Program/Publication vocabulary pair added under **Publication**
- `docs/publications/ver01/` — the seven ver01 plans moved out of the shared directory
- Commits `0b51e4b` (docs) and `64fb212` (design frames, 19 MB)
- GitHub issues **#76–#87**, all labelled `ready-for-agent`, each carrying the constraint that
  applies to it so an implementer does not rediscover it

## Not done

No code. No backend change, no migration — the plan is explicit that ver02 needs neither. The
documents went through four review rounds; the last one closed with no Major findings remaining.

## Next

Switch to Sonnet — no design fork is open. `#76` gates everything; `#77` and `#78` then run in
parallel; `#79` is the real bottleneck since `#80`/`#81` reuse its shell; `#83` is independent and
worth starting early. Suggested delegation: `#83`, `#80`, `#81` to `agy`; keep `#78`, `#84`, `#85`,
`#77` in-session. Four Draft PRs rather than one: `#76-78`, `#79-81`, `#82-84`, `#85-87`.
