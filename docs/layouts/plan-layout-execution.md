# Layout UI — execution plan (release one)

> **For agentic workers:** implement task-by-task in order. Steps use checkbox (`- [ ]`) syntax.
> Do not commit, push, deploy, or apply a migration unless separately instructed — see
> "Risk tags" below.

**Goal:** Ship the two authoring screens for multi-zone Layouts — a Layouts list and a
Layout editor — plus the `media_core.layouts` / `layout_zones` schema behind them, so an
operator can create and manage Layouts before any Publication or player can use one.

**Architecture:** A Layout is geometry only (up to four non-overlapping rectangles as
percentages of the display, plus a name, aspect ratio, background and active/inactive
status). Zones are stored in a child table and replaced wholesale on every save. Cross-row
rules (≤ 4 zones, ≥ 1 zone, no overlap) live in the upsert RPC — a table CHECK cannot see
sibling rows — and are mirrored by a pure frontend validator so the editor can show errors
live without a round trip.

**Tech stack:** Thunder_Core (Next.js 16 route handlers + Supabase plpgsql RPCs, zod),
thunder_one_prj (Next.js 16 App Router, React 19, Tailwind, `*.check.mts` with `node:assert`
— **there is no test runner in either repo, by design**).

**Spec:** `docs/adr/0044-multi-zone-layout.md` (decisions), `docs/layouts/plan-layout-ui.md`
(mockups measured against those decisions, all open questions closed 2026-08-25),
`docs/layouts/contract-v2-zones.md` (wire shape — informs the schema, not built here).

---

## Global constraints

Copied verbatim from the spec. Every task inherits these.

- **Zone geometry is percent of display area, `0–100`, one decimal place** — both axes,
  independently (`contract-v2-zones.md`, Zone object table).
- **At most four Zones, at least one.** Zones must not overlap; touching edges are legal.
  `x + width ≤ 100`, `y + height ≤ 100` (ADR 0044 §3, plan §4 Screen 2).
- **No `z` / stacking order column, and no Z-Index control on screen** — overlap is not
  supported, and an input implying it is worse than no input (ADR 0044 §3, plan §2.3).
- **Zone `role` enum is exactly `main | sidebar | ticker | secondary`** (contract v2).
- **A Layout never holds content.** No `playlist_id`, no `media_asset_id`, no per-Zone
  duration, no `Publish` button anywhere in the editor (ADR 0044 §1, plan §2.1).
- **Templates are frontend constants.** No `templates` table, no "Save as Template"
  (ADR 0044 §7, plan §2.4).
- **Lifecycle is `active ↔ inactive` with no hard delete**, copied from Playlist
  (ADR 0044 §6).
- **`aspect_ratio` is stored, resolution is not.** The list column is "Aspect ratio", never
  "Resolution" (ADR 0044 §4, plan §2.5).
- **The list thumbnail is an inline SVG wireframe rendered from the Zone percentages at
  display time** — nothing generated, stored or invalidated (plan §2.5).
- **Frontend conventions** (`CLAUDE.md` §8): camelCase / PascalCase / kebab-case files,
  files ≤ 300 lines, no `any`, no dead code, Server Component by default with `'use client'`
  only on leaves, no raw backend error text reaching the user, no new dependencies.

## Scope

**In:** the schema migration, its RPCs, the Thunder_Core HTTP routes, and frontend Screens 1
and 2 (Layouts list, Layout editor).

**Out, deliberately:**

- **Screen 3 — Layout mode inside Publication wizard step 2.** Blocked: the players render a
  single full-screen `if Image / else if Video` branch with no zone support (audit item A1),
  and the two open `playback_logs` defects multiply per Zone. Shipping it early publishes
  payloads that play as a black screen (plan §4 Sequencing). It also needs a
  `publications.layout_id` column, which this plan deliberately does **not** add — nothing
  would write it.
- **Content folders (`docs/adr/0046-content-folders.md`).** An accepted ADR, but its own
  migration touching three tables, and its own shared sidebar component adopted by Playlists
  and Media Library too. ADR 0046 §"Why now" states it is independent work that can proceed
  in parallel. Recommendation: ship the Layouts list flat first (search + status filter +
  sort already cover navigation at a few hundred items), then do folders once, for all three
  pages. The list's filter composition is written so a folder filter drops in beside the
  existing ones.
- **A `Used In` column.** Nothing can reference a Layout until Screen 3 exists, so the count
  is unconditionally zero. Add it with Screen 3's migration.
- Everything in plan §2.4 (`Upload Layout`, `Save as Template`, `Category`), §2.6 (storage
  usage tile), and all of §3 (per-Zone gradient/image backgrounds, borders, radius, fill
  mode, mute, per-Zone transition, text/image tools, widgets, safe margin) — each is either
  contradicted by an accepted decision or has no player able to render it.

## Risk tags (`CLAUDE.md` §1)

| Step | Tag | Handling |
|---|---|---|
| Authoring the migration file | **R2** | Just write it |
| **Applying** the migration | **R0** | **Stop and ask.** `.env` points at production and there is no local stack; there is no non-prod database to rehearse on (the Supabase branch attempt on 2026-08-25 failed at migration 013/103 and was deleted) |
| Thunder_Core routes, frontend screens | **R1** | Proceed, report reasoning |
| Commit / push / PR | **R0-ish** | Only on explicit instruction, per `CLAUDE.md` §4 |

No design fork remains open — `plan-layout-ui.md` §5 closed all four on 2026-08-25.

---

## File structure

**Thunder_Core**

```
supabase/migrations/<timestamp>_layouts.sql        create — schema + 4 RPCs + grants
src/app/api/core/v1/media/layouts/route.ts         create — GET list, POST create
src/app/api/core/v1/media/layouts/[id]/route.ts    create — GET one, PATCH update/status
src/app/api/core/v1/media/layouts/schema.ts        create — zod, shared by both routes
src/app/api/core/v1/media/layouts/schema.check.mts create — runnable check
docs/media/media-core-schema.dbml                  modify — two new tables
docs/media/media-core-mapping.md                   modify — new RPC rows
docs/api/api-overview.md                           modify — new endpoints
public/swagger-core-v1.json                        modify — new paths
```

**thunder_one_prj**

```
src/features/media-workspace/layouts/
  types/index.ts              create — Layout, LayoutZone, ZoneRole, LayoutStatus
  geometry.ts                 create — validation + overlap + tenth-rounding (pure)
  geometry.check.mts          create
  templates.ts                create — the seven starting compositions (constants)
  templates.check.mts         create — every template must validate clean
  status-display.ts           create — status badge + save/archive error copy
  list-filtering.ts           create — filter / sort / paginate / summarize (pure)
  list-filtering.check.mts    create
  list-url-state.ts           create — list state ↔ URL query (pure)
  list-url-state.check.mts    create
  services/layouts-api.ts     create — fetch / upsert / duplicate / set status
  components/
    LayoutWireframe.tsx       create — inline SVG, used in three places
    LayoutsListPage.tsx       create — Screen 1 shell ('use client')
    LayoutsFilters.tsx        create
    LayoutsTable.tsx          create
    LayoutEditorPage.tsx      create — Screen 2 shell ('use client')
    TemplateRail.tsx          create
    LayoutCanvas.tsx          create — drag-resize surface
    ZoneProperties.tsx        create
    LayoutSettingsStep.tsx    create — step 2 (name / ratio / background / status)
  index.ts                    create — feature's public surface

src/app/(dashboard)/(application)/media-workspace/layouts/page.tsx             create
src/app/(dashboard)/(application)/media-workspace/layouts/create/page.tsx      create
src/app/(dashboard)/(application)/media-workspace/layouts/[layoutId]/page.tsx  create
src/config/nav/media-workspace.tsx                                             modify — one nav item
```

Every pure module gets a sibling `.check.mts`; components are verified in the browser
(§"Verification"). This mirrors `src/features/media-workspace/playlists/`, which is the
closest analogue in the codebase and the file to read whenever this plan says "follow the
Playlist pattern".

---

## Task 1 — Schema migration and RPCs (Thunder_Core)

**Files:**
- Create: `Thunder_Core/supabase/migrations/<timestamp>_layouts.sql`

Generate the timestamp with `date -u +%Y%m%d%H%M%S` — the two most recent migrations
(`20260824140000_loop_anchor_at.sql`, `20260825080838_publication_snapshot_materialization.sql`)
use that form, not the legacy `NNN_` prefix.

**Interfaces produced** (Task 2 and Task 8 consume these exact signatures):

```
public.media_layouts_list(p_tenant_id uuid) → jsonb
public.media_layout_get(p_tenant_id uuid, p_layout_id uuid) → jsonb
public.media_layout_upsert(p_tenant_id uuid, p_layout_id uuid, p_name varchar,
    p_aspect_ratio varchar, p_background varchar, p_status varchar, p_zones jsonb,
    p_created_by uuid, p_idempotency_key uuid) → jsonb   -- {layout_id, zone_count}
public.media_layout_set_status(p_tenant_id uuid, p_layout_id uuid, p_status varchar) → void
```

- [x] **Step 1: Write the schema section**

```sql
-- ==============================================================================
-- 1. Schema — a Layout is geometry only (ADR 0044 §1)
-- ==============================================================================

CREATE TABLE media_core.layouts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id),
    name varchar(200) NOT NULL,
    aspect_ratio varchar(12) NOT NULL,
    background varchar(7) NOT NULL DEFAULT '#000000',
    status varchar NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_by uuid REFERENCES public.users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, name)
);

COMMENT ON TABLE media_core.layouts IS
    'verified: A named, reusable screen composition of up to four non-overlapping Zones (ADR 0044). Carries geometry and Zone roles only — never content; content is bound per Zone inside the Publication wizard and materialized into publication_snapshot_zones at publish time.';
COMMENT ON COLUMN media_core.layouts.aspect_ratio IS
    'verified: Reference frame the Zone percentages are expressed against, e.g. 16:9. Stored from release one even though only single-screen Layouts ship, because percentages alone cannot distinguish a 16:9 split from a 16:3 one (ADR 0044 §4). A Layout stores no resolution.';
COMMENT ON COLUMN media_core.layouts.background IS
    'verified: Hex colour painted behind the Zones, for display area no Zone covers. Zones need not tile the display (ADR 0044 §3).';
COMMENT ON COLUMN media_core.layouts.status IS
    'verified: active/inactive only, copied from Playlist (ADR 0044 §6). There is no hard delete and no draft state.';

CREATE TABLE media_core.layout_zones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    layout_id uuid NOT NULL REFERENCES media_core.layouts(id) ON DELETE CASCADE,
    position integer NOT NULL,
    name varchar(120) NOT NULL,
    role varchar NOT NULL CHECK (role IN ('main', 'sidebar', 'ticker', 'secondary')),
    x numeric(4,1) NOT NULL CHECK (x >= 0),
    y numeric(4,1) NOT NULL CHECK (y >= 0),
    width numeric(4,1) NOT NULL CHECK (width > 0),
    height numeric(4,1) NOT NULL CHECK (height > 0),
    CHECK (x + width <= 100),
    CHECK (y + height <= 100),
    UNIQUE (layout_id, position)
);

COMMENT ON TABLE media_core.layout_zones IS
    'verified: One rectangle of a Layout. No z / stacking column: Zones may not overlap, which is enforced in media_layout_upsert because a table CHECK cannot see sibling rows (ADR 0044 §3).';
COMMENT ON COLUMN media_core.layout_zones.position IS
    'verified: Stable display order in the editor and in list payloads. Not a stacking order — Zones never overlap.';
COMMENT ON COLUMN media_core.layout_zones.x IS
    'verified: Percent of display width, 0-100, one decimal place (contract-v2-zones.md). Not pixels — a Layout has no resolution.';
COMMENT ON COLUMN media_core.layout_zones.role IS
    'verified: main/sidebar/ticker/secondary. Advisory to the player; it carries no rendering behaviour of its own.';

CREATE INDEX idx_layout_zones_layout_id ON media_core.layout_zones (layout_id);
CREATE INDEX idx_layouts_tenant_id ON media_core.layouts (tenant_id);

ALTER TABLE media_core.layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_core.layout_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY layouts_read ON media_core.layouts
    FOR SELECT USING (public.is_tenant_member(tenant_id));
CREATE POLICY layout_zones_read ON media_core.layout_zones
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM media_core.layouts l
        WHERE l.id = layout_zones.layout_id AND public.is_tenant_member(l.tenant_id)
    ));
```

`numeric(4,1)` holds `100.0` with one decimal, matching the contract exactly. The RLS
policies copy the pattern the snapshot migration used for
`media_core.publication_snapshots` — reads are tenant-scoped, writes go through
`SECURITY DEFINER` RPCs only.

- [x] **Step 2: Write `media_layout_upsert`, where the cross-row rules live**

```sql
CREATE OR REPLACE FUNCTION public.media_layout_upsert(
    p_tenant_id uuid,
    p_layout_id uuid,
    p_name varchar,
    p_aspect_ratio varchar,
    p_background varchar,
    p_status varchar,
    p_zones jsonb,
    p_created_by uuid DEFAULT NULL,
    p_idempotency_key uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_layout_id uuid;
    v_count integer;
    v_a jsonb;
    v_b jsonb;
    i integer;
    j integer;
BEGIN
    v_count := jsonb_array_length(COALESCE(p_zones, '[]'::jsonb));

    IF v_count < 1 THEN
        RAISE EXCEPTION 'Invalid input: a layout needs at least one zone';
    END IF;
    IF v_count > 4 THEN
        RAISE EXCEPTION 'Invalid input: a layout may not have more than 4 zones';
    END IF;
    IF p_background !~ '^#[0-9A-Fa-f]{6}$' THEN
        RAISE EXCEPTION 'Invalid input: background must be a 6-digit hex colour';
    END IF;
    IF p_status NOT IN ('active', 'inactive') THEN
        RAISE EXCEPTION 'Invalid input: status must be active or inactive';
    END IF;

    -- Overlap, pairwise. At most 4 zones means at most 6 comparisons, so the naive
    -- double loop is the whole algorithm.
    -- ponytail: O(n^2) over a hard cap of 4 — if the cap is ever raised past ~50,
    -- switch to a sweep line.
    FOR i IN 0 .. v_count - 2 LOOP
        FOR j IN i + 1 .. v_count - 1 LOOP
            v_a := p_zones -> i;
            v_b := p_zones -> j;
            IF  (v_a->>'x')::numeric < (v_b->>'x')::numeric + (v_b->>'width')::numeric
            AND (v_b->>'x')::numeric < (v_a->>'x')::numeric + (v_a->>'width')::numeric
            AND (v_a->>'y')::numeric < (v_b->>'y')::numeric + (v_b->>'height')::numeric
            AND (v_b->>'y')::numeric < (v_a->>'y')::numeric + (v_a->>'height')::numeric
            THEN
                RAISE EXCEPTION 'Invalid input: zones % and % overlap', i + 1, j + 1;
            END IF;
        END LOOP;
    END LOOP;

    IF p_layout_id IS NULL THEN
        INSERT INTO media_core.layouts
            (tenant_id, name, aspect_ratio, background, status, created_by)
        VALUES
            (p_tenant_id, p_name, p_aspect_ratio, p_background, p_status, p_created_by)
        RETURNING id INTO v_layout_id;
    ELSE
        UPDATE media_core.layouts
        SET name = p_name, aspect_ratio = p_aspect_ratio, background = p_background,
            status = p_status, updated_at = now()
        WHERE id = p_layout_id AND tenant_id = p_tenant_id
        RETURNING id INTO v_layout_id;

        IF v_layout_id IS NULL THEN
            RAISE EXCEPTION 'not found: layout not found for this tenant';
        END IF;

        DELETE FROM media_core.layout_zones WHERE layout_id = v_layout_id;
    END IF;

    INSERT INTO media_core.layout_zones
        (layout_id, position, name, role, x, y, width, height)
    SELECT
        v_layout_id,
        (ord - 1)::integer,
        z->>'name',
        z->>'role',
        ROUND((z->>'x')::numeric, 1),
        ROUND((z->>'y')::numeric, 1),
        ROUND((z->>'width')::numeric, 1),
        ROUND((z->>'height')::numeric, 1)
    FROM jsonb_array_elements(p_zones) WITH ORDINALITY AS t(z, ord);

    RETURN jsonb_build_object('layout_id', v_layout_id, 'zone_count', v_count);
END;
$$;

REVOKE ALL ON FUNCTION public.media_layout_upsert(uuid, uuid, varchar, varchar, varchar, varchar, jsonb, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.media_layout_upsert(uuid, uuid, varchar, varchar, varchar, varchar, jsonb, uuid, uuid) TO service_role;
```

`p_idempotency_key` is accepted and currently unused — it exists so the create path matches
`media_playlist_upsert`'s signature shape and can gain dedupe without changing the argument
list later (changing it would create an overload, per `CLAUDE.md` §6). Say so in a comment
above the function.

**The `REVOKE`/`GRANT` pair is not optional and not decoration.** `CREATE FUNCTION` grants
`EXECUTE` to `PUBLIC` by default — see the `create-function-grants-public` memory. Every one
of the four functions in this migration needs its own pair, with the full argument list
spelled out.

- [x] **Step 3: Write `media_layouts_list`, `media_layout_get`, `media_layout_set_status`**

Model the two read functions on `media_playlists_list` in
`Thunder_Core/supabase/migrations/098_playlists_publication_count.sql` — the same
`jsonb_agg` / `jsonb_build_object` shape, ordered deterministically. Each layout object
carries `id`, `name`, `aspect_ratio`, `background`, `status`, `zone_count`, `created_at`,
`updated_at`, `created_by` (the same `id` + resolved `display_name` object 098 builds), and
a `zones` array of `{ id, position, name, role, x, y, width, height }` ordered by
`position`. The list needs the zones because the wireframe thumbnail is rendered from them.

Every aggregate must carry its own `ORDER BY` — a `jsonb_agg` without one is not
deterministic (`CLAUDE.md` §6). Order layouts by `name`, zones by `position`.

`media_layout_set_status` updates `status` and `updated_at` where
`id = p_layout_id AND tenant_id = p_tenant_id`, and raises
`'not found: layout not found for this tenant'` when nothing matched. There is no delete
function — the lifecycle has no hard delete.

Tenant isolation lives in these function bodies, not in RLS: every one filters
`tenant_id = p_tenant_id` itself (`CLAUDE.md` §6).

- [x] **Step 4: Write the migration header and rollback note**

Follow `098_playlists_publication_count.sql`'s header style: what this does, why, and an
explicit `Rollback:` line —
`DROP FUNCTION` each of the four signatures, then
`DROP TABLE media_core.layout_zones; DROP TABLE media_core.layouts;`.

- [x] **Step 5: Verify the file parses without applying it**

Run: `git diff --check` and read the file end to end. There is no local Postgres to dry-run
against. **Do not apply this migration** — applying it is R0 and needs its own approval at
the moment of the action (see "Risk tags").

---

## Task 2 — Thunder_Core HTTP routes

**Files:**
- Create: `src/app/api/core/v1/media/layouts/schema.ts`
- Create: `src/app/api/core/v1/media/layouts/schema.check.mts`
- Create: `src/app/api/core/v1/media/layouts/route.ts`
- Create: `src/app/api/core/v1/media/layouts/[id]/route.ts`

**Interfaces consumed:** the four RPC signatures from Task 1.
**Interfaces produced:** `GET|POST /media/layouts`, `GET|PATCH /media/layouts/{id}` — Task 8
calls these.

- [x] **Step 1: Write the zod schema**

```ts
import { z } from 'zod'

const zoneSchema = z.object({
    name: z.string().min(1).max(120),
    role: z.enum(['main', 'sidebar', 'ticker', 'secondary']),
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
    width: z.number().gt(0).max(100),
    height: z.number().gt(0).max(100),
})

export const layoutUpsertSchema = z.object({
    name: z.string().min(1).max(200),
    aspect_ratio: z.string().regex(/^\d{1,2}:\d{1,2}$/),
    background: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    status: z.enum(['active', 'inactive']).optional(),
    zones: z.array(zoneSchema).min(1).max(4),
})

export const layoutStatusSchema = z.object({
    status: z.enum(['active', 'inactive']),
})
```

The route validates shape; the RPC validates the cross-row rules. Both are needed — the RPC
is the trust boundary, the schema is what produces a readable message.

- [x] **Step 2: Write the check file**

Follow `src/app/api/core/v1/media/player/playback/schema.check.mts` exactly for style.
Cover: a valid single-zone payload passes; five zones fail; zero zones fail; a bad `role`
fails; `width: 0` fails; a malformed `background` fails; a well-formed `16:9` passes and
`sixteen-nine` fails.

- [x] **Step 3: Run it**

Run: `cd Thunder_Core && node src/app/api/core/v1/media/layouts/schema.check.mts`
Expected: `all assertions passed`, exit 0.

- [x] **Step 4: Write the two route files**

Copy the structure of `src/app/api/core/v1/media/playlists/route.ts` and
`playlists/[id]/route.ts` verbatim — `apiHandler`, `requireMediaTenant`, `callMedia`,
`{ success: true, data: result }`, `201` on create. `callMedia` already re-throws
`Invalid input:` / `not found:` messages untouched and swallows everything else as
`'Media operation failed'`, which is exactly the raw-error rule the frontend depends on.

`PATCH /media/layouts/{id}` handles both a full upsert body and a status-only body: parse
with `layoutStatusSchema` first and route to `media_layout_set_status` when it matches and
carries no `zones` key, otherwise parse with `layoutUpsertSchema` and route to
`media_layout_upsert`.

- [x] **Step 5: Update the four doc/spec files**

`docs/media/media-core-schema.dbml` (two tables), `docs/media/media-core-mapping.md` (four
RPCs), `docs/api/api-overview.md` and `public/swagger-core-v1.json` (four endpoints).
Verify the swagger still parses: `jq empty public/swagger-core-v1.json`.

---

## Task 3 — Frontend types and geometry validation

**Files:**
- Create: `src/features/media-workspace/layouts/types/index.ts`
- Create: `src/features/media-workspace/layouts/geometry.ts`
- Create: `src/features/media-workspace/layouts/geometry.check.mts`

**Interfaces produced:** consumed by Tasks 4, 5, 6, 7 and 8.

- [x] **Step 1: Write the types**

```ts
export const ZONE_ROLES = ["main", "sidebar", "ticker", "secondary"] as const;
export type ZoneRole = (typeof ZONE_ROLES)[number];

export const LAYOUT_STATUSES = ["active", "inactive"] as const;
export type LayoutStatus = (typeof LAYOUT_STATUSES)[number];

export type ZoneRect = { x: number; y: number; width: number; height: number };

export type LayoutZone = ZoneRect & {
  id?: string;
  position: number;
  name: string;
  role: ZoneRole;
};

export type LayoutListItem = {
  id: string;
  name: string;
  aspect_ratio: string;
  background: string;
  status: LayoutStatus;
  zone_count: number;
  zones: LayoutZone[];
  created_at?: string;
  updated_at?: string;
  created_by?: { id: string; display_name: string } | null;
};
```

- [x] **Step 2: Write the geometry module**

```ts
// The Layout geometry rules from ADR 0044 §3, kept pure so the editor can validate live
// and the whole rule set is checkable without React — see geometry.check.mts. The upsert
// RPC enforces the same rules server-side; this is the copy that produces fast feedback,
// never the only one.

import type { ZoneRect } from "./types";

export const MAX_ZONES = 4;

/** Percentages carry one decimal place (contract-v2-zones.md). Comparing them as tenths
 *  keeps every check on integers, so 33.3 + 33.3 + 33.4 lands on exactly 100 instead of
 *  a float that is a hair over it. */
export function toTenths(value: number): number {
  return Math.round(value * 10);
}

export function roundPercent(value: number): number {
  return toTenths(value) / 10;
}

/** Touching edges are not an overlap: a 0-50 / 50-100 split is the most common Layout
 *  there is, and a `<=` here would reject it. */
export function rectsOverlap(a: ZoneRect, b: ZoneRect): boolean {
  return (
    toTenths(a.x) < toTenths(b.x) + toTenths(b.width) &&
    toTenths(b.x) < toTenths(a.x) + toTenths(a.width) &&
    toTenths(a.y) < toTenths(b.y) + toTenths(b.height) &&
    toTenths(b.y) < toTenths(a.y) + toTenths(a.height)
  );
}

export type GeometryError =
  | { kind: "no-zones" }
  | { kind: "too-many-zones"; count: number }
  | { kind: "non-positive"; index: number }
  | { kind: "out-of-bounds"; index: number }
  | { kind: "overlap"; a: number; b: number };

export function validateZones(zones: ZoneRect[]): GeometryError[] {
  const errors: GeometryError[] = [];
  if (zones.length === 0) errors.push({ kind: "no-zones" });
  if (zones.length > MAX_ZONES) errors.push({ kind: "too-many-zones", count: zones.length });

  zones.forEach((z, index) => {
    if (toTenths(z.width) <= 0 || toTenths(z.height) <= 0) {
      errors.push({ kind: "non-positive", index });
      return;
    }
    if (
      toTenths(z.x) < 0 ||
      toTenths(z.y) < 0 ||
      toTenths(z.x) + toTenths(z.width) > 1000 ||
      toTenths(z.y) + toTenths(z.height) > 1000
    ) {
      errors.push({ kind: "out-of-bounds", index });
    }
  });

  for (let a = 0; a < zones.length - 1; a += 1) {
    for (let b = a + 1; b < zones.length; b += 1) {
      if (rectsOverlap(zones[a], zones[b])) errors.push({ kind: "overlap", a, b });
    }
  }

  return errors;
}
```

- [x] **Step 3: Write the check file**

```ts
/** Run: node src/features/media-workspace/layouts/geometry.check.mts */
import assert from "node:assert/strict";
import { rectsOverlap, roundPercent, validateZones } from "./geometry.ts";

const full = { x: 0, y: 0, width: 100, height: 100 };
const left = { x: 0, y: 0, width: 50, height: 100 };
const right = { x: 50, y: 0, width: 50, height: 100 };

assert.deepEqual(validateZones([full]), []);
// A 50/50 split is the commonest Layout there is — touching edges must not read as overlap.
assert.deepEqual(validateZones([left, right]), []);
assert.equal(rectsOverlap(left, right), false);
assert.equal(rectsOverlap(full, left), true);

assert.deepEqual(validateZones([]), [{ kind: "no-zones" }]);
assert.deepEqual(validateZones([full, full, full, full, full]).filter((e) => e.kind === "too-many-zones"), [
  { kind: "too-many-zones", count: 5 },
]);
assert.deepEqual(validateZones([{ x: 0, y: 0, width: 0, height: 50 }]), [{ kind: "non-positive", index: 0 }]);
assert.deepEqual(validateZones([{ x: 60, y: 0, width: 50, height: 50 }]), [{ kind: "out-of-bounds", index: 0 }]);
assert.deepEqual(validateZones([full, left]).filter((e) => e.kind === "overlap"), [{ kind: "overlap", a: 0, b: 1 }]);

// Thirds must land on exactly 100, not 99.99999999999999 — this is why the module
// compares tenths rather than floats.
assert.deepEqual(
  validateZones([
    { x: 0, y: 0, width: 33.3, height: 100 },
    { x: 33.3, y: 0, width: 33.3, height: 100 },
    { x: 66.6, y: 0, width: 33.4, height: 100 },
  ]),
  []
);
assert.equal(roundPercent(33.34), 33.3);

console.log("geometry.check.mts — all assertions passed");
```

- [x] **Step 4: Run it**

Run: `node src/features/media-workspace/layouts/geometry.check.mts`
Expected: `geometry.check.mts — all assertions passed`

---

## Task 4 — The seven starting templates

**Files:**
- Create: `src/features/media-workspace/layouts/templates.ts`
- Create: `src/features/media-workspace/layouts/templates.check.mts`

**Interfaces consumed:** `LayoutZone`, `validateZones` from Task 3.
**Interfaces produced:** `LAYOUT_TEMPLATES: LayoutTemplate[]` — Task 7's template rail.

- [x] **Step 1: Write the constants**

The seven named in ADR 0044 §7. These are frontend constants on purpose — the ADR rejected
a `templates` table, and "Save as Template" is out of scope.

```ts
import type { LayoutZone } from "./types";

export type LayoutTemplate = { key: string; name: string; zones: LayoutZone[] };

const zone = (position: number, name: string, role: LayoutZone["role"],
              x: number, y: number, width: number, height: number): LayoutZone =>
  ({ position, name, role, x, y, width, height });

export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  { key: "70-30", name: "70 / 30", zones: [
      zone(0, "Main", "main", 0, 0, 70, 100),
      zone(1, "Side", "sidebar", 70, 0, 30, 100)] },
  { key: "50-50", name: "50 / 50", zones: [
      zone(0, "Left", "main", 0, 0, 50, 100),
      zone(1, "Right", "secondary", 50, 0, 50, 100)] },
  { key: "3-zone-header", name: "3-Zone Header", zones: [
      zone(0, "Header", "ticker", 0, 0, 100, 15),
      zone(1, "Main", "main", 0, 15, 70, 85),
      zone(2, "Side", "sidebar", 70, 15, 30, 85)] },
  { key: "left-info-panel", name: "Left Info Panel", zones: [
      zone(0, "Info", "sidebar", 0, 0, 30, 100),
      zone(1, "Main", "main", 30, 0, 70, 100)] },
  { key: "top-bottom", name: "Top & Bottom", zones: [
      zone(0, "Main", "main", 0, 0, 100, 70),
      zone(1, "Ticker", "ticker", 0, 70, 100, 30)] },
  { key: "4-grid", name: "4 Grid", zones: [
      zone(0, "Top left", "main", 0, 0, 50, 50),
      zone(1, "Top right", "secondary", 50, 0, 50, 50),
      zone(2, "Bottom left", "secondary", 0, 50, 50, 50),
      zone(3, "Bottom right", "secondary", 50, 50, 50, 50)] },
  { key: "3-column", name: "3 Column", zones: [
      zone(0, "Left", "main", 0, 0, 34, 100),
      zone(1, "Middle", "secondary", 34, 0, 33, 100),
      zone(2, "Right", "secondary", 67, 0, 33, 100)] },
];
```

- [x] **Step 2: Write the check — every template must validate clean**

```ts
/** Run: node src/features/media-workspace/layouts/templates.check.mts */
import assert from "node:assert/strict";
import { LAYOUT_TEMPLATES } from "./templates.ts";
import { MAX_ZONES, validateZones } from "./geometry.ts";

assert.equal(LAYOUT_TEMPLATES.length, 7);

// A typo'd percentage in a constant would otherwise only surface as a save-time 400
// from the RPC, on a Layout the operator did not author.
for (const template of LAYOUT_TEMPLATES) {
  assert.deepEqual(validateZones(template.zones), [], `template ${template.key} has invalid geometry`);
  assert.ok(template.zones.length >= 1 && template.zones.length <= MAX_ZONES, template.key);
  assert.deepEqual(
    template.zones.map((z) => z.position),
    template.zones.map((_, i) => i),
    `template ${template.key} positions must be 0-based and dense`
  );
}

assert.equal(new Set(LAYOUT_TEMPLATES.map((t) => t.key)).size, 7);

console.log("templates.check.mts — all assertions passed");
```

- [x] **Step 3: Run it**

Run: `node src/features/media-workspace/layouts/templates.check.mts`
Expected: `templates.check.mts — all assertions passed`

---

## Task 5 — The wireframe component

**Files:**
- Create: `src/features/media-workspace/layouts/components/LayoutWireframe.tsx`

**Interfaces consumed:** `LayoutZone`, `ZoneRole` from Task 3.
**Interfaces produced:** `<LayoutWireframe zones background aspectRatio className />` — used
by the list table (Task 6), the template rail (Task 7), and eventually Screen 3's read-only
canvas.

- [x] **Step 1: Write it**

One `<svg>` with `viewBox="0 0 100 100"`, `preserveAspectRatio="none"`, and the real shape
supplied by CSS `aspect-ratio` on the element. That way a Zone's percentages are the SVG
coordinates directly, with no ratio arithmetic anywhere.

```tsx
// The list thumbnail, the template rail tile and (later) the wizard's read-only canvas are
// the same picture at three sizes: rectangles derived from the Zone percentages at display
// time. Nothing is generated, stored or invalidated, so a thumbnail can never drift from
// the geometry it depicts (docs/layouts/plan-layout-ui.md §2.5).
//
// ponytail: preserveAspectRatio="none" + a CSS aspect-ratio does the letterboxing, which
// removes the ratio maths entirely — upgrade to a computed viewBox only if a Zone ever
// needs a stroke of constant visual width.

const ROLE_FILL: Record<ZoneRole, string> = {
  main: "fill-violet-500/70",
  sidebar: "fill-sky-500/70",
  ticker: "fill-amber-500/70",
  secondary: "fill-zinc-400/70",
};
```

Props: `zones: LayoutZone[]`, `background: string`, `aspectRatio: string`, `className?`.
Parse `"16:9"` with a guard that falls back to `16 / 9` on anything unparseable — a bad
stored value must render a box, never crash a list row. Give the `<svg>` `role="img"` and an
`aria-label` naming the zone count, since it is the only visual identity a Layout row has.

This is a Server Component — it holds no state and takes no events. Do not add
`'use client'`.

---

## Task 6 — Screen 1: the Layouts list

**Files:**
- Create: `src/features/media-workspace/layouts/list-filtering.ts` + `.check.mts`
- Create: `src/features/media-workspace/layouts/list-url-state.ts` + `.check.mts`
- Create: `src/features/media-workspace/layouts/status-display.ts`
- Create: `src/features/media-workspace/layouts/services/layouts-api.ts`
- Create: `components/LayoutsListPage.tsx`, `LayoutsFilters.tsx`, `LayoutsTable.tsx`
- Create: `src/app/(dashboard)/(application)/media-workspace/layouts/page.tsx`
- Modify: `src/config/nav/media-workspace.tsx`

**Interfaces consumed:** Tasks 2, 3, 5.

- [x] **Step 1: Write `list-filtering.ts` and its check**

Mirror `src/features/media-workspace/playlists/list-filtering.ts` — same exported shapes
(`filterLayouts`, `sortLayouts`, `paginate`, `summarize`, `copyName`, `SORT_KEYS`,
`DEFAULT_SORT`), same "empty values sort last regardless of direction" rule, same
`copyName` duplicate-naming helper (`media_core.layouts` is `UNIQUE (tenant_id, name)`
exactly as playlists is, so the same helper solves the same problem).

`SORT_KEYS` for Layouts: `["name", "aspectRatio", "zones", "status", "updated"]`. Filters:
`query`, `status`. There is no ownership tab, no type filter and no campaign filter — none
of them has a meaning for a Layout. `summarize` returns `{ total, active, inactive }`.

Copy the check file's structure from `list-filtering.check.mts` in playlists, asserting at
minimum: a query matches case-insensitively on name; the status filter respects `all`;
sorting by `zones` orders by zone count and ties break on name; `paginate` clamps a page
number past the end instead of returning an empty slice.

- [x] **Step 2: Write `list-url-state.ts` and its check**

Mirror `playlists/list-url-state.ts` exactly, minus the keys that no longer exist. Keep its
two rules verbatim, because both are load-bearing: an unrecognised sort key resets the
direction with it, and only non-default values are written so an untouched page keeps a
clean `/media-workspace/layouts` URL.

Leave a comment noting that ADR 0046's folder filter is the next key to join this state, so
the composition point is obvious when folders land.

- [x] **Step 3: Write `status-display.ts`**

`statusBadge(status)` returning `{ color, label }` — green/Active, zinc/Inactive, matching
`playlists/status-display.ts`. Plus `describeSaveError(message: string): string` mapping the
RPC's `Invalid input:` wordings to Thai copy in the existing house style
(`"บันทึกไม่ได้ — <เหตุผล> กรุณา<ทางแก้>"`), with a generic fallback so nothing raw ever
reaches the user:

- `"more than 4 zones"` → `"บันทึกไม่ได้ — Layout มีได้สูงสุด 4 Zone"`
- `"at least one zone"` → `"บันทึกไม่ได้ — ต้องมีอย่างน้อย 1 Zone"`
- `"overlap"` → `"บันทึกไม่ได้ — Zone ซ้อนทับกัน กรุณาปรับขนาดหรือตำแหน่งใหม่"`
- `"Already exists"` / unique violation → `"บันทึกไม่ได้ — มี Layout ชื่อนี้อยู่แล้ว"`
- anything else → `"บันทึก Layout ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"`

Add these to a `status-display.check.mts` in the same shape as the playlists one, including
the "unrecognised message degrades to the generic string rather than leaking the body" case.

- [x] **Step 4: Write `services/layouts-api.ts`**

`fetchLayouts()`, `fetchLayout(id)`, `upsertLayout(input)`, `setLayoutStatus(id, status)`,
and `duplicateLayout(sourceId, name)` composed from `fetchLayout` + `upsertLayout` — there
is no duplicate endpoint and there does not need to be, following `duplicatePlaylist`'s
precedent in `playlists/services/playlists-api.ts`.

Reads stay in this feature service rather than `src/lib/api/media-api.ts`, because nothing
outside the feature reads a Layout yet. Add a `ponytail:` comment naming the upgrade path:
move them to `media-api.ts` when Screen 3 makes the Publication wizard a second reader.

- [x] **Step 5: Write the three components and the route**

`LayoutsListPage.tsx` is the `'use client'` shell holding URL state; `LayoutsFilters.tsx`
and `LayoutsTable.tsx` are presentational. Copy the composition from
`PlaylistsListPage.tsx` / `PlaylistsFilters.tsx` / `PlaylistsTable.tsx`, including the
inline error paragraph pattern (`<p className="mb-3 text-sm text-red-600...">`) rather than
a toast, and the loading/empty states from `PlaylistsListStates.tsx`.

Columns, in order: wireframe thumbnail (`<LayoutWireframe>` at a fixed small width), name,
aspect ratio, zones, last modified, status badge, row actions (Edit / Duplicate / Archive
or Restore). **No `Type` column, no `Resolution` column, no `Used In` column** — see
"Scope" and plan §2.5.

Archive is a destructive-ish action and needs a confirm step (`CLAUDE.md` §8); reuse
`Modal.tsx`. It sets status to `inactive`; it never deletes.

The optional stats row is three computed `StatTile`s — Total, Active, Inactive — from
`summarize()`. Cheap; include it.

The route file mirrors `playlists/page.tsx`: a Server Component that awaits `getSession()`
and renders the client shell inside `<Suspense>`.

- [x] **Step 6: Add the nav entry**

In `src/config/nav/media-workspace.tsx`, add `{ label: "Layouts", href: "/media-workspace/layouts" }`
to the `Publishing` section's `items`, directly after `Playlists`.

- [x] **Step 7: Run the checks**

Run each new `.check.mts` with `node <path>`. All must print `all assertions passed`.

---

## Task 7 — Screen 2: the Layout editor

**Files:**
- Create: `components/LayoutEditorPage.tsx`, `TemplateRail.tsx`, `LayoutCanvas.tsx`,
  `ZoneProperties.tsx`, `LayoutSettingsStep.tsx`
- Create: `src/app/(dashboard)/(application)/media-workspace/layouts/create/page.tsx`
- Create: `src/app/(dashboard)/(application)/media-workspace/layouts/[layoutId]/page.tsx`

**Interfaces consumed:** Tasks 3, 4, 5, 6.

The editor is two steps in one shell, following `PlaylistStepper.tsx`'s pattern: **step 1
geometry**, **step 2 settings**. Both routes render the same component; `[layoutId]` seeds
it from `fetchLayout`, `create` seeds it from an empty draft.

- [x] **Step 1: `TemplateRail.tsx`**

Renders `LAYOUT_TEMPLATES` as clickable tiles, each drawn with `<LayoutWireframe>`.
Selecting one replaces the working zone set wholesale. Include a "Start blank" tile that
seeds a single full-screen `main` Zone — a Layout must have at least one Zone, so an empty
canvas is not a legal state to sit in.

- [x] **Step 2: `LayoutCanvas.tsx`**

The drag-resize surface. A `'use client'` component holding the working zones. Requirements:

- Absolutely positioned `<div>`s inside a container with the Layout's CSS `aspect-ratio`,
  each Zone positioned with percentage `left/top/width/height` — the same coordinate space
  the data already uses, so no conversion layer exists to get wrong.
- Drag to move, edge/corner handles to resize. Convert pointer deltas to percentages
  against the container's measured box, then `roundPercent()` every value before it enters
  state, so stored geometry always carries exactly one decimal place.
- Clamp to `0–100` on both axes during the drag.
- Run `validateZones()` on every change and surface overlap live (tint the offending Zones,
  show the message from `status-display.ts`). **Do not block the drag** — let the operator
  see the invalid state and fix it; block the *save* instead.
- Selecting a Zone raises it to `ZoneProperties`. Selection is editor-local state and is
  never persisted.
- Grid toggle and snap-to-grid are cheap here (snap to whole percent when on) and are
  listed as buildable-as-drawn in plan §1. Include them; skip zoom and undo/redo for
  release one unless they fall out for free.

**No Z-Index input, no text tool, no image tool, no per-Zone background/border/radius
controls.** Each is explicitly out of scope — see "Global constraints" and plan §2.3 / §3.

- [x] **Step 3: `ZoneProperties.tsx`**

Name, role (the four-value select), and numeric x / y / width / height inputs bound to the
same rounded percentages. Editing a number is just another path into the same validated
state as dragging. Nothing else — plan §4 Screen 2 limits the panel to
"name / role / position / size / note".

- [x] **Step 4: `LayoutSettingsStep.tsx`**

Exactly four fields, per plan §5 decision 4: name, aspect ratio, background colour
(`<input type="color">` — a native control, no picker dependency), active/inactive.

- [x] **Step 5: `LayoutEditorPage.tsx`**

Owns the working draft, the step, and the save. Save is disabled while
`validateZones()` returns anything; the button's disabled reason is shown as text so the
operator knows which rule is failing. On save, call `upsertLayout` and route back to the
list. Surface failures through `describeSaveError`.

An unsaved-changes guard on leave — reuse `UnsavedLeaveConfirm.tsx` from the playlists
feature rather than writing a second one.

**No `Publish` button and no content picker anywhere in this component.** That is the
central decision of ADR 0044 §1 and the thing mockup 3 got wrong.

- [x] **Step 6: Write the two route files**

`create/page.tsx` and `[layoutId]/page.tsx`, both Server Components mirroring
`playlists/create/page.tsx` and `playlists/[playlistId]/page.tsx`.

---

## Task 8 — Verification and documentation

- [x] **Step 1: Run every check file in both repos**

```bash
node src/features/media-workspace/layouts/geometry.check.mts
node src/features/media-workspace/layouts/templates.check.mts
node src/features/media-workspace/layouts/list-filtering.check.mts
node src/features/media-workspace/layouts/list-url-state.check.mts
node src/features/media-workspace/layouts/status-display.check.mts
```

and in `Thunder_Core`:

```bash
node src/app/api/core/v1/media/layouts/schema.check.mts
```

- [x] **Step 2: Lint and type-check the changed files only**

`tsc` is never clean repo-wide in Thunder_Core (~127 pre-existing errors, per the
`thunder-core-tsc-never-clean` memory) — gate on the delta for changed files, not the total.
Measure the baseline by stashing, exactly as the snapshot migration's session did.

- [ ] **Step 3: Browser verification**

**Ask first, per `CLAUDE.md` §3** — this is a completion claim, not mid-debug poking, and
the question is asked at every verify point, not once per session. Offer: (1) I drive the
browser myself, (2) here is a checklist for you to run, (3) skip and mark unverified.

The checklist, if it goes that way:

1. `/media-workspace/layouts` lists Layouts with a wireframe thumbnail per row.
2. Search, status filter and sort each change the rows **and the URL**; a refresh
   reproduces the same view; back/forward works.
3. "New Layout" → template rail → pick 70/30 → canvas shows two Zones.
4. Drag the split handle; the percentage readout updates; releasing leaves one decimal.
5. Drag one Zone on top of another: an overlap error appears and Save is disabled.
6. Fix the overlap, go to step 2, set a name and background, save.
7. The new Layout appears in the list with the right zone count and aspect ratio.
8. Edit it, change a Zone, save, reopen — the change persisted.
9. Archive it (with the confirm step) → it shows Inactive; restore it → Active.
10. Save a second Layout with the same name → the Thai duplicate-name message appears,
    not a raw Postgres unique-violation string.

- [x] **Step 4: Write the session log**

`.docs/SESSIONLOG-layout-ui-<date>.md`, new file, not appended. Record which layers were
verified and which were not — in particular, state plainly whether the migration was applied
and whether anything was exercised through a browser.

---

## Self-review notes

- **Spec coverage:** ADR 0044 §§1, 3, 4, 6, 7 are implemented by Tasks 1, 3, 4, 6, 7. §§2, 5,
  8, 9, 10, 11, 12, 13 all describe publish-time or player-side behaviour that belongs to
  Screen 3 and the player, and are listed under "Out". Plan §4's Screens 1 and 2 map to
  Tasks 6 and 7; Screen 3 is deferred with its reason stated.
- **Known gap, stated rather than hidden:** the RPC's overlap check and the frontend's
  `validateZones` are two implementations of one rule. They are checked separately and can
  drift. The cheap guard is that the RPC is authoritative and the frontend copy only ever
  produces a friendlier message earlier; a drift shows up as a save that the UI allowed and
  the server refused, which `describeSaveError` already renders correctly.
- **Deliberately not planned:** undo/redo, zoom, and the free-form canvas of mockup 2. All
  are listed as buildable but none is required for an operator to author a Layout.
