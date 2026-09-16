# Plan — Create Layout flow (Phase 1)

**Decision record:** `docs/adr/0063-create-layout-flow-phase-1.md`
**Design source:** `docs/layouts/Phase1/*.png` — see `README.md` in this folder for what each frame governs
**Prior art:** ADR 0052 (merged editor), ADR 0049 (Layout/Composition split), ADR 0044 (geometry)

Ship order is **backend first**. Thunder_Core deploys from `develop` and the deployed frontend calls
the deployed backend, so a frontend PR merged ahead of its backend reaches production broken.

---

## 1. What the frames ask for, and what exists

| Frame asks for | Exists today | Gap |
|---|---|---|
| Create modal with name, folder, tags, resolution, background | — | Removed by ADR 0063 §1–§2, §4; nothing to build |
| Template Picker: search, orientation / zone-count / use-case filters, 4 groups, per-template description + *Best for* chips | 7 constants in `layouts/templates.ts` (`{key, name, zones}`) | the picker; constants gain `description`/`use_cases`/portrait variants; `last_used_at` in `media_layouts_list`. **No catalogue columns, no seeding** — ADR 0063 §3 |
| Template preview photograph | `LayoutWireframe` draws from Zone % | Not built (ADR 0063 §3) |
| Folders rail on the list | folder scope `'composition'` applied `20260829040259` | Frontend only |
| Tags rail on the list | nothing for Compositions; `playlist_tags` is the template | 1 table + 1 RPC + list RPC array |
| Merged editor with content in Zones | `CompositionEditorPage` (734 lines) | Panel and toolbar changes |
| Undo/redo, align, duplicate Zone | — | Client-side only |
| Ruler, zoom, Fit to Screen, lock, hide, Safe Margin | — | **Refused** — ADR 0063 §5 |
| Zone Behavior: play_mode / repeat / start_from | `composition_zones.playback` (ADR 0062) | Surface it |
| Zone Fill Mode, Mute, editable Duration | `media_fit` on *Playlist* metadata only | **Refused** — ADR 0063 §6 |
| `Publish` | — | Becomes `Use in Program →` (ADR 0063 §7) |
| `Save as Template` | `media_layout_set_kind` | Wire it up |
| `Import Layout` | — | **Not built** — no format, no source |
| Widgets (Clock, Text, Image, Weather, RSS, Web Page) | the string `widget` appears nowhere in this repo | **Deferred to its own ADR** — ADR 0052 §7, restated in ADR 0063 |

---

## 2. Backend — `Thunder_Core`, branch off `develop`

One migration file per ticket. Every new function needs the
`REVOKE ALL … FROM PUBLIC` / `GRANT EXECUTE … TO service_role` pair after `CREATE` — `CREATE
FUNCTION` grants `EXECUTE` to `PUBLIC` by default.

### BE-1 · `last_used_at` on `media_layouts_list`

One derived field per row, for the picker's *Recently Used* group:

```sql
(SELECT max(c.created_at) FROM media_core.compositions c WHERE c.layout_id = l.id) AS last_used_at
```

Body-only; the signature is untouched, so `CREATE OR REPLACE` keeps its grants — **no `DROP
FUNCTION`**. Per tenant, not per user (ADR 0063 §3).

Verify: create a Composition against a Template, confirm that Template's `last_used_at` moves and no
other row's does.

### BE-2 · Composition tags

Copy of `20260903150000_playlist_tags.sql` with `playlist` → `composition`:

1. `media_core.composition_tags (composition_id, tag_id, created_at)` — composite PK, cascade both
   ways, `ENABLE ROW LEVEL SECURITY`, `REVOKE ALL … FROM PUBLIC, anon, authenticated`.
2. `media_composition_set_tags(p_tenant_id uuid, p_composition_id uuid, p_tags text[])` — takes tag
   *names*, trims, drops blanks, dedupes case-insensitively, creates missing rows in the shared
   `media_core.tags` vocabulary. Standalone, so a tag is editable from a list row without loading a
   revision.
3. `media_compositions_library_list` gains a `tags` array per row — body-only change, signature
   untouched.

No backfill: nothing has ever written Composition tags.

Verify: set tags on a Composition, read them back through the library list, confirm the same word
typed under Playlist and under Layout resolves to one `tags` row.

### BE-3 · API route

`src/app/api/core/v1/media/compositions/[id]/tags/route.ts` — pass-through for
`media_composition_set_tags`, following `layouts/[id]/kind/route.ts`. Tenant comes from the session,
never from the body. BE-1 needs no route: `media_layouts_list` already has one.

---

## 3. Frontend — `thunder_one_prj`, branch off `dev`

### FE-1 · Template Picker modal

New component under `layouts/components/`. Replaces `TemplateRail.tsx` (49 lines) as the way a
starting geometry is chosen; the rail stays only if the editor still needs an in-place switcher.

- **Two sources** (ADR 0063 §3): system presets from `layouts/templates.ts`, operator Templates from
  `fetchLayouts("template")` — one fetch. Filters run **client-side** over the merged list —
  orientation from `aspect_ratio`, zone count from `zones.length`, use case from `use_cases`, plus
  free-text search over name and description. No new query parameters.
- Four groups: Recommended (presets), My Templates (fetched), All (both), Recently Used (fetched,
  ordered by `last_used_at` from BE-1). Only presets carry a description and *Best for* chips.
- **Picking a preset and picking a Template do different things** — a preset is copied into private
  geometry, a Template is pointed at. The card says which, so an operator knows whether a later edit
  travels.
- `Create from Scratch` is **inside this modal** — one modal, no modal on a modal (ADR 0063 §2).
- Details panel on the right: name, resolution, orientation, Zone arrangement, use-case chips,
  description, and a `LayoutWireframe` — **no photographic preview**.
- **No name field, and no write.** `Use This Template →` / `Create from Scratch` navigates to the
  editor with the choice in client state.

### FE-2 · Layout Properties panel absorbs creation

`CompositionEditorPage`'s right panel gains `Layout Name`, `Folder`, `Tags`, `Resolution`,
`Background`. Resolution and background continue to route through ADR 0052 §3's shared-Template
interruption. Header badge: `Unsaved` before the first save, `Last saved HH:MM` after.

`CompositionEditorPage` is already 734 lines against a 300-line ceiling — this ticket is where the
panel and the canvas separate into their own files, not a later cleanup.

### FE-3 · Canvas tools

Undo/redo (client-side state stack), the five align/distribute buttons (arithmetic on Zone
percentages), Duplicate Zone. Nothing else from the toolbar — ADR 0063 §5 lists what is refused and
why, so a later reader does not re-add a ruler.

### FE-4 · Zone Properties tabs

Content / Layout / Behavior. Behavior shows `play_mode`, `repeat`, `start_from` only; Duration is
read-only from `totalZoneDurationSeconds`. `Apply to All Zones` is labelled with its scope.

### FE-5 · Save, Activate, Save as Template, Use in Program

Split `Save Layout` button: primary saves at current status; menu has `Save as draft` and
`Save & Activate`, the latter disabled while any Zone is unbound and stating the count.
`Save as Template` calls `media_layout_set_kind`. `Use in Program →` opens the Publication wizard
pre-filled. No autosave.

**The first save is not one call.** ADR 0063 §2 gives both sequences and their partial-failure
boundaries; `CompositionEditorPage.tsx:410-461` already implements the blank one. Two recovery holes
to close, both pre-existing:

- **Layout id.** Keep the id from step 1 in state so a failure at step 2 resumes rather than
  restarting — a restart mints a second `layouts` row.
- **Inline Playlists (step 3b).** `resolved` is committed with `setBindings` only after the loop
  (`:461`), and the idempotency key is minted inside it (`:447`). A throw at Zone 3 therefore
  discards the Playlist ids earned for Zones 1 and 2, and the next Save creates fresh ones —
  `kind = 'inline'`, so invisible in the Playlist list, and unreferenced, because step 4 never ran.
  Write each Zone's key **before** its `media_playlist_upsert` and its `playlistId` **as soon as the
  call returns**, both into draft state. The `if (!playlistId)` branch then does the rest.

Verify this one deliberately: bind three Zones by picking assets, force a failure on the third
(offline, or a rejected request), re-save, and confirm `media_core.playlists WHERE kind = 'inline'`
gained three rows in total — not five.

### FE-6 · List page rails

Folders and Tags rails on the Layouts list, following `PlaylistsListPage`'s tag rail — per-tag counts
computed client-side from the rows.

---

## 4. Sequencing

```
BE-1 ─┐
      ├─► BE-3 ─► merge to develop, deploy ─┬─► FE-1 ─► FE-2 ─► FE-3 ─► FE-4 ─► FE-5
BE-2 ─┘                                     └─► FE-6
```

FE-1 also extends `layouts/templates.ts`: `LayoutTemplate` gains `description` and `use_cases`, and
each preset gains a portrait variant, so the picker's orientation filter has more than one value.
While in that file, **delete its opening comment** — it says `Save as Template` is out of release one
and offers `is_template` as the migration if that changes. Both are stale: ADR 0052 §4 shipped
`layouts.kind`, and ADR 0063 §7 builds the button.

FE work can begin against the deployed develop backend once BE-3 lands. Set `CORE_API_URL` and
restart the dev server, or the proxy keeps hitting the previously deployed build — check
`/api/proxy/__config`.

Two PRs, opened as **Draft** until verified through the browser at the layer an operator uses:
`Thunder_Core` → `develop`, `thunder_one_prj` → `dev`. Backend merges first.

---

## 5. Corrections to the frames

These are recorded so the build does not reproduce them:

- **`Saved just now` on a never-saved blank canvas.** Creation writes nothing (ADR 0063 §2) — the
  badge reads `Unsaved`.
- **`0 Zones` + `Draft` + empty required `Layout Name` on the same screen**, while the modal that
  preceded it marked the name required. Resolved by removing the name from the modal.
- **Background is `#0A0E14` in the modal, `#FFFFFF` in the blank editor, `#000000` in the editor with
  content.** The schema default is `#000000` and so is `DEFAULT_BACKGROUND`. One value, `#000000`.
- **Zone Overview lists Weather as source `Media`** while the canvas renders a weather widget. With
  Widgets deferred, that Zone's source is whatever is actually bound — Playlist or Media.
- **Duration `00:02:30` editable on a Playlist-bound Zone.** Derived, read-only (ADR 0063 §6).
- **Ruler Y axis reads `1880` and `080`.** Artefacts; the axis is not built anyway (ADR 0063 §5).
- **`Don't show this again` has no defined next behaviour.** Removed with the first modal.
- **Two stacked modals, the inner one offering the outer one's other branch.** One modal (ADR 0063 §2).
- **Template resolution shown in the picker vs resolution set in the modal.** Only the picker states
  it; Canvas Settings moved to the editor (ADR 0063 §1).
