# Nested feature folders and Trash

**Status:** accepted (2026-08-29)
**Supersedes:** ADR-0046 in full; ADR-0025's hard-delete-only Playlist decision

Communication content uses tenant-wide, feature-scoped Folder trees rather than one shared flat namespace. Assets, Playlists and operator-facing Layouts (`media_core.compositions`) each own an independent tree; geometry Templates (`media_core.layouts`) do not. Trash is a virtual soft-delete collection, not a Folder.

## Decision

- One `content_folders` table carries `tenant_id`, `scope`, `parent_id` and `name`. Scope is `asset`, `playlist` or `composition`.
- Each content table owns a nullable `folder_id` foreign key. An item belongs to at most one Folder; `NULL` is the virtual `Uncategorized` collection.
- Trees are acyclic and limited to five levels. Folder names are case-insensitively unique among siblings, may repeat under different parents, and display alphabetically.
- Selecting a Folder includes and counts content from its full subtree. `All Media`, `Uncategorized` and `Trash` are virtual collections rather than rows.
- A Folder may be created, renamed or moved through explicit menus. It may be deleted only when it has no child Folders and no direct content. Drag-and-drop and manual ordering are out.
- Assets, Playlists and Compositions use `deleted_at` for soft deletion. Normal lists and new pickers exclude them; existing references and materialized playback continue to resolve them.
- Restore returns an item to its former Folder if that Folder still exists, otherwise to `Uncategorized`. Permanent deletion is manual, one item at a time from Trash, and remains blocked by live references or immutable snapshots. There is no bulk Empty Trash or automatic retention purge.
- Media listing, Folder filtering, subtree counts, search, status/type filters, sorting and pagination are server-side. Upload registration accepts the selected `folder_id` atomically.
- The first UI adoption is Media Library. Backend contracts cover all three scopes, while Playlist and Layout UI adoption remains separate work.

## Considered options

- A browser-local or mock tree was rejected because operators would not share the same organization library.
- One namespace shared across content types was rejected because each feature needs an independent filing model.
- A polymorphic membership table was rejected because it cannot enforce foreign keys to all three content tables; nullable `folder_id` columns preserve referential integrity.
- Recursive delete, automatic reparenting and Folder soft delete were rejected because they can move or remove an unbounded subtree after one action.
- Archive was rejected as library-removal vocabulary. Active/inactive remains an operational status; Trash is the reversible removal state.

## Consequences

- ADR-0046's flat, shared namespace and no-Trash decisions no longer apply.
- Playlist and Composition lifecycle documentation must distinguish operational active/inactive state from library removal.
- The Media Library may visually include Audio, Documents and Tags controls, but they remain disabled until their own backend contracts exist.
