# Composition names are freed by Trash and never enter Templates

**Status:** accepted · 2026-10-07
**Source:** MW-003 BUG-06, issue #229; triage in `docs/media-workspace/bug-triage-mw-003.md`

## Context

An operator cannot reuse a Composition name after moving the old Composition to Trash. Two separate
causes produce this.

**Trash keeps the name.** `media_composition_trash` only sets `deleted_at`
(`Thunder_Core/supabase/migrations/20260908160000_block_trashing_used_compositions.sql`), but
`media_core.compositions` has a non-partial `UNIQUE (tenant_id, name)`
(`20260826120000_composition_schema_and_rpcs.sql:56`, never changed). `media_composition_upsert` turns
the violation into "Already exists: a composition named …", shown as "มี Composition ชื่อนี้อยู่แล้ว".
Compositions are the only trashable table with this problem: playlists and media assets have no name
uniqueness, and layouts and folders have no trash.

**The Composition name leaks into `layouts.name`.** Saving a new Composition from blank or a preset
(`compositions/save-composition.ts:120-146`) first calls `media_layout_upsert` with the operator's
Composition name. The row gets the column default `kind = 'template'`. A second call,
`media_layout_set_kind('inline')`, renames it to `comp:<id>`. The two calls are separate transactions.
So:

- a Composition from blank or a preset cannot share a name with an existing Template, although a
  Composition made from a Template can;
- if the second call fails, or the operator leaves before retrying, a `kind = 'template'` row named after
  the Composition stays behind. It appears as a Template in pickers and blocks the name for good, since
  Templates have neither trash nor delete. The error is "มี Template ชื่อนี้อยู่แล้ว".

`media_layout_upsert` declares `p_idempotency_key` but never uses it.

`media_composition_restore` is defined only in `20260901043400_composition_library_lifecycle.sql`,
whose header says it is intentionally unapplied. Whether it exists on develop and prod is not known yet.

## Decision

### 1. Only live Compositions hold a name

Replace `UNIQUE (tenant_id, name)` on `media_core.compositions` with a partial unique index on
`(tenant_id, name) WHERE deleted_at IS NULL`. In one migration, create the index first and then drop the
constraint, reading its real name from the database, so there is no window without uniqueness. Names
stay case-sensitive.

`media_composition_upsert` and `media_composition_duplicate` already catch `unique_violation`, so they
work unchanged against the partial index. Nothing uses `ON CONFLICT` on `compositions` or looks a row up
by name.

### 2. Restore renames on a clash

Once a trashed name can be reused, restoring the trashed Composition can collide with the live one.
`media_composition_restore` then appends " (2)", " (3)", … to the name, each attempt in its own
`BEGIN … EXCEPTION WHEN unique_violation` block, so two concurrent restores cannot both take the same
suffix. If the suffixed name would exceed `varchar(200)` (counted in characters), the base name is
truncated to fit.

The RPC keeps returning `void` and keeps its signature, so it is changed with `CREATE OR REPLACE`. The
migration still repeats `REVOKE ALL … FROM PUBLIC, anon, authenticated` and
`GRANT EXECUTE … TO service_role` for it: this is idempotent, and it covers an environment where the
function did not exist and is created fresh with `EXECUTE` for `PUBLIC`.

The route `POST /media/compositions/:id/restore` reads the row's `name` after the RPC (via `media_composition_get`; routes
do not read `media_core` tables directly) and returns
`{ success: true, data: { name } }`. The FE compares it with the name it had in the Trash list:

- single restore, name changed: "กู้คืนเป็น '<new name>' เพราะมีชื่อนี้อยู่แล้ว";
- batch restore: how many items were renamed;
- name unchanged: nothing extra (there is no success toast today).

The batch restore error, which today reuses the trash message ("… because it is in use"), becomes
"กู้คืนไม่สำเร็จ N รายการ".

### 3. Composition names and Template names are separate

A Composition may share its name with a Template. They live on different pages, and the Template path
already allows it.

### 4. An inline layout is created in one transaction

A new RPC, `public.media_layout_create_inline`, calls `public.media_layout_upsert` with a temporary name
(`comp:` plus a fresh uuid) and then `public.media_layout_set_kind(…, 'inline')`, which renames the row
to `comp:<id>`. Both run in one transaction. The operator's name never reaches `layouts.name`, and a
failure leaves no row.

- It takes `media_layout_upsert`'s arguments minus `p_layout_id`, `p_name` and `p_idempotency_key`, and
  reuses its validation instead of copying it. It returns the upsert's jsonb (`layout_id`, …).
- `SECURITY DEFINER`, `SET search_path = ''`. The function lives in `public` like its siblings; every
  call and table reference is schema-qualified (`public.` functions, `media_core.` tables).
- `CREATE FUNCTION` grants `EXECUTE` to `PUBLIC`, so the migration revokes it from `PUBLIC`, `anon` and
  `authenticated` and grants it to `service_role`, like its siblings.
- `POST /media/layouts` accepts `kind: 'inline'` and calls the new RPC. With `kind: 'inline'` the body's
  `name` is optional and ignored.
- The FE blank/preset save uses it in place of its first two calls (`upsertLayout`, then
  `setLayoutKind`). On resume, when `onLayoutCreated` already holds a `layoutId`, the FE goes straight to
  `fetchLayout` with no `setLayoutKind` call.

### 5. Existing orphan Template rows are listed, not deleted

On develop and on prod, query `kind = 'template'` layouts that no Composition (trashed ones included,
since they keep their `layout_id`) and no `media_core.publication_snapshots` row references, and whose
name equals a Composition's name. Show the list to the owner. Deleting any of them is a separate step
that needs approval per row set (R0). A Template that is merely unused is not an orphan, which is why the
name match is required.

## Considered and rejected

- **Restore RPC returns the new name** (the triage's first proposal). Changing the RPC's return type needs
  DROP, CREATE and a fresh REVOKE/GRANT on prod. The route can read the name after a `void` RPC instead.
- **FE fetches each restored Composition to read its name.** One extra request per item; the route
  already has the row at hand.
- **Block restore on a clash and ask the operator to rename first.** More steps for the operator, and
  there is no rename from Trash.
- **One namespace for Compositions and Templates.** It would make the accidental rule from the
  blank/preset path official, and the Template path would have to start rejecting names.
- **Add `p_kind` to `media_layout_upsert`.** One function fewer, but a DROP and re-GRANT of one of the
  most-called RPCs on prod.
- **FE-only: send a temporary name in the first call.** Still two transactions; orphans still appear,
  now with odd names in the Template picker.
- **Case-insensitive names (`lower(name)`).** Nobody has reported it, and building the index could fail
  on existing prod data.

## Out of scope

- A failure at step 4 of the blank/preset save (Composition name taken by a live Composition) leaves an
  unreferenced inline layout named `comp:<id>`. It is invisible and blocks no name. Recorded as a
  follow-up.
- "Delete forever" is blocked when any publication row, even a draft, references the Composition.
- Duplicate's default name ("<name> copy") can collide; the operator sees the existing error.

## Consequences

- First, check on develop and prod whether `media_composition_restore` and the rest of
  `20260901043400_composition_library_lifecycle.sql` are deployed. The migration plan depends on it.
- Migrations: the partial index, the new `restore` body with its grants, and
  `media_layout_create_inline`. Develop first; prod is R0. Dump the function definitions and the index
  afterwards and compare them with the files.
- Thunder_Core: `POST /media/layouts` gains the `kind: 'inline'` branch, and the restore route returns the
  name. The FE depends on both, so the BE ships first.
- The Template message ("มี Template ชื่อนี้อยู่แล้ว") can no longer come from saving a Composition. It
  remains for Save as Template.
