# 22 — Composition tags

**Issue:** https://github.com/rdThunderThailand/thunder_one_prj/issues/52
**Repo:** `Thunder_Core` · branch off `develop`
**Decided by:** `docs/adr/0063-create-layout-flow-phase-1.md` §4
**Plan:** `docs/layouts/Phase1/plan-create-layout-flow.md` BE-2
**Blocked by:** none
**Runs in parallel with:** 21
**Blocks:** 23, and the Tags half of 25 and 29
**Status:** verified (develop) — not yet applied to production

## What to build

A Layout (contract: `compositions`) can carry Tags from the tenant's one shared vocabulary. This is a
copy of `20260903150000_playlist_tags.sql` with `playlist` → `composition`, not a new design.

## Context — ADR 0063 §4

> ADR 0052 §7 put *Folders, Category, Tags on Layouts* out of scope. Both list frames rely on a
> Folders/Tags rail, so keeping them out makes the list page describe filters it does not have.
>
> - **Folders already exist.** `20260829040259_nested_feature_folders_and_trash.sql` carries scope
>   `'composition'` and `media_composition_move`. Nothing to build.
> - **Tags do not.** `media_core.composition_tags` plus `media_composition_set_tags` are modelled on
>   `20260903150000_playlist_tags.sql` line for line — same shared vocabulary (`media_core.tags`), same
>   composite PK, same RLS-on-no-grants, same "list RPC gains a `tags` array" shape.
>
> `Category` stays out. Nothing distinguishes it from a Tag.

Trap (`CLAUDE.md` §6): `CREATE FUNCTION` grants `EXECUTE` to `PUBLIC` by default. The REVOKE/GRANT
pair is not optional.

## Checklist

- [x] `media_core.composition_tags (composition_id, tag_id, created_at)` — composite PK, both FKs
      `ON DELETE CASCADE`, index on `tag_id`
- [x] `ENABLE ROW LEVEL SECURITY` with no policies, plus
      `REVOKE ALL ON TABLE ... FROM PUBLIC, anon, authenticated` — Core is the only read/write boundary
- [x] `media_composition_set_tags(p_tenant_id uuid, p_composition_id uuid, p_tags text[])` takes tag
      **names**: trim, drop blanks, dedupe case-insensitively, create what does not exist in
      `media_core.tags`, then replace the Composition's set
- [x] Standalone RPC, **not** a `p_tags` argument on `media_composition_upsert` — a tag must be
      editable from a list row without loading a revision, the same reason `media_playlist_move` exists
- [x] Tenant ownership enforced **inside the function** (isolation lives in the RPC, not in RLS)
- [x] `REVOKE ALL ON FUNCTION ... FROM PUBLIC, anon, authenticated` then
      `GRANT EXECUTE ... TO service_role`, verified with `has_function_privilege` after apply
- [x] `media_compositions_library_list` gains a `tags` array per row — **body-only, signature
      untouched**, so no `DROP FUNCTION`
- [x] No backfill. Nothing has ever written Composition tags
- [x] Rollback documented in the migration header, as `20260903150000` does
- [x] Rehearse on `develop` — done, 2026-09-06
- [ ] Stop and ask before production — **not yet done**

## Verification

- [x] Scratch tenant: set tags on a Composition, read them back through the library list
- [x] The same word typed under Playlist and under Layout resolves to **one** `media_core.tags` row
- [x] Cross-tenant `media_composition_set_tags` is refused
- [x] `anon` and `authenticated` are denied EXECUTE; `service_role` is allowed
- [x] `media_compositions_library_list` still has exactly one overload
- [x] Delete the scratch rows afterwards

Ran on `develop` (`ftfmokgphewzyxzwjitv`), 2026-09-06: scratch Composition tagged with
`['SCRATCH-tag', 'scratch-tag', ' Scratch-Tag ', 'News']` → deduped to `SCRATCH-tag` + the existing
`News` row; read back identical through `media_compositions_library_list`. A scratch Playlist tagged
`'scratch-TAG'` resolved to the same `tag_id` as the Composition's `SCRATCH-tag` — one shared
vocabulary confirmed. Cross-tenant call raised `not found: active composition not found for this
tenant`. One overload confirmed on `media_compositions_library_list`; `service_role` allowed,
`anon`/`authenticated` denied EXECUTE and table access. Scratch rows deleted after (the pre-existing
`News` tag left untouched).

Migration: `Thunder_Core` `supabase/migrations/20260906091500_composition_tags.sql` (commit
`c90cbe6`).
