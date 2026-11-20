# 15 — One page authors geometry and content

**Decided by:** `docs/adr/0052-merged-layout-authoring.md` §1, §3, §5, §6, §7

**What to build:** the two-page authoring flow becomes one. `/media-workspace/layouts` lists Layouts
(contract: `compositions`) with content thumbnails; its editor draws Zones and fills them on the same
canvas. Today's geometry-only list and editor move to `/media-workspace/layouts/templates` and become
Template management. The sidebar gains its first working entry for any of this.

**Blocked by:** 14 — `layouts.kind`

**Status:** shipped, checklist not maintained — re-verified against the working tree 2026-08-28:
`/media-workspace/compositions/*` are redirect stubs to `/media-workspace/layouts/*`, the nav lists
`Layouts` and no `Compositions` (`src/config/nav/media-workspace.tsx:31`), and `TemplateRail.tsx`,
`LayoutCanvas.tsx`, `CompositionEditorPage.tsx` and the `layouts/templates/*` routes all exist. The
unticked boxes below were never ticked; treat the code, not the boxes, as the record. Tickets 19 and
20 build on this baseline.

**Frontend only. No migration, no RPC** — ticket 14 carries every backend change this needs,
including `media_composition_fork_layout` (ADR 0052 §8).

### Routes and navigation

- [ ] Sidebar gains one item, `Layouts` → `/media-workspace/layouts`. **`Compositions` is never added**
      (`src/config/nav/media-workspace.tsx`)
- [ ] `/media-workspace/layouts` and `/media-workspace/layouts/[id]` and `.../create` now serve the
      merged list and editor — today's `CompositionsListPage` / `CompositionEditorPage`, extended
- [ ] Today's `LayoutsListPage` / `LayoutEditorPage` **move** to
      `/media-workspace/layouts/templates` and `.../templates/[id]`. They are not rewritten and not
      deleted (ADR 0052 §5) — this is where a Template is renamed or retired
- [ ] **The Templates editor is Change-all mode and says so (ADR 0052 §5).** It shows the usage count
      from ticket 14's detail payload as a banner, and when that count is > 1 its save confirms
      *"This Template is used by N Layouts. Changing the Zones affects all of them."* with
      `Change all` as the only way forward — there is no Layout to fork into on this page. This is the
      one change to the moved page
- [ ] The Templates list passes `kind = 'template'` (ticket 14)
- [ ] `/media-workspace/compositions/*` redirects to the matching `/media-workspace/layouts/*`
- [ ] Every user-facing string says **Layout** for a Composition and **Template** for a Layout. The
      contract words stay in code and types (ADR 0052 §1)

### The merged editor

- [ ] The Layout dropdown is replaced by the Template rail: pick a Template, or start from a preset,
      or start blank. Picking a Template **references** it — never copies (ADR 0052 §2)
- [ ] Starting without a Template creates an implicit `layouts` row at save time, then flipped to
      `kind = 'inline'` via `setLayoutKind` in the same save handler. It is named
      `comp:<its own layout uuid>` by `media_layout_set_kind` itself — **not** the Composition's, which
      does not exist yet (ADR 0052 §4). If the flip call fails the row stays a named `template` and
      **is visible in the Templates list**; the editor must surface that failure rather than swallow
      it, and the operator retires the row like any other Template (ADR 0052 §4, accepted failure mode)
- [ ] `LayoutCanvas` and `ZoneContentPicker` sit on one page. Zone geometry is edited on the canvas;
      the selected Zone's content is bound beside it
- [ ] **Shared-geometry interruption (ADR 0052 §3):** before the first geometry edit of a session, if
      the Template's usage count is > 1, ask — *"This Template is used by N Layouts. Changing the Zones
      affects all of them."* — with **Change all** and **Make this Layout its own copy**
- [ ] *Make this Layout its own copy* is **one call to `media_composition_fork_layout`** (ticket 14) —
      never composed from upsert + set-zones, which cannot serve an `active` Composition and strands a
      draft unbound if the second call fails (ADR 0052 §8). It works while `active`
- [ ] **Split Zone** — halves the selected Zone, producing two adjacent gap-free Zones. Respects
      ADR 0044's four-Zone ceiling and reindexes `position` through the existing `reindex` helper
- [ ] Each Zone rectangle on the canvas renders the first asset of its bound Playlist.
      `CompositionEditorPage` already calls `fetchPreviewUrls`
- [ ] **Zone Overview** under the canvas — Zone, size, content source, bound/unbound. Replaces the
      current left-column Zone list
- [ ] The three summary cards count `compositions`, split by the `kind` of the Layout each points at
      (ADR 0052 §4) — so `Templates + Custom` equals the row count of the list below
- [ ] Actions are `Save draft`, `Activate`, `Save as Template`. **No `Publish` button** (ADR 0052 §6)
- [ ] *Save as Template* names the current implicit geometry and flips it to `kind = 'template'`
- [ ] `Activate` keeps ADR 0049 §10 — refused while any Zone is unbound, with the Zone names in the
      message
- [ ] The existing clear-bindings confirmation still fires when the Template is swapped (ADR 0049 §8)

### Explicitly not in this ticket

Role, Widgets, folders/category/tags, Z-Index, border, radius, gradient and image backgrounds, safe
margin, Fill Mode, Mute, Fit to Screen, drag-and-drop media, undo/redo, lock, hide, ruler.
ADR 0052 §7 records the reason for each. **Role is refused outright, not deferred** — ticket 01
removed it from production and it carries no behaviour.

### Verification

- [ ] `npx tsc --noEmit -p tsconfig.json` clean repo-wide
- [ ] The moved check files still pass with `node <file>.check.mts`
- [ ] A check file covers Split Zone's geometry: halving a Zone yields two Zones that
      `validateZones` accepts, with no gap and no overlap
- [ ] Browser: create a Layout from a Template, bind content to every Zone, activate it; edit a
      Template used by two Layouts and confirm the interruption appears and both branches follow;
      *Make this Layout its own copy* and confirm the other branch stops following; *Save as Template*
      and confirm the row appears in the Template rail. **Ask before the browser pass**
