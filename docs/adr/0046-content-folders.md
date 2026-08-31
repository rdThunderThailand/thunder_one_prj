# Content folders

**Status:** accepted (2026-08-25)

One flat, tenant-scoped folder namespace shared by every media content type — Layouts, Playlists and
Assets — plus one reusable frontend component that renders it. A content item belongs to at most one
folder. There is no nesting. A folder that still holds anything cannot be deleted.

```
media_core.content_folders (id, tenant_id, name, created_at, updated_at)
UNIQUE (tenant_id, name)

media_core.layouts.folder_id        → content_folders(id) ON DELETE RESTRICT   (nullable)
media_core.playlists.folder_id      → content_folders(id) ON DELETE RESTRICT   (nullable)
media_core.media_assets.folder_id   → content_folders(id) ON DELETE RESTRICT   (nullable)
```

`NULL` means unfiled, which every existing row is. Nothing is backfilled and no list breaks.

## Why now

`docs/layouts/plan-layout-ui.md` §2.2 flagged the folder tree in the Layouts mockup as scope with no
model behind it, and recommended shipping the list flat. The counter-argument won: the folders drawn
in that mockup — `Lobby & Reception`, `Menu Boards`, `Retail Stores` — are obviously not
Layout-specific. The same operator wants the Playlist for the lobby and the video for the lobby in
the same place. Building a Layout-only folder now guarantees a migration and a data move later.

It is also independent work: it touches no player, no contract, and nothing in
`docs/adr/0045-publication-snapshot-materialization.md`. It can proceed in parallel with the snapshot
foundation instead of queueing behind it.

## Decisions

### 1. Flat. No `parent_id`

The cost of a folder feature is not the folder — it is the tree. A tree brings cycle prevention (a
folder must not become its own ancestor), the recursive-versus-direct question for every count,
breadcrumbs, move-between-levels, and a delete rule that has to reason about descendants. None of
that is the folder itself.

The mockup does not actually need it: every folder drawn in
`Figjam - Media Workspace (1).png` sits at the same level. Flat folders plus the search that the list
pages already have covers what a tree would do at the real scale of a few hundred items per tenant.

This is also the cheap direction to be wrong in. Adding `parent_id` later is a migration that adds a
nullable column and moves no data. Choosing per-type folders and later merging them is a migration
that moves data and has to resolve name collisions across types.

Rejected: **nested folders now** — the tree cost above, bought before anything demonstrates it is
needed. Rejected: **tags instead of folders** — tags are many-to-many and answer a different question;
they remain available as a separate, later decision, and do not conflict with this one.

### 2. Untyped and global — one namespace across all media content

A folder is not a Layouts folder or a Playlists folder. `Lobby & Reception` holds whatever an
operator puts in it, and each list page shows only the items of its own type.

The visible consequence, which is correct rather than a defect: **the count next to a folder is
per-page.** `Lobby & Reception` reads `12` on Layouts and `3` on Playlists. The folder list RPC
therefore takes the calling page's scope and counts only that type; it never returns one global
number that matches nothing on screen.

`public.asset_folders` already exists with `name` + `parent_id` + `assets.folder_id`
(`057_column_comments.sql`). **It is not reused.** It belongs to Asset Intelligence, where an "asset"
is a physical tagged object — its sibling table `asset_tags` carries `qr_url`, `install_date` and
`last_scan_at`. Sharing a table across two unrelated domains to save one `CREATE TABLE` would put
media content and building hardware in one namespace. It is a useful precedent for shape only.

### 3. One item, at most one folder — a column, not a join table

Each content table gains a nullable `folder_id`. There is no `content_folder_items` join table.

A join table would let one item sit in several folders, which is a tag, not a folder, and it would
force a polymorphic `(item_type, item_id)` pair with no referential integrity — exactly the shape
that lets a deleted Playlist leave a row behind. A real FK per table costs three columns and gives
the database the guarantee for free.

Moving an item between folders is `folder_id` on each type's existing update RPC. No new mutation
RPC, no drag-drop-specific endpoint.

### 4. Deleting a non-empty folder is blocked

`ON DELETE RESTRICT` on all three FKs, plus an explicit guard in the delete RPC that raises the
existing `Already in use:` domain error naming what still lives there, so the operator sees a
sentence rather than a foreign-key violation. This matches how the platform already refuses
destructive actions (`media_video_delete`, and
`docs/adr/0045-publication-snapshot-materialization.md` §10).

Rejected: **cascade the folder's contents into `NULL`** — a mis-click silently unfiles hundreds of
items with no undo, and the operator's next question is which items those were. Rejected:
**soft-delete / Archive for folders** — a folder is a label, not content; an empty folder can simply
be deleted, and a non-empty one must be emptied first, so there is nothing an archived state buys.

The mockup's `Trash` folder is not built. It contradicts this rule and the `active ↔ inactive`
lifecycle that Layouts and Playlists share.

### 5. Names are unique per tenant

`UNIQUE (tenant_id, name)`. In a flat namespace two folders with the same name are indistinguishable
on screen, so the constraint prevents a state the UI cannot represent. Rename is allowed and hits the
same constraint.

Tenant isolation lives in the RPCs, not in RLS — every new function filters `tenant_id` itself, per
platform convention. RLS is enabled on the table as defense in depth; browser code never queries
`media_core` directly.

### 6. One frontend component, used by every content list

`src/components/` already holds the cross-feature UI (`layout`, `ui`). The folder sidebar lands there
as a presentational component taking a folder list, counts, the selected id and callbacks — it owns
no fetching and knows nothing about Layouts, Playlists or Assets.

It reuses the list conventions the Playlist page already established rather than inventing new ones:
`list-url-state.ts` for putting the selected folder in the URL so a filtered view is linkable and
survives reload, and `list-filtering.ts` for combining the folder filter with the search, status and
sort filters already on those pages.

Rollout is per page, not all at once. The table and all three `folder_id` columns land in one
migration; the sidebar ships on **Layouts** first, because that is the page being built. Playlists
and Media Library adopt the same component when their pages are next touched — their data is already
there, unfiled, waiting.

## Surface

| RPC | Purpose |
|---|---|
| `media_content_folder_list(p_tenant_id, p_scope)` | folders + per-scope counts; `p_scope` ∈ `layout` / `playlist` / `asset` |
| `media_content_folder_create(p_tenant_id, p_name)` | |
| `media_content_folder_rename(p_tenant_id, p_folder_id, p_name)` | |
| `media_content_folder_delete(p_tenant_id, p_folder_id)` | refuses a non-empty folder with `Already in use:` |

Assignment is not here: it is a `folder_id` argument on the existing Layout / Playlist / Asset update
RPCs. All four functions are `SECURITY DEFINER SET search_path = ''`, `EXECUTE` granted to
`service_role` only, with the grant reasserted explicitly after every replacement.

## Scope of the first release

In: the table, three `folder_id` columns, the four RPCs, the shared sidebar component, and the
Layouts list page wired to it.

Out: nesting (§1); tags; a `Trash` folder (§4); per-folder permissions; folder colours or icons;
bulk move UI beyond selecting items and choosing a folder; adoption on the Playlists and Media
Library pages, which follows when those pages are next touched (§6).

## Consequences

- `docs/layouts/plan-layout-ui.md` §2.2 is superseded: the Layouts list ships **with** the folder
  sidebar, not flat. Its `Tags` tab and `Trash` folder stay cut.
- `CONTEXT.md` gains a **Folder** glossary entry.
- Deleting content is unaffected — `folder_id` is on the content row, so deleting a Playlist takes
  its filing with it and never blocks on a folder.
