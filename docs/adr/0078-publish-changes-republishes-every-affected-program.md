# 0078 — Publish Changes re-publishes every Program that uses the edited Playlist or Layout

Status: accepted (2026-09-29, owner). Extends ADR 0053 (re-publish RPC) and ADR 0045 (snapshot
materialization). Amends ADR 0013 (Playlist editor "Save Draft" button).

## Context

The MVP design "Playlist Publish Flow" adds a second publish path to the Playlist editor and the Layout
(Composition) editor. Today the editors' only publish action opens the Create wizard, which always makes a
**new** Program. An operator who fixes a typo in a Playlist that three Programs already air has no way to
push that fix to those Programs short of re-publishing each one from its detail page. The Layout side
offers that only after drift detection (ADR 0049 §11), and the Playlist side offers nothing at all.

The facts that shape the decision:

- A Program's content is a **snapshot taken at activation** (ADR 0045). Editing a Playlist or Composition
  never changes what a screen plays; `media_job_poll` reads only `publication_snapshot_*`.
- `media_publication_republish` (ADR 0053) already re-snapshots one Program in place. It keeps the
  Program's id, Schedule and Targets, and re-runs every activation guard. The airing snapshot keeps playing
  until commit.
- A Playlist reaches a Program two ways: directly (`publications.playlist_id`) or through a Zone of a
  Composition that a Program publishes.
- "Used by" data exists unevenly. `media_composition_programs_list` returns Programs without channel counts;
  Playlists have only `publication_count`.

## Decision

1. **The editor's publish button becomes a split button `Publish ▾` with two items:**
   - **Publish Changes** is the new path.
   - **Publish to Channel…** is the existing wizard path, unchanged.

   Clicking either part opens the menu; there is no default action. Publish Changes is disabled, with the
   hint "Not used by any program", when no Program is affected. A draft Composition always falls in this
   case.
2. **Publish Changes = re-publish, not versioning.** No version or published copy is added to Playlists or
   Compositions. Saved edits are the "draft", and they reach screens only through Publish Changes or a new
   Program.
3. **Affected Programs.** These are the Programs whose effective status is `active` or `scheduled`.
   - Ended, cancelled and draft Programs are excluded. A draft snapshots fresh content at its own
     activation, and ADR 0053 refuses a cancelled one.
   - Membership is decided by **`publication_type`**, never by which id column happens to be filled in.
     Nothing in the database stops a Program from carrying both `playlist_id` and `composition_id`: the
     wizard's `setPlaylistId`/`setCompositionId` do not clear each other, and `publications-api.ts` sends
     both. Activation, however, branches on type alone (`activate.sql:70`). So:
     - A Playlist's **direct** Programs are those with `publication_type <> 'composition' AND
       playlist_id = X`.
     - A Playlist's **indirect** Programs are those with `publication_type = 'composition'` whose
       Composition has a Zone bound to X. The list names the Composition each one comes through.
     - A Composition's Programs are those with `publication_type = 'composition' AND
       composition_id = X`.

     Because the two branches are split by type, no Program can be both direct and indirect.
   - The set is **distinct by publication id**. A Composition may bind the same Playlist in several Zones,
     and without `DISTINCT` one Program would be re-published twice in the same call and counted twice in
     "applied to N".
4. **All-or-nothing bulk RPCs.** `media_playlist_publish_changes(p_tenant_id, p_playlist_id, p_actor_id)`
   and `media_composition_publish_changes(p_tenant_id, p_composition_id, p_actor_id)` each resolve the set
   from §3 and call `media_publication_republish` for every member in **one transaction**.
   - If any member is refused, the whole call rolls back and the error names the failing Program. Screens
     never end up with a mix of old and new content.
   - Members are re-published **in `ORDER BY publication id`**. `media_publication_activate` takes
     `FOR UPDATE` on each row, so two overlapping bulk calls could deadlock if they locked in different
     orders.
   - **Error contract.** The frontend parses this message, so it is part of the API.
     - Each member's call is wrapped in `BEGIN … EXCEPTION`.
     - If `SQLERRM` starts with a prefix that `callMedia` (`EXPECTED_ERROR` in Thunder_Core
       `src/lib/core/media.ts`) passes through, it is re-raised as
       `Invalid input: program "<name>" — <original message>`.
     - Any other error is re-raised unchanged. `callMedia` then masks it as "Media operation failed", so
       internal errors (constraints, deadlocks) never reach the UI raw.
   - Authorization is unchanged. The RPC filters by tenant, and the route calls `requireMediaTenant`. No
     `media_*` RPC checks a role today; adding role checks is a separate decision.
   - A retry after a timeout only adds one more snapshot and Job per Program, which is harmless, so no
     idempotency key is needed.
5. **One source for the affected set.** An internal helper, `media_core.publish_changes_targets`,
   computes the §3 set. Both the bulk RPCs and a single read RPC, `media_publish_changes_programs(
   p_tenant_id, p_playlist_id, p_composition_id)`, use it, and both editors read from it for the modal
   and for the "Used by N programs" header.
   - As a result, what the user confirms is by construction what gets re-published.
   - The read RPC returns name, effective status, schedule summary, channel count and `viaComposition`.
   - `media_composition_programs_list` is **not changed**. It keeps serving the Layout trash guard, which
     also needs `draft` Programs.
6. **Unsaved edits are saved first.** If the editor is dirty, Publish Changes saves and then publishes. A
   failed save (for example a revision conflict, ADR 0003) stops the flow before any re-publish. Publish
   to Channel… keeps its existing rule: save first, then the button enables.
7. **The Playlist editor's "Save Draft" becomes "Save".** There is only one kind of save, so a second
   "Save draft" item would be a duplicate. The Composition editor keeps "Save & Activate", because
   activation is a real state change.
8. **The modal has four states, following the design:**
   1. Confirm — the affected-Program list.
   2. Publishing — an indeterminate spinner, since one request gives no per-Program progress.
   3. Updated — "applied to N programs (M channels)". M counts **distinct Channels across all N
      Programs**, so a Channel shared by two Programs is counted once. A Channel reached through a
      Channel Group counts as well as one targeted directly; device-only targets are not counted.
   4. Failed — the failing Program's name and a mapped reason, such as an unbound Zone, an incomplete
      synchronized group or a quarantined asset. Raw database text is never shown.

   Failed offers Close only.
9. **"Used by N programs"** in the editor header opens the same list read-only, with no confirm button.
10. **The wizard pre-fills the Program name (Prepare Content step).** When the name is empty, or still equals
    the previous auto-filled value, it is set as follows:

    | Content | Pre-filled name |
    |---|---|
    | Playlist | the Playlist name |
    | Composition | the Composition name |
    | Media, one asset | that asset's title |
    | Media, several assets | `<first title> +N` |

    A name the user typed is never overwritten, even after they go back and change the content. The channel
    name is not appended, because channels are chosen in a later step.

## Rejected

- **Programs read Playlists live.** This would make Publish Changes unnecessary, but it undoes ADR 0045:
  proof-of-play and the download report would no longer describe what actually aired.
- **Playlist/Composition versions (draft vs published copy).** This is the clean long-term model, but it
  needs a new data model for both entities and every read path. Re-publish gives the same operator result
  with RPCs that already exist.
- **The client loops `republish` once per Program.** This would give real per-Program progress, which is
  the design's "60%" bar. A failure partway through, though, leaves some screens on new content and some on
  old, and that state is harder to explain and recover from than a clean refusal.
- **Keep "Save" and add a "Save draft" dropdown item.** Both would perform the identical write.

## Consequences

- Thunder_Core gains one internal helper and three RPCs. No existing function changes, so there is no
  `DROP FUNCTION`. Applying to develop and prod is R0 and needs approval each time.
- **Every affected Program is re-stamped.** Activation sets `published_by = p_actor_id` and
  `activated_at = now()`, so each of them reads as "published by" whoever pressed Publish Changes.
- **Going through a Composition re-snapshots the whole Composition.** Publishing a Playlist also takes live
  any unpublished edits to the Composition's other Zones or its Layout. It also means a problem in another
  Zone, such as a quarantined asset or an empty Playlist, rolls back the entire bulk call for a reason
  unrelated to the Playlist being edited. The failure message names the Program, which is enough for the
  operator to find it. Accepted for the MVP.
- Re-publishing the same Program many times accumulates snapshots and Jobs. ADR 0053 already made every
  read pick the newest one.
- A Playlist used by many Composition Programs re-publishes all of them in one transaction. This is
  acceptable at current tenant sizes (tens of Programs). If it gets slow, move it to a background job.
- Out of scope: an "Unpublished changes" badge, which needs Playlist-side drift detection in the backend,
  and Publish Changes from the Playlists list page.
