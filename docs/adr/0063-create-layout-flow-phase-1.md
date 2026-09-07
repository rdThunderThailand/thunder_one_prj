# Creating a Layout — one picker, geometry settings in the editor

**Status:** accepted · 2026-09-05
**Amends:** `0052-merged-layout-authoring.md` §5, §6, §7
**Extends:** `0049-composition-layout-with-content.md`, `0044-multi-zone-layout.md` §7
**Source:** `docs/layouts/Phase1/*.png` (four frames, reviewed 2026-09-05)

## Context

ADR 0052 merged geometry and content onto one page and named the vocabulary shift: the mockup's
**Layout** is `media_core.compositions`, the mockup's **Template** is `media_core.layouts`. It said
nothing about how a Layout gets *created* — `/media-workspace/layouts/create` simply opens an empty
merged editor.

The Phase 1 frames answer that question, and in answering it they take back several things ADR 0052
§7 listed as out of scope or deferred. Rather than let each be re-litigated ticket by ticket, this
ADR decides them together; the amendment table in *Consequences* is the authoritative list of which
of §7's rows moved and which did not.

Reading the frames against the applied schema surfaced two facts that shape everything below.

**The Create modal sets Canvas Settings before a Template is chosen.** Resolution and background live
on the `layouts` row, which ADR 0052 §2 made a *shared reference* — five Layouts can point at one
Template. So "set my Layout's background" in that modal is either a silent edit of everybody's
geometry or an immediate fork, before the operator has drawn anything.

**The Template Picker needs catalogue data that does not exist.** It filters by orientation, zone
count and use case, groups by *Recommended / All / My Templates / Recently Used*, and shows a
description and *Best for* chips per template. `media_core.layouts` has `name`, `aspect_ratio`,
`background`, `status`, `kind` and nothing else, and today's seven starting geometries are frontend
constants (`src/features/media-workspace/layouts/templates.ts`) — a deliberate choice ADR 0044 §7
made when it rejected a `templates` table.

## Decision

### 1. Canvas Settings belong to the editor, not to creation

The Create modal does not collect resolution or background. Both stay where the geometry they
describe is edited: the *Layout Properties* panel in the merged editor, where ADR 0052 §3's
interruption already guards a shared Template.

This is safe to defer because `LayoutCanvas` is percentage-based inside a CSS `aspect-ratio` box:
changing resolution after Zones are drawn reshapes the box and leaves every Zone percentage
untouched. ADR 0050 already warns on an aspect-ratio change; that warning is the only thing this
move relies on.

Rejected: letting the modal set them and forking the geometry at creation. Every new Layout would
then own private geometry, which is ADR 0052 §2's rejected copy model reintroduced through the front
door.

Rejected: moving `background` onto `compositions` so it can differ per Layout while geometry stays
shared. It is defensible — a colour orders no Zones — but it splits one visual concept across two
tables for a want nobody has stated. One migration away if asked for.

### 2. Creation is one modal, and it does not write

`New Layout` opens a single modal: the Template Picker, with *Create from Scratch* inside it as the
blank path. There is no modal on top of a modal and no separate "choose how to start" step.

The Phase 1 frames show two stacked modals whose second one contains a `Create from Scratch` button
that returns to the first one's other option. That loop is the design defect; collapsing the two
removes it and removes the undefined `Don't show this again` checkbox with it — the frames never say
what the next `New Layout` click does once it is ticked.

**The modal collects no name.** It picks a starting point and opens the editor on it. The Layout is
named in the editor's title (inline rename) or its Properties panel, and a name is required at the
first save, not before. A name field in the modal would be the third place one Layout is named.

**The modal writes nothing.** It seeds client draft state; the first `Save` performs the whole
sequence at once. ADR 0052 §4 describes it as "two calls", which is wrong in both order and count —
a Composition cannot be created before the geometry it points at exists. The order, as
`CompositionEditorPage.tsx:410-437` already implements it, is:

**Blank, or a system preset (§3) — geometry does not exist yet: four core writes, plus 0..N inline
Playlist writes:**

1. `media_layout_upsert` — creates the `layouts` row from the drawn or preset Zones. It is
   `kind = 'template'` at this instant, because §4's naming rule needs the row's own id first.
2. `media_layout_set_kind(…, 'inline')` — flips it to private geometry and renames it
   `comp:<layout uuid>`.
3. `media_composition_upsert` — creates the Composition pointing at that `layout_id`.
3b. **For each Zone bound to picked assets rather than an existing Playlist:**
   `media_playlist_upsert` (`kind = 'inline'`) then `media_playlist_set_items`. A Zone bound to an
   existing Playlist, or bound to nothing, skips both. This is a loop, not a step — its length is
   the number of Zones the operator filled by picking assets.
4. `media_composition_set_zones` — writes the bindings, once every Playlist from 3b exists.

**An existing operator Template — geometry already exists: two core writes, plus the same 3b loop.**

1. `media_composition_upsert` with the Template's `layout_id`.
2. the 3b loop.
3. `media_composition_set_zones`.

**Partial-failure boundaries.** Every write above is its own transaction; there is no wrapper, and
one is not worth inventing for a browser-driven sequence.

- Blank 1 fails → nothing was written. Retry is clean.
- Blank 2 fails → a `kind = 'template'` row named by the operator is left in the Templates list. ADR
  0052 §4 named and accepted this; the editor surfaces it, and the row is renameable and retirable
  like any other Template. Retrying the save re-runs from step 1 and creates a *second* row, so the
  editor must hold the id from step 1 and **resume** at step 2 rather than restart.
- Blank 3 / Template 1 fails → geometry exists with no Composition. Retry resumes here.
- **3b fails partway → this is the one leak with no accepted answer yet, and it is the reason this
  section is longer than ADR 0052 §4's.** The Playlists created before the failure are
  `kind = 'inline'`, so they are filtered out of the operator's Playlist list, and step 4 never ran,
  so no `composition_zones` row references them. They are invisible from every screen. A naive retry
  makes more of them, because `CompositionEditorPage.tsx:435-461` collects results into a local
  `resolved` array and calls `setBindings(resolved)` only after the loop completes — a throw at Zone
  3 discards the ids earned for Zones 1 and 2 — and mints a fresh `crypto.randomUUID()` idempotency
  key each time, which deduplicates a retried HTTP request but not a re-clicked Save.

  So the invariant, which the editor must satisfy before this flow is called done:

  **A Zone's `playlistId` and its idempotency key are draft state, written the moment they exist and
  surviving a failed save.** The key is minted and stored *before* `media_playlist_upsert` is called,
  so a throw between the server committing and the browser hearing about it still resumes onto the
  same key. A Zone that already carries a `playlistId` skips creation entirely on the next attempt —
  the code already branches that way (`if (!playlistId)`); what is missing is that the id ever
  reaches state.

  This is a bug in the shipped save path, not a new requirement. It has not bitten anyone because
  ADR 0052 §5's pages were never reachable from the sidebar.

- Step 4 fails in either flow → the Composition exists and is unbound, which is a legal draft state
  (ADR 0049 §6). The Activate gate already refuses to publish it.

The window in which any of these is open is the reason creation does not write: it opens once, on an
explicit save, rather than every time somebody opens the picker and changes their mind.

Consequently the editor's header badge reads `Unsaved` until the first save and `Last saved HH:MM`
after it. The frames' `Saved just now` on a never-saved blank canvas is corrected, not implemented.

### 3. The picker has two sources, because it offers two different things

The picker's four groups are not four views of one collection:

| Group | Source | What choosing it does |
|---|---|---|
| Recommended | frontend constants, `layouts/templates.ts` | **copies** the geometry into a new private `inline` row (§2, blank flow) |
| My Templates | `layouts WHERE kind = 'template'` | **points at** the shared row (ADR 0052 §2) |
| All Templates | both, in that order | per source |
| Recently Used | `layouts WHERE kind = 'template'`, by `last_used_at` | points at the shared row |

A system preset is a **starting point**; an operator Template is a **shared reference**. Nobody wants
a fix to the *3 Zones – Header + 2 Bottom* preset to propagate into every Layout ever started from
it — that is precisely the propagation ADR 0052 §2 wants for a menu board and does not want here. So
copy-on-use for presets is the correct semantics, not a compromise, and two origins is honest rather
than a smell.

**This is also what the code already does.** The seven constants reach the editor through
`blankZones`, which mints private `inline` geometry on save. No behaviour changes.

Therefore **no catalogue columns and no seeding.** `description` and `use_cases` are fields on the
constant (`LayoutTemplate` gains them, and gains both orientations of each preset), so the picker's
description and *Best for* chips come from the same place the geometry does. An operator Template
shows its name, its wireframe, its zone count and its orientation — all derivable — and no
description; that is a smaller catalogue than the frames draw, and it costs nothing to carry.

Rejected: `description` / `use_cases` / `is_system` columns on `layouts` plus a lazy
`media_layout_seed_system_templates(tenant)` RPC. It buys one source instead of two and costs a
migration, an idempotent seeder, `UNIQUE (tenant_id, name)` collisions between a preset name and an
operator's own Template, and a silent-skip failure mode where the second orientation of a preset
never lands. The one source it buys is a source of two semantically different things.

Rejected earlier and still rejected: a `templates` table (ADR 0044 §7); global rows with
`tenant_id IS NULL` — tenant isolation lives inside the RPCs, not in RLS, so a null tenant is a hole
every Layout RPC would have to learn about, and `compositions.layout_id` would point across tenants.

**Accepted cost:** adding or editing a system preset is a frontend deploy, and presets cannot be
customised per tenant. An operator who wants a tenant-specific one starts from the nearest preset and
uses `Save as Template` (§7) — which is the intended path to a shared Template anyway.

#### `Recently Used` needs one derived field

`media_layouts_list` gains `last_used_at` per row:

```sql
(SELECT max(c.created_at) FROM media_core.compositions c WHERE c.layout_id = l.id)
```

Body-only change; the signature is untouched, so `CREATE OR REPLACE` keeps its grants. The
alternative — fetching the Composition library a second time and joining in the browser — pulls a
paginated, folder-and-trash-aware list to compute one ordering. Per tenant, not per user: a Template
somebody else on the team just used is as relevant as one you used yourself, and per-user would need
`created_by` plumbed through for no stated want.

**Filtering is client-side.** The picker fetches the tenant's Templates once and filters orientation,
zone count and use case in the browser — presets are already in memory — the way the Playlist tag
rail computes its counts (`20260903150000_playlist_tags.sql`).

**No stored preview images.** The picker draws each entry from its Zone percentages with
`LayoutWireframe`. The frames' photographic preview is a rendered screenshot — a file to produce,
store and invalidate whenever geometry changes — and it is not what an operator picks a geometry by.

### 4. Layouts get Folders and Tags — reverses §7

ADR 0052 §7 put *Folders, Category, Tags on Layouts* out of scope. Both list frames rely on a
Folders/Tags rail, so keeping them out makes the list page describe filters it does not have.

- **Folders already exist.** `20260829040259_nested_feature_folders_and_trash.sql` carries scope
  `'composition'` and `media_composition_move`. Nothing to build.
- **Tags do not.** `media_core.composition_tags` plus `media_composition_set_tags` are modelled on
  `20260903150000_playlist_tags.sql` line for line — same shared vocabulary (`media_core.tags`), same
  composite PK, same RLS-on-no-grants, same "list RPC gains a `tags` array" shape. It is a copy of a
  migration written nine days earlier, not a new design.

Neither is collected at creation (§2). An operator picking a starting geometry has no filing decision
to make yet; both live in the Properties panel.

`Category` stays out. Nothing distinguishes it from a Tag.

#### Amendment, 2026-09-06 — the Tags rail filters server-side

Ticket 29 was written telling the rail to compute per-tag counts and filter "client-side from the
rows, exactly as the Playlist rail does it". That instruction was wrong here, and this ADR did not
catch it.

`PlaylistsListPage` holds its whole list in memory, so its rail can count and filter in the browser.
`CompositionsListPage` does not: `media_compositions_library_list` is **server-paginated** and clamps
`p_page_size` to 100. Counting tags from the loaded page understates the collection, and filtering
client-side hides every match on the other pages. §3's "Filtering is client-side" sentence belongs to
the Template Picker, which fetches its whole list in one call; it was never a rule for §4's rails.

So the rail uses the pattern this page already uses for every other filter — a facet computed
server-side over the collection, paired with a filter parameter, exactly how
`facets.referenceResolutions` pairs with `p_reference_resolution`, and how `p_folder_id` already
works:

- `media_compositions_library_list` gains `p_tag_id uuid DEFAULT NULL` and
  `facets.tags` = `[{id, name, count}]`, counted over the `base` CTE — the same scope as `summary`
  and `referenceResolutions`, so selecting one tag leaves the other counts intact.
- Migration `20260906120000_composition_tag_filter_and_facet.sql`. Adding a parameter means
  `CREATE OR REPLACE` would build a second overload and make every existing 14-argument call
  ambiguous, so the old signature is dropped first and the REVOKE/GRANT pair re-applied.

Rejected: loading the whole Composition library into the browser to match the Playlist rail exactly.
With the page size capped at 100 that is a fetch loop on every list load, and it throws away the
server-side sort, filter and pagination this page was built on.

Rejected: counting and filtering over the current page only. Cheap, and wrong in a way an operator
would not be able to see — the counts simply read low.

### 5. The editor's toolbar — three taken, five still refused

ADR 0052 §7 deferred the whole toolbar. Taken now:

- **Undo / redo** — client-only, and the merged canvas is where an operator drags geometry with
  content already bound to it. §7 sent this to ticket 11; ticket 11 has not shipped and the cost of
  the feature is a state stack, not a contract.
- **Align / distribute** (the five-button group) — arithmetic on Zone percentages, no contract.
- **Duplicate Zone** — same.

Still refused, with §7's reasons unchanged:

- **Ruler, zoom, Fit to Screen** — the canvas is percentage-based inside an `aspect-ratio` box and is
  therefore fitted at all times. The frames' `80%` scales CSS and means nothing about the Layout.
- **Lock / hide** — no column to persist them and no meaning across a session.
- **Safe Margin** — a pixel value on a percentage model, resolved against `reference_resolution`,
  which is nullable for Layouts predating ADR 0050. It would read `N/A` for exactly the older Layouts
  most likely to want it. If it returns it returns as a percentage guide that constrains nothing.

### 6. Zone Properties shows what the player actually reads

The *Behavior* tab exposes `composition_zones.playback` as it already exists — `play_mode`,
`repeat`, `start_from` (ADR 0062). Duration is **read-only**, derived by `totalZoneDurationSeconds`;
the frames show it as an editable field on a Zone bound to a Playlist, where the number is the sum of
the Playlist's items and cannot be set at the Zone.

**Fill Mode and Mute stay out**, on ADR 0052 §7's reasoning, which the schema confirms: `media_fit`
exists on *Playlist* metadata, not per Zone, and `mute` exists nowhere. A per-Zone Fill Mode would
also silently override the Playlist's own. Both need the player, which is another repository.

**Transition stays per item**, where it is today.

**`Apply to All Zones` applies the Behavior tab only**, and the button says so. Unqualified, it reads
like it copies content.

### 7. The editor still does not publish — §6 refined, not reversed

ADR 0052 §6 refused the `Publish` button because the editor has no schedule and no target field. That
holds. The frames keep the button, so it is relabelled rather than deleted:

**`Use in Program →`** opens the Publication wizard with this Layout pre-filled. That is what the
button can honestly do, and ADR 0052 §6 already identified it as a shortcut rather than a
replacement.

`Save as Template` is built — `media_layout_set_kind` was designed for it in ADR 0052 §4.

`Import Layout` is not built. No format is specified, no source system is named, and nothing in the
schema receives it.

### 8. Saving is explicit, and Activate keeps its gate

`Save Layout` is a split button: the primary action saves and keeps the current status; the menu
offers `Save as draft` and `Save & Activate`. `Save & Activate` is disabled while any Zone is
unbound, and says how many are — ADR 0049 §10's rule, which the frames' single button cannot express.

**There is no autosave.** A geometry edit must be able to interrupt with ADR 0052 §3's fork choice
before it is written, and `compositions.revision` is an optimistic lock whose conflict has to surface
to a person. Silent periodic writes defeat both.

## Consequences

- The schema change is **one table and one function** — `media_core.composition_tags` and
  `media_composition_set_tags` (§4) — plus two body-only edits: `media_compositions_library_list`
  gains a `tags` array, `media_layouts_list` gains `last_used_at`. No column is added to `layouts`,
  no signature changes, no `DROP FUNCTION`. The whole migration is additive.
- `src/features/media-workspace/layouts/templates.ts` stays the source of truth for system presets
  and grows `description`, `use_cases` and a portrait variant of each preset.
- Adding a system preset becomes a frontend deploy (§3).

### Amendment table — ADR 0052 §6/§7

| ADR 0052 said | Now | Why |
|---|---|---|
| §7 Folders, Category, Tags on Layouts — *out of scope* | **reversed** for Folders and Tags | both list frames rely on the rail; folders already exist, tags copy `playlist_tags` (§4). Category stays rejected — nothing distinguishes it from a Tag |
| §7 undo/redo, lock, hide, ruler — *deferred to ticket 11* | **partly reversed**: undo/redo taken | client-only, and the merged canvas is where geometry is dragged with content bound. Lock, hide and ruler stay refused (§5) |
| §6 `Publish` — *not built* | **refined**, not reversed: `Use in Program →` | §6's reasoning stands; the button is relabelled to what it can honestly do, which §6 itself identified as a shortcut |
| §7 drag & drop media into a Zone — *deferred* | **still deferred** | `ZoneContentPicker` binds by clicking |
| §7 Widgets — *own ADR* | **still deferred** | see below |
| §7 Fill Mode, Mute per Zone — *deferred* | **still deferred** (§6) | needs the player, another repository |
| §7 Safe margin, used-area % — *out of scope* | **still refused** (§5) | pixels on a percentage model, against a nullable `reference_resolution` |
| §7 Fit to Screen — *not built* | **still not built** (§5) | the canvas is fitted at all times |
| §7 per-Zone Role — *refused* | **still refused** | dropped from the schema in `20260826110000` |
| §7 Z-Index, border, radius, gradient backgrounds | **still out of scope** | Zones do not overlap |
| §5 `/layouts/create` opens an empty editor | **superseded** by §2 | creation now starts from the picker |
| ADR 0044 §7 no `templates` table | **upheld** (§3) | presets stay constants; no catalogue table and no catalogue columns |
- **Widgets remain deferred.** The frames show *Clock, Text, Image, Weather, RSS Feed, Web Page* in
  two places and render two of them on the canvas, and the string `widget` does not appear anywhere in
  this repository. They are a third content source beside Playlist and Media, needing schema, a
  per-type configuration UI, a refresh policy and a renderer in the player repository. ADR 0052 §7
  sent them to their own ADR; nothing here changes that, and Phase 1 must not acquire them by
  accident, because doing so blocks the whole phase on another repository.

## Rejected alternatives

**Keep the two-modal flow from the frames.** The second modal's `Create from Scratch` returns to the
first modal's other branch; the loop is the flaw, and one picker with a blank tile removes it.

**Set Canvas Settings at creation and fork immediately.** Reintroduces copy semantics that ADR 0052
§2 rejected on a requirement confirmed twice by the PO.

**Making system presets real `layouts` rows** — whether through a `layout_templates` table (ADR 0044
§7 rejected it), catalogue columns plus a per-tenant seeder, or global rows on `tenant_id IS NULL`.
All three are answered in §3: one collection of two semantically different things, bought with a
migration the current behaviour does not need.
