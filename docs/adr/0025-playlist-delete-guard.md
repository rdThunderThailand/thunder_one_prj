# 0025 — Playlist delete is hard, and refused while any publication references it

**Status:** superseded by ADR-0056 (2026-08-29)

## Context

Ticket [86d3xxp90](https://app.clickup.com/t/86d3xxp90) mocks a Delete action on the playlists
list that had no backend support at all — `Thunder_Core` had `media_publication_delete` but no
`media_playlist_delete`; `[id]/route.ts` only exposed GET/PATCH. Two questions had to be answered
before adding it: soft or hard delete, and what happens when a publication still points at the
playlist being deleted.

- `media_core.publications.playlist_id` is already `ON DELETE RESTRICT` (migration 048), so the
  database blocks the second case regardless of what the RPC does — a raw delete would just
  surface as an unhandled FK-violation error.
- No soft-delete convention exists on `media_core.playlists` (no `deleted_at`/`is_deleted`
  column, unlike some other tables in this schema) and nothing in the ticket or mock asks for a
  trash/restore flow.
- `media_playlist_delete` also has to reject `kind <> 'user'` rows — a publication's own
  single-asset wrapper playlist (085) is owned by that publication's lifecycle and is already
  cleaned up by `media_publication_delete`; deleting it independently would desync the two.

## Decision

**Hard delete.** `media_playlist_delete(p_tenant_id, p_playlist_id)` explicitly counts
referencing publications first and raises `'Invalid input: playlist is used by % publication(s)'`
before ever reaching the `DELETE`, so the frontend gets a countable, translatable message
instead of parsing a raw Postgres FK-violation string. `kind <> 'user'` is rejected the same way.
`playlist_items` rows cascade (`ON DELETE CASCADE`, 048), so no separate cleanup step is needed.

The frontend (`describeDeleteError` in `status-display.ts`) turns the count into a Thai sentence
telling the user how many publications still reference the playlist — never the raw DB error,
per the no-raw-error rule.

## Rejected: soft delete

Would need a new column and a migration touching every read path (`media_playlists_list`,
`media_playlist_get`, dedupe logic) to filter it out, plus a restore UI nobody asked for. Declined
because nothing in the ticket needs recovery, and the referencing-publication guard already
prevents the one case a soft delete would protect against (deleting something still in use).

## Consequences

Deleting a playlist is permanent. A playlist still referenced by any publication (draft, active,
or cancelled) cannot be deleted until that publication no longer points at it. Revisit if a trash
flow is requested — the guard clause stays either way, since something has to say what happens to
a publication when its playlist disappears.
