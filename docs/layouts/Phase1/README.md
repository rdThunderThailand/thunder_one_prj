# Layouts — Phase 1 design source

Which frame governs which decision, and which document decides it. A frame is **not** a
specification: where a frame and an ADR disagree, the ADR wins and says why.

## The frames

| File | Governs | Read alongside | Not taken |
|---|---|---|---|
| `Create Modal.png` | that creating a Layout starts from a chosen geometry | ADR 0063 §1, §2 | the modal itself — name, folder, tags, resolution and background all moved out; one picker replaces the two stacked modals |
| `Template Picker.png` | the picker: groups, filters, details panel | ADR 0063 §3 | the photographic preview (a wireframe is drawn from Zone percentages instead); system presets stay frontend constants — no catalogue table and no seeding (ADR 0063 §3) |
| `Layout Editor.png` | the blank merged editor: panel layout, toolbar, empty state | ADR 0063 §2, §5 | ruler, zoom, Fit to Screen, lock, hide, Safe Margin; `Saved just now`; `Publish` |
| `Layout Editor With Content.png` | content bound inside Zones on the same canvas; Zone Properties tabs; Zone Overview | ADR 0063 §6, §7 · ADR 0052 §7 | Widgets; Fill Mode; Mute; editable Duration; `Import Layout` |

## The documents

| Document | Decides |
|---|---|
| `tickets/README.md` (this folder) | the board: 9 tickets, what blocks what, what runs in parallel |
| `plan-create-layout-flow.md` (this folder) | the build: BE/FE tickets, sequencing, corrections to the frames |
| `docs/adr/0063-create-layout-flow-phase-1.md` | creation flow, Template catalogue, Layout tags, which toolbar tools ship |
| `docs/adr/0052-merged-layout-authoring.md` | one page for geometry and content; **Layout = `compositions`, Template = `layouts`**; Template is a shared reference, never a copy; the fork interruption |
| `docs/adr/0049-composition-layout-with-content.md` | the entity split, per-Zone binding, the Activate gate |
| `docs/adr/0044-multi-zone-layout.md` | Zones as non-overlapping percentages; why there is no `templates` table |
| `docs/adr/0050-wide-layouts-across-monitors.md` | `reference_resolution`, nullable for older Layouts |
| `docs/adr/0056-nested-feature-folders-and-trash.md` | folder scope `'composition'` |
| `docs/adr/0062-the-preview-plays-what-the-playlist-says.md` | per-Zone `play_mode` / `repeat` / `start_from` — what the Behavior tab shows |
| `../Phase0/` | the earlier Figjam frames ADR 0052 was written against, plus the zone contract and player integration guide |

## Vocabulary

The frames and the schema use opposite words. ADR 0052 §1 fixed the mapping; `CONTEXT.md` carries it.

| Operator sees | Schema | Code |
|---|---|---|
| Layout | `media_core.compositions` | `features/media-workspace/compositions/` |
| Template | `media_core.layouts` | `features/media-workspace/layouts/` |
| Zone | `layout_zones` + `composition_zones` | both |
| Program | `publications` | `features/media-workspace/publications/` |

Routes follow the operator's words, not the schema's: `/media-workspace/layouts` is the Layout list
(Compositions), `/media-workspace/layouts/templates` is Template management (Layouts).

## Deferred, on purpose

**Widgets** — Clock, Text, Image, Weather, RSS Feed, Web Page appear in both editor frames and two of
them are rendered on the canvas. The string `widget` appears nowhere in this repository. They are a
third content source beside Playlist and Media and need their own ADR, a schema, a per-type
configuration UI, a refresh policy, and a renderer in the player repository. Do not let Phase 1
acquire them — it would move the phase's completion into another repo.
