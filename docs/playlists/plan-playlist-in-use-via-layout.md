# Plan: count Layout Programs when deciding whether a playlist is in use (ADR 0120)

Decision: [ADR 0120](../adr/0120-playlist-in-use-counts-layout-programs-and-only-live-statuses.md).
Most of the work is in Thunder_Core. thunder_one_prj gets the ADR plus a small change to the
badge. Reviewed with `scrutinize` on 2026-11-20. Its findings are folded in below.

## Facts this plan relies on (checked 2026-11-20 against Core `origin/develop` c38051c)

- Current function bodies:
  - `media_playlists_list`, `media_playlist_delete`, `media_playlist_permanent_delete` and
    `media_core.publish_changes_targets` come from `20261026235959_baseline_from_prod.sql`.
  - `media_playlist_get` comes from `20261105031327_media_playlist_get_publication_count.sql`.
  - No later migration redefines any of these.
- `publish_changes_targets` (baseline line 1828) has two parts:
  - A `candidates` CTE: direct Programs that are not compositions, plus composition Programs whose
    Layout has a zone on the playlist.
  - A final filter: `p.status = 'active'` and
    `publication_effective_status(...) IN ('scheduled','active')`.
  - It is `STABLE SECURITY DEFINER`, `search_path ''`, and `REVOKE ALL ... FROM PUBLIC`
    (baseline line 27355). The same filter is on prod.
- `composition_zones.playlist_id` is NOT NULL, with an index (`composition_zones_playlist_id_idx`)
  and an FK `ON DELETE RESTRICT`. Zones cannot nest Layouts.
- A composition draft can have a null `composition_id` until it is activated. On prod there are 0
  such rows today.
- Nothing ever writes `publications.status = 'expired'`. The value exists only in the CHECK; the
  `'expired'` writes in the baseline belong to bookings.
- On prod there are no `dynamic` publications. Image and video Programs point at wrapper
  playlists (`kind` single or inline), and the list never shows those.
- Frontend:
  - `PlaylistsTable.tsx:149` and `use-trash-batch.ts:22` gate permanent delete on
    `publication_count === 0`. These stay as they are.
  - `playlistDisplayStatus()` is the only place the badge is derived. Its callers are list
    filtering and stats, the table, grid, side panel, editor row and playlist picker.

## Steps

### 1. Core: confirm the live bodies (read-only)

Run `pg_get_functiondef` on the five functions above, on develop and on prod. Diff the output
against the files. If prod differs from a file, base the migration on the prod body.

### 2. Core: one migration on a branch from `develop`

File: `supabase/migrations/<ts>_playlist_in_use_via_layout.sql`.

a. **New helper**: move the `candidates` CTE into it unchanged.
   ```sql
   CREATE FUNCTION media_core.playlist_program_ids(p_tenant_id uuid, p_playlist_id uuid)
   RETURNS TABLE (publication_id uuid)
   LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
   AS $$
       SELECT p.id FROM media_core.publications p
       WHERE p.tenant_id = p_tenant_id
         AND p.publication_type <> 'composition'
         AND p.playlist_id = p_playlist_id
       UNION
       SELECT p.id FROM media_core.publications p
       WHERE p.tenant_id = p_tenant_id
         AND p.publication_type = 'composition'
         AND EXISTS (
             SELECT 1 FROM media_core.composition_zones cz
             WHERE cz.composition_id = p.composition_id
               AND cz.tenant_id = p_tenant_id
               AND cz.playlist_id = p_playlist_id
         )
   $$;
   REVOKE ALL ON FUNCTION media_core.playlist_program_ids(uuid, uuid) FROM PUBLIC;
   GRANT EXECUTE ON FUNCTION media_core.playlist_program_ids(uuid, uuid) TO service_role;
   COMMENT ON FUNCTION media_core.playlist_program_ids(uuid, uuid) IS
     'Every Program that plays the playlist, directly or through a Layout zone, any status. Callers filter status. Shared by publish_changes_targets, the playlist list/get in_use_count and media_playlist_delete (FE ADR 0120).';
   ```
   The `REVOKE` is required because `CREATE FUNCTION` grants EXECUTE to PUBLIC. Match the grants
   of `publish_changes_targets` exactly. Check them on prod in step 1.

b. **`publish_changes_targets`**: `CREATE OR REPLACE` with the same signature. In the
   `p_playlist_id` branch, take `candidates` from the helper, with `via_composition_id` =
   `p.composition_id` when `publication_type = 'composition'`. The `p_composition_id` branch and
   the final status filter stay word for word. Its output must not change (see test R1 and R2).

c. **`media_playlists_list` and `media_playlist_get`**: `CREATE OR REPLACE` with the same
   signature. Keep every parameter default, for example `p_include_drafts DEFAULT false` and
   `p_trash DEFAULT false`, or Postgres rejects the replace. Add this key next to
   `publication_count` and leave `publication_count` unchanged:
   ```sql
   'in_use_count', (
       SELECT count(DISTINCT pub.id)
       FROM media_core.playlist_program_ids(pl.tenant_id, pl.id) t
       JOIN media_core.publications pub ON pub.id = t.publication_id
       WHERE pub.status IN ('draft', 'active')
   ),
   ```

d. **`media_playlist_delete`**: `CREATE OR REPLACE` with the same signature. Replace the name
   lookup, and keep the `RAISE` text as it is:
   ```sql
   SELECT string_agg(DISTINCT pub.name, ', ' ORDER BY pub.name) INTO v_names
   FROM media_core.playlist_program_ids(p_tenant_id, p_playlist_id) t
   JOIN media_core.publications pub ON pub.id = t.publication_id
   WHERE pub.status IN ('draft', 'active');
   ```
   This also adds the tenant filter that the current lookup lacks.

e. `media_playlist_permanent_delete` is not touched.

### 3. Core: behaviour test

File: `supabase/tests/playlist_in_use_via_layout_test.sql`. It uses the same pattern as
`media_asset_tombstone_test.sql`: a `DO` block that ends in `RAISE EXCEPTION`, so nothing
persists. Run it with
`scripts/db-dry-run.sh supabase/migrations/<ts>_playlist_in_use_via_layout.sql supabase/tests/playlist_in_use_via_layout_test.sql`.

Fixtures are inserted inside the block, not read from develop. Use an existing develop tenant and
user, then create the playlist(s), a layout and its zones, a composition and its
`composition_zones`, the publications, and a `schedules` row per publication. Every insert sets
`tenant_id`.

| # | Setup | `in_use_count` | `publication_count` | Move to Trash |
|---|---|---|---|---|
| 1 | Only in a zone of a Layout whose Program is `active` | 1 | 0 | refused, names it |
| 2 | Same, but the Program is `draft` | 1 | 0 | refused |
| 3 | Same, but the Program is `cancelled` | 0 | 0 | accepted |
| 4 | Directly published, `draft` | 1 | 1 | refused |
| 5 | Directly published, only `cancelled` | 0 | 1 | accepted |
| 6 | Direct `active` + Layout `active` (two Programs) | 2 | 1 | refused, both names |
| 7 | Same Layout, playlist in two zones, one `active` Program | 1 (distinct) | 0 | refused |
| 8 | `active`, `ends_at` in the past | 1 | 1 | refused |
| 9 | `active`, `starts_at` in the future | 1 | 1 | refused |
| 10 | Composition draft with `composition_id` NULL | 0 | 0 | accepted |
| 11 | Only in a Layout no Program airs | 0 | 0 | accepted |
| 12 | Another tenant's Program uses a same-id path (tenant isolation) | 0 | — | accepted |

- `media_playlists_list` must return the same `in_use_count` as `media_playlist_get` in every
  case. Also check `media_playlists_list(p_trash => true)` for case 5 after it is moved to Trash:
  `publication_count = 1` and `in_use_count = 0`.
- Publish Changes regression:
  - **R1**: for cases 1, 4, 6, 8 and 9, `publish_changes_targets(tenant, playlist, NULL)` returns
    the same rows before and after the migration. Capture the "before" rows in the block, before
    the migration runs, or compare against a copy of the old body.
  - **R2**: the `p_composition_id` branch is unchanged for case 1's Layout.

### 4. Core: swagger / API docs

Add `in_use_count` to the playlist list and get response schemas, next to `publication_count`.
Describe `publication_count` as "direct references, any status (permanent-delete gate)".

### 5. thunder_one_prj: one small logic change

- `src/types/domain.ts:191` and `:212`: add `in_use_count?: number`.
- `status-display.ts`: `playlistDisplayStatus` reads `in_use_count` with the same fallback. The
  doc comment cites ADR 0120.
  ```ts
  if (playlist.in_use_count === undefined) return playlist.status;
  return playlist.in_use_count > 0 ? "active" : "inactive";
  ```
  The parameter type changes to `{ status; in_use_count?: number }`.
- Update `status-display.check.mts` for the new key, including the fallback case. Callers pass
  the playlist object as they do today, so they need no change. Confirm with `tsc`.
- Leave `PlaylistsTable.tsx:149` and `use-trash-batch.ts:22` on `publication_count`.
- Add a "Superseded by ADR 0120" line at the top of ADR 0028.

### 6. Release

- Core PR into `develop`. CI applies the migration to the develop DB.
- Prod is **R0**: apply with `supabase db push` at the next Core release, never through MCP. Then
  dump `prosrc` of all five functions and compare md5 against the file.
- FE PR into `dev`. Either order is safe, because of the fallback.

## Verification (at the layer the user sees)

1. SQL: the dry-run test passes on develop (step 3).
2. HTTP: on develop, after merge, `GET` the playlist list through thundercoredev. Both keys must
   be present, and a real Layout-only playlist on develop must have `in_use_count > 0`.
3. UI, in the browser (ask first, per §3), on `/playlists` with dev pointed at develop:
   - A Layout-only playlist shows Active.
   - Move to Trash on it shows the "ถูกใช้อยู่ใน publication…" message.
   - A playlist with only cancelled Programs shows Inactive and can be moved to Trash.
   - Once it is in Trash, the permanent-delete button for it is **disabled**.
   - Publish Changes on a playlist used by a live Layout still lists that Program.
4. Prod, after release, read-only:
   - "Lat Krabang (Suwannaphum)" shows Active.
   - Buriram shows Inactive.

## Not in scope (report, don't fix)

- Permanent delete of a playlist that is still in a Layout zone fails on the
  `composition_zones` FK with a raw error. This is pre-existing; open a separate issue.
- Other functions repeat a Program↔playlist join and could adopt `playlist_program_ids` later.
  Examples are around baseline lines 1134 (`media_asset_usage` area), 4574 and 9909.
- The playlist side panel's Publications tab may also miss Layout Programs.
- Protecting playlists that are used only by Layouts nobody publishes.
- Cleaning up abandoned draft Programs. This is what makes about 80% of prod playlists show Active.
