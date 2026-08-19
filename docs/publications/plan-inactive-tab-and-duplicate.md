# Publications: Inactive Tab and Duplicate — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Inactive" tab to `/publications` showing ended and cancelled publications, and a Duplicate action on Active/Inactive rows that copies a publication (playlist + items, targets, schedule shape) into a new draft, per `docs/adr/0015-publications-inactive-tab-and-duplicate.md`.

**Architecture:** The Inactive tab needs **no backend change at all** — `media_publications_list` and its route already accept `p_status = 'cancelled'` (confirmed live in prod, migrations 061/079 and the route's zod schema); the frontend simply never calls it. Duplicate needs one new RPC (`media_publication_duplicate`, fusing the insert patterns already used by `media_publication_upsert` and `media_publication_set_content`) and one new route.

**Tech Stack:** Next.js (Thunder_Core backend routes + thunder_one_prj frontend), Postgres/plpgsql (Supabase, project `sfiefevtxalqjizdkcsw`).

## ข้อเท็จจริงที่ยืนยันแล้ว — อย่า re-derive

- `media_publications_list(p_tenant_id, p_status)` (`Thunder_Core/supabase/migrations/079_publications_list_created_by.sql:23-89`) already allow-lists `'cancelled'` (line 32-34) and has since 061. It already returns `effective_status` on every row (ADR 0004).
- The GET route `Thunder_Core/src/app/api/core/v1/media/publications/route.ts:32-34` already has `status: z.enum(['draft','active','cancelled']).optional()` — `cancelled` is already a legal query value end to end. **Only `thunder_one_prj`'s `fetchPublications` union type (`"draft" | "active"`) blocks calling it.**
- `media_publication_delete` (`061_media_publication_manage.sql:63-106`) only permits `status = 'draft'` — confirmed, untouched by this plan (ADR 0015 explicitly drops bulk-delete).
- No `duplicate`/`clone` RPC exists anywhere in `Thunder_Core`'s migrations. The new RPC in Task 1 has no precedent to copy verbatim — it fuses two existing patterns (`media_publication_upsert`'s publication+targets+schedule insert, `media_publication_set_content`'s playlist+items insert). **Before applying, diff Task 1's migration against the live INSERT column lists in `078_publication_idempotency_key.sql:31-219` and `071_publication_draft_revision.sql:194-308`** — this plan was written from the confirmed table schemas below, not from those two files' literal INSERT text, so column order/defaults there may reveal something this plan missed.
- Confirmed current schema (all columns, cited migration is where each was added):
  - `media_core.publications`: `id, tenant_id, playlist_id(nullable), status, published_by, created_at, name, description, campaign_id(NOT NULL), publication_type, priority, language, metadata, activated_at, updated_at, cancelled_at, revision, created_by, idempotency_key` — status CHECK is `('draft','active','expired','cancelled')` (`055_...sql:161-162`).
  - `media_core.publication_targets` (`048_media_core_schema.sql:115-125`): `id, publication_id, target_type, channel_id, device_id` — one row per channel-or-device target.
  - `media_core.schedules` (`048_media_core_schema.sql:131-141`): `id, tenant_id, publication_id, starts_at(NOT NULL DEFAULT now()), ends_at(nullable), timezone, recurrence, created_at` — multiple rows are schema-legal; every reader picks the latest via `ORDER BY created_at DESC LIMIT 1`.
  - `media_core.playlists`: has a `kind` column (`'user'` vs `'single'`) and, since `086_playlist_draft_save.sql`, `status IN ('draft','active','inactive')`. Auto-owned publication playlists are named `'pub:' || <publication_id>` (confirmed convention, checked by `media_publication_delete`'s `LIKE 'pub:%'` guard).
  - `playlist_id` on `publications` has **no `UNIQUE` constraint** — the 1:1 relationship is convention-only.
- **`ends_at` can be cleared to `NULL` on the copy; `starts_at` cannot** — it's `NOT NULL DEFAULT now()`. ADR 0015 says "clears `starts_at`/`ends_at` to null"; this plan implements that as "`starts_at` resets to `now()`, `ends_at` resets to `NULL`" since a literal null `starts_at` violates the schema. This is a deliberate reading of the ADR's intent (force the operator to set a real window), not a deviation from it.
- `PublicationsListPage.tsx`: fetch effect at line 32-54 (`Promise.allSettled([fetchPublications("draft"), fetchPublications("active")])`), generic `renderTable(items, tab, error)` at line 84-247 parameterized by `tab`, `Tabs` usage at line 265-278. No dropdown/kebab-menu component exists anywhere in `src/features` — every row action is a plain `Button` gated by local `confirmingId`/`busyId` state (Cancel: `handleCancel` line 70-82 + Actions cell line 209-237; Edit: a plain `Link` at line 170-177).
- Migration numbering: highest existing is `087_playlists_list_include_drafts.sql` — this plan's migration is **`088`**.

---

## File Structure

**`Thunder_Core`** (backend):
- Create: `supabase/migrations/088_publication_duplicate.sql` — `media_publication_duplicate` RPC only (no schema change)
- Create: `src/app/api/core/v1/media/publications/[id]/duplicate/route.ts`

**`thunder_one_prj`** (frontend):
- Modify: `src/features/publications/services/publications-api.ts` — widen `fetchPublications`, add `duplicatePublication`
- Modify: `src/features/publications/components/PublicationsListPage.tsx` — third "Inactive" tab, Duplicate button

---

## Task 1: Thunder_Core migration — `media_publication_duplicate`

**Files:**
- Create: `supabase/migrations/088_publication_duplicate.sql`

**Interfaces:**
- Produces: `media_publication_duplicate(p_tenant_id uuid, p_source_publication_id uuid, p_created_by uuid) RETURNS jsonb` → `{ publication_id, playlist_id }`. Rejects `status = 'draft'` sources (`RAISE EXCEPTION 'Invalid input: cannot duplicate a draft publication'`).

- [x] **Step 1: Read the two source patterns this migration fuses — done, corrected the draft below**

Read `078_publication_idempotency_key.sql:31-219` and `071_publication_draft_revision.sql:194-308` in full. Two corrections this made to the original draft:

- `071:267-269` creates `pub:`-owned playlists with **`status = 'active'`**, unconditionally — every existing publication's auto playlist is `active` regardless of whether the publication itself is a draft. The duplicate's new playlist follows the same convention (`'active'`, not `'draft'`) rather than inventing a new state pub:-owned playlists have never had.
- `078` confirms publications carry tags through a separate junction table, `media_core.publication_tags(publication_id, tag_id)` (`060_media_tags_and_draft_publications.sql:24-30`), synced via `media_core.sync_publication_tags` — not a column on `publications` itself. The duplicate must copy this table too or the copy silently loses its tags. Added as a fourth copy step below.

- [ ] **Step 2: Write the migration file**

```sql
-- 088 — media_publication_duplicate: copy a non-draft publication (active, scheduled,
-- ended, or cancelled — anything but draft) into a new draft, per
-- docs/adr/0015-publications-inactive-tab-and-duplicate.md (thunder_one_prj). Copies the
-- playlist and its items (playlist created with status='active', matching the
-- unconditional convention media_publication_set_content already uses for every
-- pub:-owned playlist — 071_publication_draft_revision.sql:267-269), publication_targets,
-- publication_tags, and the latest schedule's recurrence/timezone shape. starts_at resets
-- to now() (NOT NULL, cannot be cleared) and ends_at resets to NULL, forcing the operator
-- to set a new window before publishing. Name gets a " (Copy)" suffix so the copy doesn't
-- read as the original in the list.
--
-- Rollback: DROP FUNCTION public.media_publication_duplicate(uuid, uuid, uuid);

CREATE OR REPLACE FUNCTION public.media_publication_duplicate(
    p_tenant_id uuid,
    p_source_publication_id uuid,
    p_created_by uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_source media_core.publications%ROWTYPE;
    v_new_publication_id uuid := gen_random_uuid();
    v_new_playlist_id uuid;
    v_schedule media_core.schedules%ROWTYPE;
BEGIN
    SELECT * INTO v_source
    FROM media_core.publications
    WHERE id = p_source_publication_id AND tenant_id = p_tenant_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'not found: publication not found for this tenant';
    END IF;

    IF v_source.status = 'draft' THEN
        RAISE EXCEPTION 'Invalid input: cannot duplicate a draft publication';
    END IF;

    IF v_source.playlist_id IS NOT NULL THEN
        v_new_playlist_id := gen_random_uuid();

        INSERT INTO media_core.playlists (id, tenant_id, name, status, kind, metadata, created_by)
        SELECT v_new_playlist_id, p_tenant_id, 'pub:' || v_new_publication_id, 'active', kind, metadata, p_created_by
        FROM media_core.playlists
        WHERE id = v_source.playlist_id AND tenant_id = p_tenant_id;

        INSERT INTO media_core.playlist_items (
            tenant_id, playlist_id, media_asset_id, position, duration_seconds, transition
        )
        SELECT p_tenant_id, v_new_playlist_id, media_asset_id, position, duration_seconds, transition
        FROM media_core.playlist_items
        WHERE playlist_id = v_source.playlist_id;
    END IF;

    INSERT INTO media_core.publications (
        id, tenant_id, playlist_id, status, name, description, campaign_id,
        publication_type, priority, language, metadata, revision, created_by
    ) VALUES (
        v_new_publication_id, p_tenant_id, v_new_playlist_id, 'draft',
        v_source.name || ' (Copy)', v_source.description, v_source.campaign_id,
        v_source.publication_type, v_source.priority, v_source.language,
        v_source.metadata, 1, p_created_by
    );

    INSERT INTO media_core.publication_targets (publication_id, target_type, channel_id, device_id)
    SELECT v_new_publication_id, target_type, channel_id, device_id
    FROM media_core.publication_targets
    WHERE publication_id = p_source_publication_id;

    INSERT INTO media_core.publication_tags (publication_id, tag_id)
    SELECT v_new_publication_id, tag_id
    FROM media_core.publication_tags
    WHERE publication_id = p_source_publication_id;

    SELECT * INTO v_schedule
    FROM media_core.schedules
    WHERE publication_id = p_source_publication_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF FOUND THEN
        INSERT INTO media_core.schedules (tenant_id, publication_id, starts_at, ends_at, timezone, recurrence)
        VALUES (p_tenant_id, v_new_publication_id, now(), NULL, v_schedule.timezone, v_schedule.recurrence);
    END IF;

    RETURN jsonb_build_object('publication_id', v_new_publication_id, 'playlist_id', v_new_playlist_id);
END;
$$;
```

- [ ] **Step 3: Verify state before applying — run against prod (`sfiefevtxalqjizdkcsw`) via Supabase MCP `execute_sql`**

```sql
select proname from pg_proc where proname = 'media_publication_duplicate';
```

Expected: 0 rows (function doesn't exist yet — confirms this is a create, not a silent overwrite).

- [ ] **Step 4: R0 — get explicit approval, then apply via Supabase MCP `apply_migration`**

State exactly what will change: creates 1 new function, 0 schema changes, 0 rows touched by the migration itself. Wait for explicit user approval before calling `apply_migration`.

- [ ] **Step 5: Verify after applying**

```sql
select pg_get_functiondef(oid) from pg_proc where proname = 'media_publication_duplicate';
```

Diff the returned body against the migration file text to confirm byte-identical deployment.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/088_publication_duplicate.sql
git commit -m "feat(publications): add media_publication_duplicate RPC"
```

---

## Task 2: Thunder_Core route — duplicate endpoint

**Files:**
- Create: `src/app/api/core/v1/media/publications/[id]/duplicate/route.ts`

**Interfaces:**
- Consumes: `media_publication_duplicate` from Task 1.
- Produces: `POST /media/publications/:id/duplicate` → `{ success: true, data: { publication_id, playlist_id } }`.

- [ ] **Step 1: Write the route**

Mirror the existing per-id route pattern (`requireMediaTenant`, `callMedia`, `requireUuid`) used by `src/app/api/core/v1/media/publications/[id]/route.ts` — read that file first to match its exact imports and `RouteContext` typing before writing this one.

```typescript
import { apiHandler, type RouteContext } from '@/lib/api-utils'
import { requireUuid } from '@/lib/core-api-utils'
import { callMedia, requireMediaTenant } from '@/lib/core/media'

export async function POST(request: Request, ctx: RouteContext<{ id: string }>) {
    return apiHandler(async () => {
        const { tenantId, userId, admin } = await requireMediaTenant(request)
        const { id } = await ctx.params
        const result = await callMedia(admin, 'media_publication_duplicate', {
            p_tenant_id: tenantId,
            p_source_publication_id: requireUuid(id, 'id'),
            p_created_by: userId,
        })
        return { success: true, data: result }
    }, 201)
}
```

- [ ] **Step 2: Build check**

Run: `cd Thunder_Core && npx tsc --noEmit`
Expected: no new errors from this file.

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/core/v1/media/publications/[id]/duplicate/route.ts"
git commit -m "feat(publications): add duplicate endpoint"
```

---

## Task 3: thunder_one_prj — `publications-api.ts`

**Files:**
- Modify: `src/features/publications/services/publications-api.ts`

**Interfaces:**
- Produces: `fetchPublications(status: "draft" | "active" | "cancelled")`; new `duplicatePublication(id: string): Promise<{ publication_id: string; playlist_id: string | null }>`.

- [ ] **Step 1: Widen the status union**

```typescript
export async function fetchPublications(
  status: "draft" | "active" | "cancelled"
): Promise<PublicationListItem[]> {
  const data = await requestApi<
    { publications?: PublicationListItem[] } | PublicationListItem[]
  >("GET", `/media/publications?status=${status}`);
  if (Array.isArray(data)) {
    return data;
  }
  if (
    data &&
    typeof data === "object" &&
    "publications" in data &&
    Array.isArray(data.publications)
  ) {
    return data.publications;
  }
  return [];
}
```

(Body unchanged — only the parameter type widens.)

- [ ] **Step 2: Add `duplicatePublication`**

Place alongside `deletePublication`/`cancelPublication`:

```typescript
export async function duplicatePublication(
  id: string
): Promise<{ publication_id: string; playlist_id: string | null }> {
  return requestApi("POST", `/media/publications/${id}/duplicate`);
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: errors only in `PublicationsListPage.tsx` (still calls `fetchPublications` with the old two-value union in a way TypeScript is fine with, but will need the new `"cancelled"` call added — fixed next task). If none, that's fine too.

- [ ] **Step 4: Commit**

```bash
git add src/features/publications/services/publications-api.ts
git commit -m "feat(publications): accept cancelled status and add duplicatePublication"
```

---

## Task 4: thunder_one_prj — `PublicationsListPage.tsx`

**Files:**
- Modify: `src/features/publications/components/PublicationsListPage.tsx`

**Interfaces:**
- Consumes: `fetchPublications("cancelled")` and `duplicatePublication` from Task 3.
- Produces: a third "Inactive" tab (`effective_status === 'ended'` items from the active fetch, plus every `cancelled`-status item); "Active" tab excludes `effective_status === 'ended'`; a Duplicate button on Active and Inactive rows.

- [ ] **Step 1: Fetch `cancelled` alongside `draft`/`active`, and split `active` by `effective_status`**

In the fetch effect (currently `Promise.allSettled([fetchPublications("draft"), fetchPublications("active")])`, line 32-54), add a third call:

```typescript
const [draftResult, activeResult, cancelledResult] = await Promise.allSettled([
  fetchPublications("draft"),
  fetchPublications("active"),
  fetchPublications("cancelled"),
]);
```

Add `cancelled`/`cancelledError` state next to `active`/`activeError`. Derive the two display lists (do not introduce a fourth fetch — both come from the three results already fetched):

```typescript
const activeOnly = active?.filter((p) => p.effective_status !== "ended") ?? null;
const inactive =
  active && cancelled
    ? [...active.filter((p) => p.effective_status === "ended"), ...cancelled]
    : null;
```

- [ ] **Step 2: Widen `renderTable`'s `tab` parameter and add the Duplicate action**

`renderTable(items, tab, error)`'s `tab` type widens from `"draft" | "active"` to `"draft" | "active" | "inactive"`. In the Actions cell (currently branching on `tab === "draft"` at line 169-238), add a Duplicate button for `tab === "active" || tab === "inactive"`, following the plain-`Button` pattern (no confirm step — duplicate is additive, not destructive):

```typescript
{(tab === "active" || tab === "inactive") && (
  <Button
    variant="secondary"
    disabled={busyId === item.id}
    onClick={async () => {
      setBusyId(item.id);
      try {
        const res = await duplicatePublication(item.id);
        router.push(`/publications/create?id=${res.publication_id}`);
      } catch (err) {
        setActiveError(classifyApiError(err, "ทำสำเนาไม่สำเร็จ"));
      } finally {
        setBusyId(null);
      }
    }}
  >
    Duplicate
  </Button>
)}
```

- [ ] **Step 3: Add the third `Tabs` entry**

```tsx
<Tabs
  items={[
    { key: "drafts", label: `Drafts (${drafts ? drafts.length : 0})`, content: renderTable(drafts, "draft", draftError) },
    { key: "active", label: `Active (${activeOnly ? activeOnly.length : 0})`, content: renderTable(activeOnly, "active", activeError) },
    { key: "inactive", label: `Inactive (${inactive ? inactive.length : 0})`, content: renderTable(inactive, "inactive", cancelledError) },
  ]}
/>
```

- [ ] **Step 4: Type-check and lint**

Run: `npx tsc --noEmit && npx eslint src/features/publications`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/features/publications/components/PublicationsListPage.tsx
git commit -m "feat(publications): add Inactive tab and duplicate action"
```

---

## Final verification (cross-repo, do not skip)

Task 3-4 (frontend) can `tsc`/`eslint` clean without Thunder_Core's changes deployed, but the Duplicate button and the Inactive tab's `cancelled` fetch **cannot be exercised end-to-end** until Task 1-2 ship to whatever environment `CORE_API_URL` points at (`thundercore.vercel.app` per this project's known deploy gotcha).

- [ ] After both repos' changes are merged and deployed: open `/publications`, confirm the Inactive tab shows both an ended item and a cancelled item, and that the same ended item no longer appears under Active. Click Duplicate on an ended publication, confirm it lands on `/publications/create?id=<new-draft-id>` with the name suffixed `(Copy)`, the same playlist items, the same screen/device targets, and an empty start/end date.
- **This step needs the user's explicit go-ahead before running** (per the project's browser-verification rule) — do not report the feature as "done" until it's been run and its result reported, or the user has explicitly said to skip it.
