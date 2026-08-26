# Composition — a named, reusable Layout with content

**Status:** accepted · 2026-08-26
**Supersedes:** `0044-multi-zone-layout.md` §1 · `0048-per-zone-content-binding.md` (in full)
**Extends:** `0045-publication-snapshot-materialization.md` §1, §2

## Context

ADR 0044 §1 decided that a Layout carries **geometry and Zone roles only — never content**, and that
content is bound per Zone inside step 2 of the Publication wizard. ADR 0048 then decided where that
binding lives while the Publication is a draft: `media_core.publication_zones`, one row per bound
Zone, owned by the Publication.

That model was built and browser-tested on 2026-08-26. Two things came back from it.

**It does not meet the product requirement.** The PO expects a Layout to be an authored, named thing
that already carries its content — the same shape as a Playlist — rather than an empty frame that
only becomes meaningful once someone is halfway through a Publication wizard. Binding content Zone by
Zone in the middle of a five-step wizard is not where operators expect to compose a split screen.

**The implementation hit a structural gate.** `canSelectPlaylist(type)` and `canSelectAsset(type, …)`
(`src/features/media-workspace/publications/content-selection.ts`) gate content on the Publication's
single flat `publication_type`. In Layout mode a Zone must be free to hold a Playlist while its
neighbour holds images, so one Publication needs several answers to "what type is this" at once. The
same fault repeats in `publish-eligibility.ts` and `ReviewPublishStep.tsx`. Every one of those is a
symptom of content living on an entity whose type is scalar.

### Re-examining ADR 0044's rejection

ADR 0044:68–70 rejected "Layout holds content too" for two reasons. Only one of them holds.

> *"It turns a Layout into a second Publication that lacks a schedule and a target, giving two
> answers to 'what is playing'."*

**This reasoning was wrong when it was written.** `CONTEXT.md:56` defines Playlist as having *"no
scheduling or targeting responsibility of its own"* — a Playlist is precisely a named, reusable
content holder without a schedule or a target, and nobody calls it a second Publication. An entity
that defines content without deciding when or where it airs is an established, load-bearing shape in
this domain, not a defect.

The single authority is preserved by stating the three roles precisely, which ADR 0044 conflated:

> **Playlist and Composition define reusable content. Publication decides when and where it is
> published. The Job snapshot records what actually aired.**

Neither a Playlist nor a Composition ever answers "what is playing right now" — only the snapshot
does. Adding a second content-defining entity therefore adds no second answer to anything.

> *"It also breaks the real reuse case — one menu-board Layout, different content per branch."*

**This one is correct and was confirmed as a live requirement.** The same geometry does carry
different content on different screens. Putting content directly on `layouts` would force one Layout
row per branch, duplicating geometry N times and making a single Zone adjustment an N-way manual
edit.

So the requirement and the surviving objection pull in opposite directions, and neither can be
dropped. That is what this ADR resolves.

## Decision

### 1. A new entity sits between Layout and Publication: the Composition

`media_core.compositions` is a named, tenant-scoped, reusable pairing of one Layout with content for
each of its Zones. It lives in the Layout area of the product, has its own list page, and copies
Playlist's lifecycle, which is `draft → active ↔ inactive`, no delete — three states, not two.
See §10 for what each state permits.

```
media_core.compositions
  id, tenant_id, name, layout_id, status, revision, metadata, created_at, updated_at
  status    -- draft | active | inactive               (§10)
  revision  -- optimistic lock, and drift input        (§11)
  UNIQUE (tenant_id, name)

media_core.composition_zones
  id, tenant_id, composition_id,
  layout_zone_id      -- NOT NULL, FK → layout_zones, ON DELETE RESTRICT   (§9)
  playlist_id         -- NOT NULL, FK → playlists,    ON DELETE RESTRICT
  playback jsonb      -- play_mode / repeat / start_from
  UNIQUE (composition_id, layout_zone_id)
```

`composition_zones` is `publication_zones` from ADR 0048 with `publication_id` swapped for
`composition_id`, and the `playback` CHECK carries over unchanged. Two columns do not carry over.

`layout_zone_id` becomes **`ON DELETE RESTRICT`**, not `CASCADE` (§9). ADR 0048 could cascade because
a binding was scratch state inside one draft; a Composition outlives the edit that created it.

**`position` is dropped.** ADR 0048 copied the Layout's Zone order into the binding row. A copy of a
value that its source can change is a desync waiting to happen, and Zone order is the Layout's fact:
read it by joining `layout_zones.position`.

**Layout is not touched.** It stays geometry-only and stays shared, so one menu-board Layout still
backs many Compositions. The requirement is met because the thing an operator names and fills with
content up front now exists; the reuse case is met because geometry is still owned one level down.

### 2. Layout loses `role`

`layout_zones.role` and `publication_snapshot_zones.role` are dropped, along with the enum in the
contract and the frontend.

`role` never carried behaviour: `layouts.sql:81` and `contract-v2-zones.md:74` both mark it advisory,
and ADR 0044:233 states that the capability gate counts video Zones from a Zone's **items**, not from
its role — *"A Zone has no `kind`; its items do."* It was redundant with `name` from the first commit:
`templates.ts:49` writes `zone(1, "Ticker", "ticker", …)`, naming the same fact twice.

Every Zone is equal. A Zone's free-text `name` (already `varchar(120) NOT NULL`) is the only label,
and what actually distinguishes a ticker from a main Zone is its geometry and its own playback
settings (§4). Editor colours key off `position` instead of `role`.

### 3. A Zone binds a Playlist; one-off content becomes an implicit Playlist

A Composition Zone always points at a Playlist. Picking loose assets for a Zone creates an implicit
Playlist owned by that Zone — the mechanism ADR 0048 §3 introduced and `usePublishDraft.ts` already
implements, with the marker corrected below.

This keeps one item table in the system. Ordering, per-item duration, transition, approval rules and
asset-delete protection are inherited from Playlist rather than reimplemented per Zone.

**The marker is `playlists.kind = 'inline'`, not a metadata flag.** `kind` already exists with values
`single | user | inline`, and production already holds 60 `single` and 7 `inline` machine-generated
rows named `pub:<uuid>`. ADR 0048's `metadata.publication_zone_implicit` reinvented it — and worse,
`media_playlist_upsert` forces `kind = 'user'` on create (`056_media_redesign_functions.sql:787`), so
every Zone's implicit Playlist would surface in the operator's own Playlist list. The RPC needs a
create path that yields `kind = 'inline'`. Naming follows the existing convention rather than
embedding a Publication id. §13 settles the rest of its lifecycle.

### 4. A Zone's playback overrides its Playlist's

A Playlist carries its own `playMode` / `repeat` / `startFrom` in `playlists.metadata`. A Composition
Zone carries the same triple and wins.

Without the override, running one Playlist as a loop in the main Zone and once in a ticker would
require duplicating the whole Playlist to change one field — and "a looping main Zone can sit beside
a play-once ticker" is a stated requirement (`spec-per-zone-content.md:65`). With `role` gone (§2),
per-Zone playback is what makes Zones behave differently at all.

### 5. A Publication picks one Composition, exactly as it picks one Playlist

`publication_type` gains the value **`'composition'`**, alongside `'playlist'`. Step 1 offers it as a
type; step 2 then presents a Composition picker and nothing else. The Full screen / Layout mode switch
inside step 2 is removed — the choice moves back to step 1 where every other "what kind of content is
this" choice already lives.

The stored value names the entity it points at. The UI is free to keep calling it "Layout", which is
the word the PO and operators use — presentation language and contract language are allowed to differ,
and forcing the contract to say `'layout'` while its FK says `composition_id` would recreate exactly
the naming collision this ADR exists to remove. §12 gives the invariants.

Content gating returns to one scalar dimension. The call sites that branch on `publication_type` —
`publish-eligibility.ts`, `step-validation.ts`, `dropMismatchedItems` in `content-selection.ts` —
each gain **one** `composition` branch, the same way each already has a `playlist` branch. That is
the improvement: one branch per site, instead of a layout-mode path that has to ask the question
again per Zone. `publish-eligibility.ts` in particular must be changed, not skipped — its `else`
falls through to the assets path, where a Composition Publication has no `assetItems` and would be
marked ineligible to publish.

`publications.layout_id` from ADR 0048 §1 is replaced by `publications.composition_id`.

### 6. Completeness is enforced at activation, not at save

A Composition may be saved with Zones still unbound. It may not be set `active`, and a Publication
that points at an incomplete Composition may not be activated.

ADR 0048's RPC refused an incomplete binding set outright, which made Save Draft fail mid-compose.
That rule made sense when bindings were scratch state inside one wizard session. A Composition is a
long-lived named record, so it follows Playlist's rule: a half-filled draft is a normal state.

### 7. Editing a Composition never reshapes an airing screen

The ADR 0045 snapshot rule is unchanged: activation materializes geometry **and** every Zone's items
into `publication_snapshot_zones` / `publication_snapshot_items`, and later edits do not reach a
screen that is already airing.

Because content now lives on a long-lived entity, editing it becomes routine rather than rare, so an
operator who edits a Composition will reasonably expect the screen to follow. The answer is a **drift
indicator**, not a hole in the snapshot rule: a Publication whose Composition changed after activation
is flagged, with re-publish as the action.

**The ADR 0048 drift detection does not carry over.** `hasLayoutZoneDrift`
(`zone-bindings.ts:57`) is a set difference over Zone ids: it sees a binding pointing at a vanished
Zone and nothing else — not changed geometry, not changed Playlist items, not changed playback, not a
swapped Layout, not a renamed Layout. Paired with §9's unstable ids it is wrong in both directions at
once: it fires on every Layout save while missing every real change. §11 replaces it.

Letting content through the snapshot while geometry stays frozen would put two rules inside one
object and undo a decision already live in production.

### 8. A Composition's Layout may be changed, with confirmation

Changing `layout_id` clears every Zone binding, behind a confirmation step. Silent orphaning and
position-based re-matching are both refused: re-matching guesses, and a wrong guess is invisible to
the operator.

### 9. Layout Zone identity is stable; a Zone in use cannot be deleted

`media_layout_upsert` currently deletes every Zone of a Layout and re-inserts the set on **any**
update — a rename triggers it just as a geometry change does — so `layout_zones.id` is minted fresh
from `gen_random_uuid()` on every save (`20260825104559_layout_upsert_duplicate_name.sql:105`). That
was harmless while nothing referenced a Zone. Under this ADR it would wipe every Composition's
bindings each time anyone touched the Layout, destroying the shared-geometry property that is the
entire reason the Composition exists.

`media_layout_upsert` becomes a diff:

- the editor round-trips each Zone's `id` and sends it back
- a Zone with a known `id` is **updated** in place, keeping the id
- a Zone with no `id` is **inserted**
- a known `id` absent from the payload is **deleted**

Deleting a Zone that any Composition binds is **refused** (`ON DELETE RESTRICT`), and the error names
the Compositions holding it. This is the rule the domain already uses: a Folder that still holds
content cannot be deleted, and `composition_zones.playlist_id` restricts for the same reason.
Cascading would make a Composition silently incomplete, which is the failure this ADR is correcting.

The overlap check (ADR 0044 §3) runs against the post-diff Zone set, not the payload alone.

**`UNIQUE (layout_id, position)` must become deferrable.** It is currently a plain, non-deferrable
constraint, and the wholesale delete-then-insert never met it mid-statement. A diff does: reordering
two Zones updates the first to a `position` the second still holds, and the constraint fires on the
spot. `SET CONSTRAINTS` cannot defer a constraint that was not declared deferrable, so the migration
drops and recreates it:

```sql
ALTER TABLE media_core.layout_zones DROP CONSTRAINT layout_zones_layout_id_position_key;
ALTER TABLE media_core.layout_zones
  ADD CONSTRAINT layout_zones_layout_id_position_key
  UNIQUE (layout_id, "position") DEFERRABLE INITIALLY DEFERRED;
```

Rejected: renumbering through a negative offset in two passes. It works, but it puts a trick in the
RPC that every later reader has to decode, to avoid a one-line schema change.

### 10. Composition lifecycle: `draft → active ↔ inactive`

Three states, copied from Playlist (`playlists_status_check`), not two.

| State | Zones may be incomplete | Selectable by a Publication |
|---|---|---|
| `draft` | yes | no |
| `active` | no | yes |
| `inactive` | no | no |

- A Composition is born `draft` and may be saved with Zones unbound, so composing across sessions
  works (§6).
- Activating requires a binding for every Zone of its Layout, checked in the same transaction.
- **A Composition cannot make itself incomplete while `active`.** Unbinding a Zone and changing its
  Layout (§8) are rejected in one transaction, as is deleting a bound Zone out from under it (§9's
  `RESTRICT`). Auto-demotion was rejected: a state change nobody asked for is harder to notice than a
  refusal.
- **The world can make it incomplete, and then it is told.** Adding a Zone to a shared Layout leaves
  every active Composition on that Layout one Zone short. This is permitted. Blocking it would mean a
  Layout could never gain a Zone while a single Composition was live — geometry that is shared but
  frozen, which defeats the reason §1 keeps Layout separate at all. The new Zone changes
  `layouts.updated_at`, so §11's drift indicator names every affected Publication, and §12's
  activation invariant refuses to publish until the Zone is bound.

  The line is: **a delete destroys a binding that exists; an insert destroys nothing and only raises
  the bar for completeness.** So a delete is refused at the write and an insert is caught at
  activation.

  Completeness is therefore a fact checked when it matters — at activation — not an invariant the
  `active` state can guarantee on its own.
- A Publication may only select an `active` Composition. `inactive` means retired; letting it be
  picked again would leave the state meaningless. This mirrors the Layout picker rule already
  verified in the browser — archived Layouts are absent from the list.
- Publications already activated are unaffected by any later state change, because ADR 0045's
  snapshot has already detached them.
- A Composition has no delete. This is Composition's own rule, not a domain-wide one: Playlists and
  Publications do have hard deletes (`media_playlist_delete`, `media_publication_delete`), gated by
  usage counts.

### 11. Drift is detected by revision, three levels deep

`hasLayoutZoneDrift` compared Zone id sets client-side. It is replaced.

At activation the snapshot records the revision of everything it materialized:

- `composition_revision` — bindings, per-Zone playback, which Layout is used, the name
- `layout_updated_at` — geometry, background, aspect ratio, Zone names
- **one `playlist_revision` per bound Zone** — the items, their order, durations and transitions

A Publication is drifted when any recorded revision differs from the live one. The indicator names
what changed and offers re-publish; nothing reaches an airing screen without one (§7).

The third level is not optional. Editing the items of a Playlist a Zone points at is the change an
operator makes most often — it is what "update the menu" means — and a two-level check would be blind
to precisely that. `media_playlist_set_items` already does `revision = revision + 1` on every write,
so level three works with no backend change at all.

**Level two uses `layouts.updated_at`, not a new `layouts.revision`.** `media_layout_upsert` already
sets `updated_at` on every path and mentions no revision anywhere; adding a counter would mean adding
a column *and* remembering to increment it in a function nobody else touches — and forgetting the
increment fails silently, comparing 1 against 1 forever with nothing to signal the check is dead.
Drift is a comparison, not a lock: the locks are `compositions.revision` and `publications.revision`,
which stay integers because they really are optimistic locks. A timestamp that something already
maintains beats a counter that nothing does.

Rejected: rolling the Playlist revisions up into the Composition's own, so one integer could be
compared. It makes an ordinary Playlist edit write across tables to rows it has no business knowing
about, and turns a simple save into a fan-out that is unpleasant to debug.

### 12. `publication_type = 'composition'` invariants

Enforced inside `media_publication_upsert` and at activation, not left to the client:

```
publication_type = 'composition'  ⟺  composition_id IS NOT NULL AND playlist_id IS NULL
publication_type ≠ 'composition'  ⟹  composition_id IS NULL

composition.tenant_id = publication.tenant_id           -- tenant isolation lives in the RPC
composition.status    = 'active'                        -- at activation (§10)
every Zone of composition.layout_id has a binding       -- at activation (§6)
```

`publications` gains `composition_id uuid NULL REFERENCES media_core.compositions(id)`, replacing the
`layout_id` ADR 0048 proposed. The `publication_type` CHECK widens to
`('image','video','playlist','html','dynamic','composition')`, in the table constraint **and** in the
`IF p_publication_type NOT IN (...)` copy inside the RPC.

`media_publication_upsert` gains `p_composition_id uuid DEFAULT NULL`, which changes its signature.
The existing 17-argument function must be dropped by its exact signature first — `CREATE OR REPLACE`
with an added parameter creates a second overload instead of replacing, and every existing call then
fails as ambiguous:

```sql
DROP FUNCTION IF EXISTS public.media_publication_upsert(
  uuid, uuid, uuid, varchar, text, uuid, varchar, varchar, varchar, jsonb, jsonb,
  timestamptz, timestamptz, uuid, text[], integer, uuid);
```

### 13. An implicit Playlist belongs to its Zone

An implicit Playlist is created `kind = 'inline'` and `status = 'active'` (§3), named after its
Composition and Zone rather than a Publication, and is never offered in the operator's Playlist list.
`active` matches the convention `media_publication_duplicate` already uses for the rows it mints, and
nothing gates on an inline Playlist's status today — leaving it `draft` would only create a state
that has to be remembered later.

- Editing a Zone's assets **updates that Zone's existing inline Playlist** rather than creating
  another one. ADR 0048's code minted a new Playlist whenever the draft had no id to hand, which in a
  long-lived Composition would accumulate orphans that nothing can delete.
- Re-pointing a Zone from its inline Playlist to a saved one sets the inline Playlist `inactive`.
  It cannot be deleted: `media_playlist_delete` refuses every `kind <> 'user'` row outright, so an
  inline Playlist is permanent whatever we decide. Retiring it is what keeps it out of every list and
  every count.
- An inline Playlist is never shared between Zones, so `ON DELETE RESTRICT` on
  `composition_zones.playlist_id` exists to protect **saved** Playlists from vanishing under a
  Composition. It has no bearing on inline rows, which the `kind` rule already makes permanent.

## Rejected alternatives

**Content directly on `layouts`, plus a Duplicate action** — the PO's literal request. Rejected
because the reuse case is real: geometry would fork per branch, and moving one Zone would become an
N-way edit. Reconsider only if geometry turns out never to change once screens are live.

**Keep ADR 0044 §1 as written** (Publication binds per Zone, ADR 0048's model). Rejected: it does not
meet the product requirement, and its `publication_type` fault would have to be patched at three or
more call sites with layout-mode branches that all restate the same exception.

**Content defaults on the Layout, overridable per Publication** — already rejected by ADR 0044:72 and
still rejected, for the same reason: two sources of truth stacked on each other.

**Rename: `Layout` for the content-bearing entity, `Layout Template` for geometry.** Closest to the
PO's mental model, and it would promote today's frontend template constants into a real table.
Rejected on cost: renaming an existing entity across two repositories, every RPC, the player contract
and four ADRs would exceed the cost of the work it is attached to. `Composition` costs one sentence in
`CONTEXT.md:60`, where "screen composition" becomes "screen geometry".

**`Layout Content` / `layout_contents` as the name.** Unambiguous and needs no `CONTEXT.md` edit, but
reads as a column name rather than something an operator would say out loud.

**Keeping `role` and hiding it in the UI only.** Cheaper in isolation — no migration at all — but this
change opens a migration set regardless, so folding the drop in costs almost nothing extra and avoids
leaving a dead column that still ships to players.

## Consequences

- `CONTEXT.md` gains **Composition**, and the Layout entry's *"never content"* wording changes to
  point at Composition rather than at the Publication wizard. Zone's entry loses `role`.
- ADR 0044 §1 and ADR 0048 are marked superseded. ADR 0044 §2–§11 (no scenes, no overlap, percent
  geometry, two fit rules, capability gate, equal-priority overlap block) remain in force.
- Player contract v2 drops the `role` field from `zones[]`. It was advisory, so no player behaviour
  changes.
- Two production-affecting migrations are required and are **R0**: widening the `publication_type`
  CHECK plus its hardcoded copy inside `media_publication_upsert` — which needs
  `DROP FUNCTION` before `CREATE OR REPLACE`, because adding a parameter otherwise creates an
  ambiguous overload — and dropping `role` from `publication_snapshot_zones`, a table already applied
  to production with live rows.
- **Verified read-only against production (`sfiefevtxalqjizdkcsw`) and `develop`
  (`ftfmokgphewzyxzwjitv`) on 2026-08-26:** none of the three uncommitted zone migrations was ever
  applied to either environment. `publication_zones`, `publications.layout_id`,
  `assets.player_capabilities` and `media_publication_set_zones` are all absent. The three staged
  migration files can therefore be rewritten in place without colliding with migration history.
- Production holds one Layout with two Zones — test data created the same day — so no Composition
  backfill is needed. `publication_snapshot_zones` holds 99 rows, every one `role = 'main'` (the
  implicit full-screen Zone of ADR 0045 §1), so dropping `role` destroys no meaningful value, though
  it still rewrites 99 live rows and stays R0.
- The production-affecting migration set is larger than the two items above: it also creates
  `compositions` / `composition_zones` with their FKs and RPCs, rewrites activation to read from
  them, adds an `inline` create path to `media_playlist_upsert`, and — per §9 — changes
  `media_layout_upsert` to a diff. **Every apply to production is R0, including the additive ones.**
  Rehearse the whole set on `develop` first.
- `media_layout_upsert` stops being a wholesale replace and becomes a diff (§9). This is a change to
  an RPC already live in production, and existing Layout ids survive it — only the delete-and-recreate
  behaviour goes away.
- `compositions` gains a `revision`; the snapshot gains `composition_revision`, `layout_updated_at`
  and a per-Zone `playlist_revision` (§11). `layouts` needs no new column.
- `UNIQUE (layout_id, position)` on `layout_zones` is dropped and recreated as
  `DEFERRABLE INITIALLY DEFERRED` (§9).
- **Three further RPCs already in production must learn about Compositions.** None of them mentions
  one today:
  - `media_playlist_delete` counts only `publications.playlist_id`. A saved Playlist bound to a
    Composition Zone passes that guard and then hits a raw foreign-key violation, which the route
    masks as a 500 because it does not carry the `Invalid input:` / `not found:` prefix the error
    passthrough matches on. It needs its own count over `composition_zones` raising
    `'Invalid input: playlist is used by % composition(s)'`.
  - `media_publication_duplicate` copies `playlist_id` by minting a fresh `pub:<uuid>` Playlist. For
    a `composition` Publication it must **share** `composition_id` instead — a Composition is
    reusable by design, and copying it would be both wrong and unreachable, since the duplicate would
    otherwise carry no content at all.
  - `media_publication_set_content` is gated on `publication_type` and must reject `'composition'`
    explicitly rather than falling through, since a Composition Publication's content does not live
    on the Publication.
- Tickets 01 and 02 are rewritten against this model. The Ticket 02 frontend work is largely
  recoverable: the implicit-Playlist mechanism (§3), the drift detection (§7), the clear-bindings
  confirmation (§8) and the wireframe Zone selector move to the Composition editor. Tickets 03–07 are
  unaffected in substance; 03's activation reader changes its source table.
