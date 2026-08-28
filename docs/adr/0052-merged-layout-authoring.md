# Merged Layout authoring — one page for geometry and content

**Status:** accepted · 2026-08-26
**Extends:** `0049-composition-layout-with-content.md` §1, §2, §3, §5, §10
**Source:** `docs/layouts/Figjam - Media Workspace*.png` (three frames, reviewed 2026-08-26)

## Context

ADR 0049 split authoring across two entities and, in the frontend shipped by ticket 03, across two
pages: `/media-workspace/layouts` draws geometry, `/media-workspace/compositions` picks a Layout from
a dropdown and binds content to its Zones.

The UX mockups show a different shape, and reviewing them surfaced three facts that the ADR 0049
frontend does not satisfy.

**The mockup has one page, not two.** Its editor frame draws Zones and fills them with content on the
same canvas: an *Insert to Zone* panel on the left (Media / Playlists / Widgets), Zone rectangles
rendering their actual bound content, and a *Zone Properties* panel on the right with Content /
Layout / Behavior tabs.

**The mockup's vocabulary is the inverse of ours.** Its list page is titled *Layouts*, its rows carry
content thumbnails and a content-typed column (`Mixed` / `Image` / `Video`), and its summary counts
read `Total Layouts 89 = Templates 24 + Custom Layouts 65`. So the mockup's **Layout** is ADR 0049's
**Composition**, and the mockup's **Template** is ADR 0049's **Layout**. The entity boundary is in the
same place; only the words moved.

**Nothing reached the operator.** `Compositions` was never added to the sidebar
(`src/config/nav/media-workspace.tsx:31` lists `Layouts` and no sibling), so the page ticket 03
shipped is unreachable without typing the URL.

The mockup taken literally would also collapse Template and Layout into one table with a copy-on-use
relationship. That is ADR 0044's rejected model, and §2 below explains why it stays rejected.

## Decision

### 1. UI vocabulary is remapped; the contract is not

| Operator sees | Contract / schema |
|---|---|
| Layout | `media_core.compositions` |
| Template | `media_core.layouts` |
| Zone | `layout_zones` + `composition_zones` |
| Program / Publication | `publications` |

ADR 0049 §5 already licensed presentation language to differ from contract language. This decision
applies that licence in the opposite direction from the one §5 anticipated, and adds the missing
half: the mapping is written down in `CONTEXT.md` rather than left for each reader to infer.

Renaming the tables to match was rejected. `compositions` and its RPCs are applied to `develop`, the
API routes and the whole of ticket 03 are built on those names, and the rename buys no behaviour —
only a second migration of the same risk class as the one ticket 04 is already waiting on.

### 2. A Template is a shared reference, never a copy

Selecting a Template makes the Layout point at it (`compositions.layout_id`). It does not stamp a
private copy of its geometry.

This is the load-bearing decision of this ADR, and it is forced. The requirement ADR 0049:51–54
records — one menu-board geometry, different content per branch, confirmed live by the PO and
re-confirmed during this review — is only satisfied if a geometry fix reaches every branch that uses
it. Copy semantics would put one `layouts` row behind every branch and turn a single Zone adjustment
into an N-way manual edit, which is precisely the objection ADR 0049 was written to answer.

The mockup's *Save as Template* button reads like copy semantics, and its `Templates 24 + Custom 65 =
89` summary reads like one table. Both are presentation; neither survives contact with the
requirement. The entity split stays exactly where ADR 0049 §1 put it.

### 3. Editing shared geometry warns, and offers to fork

Merging the two pages creates a hazard the two-page design did not have: geometry now sits on the
same canvas as content that belongs to one Layout, so an operator dragging a Zone in *Menu Board —
Branch A* has no reason to suspect Branch B moved too.

Before the first geometry edit in a session, when the Template backs more than one Layout, the editor
interrupts:

> This Template is used by 5 Layouts. Changing the Zones affects all of them.
> **[Change all]** **[Make this Layout its own copy]**

*Make this Layout its own copy* creates a new `layouts` row with `kind = 'inline'` (§4), repoints
`composition_zones.layout_zone_id` at the copy's Zones, and leaves the shared Template untouched.
This cannot be composed from the existing RPCs and goes through one new transactional function — §8.

This is the component/instance model from Figma and Canva, which the operators for this product
already use. The alternatives were rejected: editing silently lies about the blast radius, and
sending the operator to a separate Template page to change a Zone is the two-page flow this ADR
exists to remove.

The usage count comes from `SELECT count(*) FROM media_core.compositions WHERE layout_id = $1`.

`aspect_ratio` and `background` live on `layouts` too, so they are covered by the same interruption.

### 4. `layouts.kind` separates a named Template from private geometry

```sql
ALTER TABLE media_core.layouts
  ADD COLUMN kind varchar NOT NULL DEFAULT 'template'
  CHECK (kind IN ('inline', 'template'));
```

- `template` — named by an operator, offered in the Template rail and the Templates list.
- `inline` — geometry private to one Layout, named `comp:<its own layout uuid>`, never offered.

An operator drawing a new Layout from scratch should not have to name and publish a Template first.
The implicit row created for them is the same mechanism ADR 0049 §3 and §13 already chose for
one-off *content* (`playlists.kind = 'inline'`, named `pub:<uuid>`, excluded from the operator's
Playlist list). This is that problem again with geometry in place of content, so it takes the same
answer rather than a new one — including the list-filtering code, which is copied from the Playlist
path.

*Save as Template* names the row and flips it to `template`.

**The mockup's `Total Layouts 89 = Templates 24 + Custom 65` counts Layouts, not geometry rows.** The
list shows `compositions` (§1), so all three cards count `compositions`, split by the `kind` of the
`layouts` row each one points at:

```sql
SELECT l.kind, count(*) FROM media_core.compositions c
JOIN media_core.layouts l ON l.id = c.layout_id
WHERE c.tenant_id = $1 GROUP BY l.kind;
```

Counting `layouts` rows instead would make the two halves sum to something other than the list's own
row count — one Template backing five Layouts is 1 there and 5 here. The cards describe the list
below them, so they follow the list.

**The flip goes through a new additive RPC, not through `media_layout_upsert`.**

```sql
media_layout_set_kind(p_tenant_id uuid, p_layout_id uuid, p_kind varchar)
```

`media_layout_upsert` takes ten arguments today
(`20260826110000_zone_identity_and_precision.sql:202`). Adding `p_kind` would change its signature,
which means dropping a live function by exact signature and recreating it — the R0 trap this series
has already walked twice. A default of `'template'` makes every existing row and every existing call
site correct with no change, and only the new merged-editor save path calls the new function, to flip
its implicit row to `'inline'`. The whole migration is then additive: one column, no signature
touched.

**`media_layout_set_kind` does the renaming too, and guards the invariant.** A row cannot be named
`comp:<its own uuid>` at creation — `media_layout_upsert` needs the name before it mints the id — so
the flip to `'inline'` renames it in the same transaction. The flip is also the second door onto §8's
invariant: flipping a Template that five Layouts already use would hand them a shared row that claims
to be private. So `template → inline` is refused unless the usage count is zero, with the row locked
`FOR UPDATE` first so a Composition cannot be created against it in the gap. `inline → template` is
always allowed; that is *Save as Template*, and it only ever widens who may point at the row.

**Known failure mode, accepted:** the implicit row is created by one call and flipped by a second. If
the flip fails, a `kind = 'template'` row named by the operator is left in the Templates list. It is
renameable and retirable like any other Template, and the alternative — a fourth RPC that creates
Composition and Layout together — buys atomicity for a two-call window at the cost of another
function that duplicates `media_composition_upsert`. Not worth it; the editor surfaces the failure
and the operator sees the row.

Rejected: deriving `kind` from usage count. A Template that nothing uses yet is still a Template.

### 5. Routes move; nothing is deleted

| URL | Serves |
|---|---|
| `/media-workspace/layouts` | the merged list — `compositions`, with content thumbnails |
| `/media-workspace/layouts/[id]` | the merged editor |
| `/media-workspace/layouts/create` | the merged editor, new |
| `/media-workspace/layouts/templates` | today's Layout list, filtered `kind = 'template'` |
| `/media-workspace/layouts/templates/[id]` | today's `LayoutEditorPage`, plus the Change-all banner |
| `/media-workspace/compositions/*` | redirect to the matching `/media-workspace/layouts/*` |

The sidebar gains one entry, `Layouts`, pointing at the merged list. `Compositions` is never added.

**The Templates page is Change-all mode, and says so.** §3's fork option exists because in the merged
editor the operator is looking at one Layout's content and has no reason to suspect the others moved.
On the Templates page there is no one Layout to fork *into* — the operator navigated to the shared
thing on purpose. So that page keeps saving straight through, but it is not allowed to stay silent:
it shows the usage count as a banner, and its save confirms *"This Template is used by N Layouts.
Changing the Zones affects all of them."* with `Change all` as the only way forward. That is the
smallest change that makes the guarantee above true at both doors.

`LayoutsListPage`, `LayoutsTable`, `LayoutsFilters` and `LayoutEditorPage` **move rather than being
deleted**. They become Template management, which is where a Template gets renamed or retired — a
capability that would otherwise disappear, since the merged editor only ever consumes Templates. The
banner and confirmation above are the only thing added to them; nothing is rewritten.

### 6. The editor does not publish

The mockup's editor carries a `Publish` button. It is not built.

Publication is the entity that owns schedule and target, and the merged editor has no field for
either; a `Publish` button there would either open the Publication wizard under a misleading name or
create an unscheduled Publication nobody asked for. The mockup's own sidebar keeps `Programs`,
`Now & Next` and `Calendar`, and its list page counts `Used in Programs 47`, so Publication survives
in the mockup too — the button is a shortcut, not a replacement.

The editor's actions are `Save draft`, `Activate` and `Save as Template`. `Activate` keeps ADR 0049
§10's rule that every Zone must be bound first, which the mockup's single `Save Layout` button has no
way to express.

### 7. What the mockup shows and this ADR does not take

| In the mockup | Decision |
|---|---|
| per-Zone **Role** (*บทบาท: เนื้อหาหลัก*) | **Refused.** ADR 0049 §2 dropped it as redundant with `name`; ticket 01 removed it from the schema and it is applied to production. Re-adding a field with no behaviour is a regression. |
| **Widgets** as a content source (weather, news) | Deferred to its own ADR. It is a third content source beside Playlist and Media, not a layout concern. |
| Folders, Category, Tags on Layouts | Out of scope. |
| Z-Index, border, radius, gradient and image backgrounds | Out of scope. Zones do not overlap (ADR 0044 §3), so Z-Index has nothing to order. |
| Safe margin, used-area % | Out of scope; both are derivable from `zones` when wanted. |
| Fill Mode, Mute per Zone | Deferred. Both need `composition_zones.playback` **and** a player that reads them; the player is a separate repo (ticket 13). Shipping the control first means a knob that changes nothing on screen. |
| Fit to Screen | Not built. `LayoutCanvas` is percentage-based inside a CSS `aspect-ratio` box and has no zoom, so the canvas is already fitted at all times. |
| drag & drop media into a Zone | Deferred. `ZoneContentPicker` already binds content by clicking. |
| undo / redo, lock, hide, ruler | Deferred to ticket 11. |

Three things from the mockup **are** taken, because they are what makes a merged page better than two
stacked panels:

- **Split Zone** — halves the selected Zone. It produces adjacent, non-overlapping, gap-free Zones by
  construction, which is stronger than drawing them and having `validateZones` reject the result.
- **Content thumbnails on the canvas** — each Zone renders the first asset of its bound Playlist.
  Without this the merged editor is two panels on one page rather than one picture of the screen.
  `CompositionEditorPage` already fetches these previews.
- **Zone Overview** — a table under the canvas: Zone, size, content source, bound/unbound. It replaces
  the current left-column Zone list and reads from data already loaded.

### 8. Forking geometry is one RPC, and `inline` is enforced, not described

§3's *Make this Layout its own copy* cannot be composed from the RPCs ADR 0049 shipped. Reviewed
against the applied migration:

- `media_composition_upsert` **refuses** to change `layout_id` while the Composition is `active`
  (`20260826120000_composition_schema_and_rpcs.sql:239`), which ADR 0049 §10 states as a rule, not an
  accident.
- On a draft it deletes every `composition_zones` row the moment `layout_id` changes, and
  `media_composition_set_zones` only accepts Zones belonging to the *current* Layout — so the
  bindings can only be restored by a second call, leaving a window where the Layout is unbound and a
  failed second call leaves it that way.

A fork is not what §10 was written to prevent. §10 forbids a Composition making *itself incomplete*;
a fork changes no geometry, drops no binding, and leaves the Layout exactly as complete as it was.
So forking is permitted on an `active` Composition, and the new function is the only write path that
may repoint an active Composition's `layout_id`:

```sql
media_composition_fork_layout(p_tenant_id uuid, p_composition_id uuid, p_expected_revision integer)
```

In one transaction: copy the current `layouts` row with `kind = 'inline'`, copy its `layout_zones`,
repoint this Composition's `composition_zones.layout_zone_id` at the copies by `position`, set
`layout_id`, bump `revision`. Returns the new `layout_id` and `revision`. Signature-additive — no
existing function is dropped or changed, so this stays R1 with ticket 14's column.

Rejected: composing it in the frontend from three HTTP calls. It cannot serve an `active`
Composition at all, and on a draft it puts compensation logic for a half-applied fork in the browser.

Rejected: a fourth RPC to create a Composition and its implicit Layout together. The dependency it
would solve is only a naming one — ticket 15 wanted `comp:<composition_uuid>` before the Composition
exists — and having `media_layout_set_kind` name the row after **its own** id removes it (§4). What
it would genuinely buy is closing the two-call window between creating that row and flipping it; §4
takes the visible junk Template instead, and says so.

**`inline` becomes an invariant.** Until now "geometry private to one Layout" was only §4's prose.
`duplicateComposition` reuses `source.layout_id` verbatim
(`compositions/services/compositions-api.ts:62`), so duplicating a Layout that owns inline geometry
silently gives it two owners — and §3's interruption would then fire on an `inline` row, which
nothing in this ADR contemplates. So:

- A write path may not point a second Composition at an `inline` Layout. Enforced server-side in
  `media_composition_upsert`; its body changes, its signature does not, so `CREATE OR REPLACE` is
  enough and no `DROP FUNCTION` is involved. `media_layout_set_kind` closes the same hole from the
  other side (§4).

That guard makes today's Duplicate impossible to keep. It is composed in the browser from a read plus
an upsert reusing `source.layout_id` (`compositions-api.ts:58`), which the guard now refuses whenever
the source owns inline geometry — and `media_composition_fork_layout` cannot stand in, because it
forks the Layout of a Composition that already exists rather than minting a second one. So Duplicate
becomes the third and last function:

```sql
media_composition_duplicate(p_tenant_id uuid, p_source_composition_id uuid, p_name varchar,
                            p_created_by uuid)
```

- Source's Layout is `template` → the copy **points at the same Template**. That is §2's whole point.
- Source's Layout is `inline` → the copy gets a **fork of that geometry**, by the same mechanism as
  above.
- **`composition_zones` are copied in both cases.** Bindings must not depend on which kind of geometry
  happens to sit underneath — that coupling is the actual defect in the shipped behaviour, which
  copies none. A duplicate that keeps nothing is `Create`, spelled longer; the operator who wants an
  empty one already has that button, and clearing a Zone is one click.

This supersedes the note at `compositions-api.ts:56` ("a fresh Composition starts unbound"). Nothing
in ADR 0049 §6 required an unbound duplicate — §6 permits an incomplete draft, it does not mandate
one — and no operator has used the button, since ticket 03's pages were never reachable.

## Consequences

- The two-page authoring flow ticket 03 shipped is replaced before it was ever reachable from the
  sidebar. No operator has used it, so there is nothing to migrate.
- `layouts` gains a column and the system gains three RPCs (`media_layout_set_kind`,
  `media_composition_fork_layout`, `media_composition_duplicate`), plus a body-only change to
  `media_composition_upsert`. No
  function signature changes, so this migration is additive and does not carry ticket 04's overload
  risk.
- `media_composition_fork_layout` is the one exception to ADR 0049 §10's "an active Composition
  cannot change its Layout" (§8). Any future write path that wants the same exception has to argue
  for it separately.
- Templates keep a management surface. Retiring one is still `status = 'inactive'`, unchanged.
- A Layout whose Template is shared can no longer have its geometry edited **from the merged editor**
  without an explicit choice. This is a new interruption in a flow that previously had none, and it is
  the price of putting geometry and content on one canvas. The Templates page is the other door onto
  the same geometry and it does not get the fork option — see §5.
- The mockup remains ahead of the build in seven named areas (§7). Each is a deliberate deferral with
  a reason, not an oversight, and none of them blocks the merged flow.

## Rejected alternatives

**Merge the entities — one table holding geometry and content.** The literal reading of the mockup,
and ADR 0044's rejected model. It breaks the confirmed per-branch reuse requirement (§2) and would
require unwinding tickets 02 and 03, whose migration is already applied to `develop`.

**Rename the tables to match the mockup.** Costs a migration of the same risk class as ticket 04's,
touches every API route and all of ticket 03, and changes no behaviour. A `CONTEXT.md` mapping does
the same work for free. Available later as an isolated ticket if the vocabulary gap proves expensive
to maintain.

**Keep two pages and add a *New Template* shortcut to the Composition editor.** The cheapest option
considered, and it was the recommendation before the mockups were read. It leaves the operator with
two lists and two nav entries for one authoring task, which is the thing the mockup is reacting to.
