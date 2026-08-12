# Playlist Draft-Save Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give playlists the same DB-backed draft-save semantics publications already have (ADR 0003) — a draft row created on the first "Next", resumable after a crash/refresh, revision-guarded against concurrent edits — per the decisions recorded in `docs/adr/0012-playlist-draft-save.md`.

**Architecture:** Mirror `media_publication_upsert`'s exact idempotency-key + revision pattern into the already-existing `media_playlist_upsert`/`media_playlist_set_items`/`media_playlist_get`/`media_playlists_list` RPCs, drop `UNIQUE(tenant_id, name)`, and rewire the frontend draft store + wizard to create the row on first step-transition instead of at final submit.

**Tech Stack:** Next.js (Thunder_Core backend routes + thunder_one_prj frontend), Postgres/plpgsql (Supabase, project `sfiefevtxalqjizdkcsw`), Zustand persist, Zod route validation.

## Global Constraints

- Every migration in this plan targets **production** directly (`.env` has no local stack) — apply only via Supabase MCP `apply_migration`, and get explicit user approval before applying, per the project's R0 rule. Show the SQL and the exact objects/rows affected first.
- `CREATE OR REPLACE FUNCTION` does not replace a function when a parameter is added — it creates an ambiguous overload. `media_playlist_upsert` gains 2 parameters, so its migration must `DROP FUNCTION IF EXISTS` the old 6-arg signature first. `media_playlist_set_items`, `media_playlist_get`, `media_playlists_list` keep their signatures — direct `CREATE OR REPLACE` is fine for those three.
- No test runner exists in either repo by design. `thunder_one_prj` uses `*.check.mts` (plain `node:assert`, run with `node <file>.check.mts`). Migrations are verified by re-querying prod before/after, matching the pattern already used for migration 085 (see `.docs/SESSIONLOG-migration-085-content-unify-2026-08-11.md`).
- Commit messages: no `Co-Authored-By`, no mention of AI/Claude/Codex.
- Frontend calls hit `Thunder_Core`'s deployed backend (`CORE_API_URL` → `thundercore.vercel.app`), not local code — Task 7 onward cannot be verified end-to-end from `thunder_one_prj` alone until Thunder_Core's changes are deployed. This plan verifies each repo's pieces independently and flags the cross-repo gap explicitly at the end.

---

## File Structure

**`Thunder_Core`** (backend — RPCs + routes):
- Create: `supabase/migrations/086_playlist_draft_save.sql` — schema (`revision`, `idempotency_key`, drop name-unique, `status` check) + 4 RPC replacements
- Modify: `src/app/api/core/v1/media/playlists/route.ts` — POST body gains `status:'draft'`, `idempotency_key`
- Modify: `src/app/api/core/v1/media/playlists/[id]/route.ts` — PATCH body gains `status:'draft'`, `expected_revision`
- (`[id]/items/route.ts` unchanged — `media_playlist_set_items`'s new revision bump needs no route change)

**`thunder_one_prj`** (frontend):
- Modify: `src/features/playlists/types/index.ts` — `PLAYLIST_STATUSES` gains `'draft'`, `PlaylistDetail` gains `revision`
- Modify: `src/features/playlists/store/usePlaylistDraftStore.ts` — add `revision`, `idempotencyKey`; bump persist key `v1 → v2`
- Modify: `src/features/playlists/services/playlists-api.ts` — replace `createPlaylist`/`updatePlaylist` with one `upsertPlaylist`
- Modify: `src/features/playlists/step-validation.ts` — remove `isNameTaken`/`takenNames` (dead once the unique constraint is gone)
- Modify: `src/features/playlists/components/CreatePlaylistPage.tsx` — create draft on first Next, submit via `upsertPlaylist(status:'active')`, stale-draft + revision-conflict handling
- Modify: `src/features/playlists/components/BasicInfoStep.tsx` — drop `takenNames`/`nameTaken` UI
- Modify: `src/features/playlists/components/ReviewStep.tsx` — drop `takenNames`/`nameTaken` UI
- Modify: `src/features/publications/components/AssetCard.tsx` — show `created_at` under the playlist name (disambiguates now-nonunique names)

---

## Task 1: Thunder_Core migration — schema + `media_playlist_upsert`

**Files:**
- Create: `supabase/migrations/086_playlist_draft_save.sql`

**Interfaces:**
- Produces: `media_core.playlists.revision integer`, `media_core.playlists.idempotency_key uuid`, `status IN ('draft','active','inactive')`, no more `UNIQUE(tenant_id, name)`. RPC `media_playlist_upsert(p_tenant_id uuid, p_playlist_id uuid, p_name varchar, p_status varchar DEFAULT 'active', p_metadata jsonb DEFAULT NULL, p_created_by uuid DEFAULT NULL, p_expected_revision integer DEFAULT NULL, p_idempotency_key uuid DEFAULT NULL) RETURNS jsonb` with `{ playlist_id, revision }`.

- [ ] **Step 1: Write the migration file**

```sql
-- 086 — Playlist draft-save: revision + idempotency_key, mirroring publications (ADR 0003
-- in thunder_one_prj) per docs/adr/0012-playlist-draft-save.md (thunder_one_prj).
--
-- Four changes:
--   1. playlists gains revision (optimistic lock) and idempotency_key (create-retry safety),
--      status gains 'draft'.
--   2. UNIQUE(tenant_id, name) is DROPPED — confirmed explicitly: playlist names may collide,
--      for every status, not just draft. This is a deliberate scope expansion, not an
--      oversight (see ADR 0012 "Consequences").
--   3. media_playlist_upsert gains p_expected_revision + p_idempotency_key, mirrors
--      media_publication_upsert's lookup-by-key / adopt-on-race / status-downgrade-guard
--      logic exactly. Old 6-arg signature must be dropped first (adding params to
--      CREATE OR REPLACE creates an ambiguous overload, not a replacement).
--   4. media_playlist_set_items bumps revision (no check — same asymmetry as publications'
--      set_content/set_schedule). media_playlist_get returns revision. media_playlists_list
--      excludes status='draft' so an in-progress draft can't be picked by a publication.
--
-- Rollback: re-add UNIQUE(tenant_id, name) (will fail if duplicate names exist by then —
-- must be resolved manually first), restore playlists_status_check to ('active','inactive')
-- after deleting/reassigning any 'draft' rows, DROP the idempotency index and column, DROP
-- the revision column, and DROP FUNCTION the 8-arg media_playlist_upsert before restoring the
-- 6-arg version from before this migration.

ALTER TABLE media_core.playlists
  DROP CONSTRAINT playlists_tenant_id_name_key;

ALTER TABLE media_core.playlists
  ADD COLUMN revision integer NOT NULL DEFAULT 1,
  ADD COLUMN idempotency_key uuid;

CREATE UNIQUE INDEX media_playlists_tenant_idempotency_key_idx
  ON media_core.playlists (tenant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

ALTER TABLE media_core.playlists
  DROP CONSTRAINT playlists_status_check,
  ADD CONSTRAINT playlists_status_check
    CHECK (status::text = ANY (ARRAY['draft','active','inactive']::text[]));

DROP FUNCTION IF EXISTS public.media_playlist_upsert(uuid, uuid, character varying, character varying, jsonb, uuid);

CREATE OR REPLACE FUNCTION public.media_playlist_upsert(
    p_tenant_id uuid,
    p_playlist_id uuid,
    p_name character varying,
    p_status character varying DEFAULT 'active'::character varying,
    p_metadata jsonb DEFAULT NULL::jsonb,
    p_created_by uuid DEFAULT NULL::uuid,
    p_expected_revision integer DEFAULT NULL::integer,
    p_idempotency_key uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_id uuid;
    v_kind text;
    v_current_status text;
    v_current_revision integer;
    v_new_revision integer;
BEGIN
    IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
        RAISE EXCEPTION 'Invalid input: name is required';
    END IF;
    IF p_status NOT IN ('draft', 'active', 'inactive') THEN
        RAISE EXCEPTION 'Invalid input: status must be draft, active or inactive';
    END IF;

    IF p_playlist_id IS NULL AND p_idempotency_key IS NOT NULL THEN
        SELECT id INTO p_playlist_id
        FROM media_core.playlists
        WHERE tenant_id = p_tenant_id AND idempotency_key = p_idempotency_key;
    END IF;

    IF p_playlist_id IS NULL THEN
        -- A brand-new create cannot legally request 'draft'->non-draft in one call, and
        -- a fresh row has no current status to compare against, so the downgrade guard
        -- below doesn't apply here — any of the three values is a valid starting status.
        BEGIN
            INSERT INTO media_core.playlists (
                tenant_id, name, status, kind, metadata, created_by, idempotency_key
            )
            VALUES (
                p_tenant_id, p_name, p_status, 'user',
                COALESCE(p_metadata, '{}'::jsonb), p_created_by, p_idempotency_key
            )
            RETURNING id, revision INTO v_id, v_new_revision;
        EXCEPTION WHEN unique_violation THEN
            -- Only the idempotency index may be handled here. Any other unique violation
            -- must keep propagating.
            IF p_idempotency_key IS NULL THEN
                RAISE;
            END IF;

            -- Lost the race to a concurrent request carrying the same key. Adopt the
            -- winner's row instead of failing.
            SELECT status, revision INTO v_current_status, v_current_revision
            FROM media_core.playlists
            WHERE tenant_id = p_tenant_id AND idempotency_key = p_idempotency_key
            FOR UPDATE;

            IF NOT FOUND THEN
                RAISE;
            END IF;

            IF p_status = 'draft' AND v_current_status <> 'draft' THEN
                RAISE EXCEPTION 'Invalid input: cannot move an existing playlist back to draft';
            END IF;

            UPDATE media_core.playlists
            SET name = p_name,
                status = p_status,
                metadata = COALESCE(p_metadata, metadata),
                revision = revision + 1,
                updated_at = now()
            WHERE tenant_id = p_tenant_id AND idempotency_key = p_idempotency_key
            RETURNING id, revision INTO v_id, v_new_revision;
        END;
    ELSE
        SELECT kind, status, revision INTO v_kind, v_current_status, v_current_revision
        FROM media_core.playlists
        WHERE id = p_playlist_id AND tenant_id = p_tenant_id
        FOR UPDATE;

        IF NOT FOUND OR v_kind = 'single' THEN
            RAISE EXCEPTION 'not found: playlist not found for this tenant';
        END IF;

        IF p_status = 'draft' AND v_current_status <> 'draft' THEN
            RAISE EXCEPTION 'Invalid input: cannot move an existing playlist back to draft';
        END IF;

        IF p_expected_revision IS NOT NULL AND p_expected_revision <> v_current_revision THEN
            RAISE EXCEPTION 'Already modified: draft was changed elsewhere';
        END IF;

        UPDATE media_core.playlists
        SET name = p_name,
            status = p_status,
            metadata = COALESCE(p_metadata, metadata),
            revision = revision + 1,
            updated_at = now()
        WHERE id = p_playlist_id AND tenant_id = p_tenant_id AND kind = 'user'
        RETURNING id, revision INTO v_id, v_new_revision;
    END IF;

    RETURN jsonb_build_object('playlist_id', v_id, 'revision', v_new_revision);
END;
$function$;

CREATE OR REPLACE FUNCTION public.media_playlist_set_items(p_tenant_id uuid, p_playlist_id uuid, p_items jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_count integer;
    v_bad_assets integer;
    v_new_revision integer;
BEGIN
    PERFORM 1 FROM media_core.playlists WHERE id = p_playlist_id AND tenant_id = p_tenant_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'not found: playlist not found for this tenant';
    END IF;

    IF jsonb_typeof(p_items) <> 'array' THEN
        RAISE EXCEPTION 'Invalid input: items must be an array';
    END IF;

    SELECT count(*) INTO v_bad_assets
    FROM jsonb_array_elements(p_items) e
    LEFT JOIN media_core.media_assets ma
        ON ma.id = (e->>'media_asset_id')::uuid AND ma.tenant_id = p_tenant_id
    WHERE ma.id IS NULL;
    IF v_bad_assets > 0 THEN
        RAISE EXCEPTION 'Invalid input: % item(s) reference a video not in this tenant', v_bad_assets;
    END IF;

    DELETE FROM media_core.playlist_items WHERE playlist_id = p_playlist_id;

    INSERT INTO media_core.playlist_items (
        tenant_id, playlist_id, media_asset_id, position, duration_seconds, transition
    )
    SELECT
        p_tenant_id,
        p_playlist_id,
        (e->>'media_asset_id')::uuid,
        (e->>'position')::integer,
        NULLIF(e->>'duration_seconds', '')::integer,
        COALESCE(e->>'transition', 'cut')
    FROM jsonb_array_elements(p_items) e;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    UPDATE media_core.playlists
    SET revision = revision + 1, updated_at = now()
    WHERE id = p_playlist_id AND tenant_id = p_tenant_id
    RETURNING revision INTO v_new_revision;

    RETURN jsonb_build_object('playlist_id', p_playlist_id, 'item_count', v_count, 'revision', v_new_revision);
END;
$function$;

CREATE OR REPLACE FUNCTION public.media_playlist_get(p_tenant_id uuid, p_playlist_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'id', pl.id,
        'name', pl.name,
        'status', pl.status,
        'metadata', pl.metadata,
        'revision', pl.revision,
        'created_by', CASE WHEN cu.id IS NULL THEN NULL ELSE jsonb_build_object(
            'id', cu.id,
            'display_name', COALESCE(
                NULLIF(BTRIM(cu.display_name), ''),
                NULLIF(BTRIM(CONCAT_WS(' ', cu.first_name, cu.last_name)), ''),
                cu.email
            )
        ) END,
        'items', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'media_asset_id', pi.media_asset_id,
                'title', ma.title,
                'position', pi.position,
                'duration_seconds', COALESCE(pi.duration_seconds, ma.duration_seconds),
                'transition', pi.transition
            ) ORDER BY pi.position), '[]'::jsonb)
            FROM media_core.playlist_items pi
            JOIN media_core.media_assets ma ON ma.id = pi.media_asset_id
            WHERE pi.playlist_id = pl.id
        )
    ) INTO v_result
    FROM media_core.playlists pl
    LEFT JOIN public.users cu ON cu.id = pl.created_by
    WHERE pl.id = p_playlist_id AND pl.tenant_id = p_tenant_id;

    IF v_result IS NULL THEN
        RAISE EXCEPTION 'not found: playlist not found for this tenant';
    END IF;

    RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.media_playlists_list(p_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_result jsonb;
BEGIN
    SELECT COALESCE(jsonb_agg(p ORDER BY p->>'name'), '[]'::jsonb) INTO v_result
    FROM (
        SELECT jsonb_build_object(
            'id', pl.id,
            'name', pl.name,
            'status', pl.status,
            'item_count', (SELECT count(*) FROM media_core.playlist_items pi WHERE pi.playlist_id = pl.id),
            'created_at', pl.created_at,
            'metadata', pl.metadata,
            'created_by', CASE WHEN cu.id IS NULL THEN NULL ELSE jsonb_build_object(
                'id', cu.id,
                'display_name', COALESCE(
                    NULLIF(BTRIM(cu.display_name), ''),
                    NULLIF(BTRIM(CONCAT_WS(' ', cu.first_name, cu.last_name)), ''),
                    cu.email
                )
            ) END,
            'cover_asset_id', COALESCE(
                NULLIF(pl.metadata -> 'info' ->> 'cover_asset_id', '')::uuid,
                (SELECT pi.media_asset_id
                 FROM media_core.playlist_items pi
                 WHERE pi.playlist_id = pl.id
                 ORDER BY pi.position, pi.id
                 LIMIT 1)
            )
        ) AS p
        FROM media_core.playlists pl
        LEFT JOIN public.users cu ON cu.id = pl.created_by
        WHERE pl.tenant_id = p_tenant_id AND pl.kind = 'user' AND pl.status <> 'draft'
    ) rows;

    RETURN v_result;
END;
$function$;
```

- [ ] **Step 2: Verify state before applying — run against prod (`sfiefevtxalqjizdkcsw`) via Supabase MCP `execute_sql`**

```sql
select count(*) as total, count(*) filter (where kind='user') as user_kind
from media_core.playlists;

select conname from pg_constraint where conrelid = 'media_core.playlists'::regclass;
```

Record the counts and constraint list in the task's completion note — this is what "before" looks like for the verification in Step 4.

- [ ] **Step 3: R0 — get explicit approval, then apply via Supabase MCP `apply_migration`**

State exactly what will change before applying: drops `playlists_tenant_id_name_key`, adds 2 columns + 1 index + 1 check-constraint replacement, replaces 4 functions (1 via `DROP`+`CREATE`, 3 via `CREATE OR REPLACE`), 0 rows are inserted/deleted/updated by this migration itself (schema + function bodies only). Wait for explicit user approval before calling `apply_migration`.

- [ ] **Step 4: Verify after applying**

```sql
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema='media_core' and table_name='playlists'
order by ordinal_position;

select conname, pg_get_constraintdef(oid) from pg_constraint
where conrelid = 'media_core.playlists'::regclass;

select proname, pg_get_function_arguments(oid)
from pg_proc where proname like 'media_playlist%' and pronamespace='public'::regnamespace;
```

Confirm: `revision`/`idempotency_key` columns present, no `playlists_tenant_id_name_key`, `media_playlist_upsert` has 8 args, `media_playlists_list`/`media_playlist_get`/`media_playlist_set_items` unchanged signatures. Then dump each function body with `pg_get_functiondef` and diff against the migration file text to confirm byte-identical deployment (same discipline as migration 085).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/086_playlist_draft_save.sql
git commit -m "feat(playlists): add revision/idempotency-key draft-save to playlist RPCs"
```

---

## Task 2: Thunder_Core route handlers

**Files:**
- Modify: `src/app/api/core/v1/media/playlists/route.ts`
- Modify: `src/app/api/core/v1/media/playlists/[id]/route.ts`

**Interfaces:**
- Consumes: `media_playlist_upsert` from Task 1 (8 params, returns `{playlist_id, revision}`).
- Produces: `POST /media/playlists` body accepts `{name, status?, metadata?, idempotency_key?}`; `PATCH /media/playlists/:id` body accepts `{name, status?, metadata?, expected_revision?}`.

- [ ] **Step 1: Update the POST/GET route**

```typescript
import { apiHandler } from '@/lib/api-utils'
import { callMedia, requireMediaTenant } from '@/lib/core/media'
import { z } from 'zod'

const playlistCreateSchema = z.object({
    name: z.string().min(1),
    status: z.enum(['draft', 'active', 'inactive']).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    idempotency_key: z.string().uuid().optional(),
})

export async function GET(request: Request) {
    return apiHandler(async () => {
        const { tenantId, admin } = await requireMediaTenant(request)
        const result = await callMedia(admin, 'media_playlists_list', {
            p_tenant_id: tenantId,
        })
        return { success: true, data: result }
    })
}

export async function POST(request: Request) {
    return apiHandler(async () => {
        const { tenantId, userId, admin } = await requireMediaTenant(request)
        const body = await request.json().catch(() => null)
        const parsed = playlistCreateSchema.safeParse(body)
        if (!parsed.success) {
            throw new Error(`Invalid input: ${parsed.error.issues.map((e) => e.message).join(', ')}`)
        }
        const input = parsed.data
        const result = await callMedia(admin, 'media_playlist_upsert', {
            p_tenant_id: tenantId,
            p_playlist_id: null,
            p_name: input.name,
            p_status: input.status ?? 'active',
            p_metadata: input.metadata ?? null,
            p_created_by: userId,
            p_idempotency_key: input.idempotency_key ?? null,
        })
        return { success: true, data: result }
    }, 201)
}
```

- [ ] **Step 2: Update the PATCH route**

```typescript
import { apiHandler, type RouteContext } from '@/lib/api-utils'
import { requireUuid } from '@/lib/core-api-utils'
import { callMedia, requireMediaTenant } from '@/lib/core/media'
import { z } from 'zod'

const playlistUpdateSchema = z.object({
    name: z.string().min(1),
    status: z.enum(['draft', 'active', 'inactive']).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    expected_revision: z.number().int().optional(),
})

export async function GET(request: Request, ctx: RouteContext<{ id: string }>) {
    return apiHandler(async () => {
        const { tenantId, admin } = await requireMediaTenant(request)
        const { id } = await ctx.params
        const result = await callMedia(admin, 'media_playlist_get', {
            p_tenant_id: tenantId,
            p_playlist_id: requireUuid(id, 'id'),
        })
        return { success: true, data: result }
    })
}

export async function PATCH(request: Request, ctx: RouteContext<{ id: string }>) {
    return apiHandler(async () => {
        const { tenantId, admin } = await requireMediaTenant(request)
        const { id } = await ctx.params
        const body = await request.json().catch(() => null)
        const parsed = playlistUpdateSchema.safeParse(body)
        if (!parsed.success) {
            throw new Error(`Invalid input: ${parsed.error.issues.map((e) => e.message).join(', ')}`)
        }
        const input = parsed.data
        const result = await callMedia(admin, 'media_playlist_upsert', {
            p_tenant_id: tenantId,
            p_playlist_id: requireUuid(id, 'id'),
            p_name: input.name,
            p_status: input.status ?? 'active',
            p_metadata: input.metadata ?? null,
            p_expected_revision: input.expected_revision ?? null,
        })
        return { success: true, data: result }
    })
}
```

- [ ] **Step 3: Build check**

Run: `cd Thunder_Core && npx tsc --noEmit`
Expected: no new errors from these two files.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/core/v1/media/playlists/route.ts src/app/api/core/v1/media/playlists/[id]/route.ts
git commit -m "feat(playlists): accept draft status/idempotency-key/expected-revision on save"
```

---

## Task 3: thunder_one_prj types

**Files:**
- Modify: `src/features/playlists/types/index.ts:6-7` (status), `:74-84` (`PlaylistListItem`), `:86-94` (`PlaylistDetail`)

**Interfaces:**
- Produces: `PlaylistStatus = "draft" | "active" | "inactive"`, `PlaylistDetail.revision: number`.

- [ ] **Step 1: Edit the status union**

```typescript
export const PLAYLIST_STATUSES = ["draft", "active", "inactive"] as const;
export type PlaylistStatus = (typeof PLAYLIST_STATUSES)[number];
```

- [ ] **Step 2: Add `revision` to `PlaylistDetail`**

```typescript
export type PlaylistDetail = {
  id: string;
  name: string;
  status: PlaylistStatus;
  items: PlaylistItem[];
  revision: number;
  /** Phase 2 fields — absent until the get RPC is extended. */
  metadata?: Record<string, unknown>;
  created_by?: Creator;
};
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: errors only in files this plan will touch later (`CreatePlaylistPage.tsx` reading `detail.revision`-shaped things, `step-validation.ts` consumers) — no unrelated breakage. Note which files error; they are exactly Tasks 4-7 below.

- [ ] **Step 4: Commit**

```bash
git add src/features/playlists/types/index.ts
git commit -m "feat(playlists): add draft status and revision to playlist types"
```

---

## Task 4: `usePlaylistDraftStore` — revision + idempotency key, bump persist key

**Files:**
- Modify: `src/features/playlists/store/usePlaylistDraftStore.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `PlaylistDraftFields.revision: number | null`, `.idempotencyKey: string`, `setRevision(revision: number | null): void`, `resetIdempotencyKey(): void`. Persist key `thunderone.playlists.create-draft.v2`.

- [ ] **Step 1: Add the fields and actions**

```typescript
const STORAGE_KEY = "thunderone.playlists.create-draft.v2";

export interface PlaylistDraftFields {
  playlistId: string | null;
  editingId: string | null;
  /** Minted once per draft, sent on the first (create) POST — same role as
   *  the publication draft's idempotencyKey. Must be minted at construction,
   *  never lazily inside the save path. */
  idempotencyKey: string;
  /** Optimistic-lock counter from the last successful save. `null` until the
   *  first save/load — omitting `expected_revision` on that first write is
   *  what `media_playlist_upsert` treats as "no check". */
  revision: number | null;
  step: number;
  name: string;
  status: "draft" | "active" | "inactive";
  info: PlaylistInfo;
  playback: PlaylistPlayback;
  items: DraftItem[];
}

function getDefaultDraft(): PlaylistDraftFields {
  return {
    playlistId: null,
    editingId: null,
    idempotencyKey: crypto.randomUUID(),
    revision: null,
    step: 1,
    name: "",
    status: "draft",
    info: defaultInfo(),
    playback: defaultPlayback(),
    items: [],
  };
}
```

- [ ] **Step 2: Add `setRevision`/`resetIdempotencyKey` to the interface and store body**

```typescript
interface PlaylistDraftStore extends PlaylistDraftFields {
  setStep: (step: number) => void;
  setName: (name: string) => void;
  setInfo: (patch: Partial<PlaylistInfo>) => void;
  setPlayback: (patch: Partial<PlaylistPlayback>) => void;
  setItems: (items: DraftItem[]) => void;
  addItem: (item: DraftItem) => void;
  removeItem: (mediaAssetId: string) => void;
  moveItem: (from: number, to: number) => void;
  patchItem: (mediaAssetId: string, patch: Partial<DraftItem>) => void;
  setCover: (mediaAssetId: string | undefined) => void;
  setPlaylistId: (id: string | null) => void;
  setRevision: (revision: number | null) => void;
  resetIdempotencyKey: () => void;
  loadDraft: (draft: Partial<PlaylistDraftFields>) => void;
  reset: () => void;
}
```

Add inside the `persist((set) => ({ ... }))` body, alongside `setPlaylistId`:

```typescript
      setPlaylistId: (playlistId) => set({ playlistId }),
      setRevision: (revision) => set({ revision }),
      resetIdempotencyKey: () => set({ idempotencyKey: crypto.randomUUID() }),
      loadDraft: (draft) => set((s) => ({ ...s, ...draft })),
      reset: () => set(getDefaultDraft()),
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors in this file. Consumers (`CreatePlaylistPage.tsx` etc.) still error until Task 6 — expected at this point.

- [ ] **Step 4: Commit**

```bash
git add src/features/playlists/store/usePlaylistDraftStore.ts
git commit -m "feat(playlists): add revision and idempotency key to the draft store"
```

---

## Task 5: `playlists-api.ts` — `upsertPlaylist`

**Files:**
- Modify: `src/features/playlists/services/playlists-api.ts`

**Interfaces:**
- Consumes: `requestApi` from `@/lib/api/media-api` (existing).
- Produces: `upsertPlaylist(input: { name: string; status?: PlaylistStatus; metadata?: Record<string, unknown>; playlistId?: string | null; expectedRevision?: number | null; idempotencyKey?: string }): Promise<{ playlist_id: string; revision: number }>`. Replaces `createPlaylist`/`updatePlaylist` — remove both, no other file references them outside `CreatePlaylistPage.tsx` (fixed in Task 6).

- [ ] **Step 1: Replace `createPlaylist`/`updatePlaylist` with `upsertPlaylist`**

```typescript
import { requestApi } from "@/lib/api/media-api";
import type { PlaylistDetail, PlaylistListItem, PlaylistStatus, Transition } from "../types";

export async function fetchPlaylists(): Promise<PlaylistListItem[]> {
  const data = await requestApi<{ playlists?: PlaylistListItem[] } | PlaylistListItem[]>(
    "GET",
    "/media/playlists"
  );
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray(data.playlists)) {
    return data.playlists;
  }
  return [];
}

export async function fetchPlaylist(id: string): Promise<PlaylistDetail> {
  return requestApi<PlaylistDetail>("GET", `/media/playlists/${id}`);
}

export type UpsertPlaylistInput = {
  name: string;
  status?: PlaylistStatus;
  metadata?: Record<string, unknown>;
  playlistId?: string | null;
  /** Only meaningful on an update — a fresh draft (POST) has no revision to
   *  race against yet. `media_playlist_upsert` skips the check when omitted. */
  expectedRevision?: number | null;
  /** Only sent on create: an update already addresses the row by id and
   *  never needs a dedupe key. */
  idempotencyKey?: string;
};

export async function upsertPlaylist(
  input: UpsertPlaylistInput
): Promise<{ playlist_id: string; revision: number }> {
  const body: Record<string, unknown> = { name: input.name.trim() };
  if (input.status) body.status = input.status;
  if (input.metadata) body.metadata = input.metadata;

  if (input.playlistId) {
    if (input.expectedRevision != null) body.expected_revision = input.expectedRevision;
    return requestApi("PATCH", `/media/playlists/${input.playlistId}`, body);
  }
  if (input.idempotencyKey) body.idempotency_key = input.idempotencyKey;
  return requestApi("POST", "/media/playlists", body);
}

/** What `PUT /{id}/items` accepts — `duration_seconds` is omitted (not null) to let the
 *  backend fall back to the asset's own duration. */
export type PlaylistItemPayload = {
  media_asset_id: string;
  position: number;
  duration_seconds?: number;
  transition?: Transition;
};

/** Replaces the playlist's items wholesale — positions must already be 0-based and dense. */
export async function setPlaylistItems(
  id: string,
  items: PlaylistItemPayload[]
): Promise<{ item_count?: number; revision?: number }> {
  return requestApi("PUT", `/media/playlists/${id}/items`, { items });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: errors only in `CreatePlaylistPage.tsx` (still imports removed `createPlaylist`/`updatePlaylist`) — fixed next task.

- [ ] **Step 3: Commit**

```bash
git add src/features/playlists/services/playlists-api.ts
git commit -m "feat(playlists): replace create/update calls with a single upsertPlaylist"
```

---

## Task 6: `step-validation.ts` — remove name-uniqueness

**Files:**
- Modify: `src/features/playlists/step-validation.ts`

**Interfaces:**
- Produces: `ValidatableDraft` loses `takenNames`. `validateStep`/`canSubmit` unchanged otherwise. `isNameTaken` removed entirely.

- [ ] **Step 1: Rewrite the file**

```typescript
// Per-step gate for the Create Playlist wizard, same shape as the publications one
// (docs/adr/0001-wizard-step-contract.md) minus the persistence half — Next still just
// validates then calls setStep; the actual draft-row save now happens in
// CreatePlaylistPage's goNext handler (docs/adr/0012-playlist-draft-save.md).

import type { DraftItem } from "./types";

export const PLAYLIST_LIMITS = {
  nameMax: 100,
  descriptionMax: 300,
} as const;

export type WizardStepId = 1 | 2 | 3;

export interface StepValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ValidatableDraft {
  name: string;
  description?: string;
  items: DraftItem[];
}

export function validateStep(
  step: WizardStepId,
  draft: ValidatableDraft
): StepValidationResult {
  const errors: string[] = [];

  if (step === 1) {
    const trimmed = draft.name.trim();
    if (trimmed.length === 0) {
      errors.push("ตั้งชื่อ playlist ก่อน");
    } else if (trimmed.length > PLAYLIST_LIMITS.nameMax) {
      errors.push(`ชื่อยาวเกิน ${PLAYLIST_LIMITS.nameMax} ตัวอักษร`);
    }
    if ((draft.description?.length ?? 0) > PLAYLIST_LIMITS.descriptionMax) {
      errors.push(`คำอธิบายยาวเกิน ${PLAYLIST_LIMITS.descriptionMax} ตัวอักษร`);
    }
  }

  if (step === 2 && draft.items.length === 0) {
    errors.push("เลือก media อย่างน้อย 1 ชิ้น");
  }

  return { valid: errors.length === 0, errors };
}

/** Whether the wizard can be submitted at all — every step's rules at once. */
export function canSubmit(draft: ValidatableDraft): boolean {
  return ([1, 2, 3] as WizardStepId[]).every((step) => validateStep(step, draft).valid);
}
```

- [ ] **Step 2: Write the check**

Create `src/features/playlists/step-validation.check.mts`:

```typescript
import assert from "node:assert";
import { validateStep, canSubmit } from "./step-validation.ts";

// Empty name still fails step 1 — the one rule that survived the uniqueness removal.
{
  const result = validateStep(1, { name: "", items: [] });
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.includes("ตั้งชื่อ playlist ก่อน"));
}

// A duplicate-looking name (same string used twice) is no longer rejected — this is the
// behavior change this task exists to make, so assert it directly rather than just
// asserting the old rejection is gone.
{
  const result = validateStep(1, { name: "Lobby Loop", items: [] });
  assert.strictEqual(result.valid, true);
}

// canSubmit requires step 2's item rule too.
{
  assert.strictEqual(canSubmit({ name: "Lobby Loop", items: [] }), false);
  assert.strictEqual(
    canSubmit({ name: "Lobby Loop", items: [{ mediaAssetId: "a", transition: "cut" }] }),
    true
  );
}

console.log("step-validation.check.mts OK");
```

- [ ] **Step 3: Run the check**

Run: `node src/features/playlists/step-validation.check.mts`
Expected: prints `step-validation.check.mts OK`, exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/features/playlists/step-validation.ts src/features/playlists/step-validation.check.mts
git commit -m "feat(playlists): drop name-uniqueness validation now that names can collide"
```

---

## Task 7: `BasicInfoStep.tsx` / `ReviewStep.tsx` — remove `takenNames` UI

**Files:**
- Modify: `src/features/playlists/components/BasicInfoStep.tsx`
- Modify: `src/features/playlists/components/ReviewStep.tsx`

**Interfaces:**
- Consumes: `validateStep`/`canSubmit` from Task 6 (no `takenNames` field).
- Produces: both components drop the `takenNames` prop entirely.

- [ ] **Step 1: `BasicInfoStep.tsx` — drop the prop and the taken-name UI**

Remove `takenNames` from the destructured props and its type (`:24`, `:28`). Remove the `isNameTaken` import (`:9`) and the `nameTaken` computation (`:43`). Remove the `aria-invalid`/red-border/warning-paragraph block tied to `nameTaken` (`:62-67`), leaving a plain input:

```typescript
        <Field
          label="Playlist Name"
          required
          hint={`${nameLength} / ${PLAYLIST_LIMITS.nameMax}`}
        >
          <input
            value={name}
            maxLength={PLAYLIST_LIMITS.nameMax}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น KFC Wednesday Main Playlist"
            className={inputClasses}
          />
        </Field>
```

- [ ] **Step 2: `ReviewStep.tsx` — drop the prop and the taken-name UI**

Remove `takenNames` from the destructured props and its type (`:27`, `:32`). Remove `isNameTaken` from the import (`:11`, keep `canSubmit`). Change `:50-51` to:

```typescript
  const ready = canSubmit({ name, description: info.description, items });
```

Simplify the validation-summary block (`:166-181`) to only check whether a name is present:

```typescript
          <span
            className={`flex items-center gap-2 ${
              name.trim() ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500"
            }`}
          >
            {name.trim() ? (
              <CheckCircleIcon className="h-4 w-4" />
            ) : (
              <WarningTriangleIcon className="h-4 w-4 text-amber-500" />
            )}
            {name.trim() ? "ตั้งชื่อ playlist แล้ว" : "ยังไม่ได้ตั้งชื่อ playlist"}
          </span>
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors in these two files. `CreatePlaylistPage.tsx` (their caller) still errors — fixed next task.

- [ ] **Step 4: Commit**

```bash
git add src/features/playlists/components/BasicInfoStep.tsx src/features/playlists/components/ReviewStep.tsx
git commit -m "feat(playlists): remove taken-name UI from Basic Info and Review steps"
```

---

## Task 8: `CreatePlaylistPage.tsx` — create draft on first Next, revision-guarded submit

**Files:**
- Modify: `src/features/playlists/components/CreatePlaylistPage.tsx`

**Interfaces:**
- Consumes: `upsertPlaylist` (Task 5), `PlaylistDraftFields.idempotencyKey`/`.revision`/`setRevision`/`resetIdempotencyKey` (Task 4), `validateStep`/`ValidatableDraft` without `takenNames` (Task 6), `isConflict` from `@/lib/api/api-error` (existing, already used by publications).
- Produces: draft row created on first `goNext()` from step 1; `handleSubmit` calls `upsertPlaylist(status:'active')` then `setPlaylistItems`; a 409 sets a `revisionConflict` banner distinct from `submitError`; a stale-draft 404 re-mints the idempotency key and retries as a fresh create.

- [ ] **Step 1: Remove the name-collision machinery**

Delete the `existingNames` state (`:56`) and its population in the `Promise.allSettled` block (`:78-80`, and drop `fetchPlaylists()` from the `Promise.allSettled` array if nothing else in this file needs it — check: `takenNames`/`existingNames` were its only consumer, so remove `fetchPlaylists` from imports and from the array too). Delete `takenNames` (`:132`) and the `isNameTaken` import along with the `retryOnly`-related duplicate-name special-casing inside the catch block (`:196-214`, the `rowExists`/`classified.kind === "retryable"` duplicate-name guess) — replace with plain `classifyApiError` output, since a name collision can no longer happen.

Also drop `takenNames` from `validatableDraft` (`:134`, becomes `{ name, description: info.description, items }`) and stop passing `takenNames={takenNames}` to `<BasicInfoStep>` (`:224`) and `<ReviewStep>` (`:236-237`) in `stepContent()` — both dropped the prop in Task 7.

- [ ] **Step 2: Capture `revision` on edit-mode load**

The `?id=` edit-mode effect (`:91-98`) fetches the real playlist but never stores its `revision` — add it, or the first `goNext`/`handleSubmit` on an existing playlist sends `expectedRevision: null` and skips the guard entirely:

```typescript
    fetchPlaylist(idParam)
      .then((detail) => {
        if (!alive) return;
        draft.reset();
        draft.setName(detail.name);
        draft.setItems(detailToDraftItems(detail.items));
        draft.setPlaylistId(detail.id);
        draft.setRevision(detail.revision);
        usePlaylistDraftStore.setState({ editingId: detail.id, step: 1 });
      })
```

- [ ] **Step 3: Add `isStaleDraftError` and revision-conflict state**

Add near the top of the file, alongside the other imports:

```typescript
import { classifyApiError, isConflict, type ClassifiedError } from "@/lib/api/api-error";
import { upsertPlaylist, fetchPlaylist, setPlaylistItems } from "../services/playlists-api";

/** The backend rejection that means "this draft id is no longer usable" — the row
 *  was deleted, or moved out of 'draft' from elsewhere. Matched on message because
 *  the proxy only forwards `{ error: string }`. Same shape as publications'
 *  isStaleDraftError in usePublishDraft.ts. */
function isStaleDraftError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : "";
  return msg.includes("playlist not found for this tenant");
}
```

Add state inside the component, alongside `submitError`:

```typescript
  const [revisionConflict, setRevisionConflict] = useState<string | null>(null);
```

- [ ] **Step 4: Create the draft row on first Next**

Replace `goNext`:

```typescript
  const [creatingDraft, setCreatingDraft] = useState(false);

  const goNext = async () => {
    if (step >= LAST_STEP) return;
    const result = validateStep(step as WizardStepId, validatableDraft);
    setValidationErrors(result.errors);
    if (!result.valid) return;

    // Draft row is created (or updated) on the first Next from step 1 — mirrors
    // publications' persistDraft trigger point (docs/adr/0012).
    if (step === 1) {
      setCreatingDraft(true);
      setSubmitError(null);
      try {
        const current = usePlaylistDraftStore.getState();
        const res = await upsertPlaylist({
          name: name.trim(),
          status: "draft",
          playlistId: current.playlistId ?? current.editingId,
          expectedRevision: current.revision,
          idempotencyKey: current.idempotencyKey,
        });
        draft.setPlaylistId(res.playlist_id);
        draft.setRevision(res.revision);
      } catch (err) {
        if (isStaleDraftError(err)) {
          draft.resetIdempotencyKey();
          draft.setPlaylistId(null);
          draft.setRevision(null);
          const res = await upsertPlaylist({
            name: name.trim(),
            status: "draft",
            idempotencyKey: usePlaylistDraftStore.getState().idempotencyKey,
          });
          draft.setPlaylistId(res.playlist_id);
          draft.setRevision(res.revision);
        } else {
          if (err instanceof Error && isConflict(err.message)) {
            setRevisionConflict(classifyApiError(err, err.message).message);
          } else {
            setSubmitError(classifyApiError(err, "บันทึก draft ไม่สำเร็จ"));
          }
          setCreatingDraft(false);
          return;
        }
      }
      setCreatingDraft(false);
    }

    draft.setStep(step + 1);
  };
```

- [ ] **Step 5: Rewrite `handleSubmit`**

```typescript
  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const current = usePlaylistDraftStore.getState();
      const metadata = encodeMetadata({ info, playback: draft.playback });
      const id = current.playlistId ?? current.editingId;
      if (!id) throw new Error("missing playlist id");

      const res = await upsertPlaylist({
        name: name.trim(),
        status: "active",
        metadata,
        playlistId: id,
        expectedRevision: current.revision,
      });
      draft.setRevision(res.revision);

      const itemsRes = await setPlaylistItems(id, buildItemPayload());
      if (typeof itemsRes.revision === "number") draft.setRevision(itemsRes.revision);

      draft.reset();
      router.push("/playlists");
    } catch (err) {
      if (err instanceof Error && isConflict(err.message)) {
        setRevisionConflict(classifyApiError(err, err.message).message);
      } else {
        setSubmitError(classifyApiError(err, "สร้าง playlist ไม่สำเร็จ"));
      }
    } finally {
      setSubmitting(false);
    }
  };
```

Remove the now-unused `retryOnly` state and its `<Button>` label branch (`"ลองใหม่"`) — a failed submit can simply be retried as-is, since `upsertPlaylist` on the update path (`playlistId` set) is idempotent per revision, not per "did the row get created yet".

- [ ] **Step 6: Render the revision-conflict banner**

Add alongside the existing `submitError` card, same amber/red pattern used by publications:

```typescript
          {revisionConflict && (
            <Card className="border-amber-200 p-4 dark:border-amber-900">
              <p className="text-sm text-amber-700 dark:text-amber-400">{revisionConflict}</p>
              <Button
                className="mt-2"
                variant="secondary"
                onClick={async () => {
                  const id = playlistId ?? editingId;
                  if (!id) return;
                  const fresh = await fetchPlaylist(id);
                  draft.setName(fresh.name);
                  draft.setRevision(fresh.revision);
                  setRevisionConflict(null);
                }}
              >
                โหลดใหม่
              </Button>
            </Card>
          )}
```

Also disable the Next/submit buttons while `creatingDraft` is true, same as the existing `submitting` disable, so a double-click can't fire two draft-creates.

- [ ] **Step 7: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 errors across the `playlists` feature.

- [ ] **Step 8: Lint**

Run: `npx eslint src/features/playlists`
Expected: 0 errors. Pay attention to the "no synchronous setState in useEffect" rule this repo enforces if any effect ends up touching `goNext`'s new async path — it shouldn't, since `goNext` is now a plain async event handler, not an effect.

- [ ] **Step 9: Commit**

```bash
git add src/features/playlists/components/CreatePlaylistPage.tsx
git commit -m "feat(playlists): create draft on first Next, revision-guard the submit"
```

---

## Task 9: `AssetCard.tsx` — disambiguate playlists by date, not just name

**Files:**
- Modify: `src/features/publications/components/AssetCard.tsx:59-64`

**Interfaces:**
- Consumes: `PlaylistListItem.created_at` (already exists in the type, per Task 3 — unchanged there).

- [ ] **Step 1: Add a `created_at` line under the playlist name**

```typescript
        <div className="flex flex-col gap-1 p-2">
          <p className="truncate text-xs font-medium text-zinc-900">{playlist.name}</p>
          <p className="text-[11px] text-zinc-400">
            {playlist.item_count} items
            {playlist.created_at ? ` · ${new Date(playlist.created_at).toLocaleDateString()}` : ""}
          </p>
          <span className="inline-flex w-fit items-center rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">
            Playlist
          </span>
        </div>
```

Shown unconditionally (not just when a name collision is detected) — per ADR 0012, avoids string-comparison dedup logic entirely.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/publications/components/AssetCard.tsx
git commit -m "feat(publications): show playlist created date to disambiguate duplicate names"
```

---

## Final verification (cross-repo, do not skip)

This plan's frontend tasks (3-9) can `tsc`/`eslint` clean without Thunder_Core's changes being deployed, but **cannot be exercised end-to-end** until Task 1-2 ship to the environment `CORE_API_URL` points at (`thundercore.vercel.app` per the project's deployment gotcha) — local frontend code talks to the deployed backend, not local Thunder_Core code.

- [ ] After Thunder_Core's PR (Tasks 1-2) is merged and deployed, and thunder_one_prj's PR (Tasks 3-9) is merged and deployed: manually walk the Create Playlist wizard in a browser — fill step 1, click Next, confirm (via Supabase `execute_sql`) a `status='draft'` row now exists; refresh the tab mid-wizard, confirm the draft resumes from the same row (same `playlistId`, no duplicate created); finish the wizard, confirm `status` flips to `'active'` and the row no longer appears in `/playlists` while it was still `draft`.
- [ ] Open the same draft in two tabs (same browser, shares localStorage) and submit both — confirm the second submit hits the revision-conflict banner, not a silent overwrite or a crash.
- **This step needs the user's explicit go-ahead before running** (per the project's browser-verification rule) — do not report the feature as "done" until it's been run and its result reported, or the user has explicitly said to skip it.
