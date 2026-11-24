# A Playlist may repeat an Asset

**Status:** accepted · 2026-11-11
**Source:** prod report on Playlist `1d3f46cf…` (Office Tower 6000x910 1 Oct 2026); owner decision the same day
**Related:** `#35` (Add Item drawer), `0060` §5a (per-item overrides)

## Context

The Playlist editor treated `mediaAssetId` as the row's identity: the Add Item drawer hid every Asset
already in the Playlist, `appendItems` dropped repeats, and select, edit, remove, drag and the React
`key` all matched on the Asset id. The database never had that rule: `playlist_items` is unique on
`(playlist_id, position)` only, and `media_playlist_set_items` stores what it is sent.

On prod the Playlist above holds 173 items that use 101 distinct Assets, which is every Asset of its
tenant. The editor then showed "ยังไม่มี media ในคลัง" in the drawer, numbered repeated rows with
the first copy's position, and applied an edit or a remove to every copy of the Asset. The same
Playlist also lost all its thumbnails: the editor asked `POST /media/videos/preview-urls` for 173 ids,
the route caps a request at 100, and the 400 was swallowed.

## Decision

1. **Repeats are allowed.** The drawer lists the whole library; picking an Asset already in the
   Playlist adds another row. Looping the same advert is ordinary signage use.
2. **A row's identity is `DraftItem.key`**, a client-side `crypto.randomUUID()` minted when a row is
   loaded, added or duplicated. It is never sent to the backend; the saved order is still `position`.
   Select, edit, remove, drag, the now-playing marker (from the preview frame's authored
   `itemIndex`) and React keys all use it.
3. **Duplicate** in the row menu inserts a copy, with all its overrides, directly after the row.
4. **`fetchPreviewUrls` de-duplicates ids and signs them in batches of 100**, so every caller is
   safe from the route's cap.
5. **The Add Item drawer signs preview URLs lazily.** Only rows that have scrolled near the viewport
   are asked for (`useSeenIds`), in chunks of 100 that paint as they arrive (`usePreviewUrls`).
   Signing a whole 500-asset library up front took 10–20 s before the first thumbnail.

## Considered and not chosen

- **Keep blocking repeats and fix only the drawer's message.** It leaves the existing 72 repeats on
  prod broken in the editor (shared edits, clashing keys) and contradicts how the Playlist is used.
- **Use a server item id as the key.** The items read returns no id and `set_items` replaces the
  list, so it would mean a backend change for a value only the editor needs.

## Consequences

- Hotfix is frontend-only; no migration.
- The preview handoff carries `key` as an extra field; the preview ignores it.
