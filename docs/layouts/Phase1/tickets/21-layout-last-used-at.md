# 21 — `last_used_at` on `media_layouts_list`

**Issue:** https://github.com/rdThunderThailand/thunder_one_prj/issues/51
**Repo:** `Thunder_Core` · branch off `develop`
**Decided by:** `docs/adr/0063-create-layout-flow-phase-1.md` §3
**Plan:** `docs/layouts/Phase1/plan-create-layout-flow.md` BE-1
**Blocked by:** none
**Runs in parallel with:** 22
**Status:** verified (develop) — not yet applied to production

## What to build

One derived field per row so the Template Picker can order its *Recently Used* group. No column, no
new function, no signature change.

## Context — ADR 0063 §3

> `media_layouts_list` gains `last_used_at` per row:
>
> ```sql
> (SELECT max(c.created_at) FROM media_core.compositions c WHERE c.layout_id = l.id)
> ```
>
> Body-only change; the signature is untouched, so `CREATE OR REPLACE` keeps its grants. The
> alternative — fetching the Composition library a second time and joining in the browser — pulls a
> paginated, folder-and-trash-aware list to compute one ordering. Per tenant, not per user: a Template
> somebody else on the team just used is as relevant as one you used yourself, and per-user would need
> `created_by` plumbed through for no stated want.

Related trap (`CLAUDE.md` §6): `CREATE OR REPLACE FUNCTION` does **not** replace when a parameter is
added — it creates an overload and every existing call becomes ambiguous. This ticket adds no
parameter, and must not start adding one.

## Checklist

- [x] `media_layouts_list` returns `last_used_at timestamptz` per row, from the correlated subquery
      above. **Signature untouched** — `CREATE OR REPLACE` only, no `DROP FUNCTION`
- [x] A Layout no Composition points at returns `null`, not an error and not `epoch`
- [x] The frontend `LayoutListItem` type gains `last_used_at?: string | null`
- [x] Post-apply: confirm `media_layouts_list` still has exactly one overload and its grants survived
      (`has_function_privilege` for `service_role` yes, `anon`/`authenticated` no)
- [x] Rehearse on `develop` — done, 2026-09-06
- [ ] Stop and ask before production, naming the rows affected — **not yet done**

## Verification

- [x] Create a Composition against a Template on a scratch tenant; that Template's `last_used_at`
      moves and no other row's does
- [x] Delete the scratch rows afterwards

Ran on `develop` (`ftfmokgphewzyxzwjitv`), 2026-09-06: scratch Layout `a1111111-…` started at
`last_used_at: null`, moved to the scratch Composition's `created_at` after creating it against that
Layout, one overload confirmed, `service_role` allowed / `anon`+`authenticated` denied EXECUTE. Scratch
rows deleted after.

Migration: `Thunder_Core` `supabase/migrations/20260906090000_layouts_last_used_at.sql` (commit
`c90cbe6`). Frontend: `src/features/media-workspace/layouts/types/index.ts` (commit `775d9f6`).
