# Playlists: a draft is something you save on purpose

Date: 2026-08-13
Status: approved, not yet implemented
Scope: `thunder_one_prj` frontend **and** `Thunder_Core` backend. Includes a production
migration — R0, needs explicit approval at apply time.

## Problem

ADR 0012 made "draft" mean *"the wizard got past step 1"*. Pressing Next created a row with
`status='draft'`, and `media_playlists_list` was taught to hide every such row from both the
`/playlists` page and the publication content picker.

That model does not match how the feature is meant to be used. The intended meaning:

- A **draft** is a playlist the operator deliberately saved with the Save Draft button. It is a
  real thing they expect to find again, listed on `/playlists` with a Draft status.
- **Auto-save while moving through the wizard is not a draft.** It only exists so that leaving
  the page and coming back does not lose the work in progress.

Under the shipped model the two are conflated, with three consequences:

1. Every abandoned wizard leaves a `status='draft'` row on production that no screen can show
   and nothing can delete. There is one such row on production today.
2. The Save Draft button — the feature the previous sprint was built around — has no observable
   effect that distinguishes it from pressing Next.
3. Drafts are unreachable. `media_playlists_list` filters them out (verified against production),
   so the only route back to one is a `localStorage` banner in the same browser.

A separate, smaller defect motivated this review: the "มี draft ที่ทำค้างไว้อยู่" banner is
computed from `hasDraftContent(draft)`, which reads **live** store state. `draft.name` changes on
every keystroke, so the banner fires the moment the operator types the first character of a brand
new playlist — announcing leftover work that is in fact what they are typing right now.

## Decision

A server row is created only when the operator asks for one.

| Action | Server effect |
| --- | --- |
| Typing, picking media, changing settings | none — `localStorage` only |
| Next / Back | none — `localStorage` only |
| **Save Draft** | upsert with `status='draft'` |
| **Create Playlist** (final submit) | upsert with `status='active'` + items |

Rejected: keeping the row but adding an `explicitly_saved` column to distinguish a real draft
from wizard scratch state (publications' pattern). It survives a browser change or a crash on
another device, which the localStorage-only model does not. Declined because it needs a new
column and keeps every abandoned wizard writing a row to production — paying the cost this
change exists to remove, to buy cross-device recovery nobody asked for.

Consequence accepted deliberately: work not yet saved with Save Draft lives only in that
browser. Clearing site data or moving to another machine loses it. This is the same guarantee
the wizard had before the draft-save sprint, and the Save Draft button is the escape hatch.

### Frontend — `thunder_one_prj`

**1. `goNext` stops writing to the server.** Remove the `persistDraft({ activate: false })` call
added in the previous sprint; Next becomes validation plus `setStep` again. The
`usePlaylistDraftSave` hook stays — `saveDraft` and `handleSubmit` remain its callers.

**2. The banner reads a snapshot, not live state.** Capture whether there was leftover content
once, when the store finishes rehydrating, and drive the banner from that. Typing must never
raise it. The existing "ทำต่อ / เริ่มใหม่" copy and actions are unchanged.

**3. The banner asks at any step, not only step 1.** Today it is gated on `step === 1`, so an
operator who left off on step 3 is silently dropped back into step 3. Under this design the
prompt is the thing that distinguishes "start fresh" from "carry on", so it has to appear
wherever the rehydrated wizard lands.

**4. `/playlists` shows drafts.** Three call sites currently assume two statuses and must
handle a third:
- `PlaylistsListPage.tsx:75` and `PlaylistDetailPanel.tsx:75` render
  `status === "active" ? "Active" : "Inactive"`, so a draft would be mislabelled "Inactive".
  Add a Draft badge, visually distinct from Inactive.
- `PlaylistsListPage.tsx:113-118` computes `inactive = total - active`, which would silently
  count drafts as inactive. Count drafts separately.

**5. Editing a draft uses the path that already exists.** `PlaylistDetailPanel.tsx:115` links to
`/playlists/create?id=<uuid>`, and the wizard's `?id=` hydration already loads a playlist into
the draft store. No new route.

**6. The publication content picker must keep not seeing drafts.**
`AssetLibraryStep.tsx:114` and `PlaylistsListPage.tsx:95` both call the same parameterless
`fetchPlaylists()`. After the backend change the list page opts in; the picker does not.

### Backend — `Thunder_Core` (R0)

**7. `media_playlists_list` gains `p_include_drafts boolean DEFAULT false`.** The predicate
`AND pl.status <> 'draft'` becomes conditional on it.

**Default `false` is deliberate.** A future caller that forgets the parameter gets the safe
behaviour — no drafts — rather than leaking incomplete playlists into a picker. The failure mode
of the wrong default is silent and user-visible; the failure mode of this one is a missing row
that someone notices immediately.

`CREATE OR REPLACE FUNCTION` does **not** replace when a parameter is added — it creates an
overload, and existing calls become ambiguous and start failing. The migration must
`DROP FUNCTION IF EXISTS media_playlists_list(<existing signature>)` first. This is the same trap
ADR 0003 and ADR 0012 both recorded; check the live signature before writing the DROP.

**8. `GET /api/core/v1/media/playlists` reads an `include_drafts` query parameter** and passes it
through. Absent means false.

**9. `fetchPlaylists(includeDrafts?: boolean)`** on the frontend client, defaulting to false.

## Hazard found while surveying — must be handled

**Activating a draft from the list bypasses the wizard entirely.**
`PlaylistDetailPanel.tsx:123-126` renders an Archive/Activate button from
`status === "active" ? "Archive" : "Activate"`, and `PlaylistsListPage.handleStatusChange`
(L122-133) sends `upsertPlaylist({ playlistId, name, status: next })`.

A draft is not `active`, so the panel would offer **"Activate"**, and pressing it would publish a
playlist that never passed `validateStep` — no items, no playback settings — straight to the
screens. `media_playlist_upsert`'s status guard does not stop this: it only blocks moving *back*
to `draft`, not `draft → active`.

Required: a draft must not offer Archive/Activate. Its action is "continue editing", which the
Edit Playlist link already provides. The status toggle appears only for `active`/`inactive` rows.

## Out of scope

- **`media_playlist_delete` and a Cancel button.** Still deferred. Note this change shrinks the
  problem it was meant to solve: rows are no longer created by merely walking the wizard, so the
  only rows that can be abandoned are ones the operator deliberately saved — and those are now
  visible on `/playlists`, so they are no longer invisible litter.
- **The `kind='inline'` bug** in `media_playlist_upsert` (reads `kind='single'`, updates
  `kind='user'`, so 7 inline rows on production silently no-op). Pre-existing, previously
  deferred with the repo owner's agreement.
- **Cross-device resume.** Explicitly rejected above.
- **Cleaning up the one existing `status='draft'` row on production.** It becomes visible as a
  Draft on `/playlists` when this ships, which is the correct outcome. No migration data step.

## Relationship to the open PR

`feat/playlist` (PR #2, Draft) contains the previous sprint plus the Save Draft work. This change
reverts exactly one thing from it — `goNext`'s server write — and keeps the rest: the Save Draft
button, `resolveDraftStatus`, the `usePlaylistDraftSave` hook, the metadata-restore fix, and the
stale-retry guard.

**PR #2 should not be merged or deployed ahead of this change.** Shipping it alone would put the
auto-create-on-Next behaviour into production for a window and start accumulating exactly the
invisible rows this design removes. Ship them together.

## Risks

- **The migration is the whole risk surface.** `media_playlists_list` serves both the management
  page and the publication picker; a mistake in the DROP/CREATE ordering breaks both at once.
  Dump `prosrc` after applying and diff it against the migration file.
- **A draft reaching the publication picker** would let an operator schedule an unfinished
  playlist to real screens. The `default false` choice above is the structural guard; the
  verification plan tests it directly rather than trusting it.
- **Reverting `goNext`'s write is a behaviour rollback within an unmerged branch.** Confirm no
  other code came to depend on `playlistId` being set by Next — in particular `handleSubmit`,
  which must still work when the wizard reaches the last step having never touched the server.

## Verification plan

Type and unit level:

- `npx tsc --noEmit` and `npx eslint src/features/playlists` clean in `thunder_one_prj`.
- Every `*.check.mts` under `src/features/playlists/` passes.
- The banner's snapshot logic should be extracted far enough to get one `*.check.mts` covering
  "content at hydration ⇒ prompt" and "empty at hydration, then typed ⇒ no prompt". That second
  case is the reported bug and is worth pinning.

Database, after applying the migration:

- Dump `prosrc` for `media_playlists_list` and diff against the migration file.
- Call it both ways for the tenant and confirm the draft row appears only with
  `p_include_drafts => true`.

Browser (blocked until `Thunder_Core` is deployed; ask before running):

1. Create Playlist with an empty store → no prompt, type a name → still no prompt.
2. Fill in a name, walk to step 3, navigate away, return → prompt appears; "ทำต่อ" restores the
   work, "เริ่มใหม่" clears it.
3. Walk the whole wizard **without** pressing Save Draft → confirm no row is created at any
   point (check the database, not just the UI).
4. Press Save Draft → row appears with `status='draft'` and shows on `/playlists` with a Draft
   badge.
5. Open that draft from the panel's Edit Playlist → the wizard loads its name, items, description
   and playback settings → finish it → it becomes `active`.
6. Confirm the draft offers no Archive/Activate control in the panel.
7. Open the publication wizard's content picker → confirm the draft is **not** listed.
