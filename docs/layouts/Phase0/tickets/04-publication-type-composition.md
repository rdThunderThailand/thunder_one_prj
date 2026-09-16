# 04 — A Publication can be of type `composition`

**Spec:** `docs/layouts/spec-composition-content.md` ·
**Decided by:** `docs/adr/0049-composition-layout-with-content.md` §5, §12

**What to build:** a Publication picks one Composition exactly as it picks one Playlist. The type is
chosen at step 1 with every other "what kind of content is this" choice, and step 2 shows a
Composition picker and nothing else. This ticket also removes the Full screen / Layout mode switch
built for the superseded model.

**Blocked by:** 02 — Composition entity: schema and RPCs

**Status:** shipped — migration applied to **production** (`sfiefevtxalqjizdkcsw`), re-verified
against prod 2026-08-28: `publications.composition_id` exists, the `publication_type` CHECK reads
`('image','video','playlist','html','dynamic','composition')`, `media_publication_upsert` carries
`p_composition_id`, and `media_publication_upsert` / `_activate` / `_duplicate` / `_set_content` each
have **exactly one overload** — the ambiguity trap this ticket warned about did not happen. Frontend
branches are live: `step-validation.ts:67`, `publish-eligibility.ts:70`, `content-selection.ts`.
Production holds **0 composition Publications**, so the operator path is shipped but never yet
exercised on real data.

**The migration part is R0 — it rewrites a CHECK on a live table and drops a live function signature.
Rehearse on `develop` first.**

- [ ] `publications` gains `composition_id uuid NULL REFERENCES media_core.compositions(id)`
- [ ] The `publication_type` CHECK widens to
      `('image','video','playlist','html','dynamic','composition')` — in the table constraint **and**
      in the hardcoded `IF p_publication_type NOT IN (...)` copy inside `media_publication_upsert`
- [ ] `media_publication_upsert` gains `p_composition_id uuid DEFAULT NULL`. **Its existing
      17-argument signature is dropped by exact signature first** — the statement is in ADR 0049 §12;
      `CREATE OR REPLACE` with an added parameter creates a second overload and every existing call
      then fails as ambiguous
- [ ] The RPC enforces: `type = 'composition' ⟺ composition_id IS NOT NULL AND playlist_id IS NULL`;
      `type ≠ 'composition' ⟹ composition_id IS NULL`; `composition.tenant_id =
      publication.tenant_id`
- [ ] `media_publication_set_content` rejects `'composition'` explicitly instead of falling through
- [ ] `media_publication_duplicate` **shares** `composition_id` for a composition Publication rather
      than minting a fresh `pub:<uuid>` Playlist as it does for the playlist type — the duplicate
      would otherwise carry no content at all
- [ ] Step 1 offers the type (labelled "Layout" for operators — the UI is allowed to differ from the
      contract word)
- [ ] Step 2 renders a Composition picker for that type, listing `active` Compositions only
- [ ] The Full screen / Layout mode switch and its per-Zone binding UI are removed from step 2; every
      other type behaves exactly as it does today
- [ ] `publish-eligibility.ts`, `step-validation.ts` and `dropMismatchedItems` in
      `content-selection.ts` each gain **one** `composition` branch beside their existing `playlist`
      branch. `publish-eligibility.ts` must be changed rather than skipped — its `else` falls through
      to the assets path, where a composition Publication has no `assetItems` and would be marked
      ineligible to publish
- [ ] The draft store's persisted key version is bumped; older drafts are dropped, not migrated
- [ ] `publish-eligibility.check.mts` and the step-validation check file gain the `composition` cases
- [ ] Post-apply verification: `pg_get_functiondef` diffed against the migration file, **exactly one
      overload of `media_publication_upsert`** (this is the specific failure this ticket risks), grants
      confirmed with `has_function_privilege`, advisors show no new finding
- [ ] Scratch-tenant SQL probe: create a composition Publication, fail to create one with both
      `composition_id` and `playlist_id`, fail with a Composition from another tenant, duplicate it and
      confirm the copy shares the same `composition_id`
- [ ] Verified in the browser through steps 1 and 2; note that the frontend calls the **deployed**
      `Thunder_Core`, so the route changes are invisible in the UI until deployed
