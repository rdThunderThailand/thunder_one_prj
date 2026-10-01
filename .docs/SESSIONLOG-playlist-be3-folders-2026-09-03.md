# SESSIONLOG — Playlist v1 #38 / BE-3 (folders backend)

Date: 2026-09-03
Branch: `fix/playlist` (both repos, unpushed)
Model: Sonnet (execute-the-plan; plan resolved all design forks)

## Scope

BE-3 only — the backend/route half of #38 (Folders for Playlists). FE-5 (folder rail
on the list page) not started.

## Design decision

Handoff said "thread `p_folder_id` through `media_playlist_upsert`". Rejected in favour of
a dedicated `media_playlist_move` RPC mirroring `media_composition_move` (20260901043400).
Reasons: no `DROP FUNCTION` / overload risk on upsert; `folder_id = NULL` is a valid target
(Uncategorized) so `COALESCE(p_folder_id, folder_id)` can't express "leave unchanged";
`PATCH /playlists/[id]` is already the editor save path. Move gets its own sub-route
`PATCH /playlists/[id]/move`, matching the folders/videos precedent. User approved.

## Changes

Thunder_Core:
- `supabase/migrations/20260903130000_playlists_folder_id_and_move.sql` (new)
  - `media_playlists_list` CREATE OR REPLACE (2-arg sig unchanged): adds `folder_id` per
    row, adds `AND pl.deleted_at IS NULL`, adds ponytail ceiling comment.
  - `media_playlist_move(uuid, uuid, uuid DEFAULT NULL)` new — folder validation
    (tenant + scope='playlist'), active-row-only update, REVOKE PUBLIC / GRANT service_role.
- `src/app/api/core/v1/media/playlists/[id]/move/route.ts` (new) — `PATCH`, `movePlaylistSchema`.

thunder_one_prj:
- `src/lib/api/media-api.ts` — `movePlaylist(id, folderId)`.
- `src/types/domain.ts` — `PlaylistListItem.folder_id?: string | null`.

## Verification

- Migration applied to **develop** `ftfmokgphewzyxzwjitv` and **prod** `sfiefevtxalqjizdkcsw`
  via Supabase MCP `apply_migration` (CLI is broken — migration-cli-drift).
- Post-apply schema dump on both: single signature (no overload), `has_folder_id` +
  `has_deleted_filter` true, `media_playlist_move` grants = postgres + service_role only.
- SQL-layer smoke (DO block, `RAISE EXCEPTION` rollback) on both envs — 4 asserts pass:
  move→folder sets `folder_id`; `media_playlists_list` reflects it; move→NULL clears it;
  bogus folder id rejected.
- `tsc` clean on the 2 changed frontend files.
- **NOT verified**: HTTP layer (route not deployed — backend deploys from `develop`),
  browser. No FE consumer of `folder_id` / `movePlaylist` yet.

## BE-4 (#40 trash & restore) — DB applied develop + prod, routes + FE API done

Migration `20260903140000_playlist_trash_and_restore` applied to both envs via MCP.

- `media_playlists_list` — arity change (DROP + CREATE, pattern of 087), added `p_trash`
  boolean (false = active, true = only `deleted_at IS NOT NULL`). Keeps `folder_id`.
- `media_playlist_delete` (2-arg, CREATE OR REPLACE) — was hard delete, now soft:
  `deleted_at=now(), trashed_folder_id=folder_id, folder_id=NULL`. Refuses while a
  publication with `status IN ('draft','active')` points at it, `RAISE` with
  `string_agg(name)`. `expired`/`cancelled` do not block. Idempotent if already trashed.
- `media_playlist_restore` (new) — mirrors `media_composition_restore`.
- `media_playlist_permanent_delete` (new) — trashed rows only (`FOR UPDATE`), guard
  counts every publication status → returns `{deleted:false, reason:'published'}` (not an
  error); else `DELETE` (items cascade) → `{deleted:true}`.
- REVOKE PUBLIC/anon/authenticated + GRANT service_role on the two new fns.

SQL smoke on develop (DO block, rollback): soft-delete columns; active list hides /
trash list shows; restore→former folder; restore→Uncategorized when folder deleted;
permanent-delete guard returns `{deleted:false,reason:published}`; `draft` publication
blocks trash with its name in the message; `cancelled` publication does not block.
Read-only smoke on prod: list works both modes (11 active / 0 trash).

Thunder_Core routes:
- `playlists/[id]/restore/route.ts` (new) — `POST` → `media_playlist_restore`.
- `playlists/[id]/permanent/route.ts` (new) — `DELETE` → `media_playlist_permanent_delete`,
  passes the `{deleted,reason}` body through.
- `playlists/route.ts` GET — passes `p_trash` from `?trash=true`.
- `playlists/[id]/route.ts` DELETE — unchanged (now soft-deletes).

thunder_one_prj API layer:
- `media-api.ts` — `fetchPlaylists(includeDrafts, trash)`, `restorePlaylist(id)`,
  `permanentlyDeletePlaylist(id) → {deleted, reason?}`.
- `status-display.ts` `describeDeleteError` + `.check.mts` — handle the new
  "used by an active or draft publication: <names>" wording (legacy count wording kept).
- `playlists-api.ts` `deletePlaylist` doc comment updated (soft delete).
- `status-display.check.mts` passes; `tsc` clean on changed files.

NOT verified: HTTP layer (routes not deployed), browser. No trash/restore UI yet.

## Next

- FE-5: folder rail on `PlaylistsListPage` — reuse `ContentFolderRail` +
  `CompositionFolderRail`/`CompositionsListPage` as the template (both already do
  all / uncategorized / trash / URL sync / move). Trash collection in the rail needs
  BE-4 (#40).
- Then #40 (BE-4 trash RPCs) → #41 (BE-5 tags + prod backfill R0) → X-1 → X-2.
- One PR for the whole epic when every ticket lands; Draft until browser-verified.
