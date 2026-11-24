# 0012 — DB-backed draft-save for playlists, mirroring publications

## Context

Playlists currently have no server-side draft. `usePlaylistDraftStore.ts` says so directly:
"nothing here is persisted server-side until the final submit — the whole wizard is local...
this store *is* the draft." `CreatePlaylistPage.handleSubmit()` is the only write: it creates
(or updates) the row and sets items in one shot, at the very last step.

Publications solved the same problem in ADR 0003 (`revision` column, optimistic locking) and
already create their DB row on the first Save/Next, not at final submit
(`usePublishDraft.ts` `persistDraft`). The request here is explicit: give playlists the same
shape, for two reasons — data loss on refresh/crash during a long edit, and consistency with
how publications already behave.

State verified directly against prod (`sfiefevtxalqjizdkcsw`), not assumed from docs:

- `media_core.playlists` has `status IN ('active','inactive')` (no `draft`), `UNIQUE
  (tenant_id, name)`, no `revision`, no `idempotency_key`.
- `media_core.publications` — checked as the pattern to mirror — has `revision integer NOT
  NULL DEFAULT 1`, `idempotency_key uuid` (nullable), and a **partial unique index**
  `media_publications_tenant_idempotency_key_idx ON (tenant_id, idempotency_key) WHERE
  idempotency_key IS NOT NULL`. It has **no** unique constraint on `name` at all.
- `media_publication_upsert`'s actual retry-safety mechanism: on insert, if
  `p_idempotency_key` is given and `p_publication_id` is null, it looks up an existing row by
  key first; a concurrent racer that also inserts hits the partial unique index, and the loser
  catches `unique_violation`, re-selects the winner's row `FOR UPDATE`, and adopts it instead of
  failing. `p_expected_revision` is checked only on the update path (existing
  `p_publication_id`), and every successful write bumps `revision`.
- Playlist RPCs already exist and were read in full: `media_playlist_upsert` (create/update,
  6 params, current `status` check `IN ('active','inactive')`, name-collision handled by
  catching `unique_violation` on the name constraint and raising `'Already exists: ...'`),
  `media_playlist_set_items` (wholesale replace, no revision concept), `media_playlist_get`
  (no `revision` in its return), `media_playlists_list` (filters `kind='user'` only, no status
  filter — a draft row would appear in both `/playlists` and the publication content picker
  today).

## Decision

Mirror the publications pattern as closely as the schema allows: add `revision` and
`idempotency_key` to `playlists`, add `'draft'` to the status check, and reuse
`media_publication_upsert`'s exact idempotency/revision logic in `media_playlist_upsert`.

**Draft row created on first "Next" from the info step** (name is known by then), not on every
keystroke and not behind a separate "Save Draft" button — matches how publications trigger
`persistDraft`.

**`status` gains `'draft'` as a third enum value**, not a separate `is_draft` boolean. Decided
explicitly over keeping `active`/`inactive` untouched, because every list/query that already
filters on `status` gets one predicate to update instead of a second axis to remember
everywhere.

**Rejected — separate `playlist_drafts` table.** Full isolation from real playlist rows, but
duplicates the schema and needs an explicit migration step at finalize time. Rejected because
it does not actually serve either motivating reason (crash-recovery works the same either way;
consistency with publications specifically means *not* doing this, since publications don't).

**`UNIQUE (tenant_id, name)` is dropped entirely — confirmed twice, deliberately scoped beyond
drafts.** The simpler alternative (a partial unique index scoped to `status <> 'draft'`, so only
*published* playlists stay unique) was offered and explicitly declined: the user confirmed
duplicate names should be allowed regardless of status, for every playlist. This is a real
behavior change for already-published playlists, not just an implementation detail of
draft-save, and is recorded here as a deliberate scope expansion rather than an oversight.
Consequence: `AssetLibraryStep` and any other playlist picker must stop relying on name as a
human-distinguishable key — a secondary line (`updated_at`) is added under the name
unconditionally, not just when a collision is detected, to avoid string-comparison-based
dedup logic. This also means the client-side `existingNames` uniqueness check in
`CreatePlaylistPage.handleSubmit()` is dead code once this ships and must be deleted, not left
inert.

**Idempotency via `idempotency_key` + partial unique index, not the name constraint.** With
`UNIQUE(tenant_id, name)` gone, nothing naturally protects a retried create from double-firing —
so unlike the original plan (lean on the existing name constraint), this now requires the same
mechanism publications use. `media_playlist_upsert` gains `p_expected_revision` and
`p_idempotency_key`, with the identical lookup-then-insert-then-catch-race logic copied from
`media_publication_upsert`. `media_playlist_upsert` currently has 6 parameters; adding 2 more
requires `DROP FUNCTION IF EXISTS` on the old 6-arg signature before `CREATE OR REPLACE` —
`CREATE OR REPLACE` does not replace when a parameter is added, it overloads, and existing call
sites become ambiguous (same trap ADR 0003 called out).

**Revision-guard covers both create-draft and edit-existing.** Confirmed explicitly: editing an
already-published playlist via `?id=` also sends `expected_revision` and can hit the same 409.
Decided over scoping the guard to drafts only, because the `revision` column and check logic are
already being added — leaving edit-existing unprotected would be an inconsistent half-measure
with no cost saved.

**No separate "finalize/activate" RPC.** Unlike `media_publication_activate` (which needs its
own `FOR UPDATE` row lock to guard a duplicate-activate race against `expired`/`cancelled`
states), a playlist's final submit is just another `media_playlist_upsert` call with
`p_status='active'` and the current `expected_revision` — the UPDATE statement already locks the
row it touches. Adding a second RPC would duplicate logic for no state machine that needs it.

**Status-downgrade guard.** `p_status='draft'` is only accepted on insert, or when the row's
current status is already `'draft'`. An update cannot move a `'active'`/`'inactive'` row back to
`'draft'` through this RPC — closes an obvious misuse path (an old draft-mode client re-sending
a stale payload) at effectively no cost.

**`media_playlist_set_items` bumps `revision` but does not check it** — same asymmetry as
publications' `set_content`/`set_schedule`: the first call in a save cycle (`upsert`) is the one
that always runs and therefore the one that needs to catch a conflict; items-only writes ride
along.

**`media_playlists_list` gains `AND pl.status <> 'draft'`.** One shared query already serves
both the `/playlists` management page and the publication content picker (unified in the prior
sprint) — a draft is excluded from both by construction, no second RPC needed. Confirmed
explicitly: an in-progress draft must not be selectable by a publication.

**`media_playlist_get` gains `revision` in its return** — the edit-existing path needs to know
the current revision before it can send `expected_revision` on save.

**No cleanup job for abandoned drafts.** Matches publications, which have none either. Recorded
as a known, accepted gap rather than a decision to revisit — abandoned draft rows accumulate
silently, hidden from every list, forever. Acceptable because the motivating reasons (crash
recovery, consistency) don't require cleanup, and publications already carry the same gap
without incident.

**No cross-device/cross-tab "My Drafts" list.** Explicitly declined — recovery is scoped to the
same browser tab crashing and reopening (localStorage still has `playlistId`/`revision`), not to
resuming a draft from a different device or after clearing local storage. If that gap matters
later, it is a separate, larger feature (a drafts list view + fetch-by-id resume), not a
revision to this one.

**Draft shape enters the persisted store — bump the localStorage key.**
`usePlaylistDraftStore.ts`'s persist key moves `v1 → v2` (new fields: `revision`,
`idempotencyKey`). An old `v1` draft is dropped on load, not migrated — same call ADR 0003 made
for publications' `v3 → v4`.

## Consequences

Every future write path to `media_core.playlists` must bump `revision`, or it silently stops
protecting that path — same residual risk ADR 0003 already accepted for publications, now
inherited here.

Dropping `UNIQUE(tenant_id, name)` is irreversible-in-practice once operators start creating
duplicate-named playlists: re-adding it later requires a rename pass over whatever collisions
exist by then. This is the direct consequence of the confirmed decision above, not a side
effect — recorded so it isn't rediscovered as a surprise.

Any playlist picker UI (current or future) must treat `name` as display-only, never as a lookup
or dedup key, from this point forward.

The residual unprotected window is the interval between `upsert` and `set_items` within one save
cycle — identical shape to the gap ADR 0003 accepted for publications' `upsert` → `set_content` →
`set_schedule`.
