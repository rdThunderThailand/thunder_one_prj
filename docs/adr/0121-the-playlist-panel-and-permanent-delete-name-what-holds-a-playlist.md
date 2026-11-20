# 0121 — The playlist panel and permanent delete name what holds a playlist

Status: accepted (2026-11-20, owner decisions in a grilling session on the ADR 0120 follow-ups).
**Workspace:** media-workspace

Builds on [ADR 0120](0120-playlist-in-use-counts-layout-programs-and-only-live-statuses.md). ADR 0120
decided which Programs make a playlist **in use**. This ADR decides how the screens show the operator
what holds a playlist, and when permanent delete is refused. ADR 0120's rules stay as they are.

## Context

ADR 0120 shipped on prod in Core v0.27.0 and One v1.0.1. It left three follow-ups in
`docs/media-workspace/playlists/plan-playlist-in-use-via-layout.md`:

1. **Permanent delete of a playlist that is still in a Layout zone fails.**
   - `media_playlist_permanent_delete` counts only direct `publications.playlist_id` rows.
   - The delete then fails on `composition_zones_playlist_id_fkey` (`ON DELETE RESTRICT`).
   - `callMedia` (`src/lib/core/media.ts`) turns the FK error into `Media operation failed`, so the
     operator sees a generic 500 with no reason. The raw text does not leak.
   - The Trash page enables the button for this playlist, because the gate is
     `publication_count === 0`.
   - The usual way into this state is ADR 0120 itself: Move to Trash accepts a playlist whose Layout
     has no draft or active Program.
   - There is a narrow second way in. The Layout editor's picker hides trashed playlists, but
     `media_composition_set_zones` checks only the playlist's tenant, not `deleted_at`. A stale editor
     or a direct API call can therefore put a trashed playlist into a zone.
2. **The playlist side panel's Publications tab hides Layout Programs.** It fetches every Program of
   the tenant (`fetchPublications()`, no limit) and keeps `playlist_id === playlistId`. A playlist that
   is Active only because a Layout plays it shows an empty tab. The badge says Active, and the tab does
   not show why.
3. **About 80% of prod playlists show Active.** This was measured read-only on prod on 2026-11-20. The
   set is user playlists that are past draft and not in Trash: 242 rows. ADR 0120's "221 of 276" used
   a different denominator.

   | | Customer tenants | `thunder_qa` |
   |---|---|---|
   | Total | 157 | 85 |
   | In use (ADR 0120) | 145 | 67 |
   | ...held by an `active` Program | 94 | 3 |
   | ...held only by `draft` Programs | 51 | 64 |

   - Prod has 145 draft Programs in all. 22 of them were last updated more than 30 days ago,
     and none more than 90 days ago.
   - 75 of the drafts are in `thunder_qa`, the QA fixture tenant.
   - Customer drafts cluster on onboarding days (2026-11-03 to 2026-11-12).
   - 30 Programs are still `active` after their last schedule ended. Removing them would turn 3
     playlists Inactive.
   - The badge is right by ADR 0120's rule. Drafts are not old and abandoned; they are recent, and
     most of them are QA's.

## Decision

1. **Permanent delete names the Layouts that hold the playlist.**
   - Before deleting, `media_playlist_permanent_delete` checks `composition_zones` for the playlist in
     the same tenant. It checks every Layout, including Layouts in Trash, because their zones still hold
     the FK.
   - If any zone holds the playlist, it returns
     `{ deleted: false, reason: 'in_layout', layouts: [{ id, name, in_trash }] }` and does not throw.
     This is the same shape as the existing `reason: 'published'`.
   - The `published` check runs first and is unchanged.
2. **No new key on the playlist list.**
   - The Trash button stays gated on `publication_count`. The operator may press it, and the reply
     names the Layouts.
   - Empty Trash reports Layout-held playlists as their own count ("ถูกใช้ใน Layout N playlist"),
     separate from locked and failed.
3. **A playlist in Trash cannot be newly put into a Layout zone.**
   - `media_composition_set_zones` replaces every zone on each save (delete all, insert all).
   - It refuses a playlist with `deleted_at IS NOT NULL` only when this composition does not already
     hold that playlist. The error is `Invalid input: playlist is in Trash: <name>`.
   - A Layout that already holds a trashed playlist can still be saved. Otherwise editing any other
     zone of that Layout would fail.
4. **Move to Trash keeps ADR 0120's rule.** It is not widened to "in any Layout zone". Widening it would
   make a playlist that only an unaired Layout uses show Inactive and refuse Trash. That is the
   badge/guard split ADR 0120 just closed. Permanent delete would still need decision 1, for Layouts in
   Trash.
5. **The side panel reads a new endpoint: `GET /media/playlists/:id/programs`.**
   - It is backed by a new RPC, `media_playlist_programs(p_tenant_id, p_playlist_id)`, built on
     `media_core.playlist_program_ids`.
   - It returns every Program that plays the playlist, in any status, either directly or through a
     Layout. Each row carries `via_composition` (`{ id, name }` or null).
   - The panel keeps its own live/past split. A Layout row shows "ผ่าน Layout: <name>".
   - Core ships before the frontend. There is no client-side fallback.
   - **The panel had not been mounted anywhere since commit `5c9a1e50` (2026-09-04).** The #38/#40/#41
     list rewrite dropped it, and its commit message does not mention it. Browser verification on
     2026-11-20 found this.
   - It comes back as a right-hand drawer (`PlaylistDetailsDrawer`), opened from a new first row-menu
     item, "Details". It is in list view only and not in Trash. A drawer was chosen over the old
     two-column grid, so that the table does not reflow.
   - While the drawer is open it covers the row-menu column. Close it to use another row's menu.
6. **The 80% Active is not a bug.** No code and no data change.
   - The badge follows ADR 0120.
   - Decision 5 answers "why is this Active": the panel lists the drafts that hold the playlist, and
     the operator can delete them with the existing draft delete.
   - `thunder_qa` drafts are fixtures and are not deleted.

## Rejected alternatives

- **Map the FK error to a message and change nothing else.** The operator would still not know which
  Layout to edit. The RPC also already has a soft-refusal shape for this.
- **Move to Trash refuses any playlist that is in a Layout zone.** See decision 4.
- **A `layout_count` key on the list, so the Trash button is disabled up front.** It needs a list RPC
  change and a gate change for one rare case. The reply in decision 1 is enough.
- **Add a status filter to `affected-programs`.** That endpoint belongs to Publish Changes, which needs
  active, on-air or scheduled Programs only. Sharing it would tie two reasons to change together.
- **The frontend joins Layouts to Programs itself.** That repeats the join ADR 0120 moved into one
  helper.
- **A badge sub-label such as "draft only".** ADR 0120 says to fix the badge at its cause, not to make
  it say more.
- **Deleting old drafts, once or by sweep.** No draft is older than 90 days, so a sweep would change
  almost nothing today. Deleting a draft also destroys the operator's work. Not recorded as a follow-up,
  by owner choice.

## Consequences

- `playlist_program_ids` gains a fourth caller (the panel). If its meaning changes, the panel changes
  with Publish Changes, the badge and the Trash guard.
- The panel no longer downloads every Program of the tenant to show the few that use one playlist.
- `publication_count` still means "direct references, any status". It is the permanent delete gate for
  Programs. Layout zones are a second, separate gate, enforced in the RPC (decision 1).
- A Layout that already holds a trashed playlist keeps it. Decision 3 blocks only new assignments. For
  permanent delete to succeed, the operator does one of these for each Layout named in the reply:
  - clears or swaps the zone, restoring the Layout first if it is in Trash, because a trashed Layout
    can only be restored or deleted forever;
  - permanently deletes the Layout, which works only for a Layout that never had a Program.

  Restoring the playlist does not unblock the delete.
- `media_composition_duplicate` copies zones as they are, so a copy of such a Layout also holds the
  trashed playlist. This is accepted: the copy is not a new choice of that playlist, and decision 1
  still names both Layouts.
- What a Layout Program does at activate or publish time when a zone's playlist is in Trash is not
  decided here. It is unchanged.
