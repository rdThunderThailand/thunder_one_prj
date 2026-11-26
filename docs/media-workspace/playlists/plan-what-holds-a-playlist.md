# Plan: name what holds a playlist (ADR 0121)

Decision: [ADR 0121](../../adr/0121-the-playlist-panel-and-permanent-delete-name-what-holds-a-playlist.md),
which builds on [ADR 0120](../../adr/0120-playlist-in-use-counts-layout-programs-and-only-live-statuses.md).
Reviewed with `scrutinize` on 2026-11-20. The verdict was "fix the docs, then ship". All 7 findings
are folded in below.

**Status (2026-11-20).**

- A1: done for develop and prod. Prod was checked read-only on 2026-11-20; its last migration is
  20261120100000.
  - `media_playlist_permanent_delete`: prod md5 `02d88d30…` equals the pre-migration body in the
    rollback file.
  - `media_composition_set_zones`: logic is identical. Prod lacks one two-line comment ("Completeness
    is not required to save…") that develop has. After `db push`, prod gains that comment.
  - `playlist_program_ids`, `media_publish_changes_programs` and `publication_effective_status`:
    same md5 as develop.
  - `media_playlist_programs` does not exist yet.
  - `media_core.campaigns` exists. `compositions` has `deleted_at`, `name` and `tenant_id`.
  - Grants match develop for all of these: `service_role` only, with no EXECUTE for PUBLIC, anon or
    authenticated. `playlist_program_ids` is owner only.
- A2–A4, B1–B4, C1–C6 and C4a: done. The dry-run passes 13/13.
- Core#415 is merged and live on develop. The md5 of all three functions matches the migration file.
- Verification 2–3 passed on develop on 2026-11-20, with two exceptions:
  - Empty Trash was not run, because it would delete other trashed playlists.
  - The in-Trash Layout message variant is covered by the check only.
- Released on 2026-11-20.
  - Core v0.28.0 (#26) went out as a selective release in two PRs. #417 carried the migration, which
    was pushed to prod with `db push` (md5 matches). #418 carried the route. Tagged on `70a1d26`.
  - One v1.0.2 (#29) went out in #441, tagged on `024f37c5`.
  - Swagger for `/programs` is not on Core `main` yet. It ships with the release that brings
    `swagger-core-v1-one.json` to `main`.
- Verification step 4 passed on prod, read-only, on Robinson: "Lat Krabang (Suwannaphum)" lists "Lad
  Krabang" with the line "ผ่าน Layout: Lad Krabang".

The work is two PRs, in this order:

1. **Core PR** into `develop` (Thunder_Core): part A (permanent delete, zone guard), then part B (the
   programs endpoint).
2. **FE PR** into `dev` (thunder_one_prj): consumes both.

Core ships first. The FE has no fallback (ADR 0121 §5).

Rules for whoever executes this plan:

- Do not commit, push or apply a migration to prod.
- Stop and report on any design fork, or on any fact below that turns out false.

## Facts this plan relies on (checked 2026-11-20, Core `origin/develop`, FE `origin/dev`)

**Core function bodies**

- `media_playlist_permanent_delete`, `media_composition_set_zones` and
  `media_publish_changes_programs` are defined only in
  `supabase/migrations/20261026235959_baseline_from_prod.sql`. No later migration redefines them.
- `media_composition_duplicate` was redefined in `20261117035953_layout_copies_keep_canvas_mode.sql`.
  It is not touched here.
- `media_playlist_permanent_delete` (baseline ~8466) does this:
  1. Locks the playlist row: `kind = 'user'` and `deleted_at IS NOT NULL`. Otherwise it raises
     `Invalid input: only trashed playlists…`.
  2. Counts direct `publications.playlist_id`, any status. If any, it returns
     `{deleted:false, reason:'published'}`.
  3. Deletes. Grant: `service_role`.
- `media_composition_set_zones(p_tenant_id, p_composition_id, p_zones jsonb, p_expected_revision)`
  (baseline 5993):
  - It loops the zones. At 6048-6052 it checks
    `media_core.playlists WHERE id = v_playlist_id AND tenant_id = p_tenant_id` and raises
    `not found: playlist % not found for this tenant`.
  - It then does `DELETE FROM media_core.composition_zones WHERE composition_id = …` and inserts every
    zone again. **This is a full replace.**
- `media_publish_changes_programs` (baseline ~11188) is the shape to copy:
  - `LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''`.
  - A tenant check that raises `not found:`.
  - The newest schedule per Program, via
    `LEFT JOIN LATERAL (… ORDER BY sc.created_at DESC LIMIT 1)`.
  - Status via `media_core.publication_effective_status(p.status, s.starts_at, s.ends_at)`.
  - The result is `jsonb`.
- `media_core.playlist_program_ids(p_tenant_id, p_playlist_id) RETURNS TABLE(publication_id uuid)`
  (`20261120100000_playlist_in_use_via_layout.sql`):
  - Direct Programs (`publication_type <> 'composition'`) union Layout Programs whose
    `composition_id` has a zone on the playlist.
  - Any status. Owner only.
- `media_publications_list` gets `campaign_name` from a campaigns join (`cmp.name`). Copy that join
  for the new RPC. The current body is in `20261113060000_publication_failed_badge.sql`, around line
  528, not the baseline. Its `effective_status` uses the same newest-schedule lateral (:357-363) and
  `publication_effective_status` (:473).
- `media_core.compositions` has `tenant_id` and `deleted_at`.
- A zone's `tenant_id` always equals its composition's tenant:
  - `set_zones` locks the composition by `tenant_id = p_tenant_id` (baseline:6012) and inserts
    `p_tenant_id`.
  - `media_composition_duplicate` copies from a source that it fetched by tenant.
- A trashed Layout offers only restore and delete-forever (FE `compositions/library-actions.ts:16`).
  `media_composition_permanent_delete` refuses a Layout that ever had a Program.
- The Layout editor picker hides trashed playlists (`useCompositionEditorData.ts:81` →
  `fetchPlaylists()`, which uses `trash=false`).

**Core plumbing**

- `callMedia` (`src/lib/core/media.ts:31-47`) rethrows only messages that match
  `^(Invalid input:|not found:|Unauthorized|Permission denied|Already )`. Anything else becomes
  `Media operation failed`.
- Route pattern: `src/app/api/core/v1/media/playlists/[id]/affected-programs/route.ts`
  (`apiHandler`, `requireMediaTenant`, `requireUuid`, `callMedia`, return `{success:true, data}`).
- Swagger: `public/swagger-core-v1-one.json`.
- Tests: `supabase/tests/*_test.sql`, run with `scripts/db-dry-run.sh <migration> <test>`. Follow
  `supabase/tests/playlist_in_use_via_layout_test.sql`: a `DO` block that ends in `RAISE EXCEPTION`,
  so nothing persists.

**FE**

- `src/lib/api/media-api.ts:252`: `permanentlyDeletePlaylist(id): Promise<{deleted: boolean; reason?: string}>`.
- `playlists/components/PlaylistsListDialogs.tsx:44-54`: on `!result.deleted` it always shows the
  "เคยถูก publish" message.
- `playlists/use-trash-batch.ts`:
  - `handleEmptyTrash` counts `deleted`, `skipped` (locked plus `deleted:false`) and `failed`.
  - `runBatch` counts any failure as generic. Leave `runBatch` alone.
- `playlists/components/PlaylistPanelTabs.tsx:115-132`: `usePlaylistPublications` calls
  `fetchPublications()` (every Program, no limit) and filters `p.playlist_id === playlistId`.
  `PublicationRow`, `ScheduleTab` and `HistoryTab` read `id`, `name`, `campaign_name`, `status`,
  `effective_status`, `updated_at` and `created_at`.
- `publications/publication-status.ts`: `publicationDisplayStatus`, `isPastPublication` and
  `publicationStatusColor` take `{status, effective_status?}`.

## Part A — Core: permanent delete names Layouts; no new trashed playlist in a zone

### A1. Confirm the live bodies (read-only)

- Run `pg_get_functiondef` for `media_playlist_permanent_delete` and `media_composition_set_zones` on
  develop and on prod. Diff against the baseline.
- If prod differs, base the migration on the prod body and report it.
- Record the grants of both functions (`has_function_privilege` for `anon`, `authenticated`,
  `service_role`, `public`).

### A2. Migration `supabase/migrations/<ts>_what_holds_a_playlist.sql`

One migration for A and B. Same signatures, `CREATE OR REPLACE`, so no `DROP` is needed. Re-state the
grants recorded in A1 after each function anyway.

a. **`media_playlist_permanent_delete`**: keep the body. After the `published` check and before the
   `DELETE`, add:

```sql
SELECT jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'in_trash', c.deleted_at IS NOT NULL)
                 ORDER BY c.name, c.id)
INTO v_layouts
FROM media_core.compositions c
WHERE c.tenant_id = p_tenant_id
  AND EXISTS (SELECT 1 FROM media_core.composition_zones cz
              WHERE cz.composition_id = c.id AND cz.tenant_id = p_tenant_id
                AND cz.playlist_id = p_playlist_id);

IF v_layouts IS NOT NULL THEN
    RETURN jsonb_build_object('deleted', false, 'reason', 'in_layout', 'layouts', v_layouts);
END IF;
```

   - Declare `v_layouts jsonb`.
   - Keep the `c.tenant_id` filter, because the tenant isolation rule requires it. The `cz.tenant_id`
     filter is redundant but harmless (see Facts).

b. **`media_composition_set_zones`**: replace only the playlist check at ~6047:

```sql
SELECT pl.name, pl.deleted_at INTO v_playlist_name, v_playlist_deleted_at
FROM media_core.playlists pl
WHERE pl.id = v_playlist_id AND pl.tenant_id = p_tenant_id;
IF NOT FOUND THEN
    RAISE EXCEPTION 'not found: playlist % not found for this tenant', v_playlist_id;
END IF;
IF v_playlist_deleted_at IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM media_core.composition_zones cz
    WHERE cz.composition_id = p_composition_id AND cz.playlist_id = v_playlist_id
) THEN
    RAISE EXCEPTION 'Invalid input: playlist is in Trash: %', v_playlist_name;
END IF;
```

   - Declare `v_playlist_name` with the column's type and `v_playlist_deleted_at timestamptz`.
   - The `NOT EXISTS` has to read the zones **before** the `DELETE` further down. It does, because the
     loop runs first. Do not move the loop.

### A3. Test `supabase/tests/what_holds_a_playlist_test.sql`

Fixtures go inside the block: an existing develop tenant and user, then playlists, a layout with two
zones, compositions and zones, publications and schedules. Every insert sets `tenant_id`.

| # | Setup | Call | Expect |
|---|---|---|---|
| A1 | Trashed playlist, no Program, in a zone of a live Layout L1 | permanent delete | `{deleted:false, reason:'in_layout', layouts:[{L1, in_trash:false}]}`, row still exists |
| A2 | Same, L1 in Trash too | permanent delete | `in_trash:true` |
| A3 | In zones of L1 and L2 | permanent delete | both, ordered by name |
| A4 | Trashed, direct `cancelled` Program and in L1 | permanent delete | `reason:'published'` (published first) |
| A5 | Trashed, no Program, no zone | permanent delete | `{deleted:true}`, row gone |
| A7 | Trashed playlist P not on composition C | `set_zones(C, [{…P}])` | raises `Invalid input: playlist is in Trash: <P name>` |
| A8 | C already holds trashed P in zone Z1; save Z1=P, Z2=live Q | `set_zones` | succeeds, zones replaced |
| A9 | Live playlist | `set_zones` | succeeds (regression) |

Run `scripts/db-dry-run.sh supabase/migrations/<ts>_what_holds_a_playlist.sql supabase/tests/what_holds_a_playlist_test.sql`.

### A4. Swagger

Document `reason: 'in_layout'` and `layouts[]` on `DELETE /media/playlists/{id}/permanent`.

## Part B — Core: `GET /media/playlists/:id/programs`

### B1. RPC, in the same migration

```sql
CREATE FUNCTION public.media_playlist_programs(p_tenant_id uuid, p_playlist_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO '' AS $$ … $$;
REVOKE ALL ON FUNCTION public.media_playlist_programs(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.media_playlist_programs(uuid, uuid) TO service_role;
```

- `CREATE FUNCTION` grants EXECUTE to PUBLIC, and there is a default-privilege gotcha for
  `service_role`. Match the grants of `media_publish_changes_programs` as checked in A1. Confirm on
  develop after CI applies the migration.

Body:

1. `PERFORM 1 FROM media_core.playlists WHERE id = p_playlist_id AND tenant_id = p_tenant_id`.
   - Do not filter `deleted_at`: the panel also opens in Trash.
   - If `NOT FOUND`, raise `not found: playlist not found for this tenant`.
2. Rows: `playlist_program_ids(p_tenant_id, p_playlist_id) t JOIN media_core.publications p ON p.id = t.publication_id`.
   Then:
   - `LEFT JOIN` the newest schedule, as `media_publish_changes_programs` does.
   - `LEFT JOIN media_core.compositions c ON c.id = p.composition_id AND p.publication_type = 'composition'`.
   - The campaigns join, as in `media_publications_list`.
3. Return `jsonb_build_object('programs', COALESCE(jsonb_agg(… ORDER BY p.updated_at DESC, p.id), '[]'))`.
   Each row has these keys. They are snake_case on purpose, so the FE row type is a subset of
   `PublicationListItem`:
   - `id`, `name`, `status`
   - `effective_status`: `publication_effective_status(p.status, s.starts_at, s.ends_at)`
   - `campaign_name`, `created_at`, `updated_at`
   - `via_composition`: `{id, name}` or null

### B2. Route `src/app/api/core/v1/media/playlists/[id]/programs/route.ts`

Copy `affected-programs/route.ts`. Call `media_playlist_programs` with `p_tenant_id` and
`p_playlist_id`.

### B3. Test, in the same test file

| # | Setup | Expect |
|---|---|---|
| B1 | Direct `active` + Layout `draft` + direct `cancelled` | 3 rows; the Layout row has `via_composition` = L1, the others null |
| B2 | Playlist in two zones of one Layout, one Program | 1 row (distinct) |
| B3 | Other tenant's playlist id | raises `not found:` |
| B4 | Trashed playlist with a cancelled Program | 1 row |
| B5 | No Programs | `programs: []` |

### B4. Swagger

Add `GET /media/playlists/{id}/programs` with the row schema.

## Part C — FE PR into `dev`

### C1. Types and API

- `src/lib/api/media-api.ts`:
  - Widen the `permanentlyDeletePlaylist` return to
    `{ deleted: boolean; reason?: "published" | "in_layout"; layouts?: { id: string; name: string; in_trash: boolean }[] }`.
  - Export that type.
- `playlists/services/playlists-api.ts`: add `fetchPlaylistPrograms(id)`, which calls
  `GET /media/playlists/${id}/programs` and returns `PlaylistProgram[]` (unwrap `programs`).
- `playlists/types/index.ts`: add `PlaylistProgram`. It is the row from B1, with
  `via_composition: { id: string; name: string } | null`.

### C2. Message helper (pure, checked)

- In `playlists/status-display.ts`, add `describePermanentDeleteRefusal(result)`. It returns the Thai
  line:
  - `published`: the existing text, "ลบถาวรไม่ได้ — playlist นี้เคยถูก publish จึงถูกล็อกไว้ถาวร".
  - `in_layout`: "ลบถาวรไม่ได้ — playlist นี้ยังอยู่ใน Layout: <A>, <B (ในถังขยะ — กู้คืน Layout ก่อน)>
    เอาออกจาก Layout ก่อน".
  - Unknown or missing reason: a generic line.
- Add cases to `status-display.check.mts`:
  - published;
  - in_layout with one Layout, and with two;
  - the in_trash suffix, including a mix of a live and a trashed Layout;
  - an unknown reason. Run `node src/features/media-workspace/playlists/status-display.check.mts`.

### C3. Callers

- `PlaylistsListDialogs.tsx`: on `!result.deleted`, call `onError(describePermanentDeleteRefusal(result))`.
- `use-trash-batch.ts` `handleEmptyTrash`:
  - Split the fulfilled `!deleted` results into `inLayout` (`reason === 'in_layout'`) and the rest.
  - The summary becomes
    `ลบถาวรแล้ว N playlist; ข้าม M playlist ที่ถูกล็อก; ถูกใช้ใน Layout K playlist; ล้มเหลว F playlist`.
    Leave out any part that is 0.

### C4. Side panel

- `PlaylistPanelTabs.tsx`: `usePlaylistPublications` calls `fetchPlaylistPrograms(playlistId)`
  instead of `fetchPublications()` plus the filter, and holds `PlaylistProgram[]`. Rename the hook to
  `usePlaylistPrograms`.
- `PublicationRow` takes `PlaylistProgram`. When `via_composition` is set, it shows a muted second line,
  "ผ่าน Layout: <name>". Keep one element per line (AGENTS.md JSX rule) and use tokens only.
- Update the comment above `PER_PAGE`: the rows now come from the playlist's own endpoint and include
  Layout Programs (ADR 0121). Keep the existing note that there are no dates.
- The `publication-status.ts` helpers take the new type as is, because the row has `status` and
  `effective_status`.

### C4a. Mount the panel again (added 2026-11-20, after browser verification)

- `PlaylistSidePanel` was imported nowhere: commit `5c9a1e50` dropped it, so C4 had no visible effect.
- `PlaylistsTable.tsx` gains a `details` row action, the first item of the list-view menu.
- `PlaylistSidePanel.tsx` gains `PlaylistDetailsDrawer`, a fixed right-hand drawer, 380px wide and
  full width on phones.
- `PlaylistsListPage.tsx` holds `detailsId` and renders the drawer. The drawer is never shown in
  Trash.
- The panel's Details tab shows Campaign as "—", because the list page no longer loads campaign
  names.

### C5. Layout editor error

- `compositions/hooks/useCompositionSave.ts:29-31` sends `Invalid input:` messages to
  `describeActivateError`. That function falls back to `describeSaveError` (`compositions/status-display.ts:27-63`),
  which ends in the generic "บันทึก Composition ไม่สำเร็จ".
- Add `/playlist is in Trash: (.+)/` to `describeSaveError`, mapping to "Playlist <name> อยู่ในถังขยะ
  กู้คืนก่อนจึงจะใส่ใน Layout ได้".
- Add the case to `compositions/status-display.check.mts`.

### C6. Checks

`npx tsc --noEmit`, `npm run lint`, and the `.check.mts` files you touched.

## Release

- Core PR → `develop`. CI applies the migration to develop.
- Prod is **R0**: `supabase db push` at the next Core release, never through MCP. Then compare the md5
  of the `prosrc` of the three functions against the file.
- FE PR → `dev`, released after Core is on prod.

## Verification (at the layer the user sees)

1. SQL: the dry-run test passes on develop.
2. HTTP, on develop after the Core merge, through thundercoredev:
   - `GET /media/playlists/<layout-only playlist>/programs` returns the Layout row with
     `via_composition`.
   - `DELETE …/permanent` on a trashed Layout-held playlist returns `reason:'in_layout'` with a 200,
     not a 500.
3. UI, in the browser. Ask the owner first (§3). `dev` points at develop.
   - The side panel of a Layout-only playlist lists the Program with "ผ่าน Layout: …".
   - The side panel of a draft-only playlist lists the draft.
   - Permanent delete on a trashed Layout-held playlist shows the Layout names.
   - Empty Trash shows the "ถูกใช้ใน Layout" count.
   - Saving a Layout that already holds a trashed playlist still works.
4. Prod, read-only, after release: the panel of "Lat Krabang (Suwannaphum)" lists "Lad Krabang" via its
   Layout.

## Not in scope

- What a Layout Program does at activate or publish time when a zone's playlist is in Trash.
- `runBatch` (multi-select permanent delete) still reports failures generically.
- The panel badges on `effective_status`, as it does today. The Programs list badges on
  `display_status` (`publication-list-display.ts:80-99`), so a Failed or Publishing Program shows
  "active" in the panel. Computing `display_status` here would need the play-window and delivery
  laterals.
- Cleaning up drafts, in `thunder_qa` or anywhere else (ADR 0121 §6).
