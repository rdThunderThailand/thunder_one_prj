# 0028 — Playlist Active/Inactive is derived from publication references, not stored

## Context

The agreed business rule is that a playlist is **Active** when at least one publication
references it (that publication may itself be draft, active or cancelled — any of them means the
playlist is in use), **Inactive** when it is finished but nothing references it, and **Draft**
while the wizard has not completed it.

The stored `media_core.playlists.status` column cannot express that:

- It is `DEFAULT 'active'` (migration `048_media_core_schema.sql:49`), constrained to
  `draft|active|inactive` (`086_playlist_draft_save.sql:55`).
- No frontend write path has ever produced `'inactive'` — `resolveDraftStatus()` only yields
  `'draft'`, `'active'` or `undefined`. The single producer was a manual **Archive** button on
  the playlist detail page.
- So the "Inactive" StatCard on `/playlists` and the Inactive option in the status filter could
  never count above zero for any row nobody had archived by hand, and the number they showed had
  no relationship to whether the playlist was actually in use.

Meanwhile ADR 0025 / migration 097 already made `media_playlist_delete` count referencing
publications as a delete guard — so the database already computes exactly the value the new rule
needs; it simply never returned it on read.

## Decision

Thunder_Core migration `098_playlists_publication_count.sql` adds a `publication_count` key to
`media_playlists_list` and `media_playlist_get` — the same `count(*)` subquery over
`media_core.publications` that the delete guard uses. The frontend turns that count into a
display status in exactly one place, `playlistDisplayStatus()` in
`src/features/playlists/status-display.ts`:

- `status === "draft"` → `draft` (the stored column still decides draft / not-draft)
- `publication_count === undefined` → the stored status, unchanged
- otherwise `publication_count > 0 ? "active" : "inactive"`

Every read-side consumer routes through it: `summarize()` (the StatCards), `filterPlaylists()`
(the status filter), `sortValue()`'s `status` key (the sortable Status column), and the four
`statusBadge()` call sites (table, side panel, detail properties, publication review step).
`statusBadge()` itself is unchanged — callers pass the derived value in.

The **Archive / Activate** button on `PlaylistDetailPage` is removed. Status is no longer
something an operator sets, and leaving the button would give a control that changes a stored
value the UI no longer reads.

## Rejected alternatives

**Return a computed `effective_status` from SQL** (the shape ADR 0004 uses). The rule would then
live in plpgsql where no `.check.mts` can cover it, and the frontend still needs the raw count
for the delete-guard message in `describeDeleteError`. Returning the count and deriving once on
the client keeps a single, checkable definition.

**Derive on the client by calling `fetchPublications` per playlist.** Three requests per row on a
list page, and it repeats the weakness the side panel already has.

**Backfill / migrate the stored `status` column.** It would have to be re-run on every
publication create, delete and cancel; a derived read is correct by construction and cannot drift.

## Consequences

- `media_core.playlists.status` now means only **draft / not-draft**. Nothing else should read it
  for display.
- "Inactive" and "deletable" become the same condition, matching the delete guard from ADR 0025 —
  a row shown as Inactive is exactly a row `media_playlist_delete` will accept.
- Rows someone archived by hand before this reappear as Active if a publication references them.
  That is correct under the new rule; no data migration is performed.
- A frontend deployed ahead of Thunder_Core 098 sees no `publication_count` and falls back to the
  stored value, rather than declaring every playlist Inactive.
- Operators can no longer set status manually. If a "hide this playlist" need appears later it
  needs its own field — reusing `status` for it would break the rule above.
