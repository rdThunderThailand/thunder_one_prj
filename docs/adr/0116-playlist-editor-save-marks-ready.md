# 0116 — The Playlist editor's Save marks a draft ready; the Program picker lists drafts

Status: accepted (2026-11-18, owner decision after UAT v1.0 finding #404).
Amends ADR 0060 §2 (the editor's only save control is *Save Draft*) and the "one stored transition"
paragraph under §3 (*Mark as ready* is a list-page row action).

## Context

UAT on prod (#404): an operator created a Playlist, pressed Save, went to Programs → Create Program,
and could not find it. Save writes `status = 'draft'`, and the Program wizard's Playlist picker called
`fetchPlaylists()` without `include_drafts`, so drafts never appeared, even under its own "Draft" status
filter. The way out, *Mark as ready*, sits in the ⋯ menu of the Playlists list, so making a Playlist
usable took a save, leaving the editor, and a menu action most operators do not find.

Meanwhile the editor's *Publish to Channel* already opens the wizard with a draft's id, and prod holds
11 Programs that point at draft Playlists, so Core accepts drafts in a Program.

## Decision

1. **The editor's primary button is *Save & Activate* while the Playlist is a draft** (new or saved as
   draft). It saves and sends `status = 'active'`. Once the Playlist is no longer a draft the button is
   plain *Save* and sends no status (as before, a save never demotes).
2. ***Save Draft* moves to the button's ▾ menu**, shown only while the Playlist is a draft, and keeps
   today's behaviour. This mirrors the Layout editor (*Save Layout* ▾ *Save & Activate*), with the
   default flipped because a Playlist has nothing like unbound Zones that makes activating risky.
3. **The Program wizard's Playlist picker lists drafts too** (`fetchPlaylists(true)`), so its Draft filter
   matches something and a Playlist saved as draft is still reachable.
4. *Mark as ready* on the list page stays for drafts saved before this change.
5. **The Publish button runs the path that fits, in both editors** (amends ADR 0078 §1, where either part
   only opened the menu). With no active or scheduled Program using the row it runs *Publish to Channel…*;
   once one does, it runs *Publish Changes*. The ▾ menu keeps both. Save and Publish menus share one
   dropdown component, so opening one closes the other (two stacked menus hid *Save Draft* in testing).
6. ***Publish to Channel…* is never disabled for a row that is not ready; it asks first.** A draft or
   inactive row, or one with unsaved edits, opens a dialog whose one button does the missing step and then
   opens the wizard: *Save & Activate แล้วไปต่อ* (draft Playlist; Layout that is not Active) or *Save แล้วไปต่อ*
   (unsaved edits only). A Layout that cannot be activated (unbound Zones, invalid name or Zones) gets the
   reason and only a close button. A failed save keeps the dialog open. This replaces the disabled item and
   its tooltip, which UAT showed nobody finds (#401, #402). *Publish Changes* is unchanged: it already saves
   first (ADR 0078 §6) and only applies to a row a Program already uses.

## Not chosen

- **Keep Save as draft-only and only list drafts in the picker.** Fixes #404, but every Playlist would
  stay a draft forever unless someone finds *Mark as ready*, so "Draft" would stop meaning anything.
- **Keep ADR 0060 as is and fix the UAT step.** That documents the hidden step instead of removing it.

## Consequences

- "Draft" now means "the operator chose Save Draft", not "every Playlist saved from the editor".
- The editor owns a status transition again, which ADR 0060 §3 had kept out of it on purpose. That only
  covers ready/not ready; it still has no targeting authority.
