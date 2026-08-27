# Plan: Layout UI, measured against the mockups

> **Partly overtaken 2026-08-26.** Its geometry, validation and wireframe findings still hold, but its
> central verdict — that the mockup showing content inside a Layout is wrong — is now half right. The
> mockup was right that an operator wants to author content against a geometry; it was wrong about
> which entity holds it. That entity is the **Composition**
> (`docs/adr/0049-composition-layout-with-content.md`), and the screen it describes is the Composition
> editor, ticket 03. Zone `role` no longer exists; every mention of it below is stale. Percentages are
> now three decimal places (`docs/adr/0050-wide-layouts-across-monitors.md`).

Reviews the three FigJam mockups in this folder against `docs/adr/0044-multi-zone-layout.md`,
`docs/layouts/contract-v2-zones.md` and the two player audits, and states what release one can
actually ship.

- `Figjam - Media Workspace (1).png` — Layouts list
- `Figjam - Media Workspace.png` — Layout Editor, step 1 (geometry)
- `Figjam - Media Workspace (2).png` — Layout detail with content bound per Zone

**Verdict: buildable, but not as drawn.** The geometry editor is close to shippable. The list page
and the detail page each contain a feature the accepted design deliberately does not have — folders
in one, content-inside-Layout in the other — and roughly a third of the drawn controls have nothing
on the player that can render them. Cutting those, release one is a two-screen frontend slice with
one migration behind it.

## 1. Buildable as drawn

Frontend only, no contract change, no player change.

| Mockup | Element |
|---|---|
| Editor | Template rail, `+ เพิ่ม Zone`, aspect-ratio selector, grid toggle, zoom, undo/redo |
| Editor | Drag-to-resize split handle, percentage/px readout under the canvas |
| Editor | Zone properties: name, role, size, position — all four already in the ADR schema |
| Editor | Landscape/portrait toggle (orientation is already part of the fit rule) |
| Editor | Step 1 / step 2 wizard shell — matches the existing Publication wizard pattern |
| Detail | `Behavior` tab — play mode, repeat, start position. This is exactly ADR 0045 §2 playback-on-Zone |
| Detail | `Zone Overview` panel with px sizes derived from aspect ratio × percentage |
| Detail | `Split Zone`, grid presets, `Fit to Screen`, lock/hide/duplicate — editor-local geometry ops |
| List | `Zones` count, `Used In` count, `Last Modified`, Active/Inactive status, search, sort |

The template rail stays a frontend constant array, per ADR 0044's rejection of a `templates` table.

## 2. Contradicts a settled decision — cut, or reopen the ADR

### 2.1 Content bound inside the Layout editor (mockup 3) — the big one

The detail page has `Insert to Zone`, `Content Source: Playlist → Corporate Main`, a per-Zone
`Duration`, and a **`Publish`** button. ADR 0044's central decision is the opposite: a Layout carries
geometry and Zone roles **only**, and content is bound per Zone when an operator builds a
Publication, so Publication stays the single place that decides what plays where and when.

Publishing from the Layout editor also routes around Schedule, target selection, the geometry fit
rule and the priority-overlap block — every one of which lives on the Publication path.

**Decided (2026-08-25): keep the screen, change what it is** — recorded in ADR 0044 §1.

The wizard already has five steps — `Basic Info → Content → Channels → Schedule → Review & Publish`
(`src/features/media-workspace/publications/mock-data.ts`) — so this is **not** a new step. Step 2
(`Content`) gains a full-screen / Layout mode switch; in Layout mode the operator picks a Layout and
binds a source plus playback settings per Zone. `Save Layout` and `Publish` are removed and the
wizard footer owns navigation. The Layout editor keeps geometry and settings and never sees a
Playlist. Nothing in the visual design is wasted; it moves one route over.

Where the errors surface: the geometry fit rule needs a target set, which is step 3 (`Channels`), so
it cannot fire at step 2 — it appears at step 3 and again at step 5. The equal-priority overlap block
also needs the Schedule from step 4, so it is a step 5 check. **No capability warning at step 3 and
no capability block at step 5** — ADR 0054 defers device-capacity enforcement, so the wizard holds no
Device capability state of its own and offers no override.

### 2.2 Folders, tags and Trash on the list page (mockup 2)

**Superseded 2026-08-25 by `docs/adr/0046-content-folders.md`. Folders ship; tags and Trash do not.**

This section originally recommended shipping the list flat, on the grounds that no folder entity
existed for any media content type. That part is still true — no media table has one — but the
recommendation lost on the stronger argument: the folders drawn (`Lobby & Reception`, `Menu Boards`,
`Retail Stores`) are plainly cross-type, so a Layout-only folder would guarantee a migration and a
data move later. ADR 0046 builds them once, shared.

One factual correction to the original text: `public.asset_folders` **does** exist, with `name`,
`parent_id` and `assets.folder_id` (`057_column_comments.sql`). It belongs to Asset Intelligence —
its sibling `asset_tags` carries `qr_url` and `install_date` — and ADR 0046 §2 deliberately does not
reuse it.

What ADR 0046 changes here: folders are **flat** (no `parent_id` — the tree is where the cost is, and
every folder in the mockup is drawn at one level), untyped and shared across Assets, Playlists and
Layouts, with deletion **blocked** while a folder still holds anything. The sidebar is a shared
component in `src/components/`, wired to the Layouts page first and adopted by Playlists and Media
Library when those pages are next touched.

Still cut: the `Tags` tab (many-to-many, a separate decision) and `Trash`, which contradicts the
`active ↔ inactive` lifecycle Layouts and Playlists share. The list still reuses
`src/features/media-workspace/playlists/list-filtering.ts` and `list-url-state.ts` — the folder filter
composes with the search, status and sort filters and goes in the URL like they do.

### 2.3 `Z-Index` field on the Zone properties panel (mockup 1)

ADR 0044: Zones may not overlap and there is no stacking order; the contract lists `z` under
"deliberately not in this contract". A Z-Index input on screen tells the operator overlap is
supported, and the geometry validator will then reject what the input implied was legal.

**Recommendation: remove the field.** Overlap is a real feature request with a real cost (the player
must composite rather than tile) and belongs to a later ADR.

### 2.4 `Upload Layout`, `Save as Template`, `Category` (mockups 1 and 2)

- **Upload Layout** — no import format is defined. Aurora's `layoutDesign.json` is the obvious
  candidate, and ADR 0044 §13 already says Aurora video-wall customers cannot migrate in release
  one. An import button that refuses most real files is worse than no button.
- **Save as Template / Templates: 24** — this is the `templates` table the ADR rejected, re-entering
  through the UI. Starting compositions stay frontend constants.
- **Category (Corporate)** — a taxonomy field with no model behind it and no consumer.

**Recommendation: cut all three from release one.**

### 2.5 List columns that cannot exist for a content-free Layout

`Type: Mixed / Image / Video`, and the content thumbnails, both describe content — which a Layout
does not have. `Status: Scheduled` is a Publication status, not a Layout status. `Resolution
1920 × 1080` should be the declared aspect ratio, since a Layout stores `aspect_ratio` and never a
resolution. Two rows show 5 and 6 Zones, above the maximum of four.

**Decided 2026-08-25: the thumbnail is a geometry wireframe.** Drop `Type`; `Resolution` becomes
`Aspect ratio`; status is Active/Inactive only.

The wireframe is **inline SVG rendered from the Zone percentages at display time** — one `<svg>` with
a `viewBox` matching the aspect ratio and one `<rect>` per Zone, filled by role, over the Layout's
background colour. Nothing is generated, stored or invalidated: a Layout is at most four rectangles,
the list already loads them for the `Zones` count, and a thumbnail derived from the row can never
drift from the geometry it depicts.

Rejected: **generating and storing a PNG per Layout** — an image pipeline, a storage bucket, and a
regeneration path on every geometry edit, to depict four rectangles. The same component renders the
template rail in the editor and the read-only canvas in the wizard's Zone-binding step, so it is
written once and used in three places.

### 2.6 `Storage Usage — 128.6 GB of 500 GB` (mockup 2)

Layouts store no bytes. This is the Media Library's stat on the wrong page.

## 3. Blocked on the player, not on us

These are drawn as ordinary form controls but every one of them needs rendering work in **both**
players (`Ads_Manager_WindowApp-main`, WPF `MediaElement`; `Ads_Manager_AndroidApp-dev`,
`android.widget.VideoView`, `minSdk 24`, no ExoPlayer/media3). Read
`AUDIT_Player_Gaps_Priority.md` before promising any of them.

| Control | Why it is blocked |
|---|---|
| Per-Zone background: solid / **gradient** / **image** | ADR 0044 puts background colour on the **Layout**, for uncovered area only. Per-Zone gradients and image backgrounds are new render paths in both players |
| Border colour / style / width, `Radius (มุมโค้ง)` | Nothing in the contract carries them; rounded, stroked Zones are non-trivial on both stacks |
| `Fill Mode` | Media fit is stored intent that no player reads (ADR 0010). The dropdown would silently do nothing |
| `Mute` | Volume is stored intent, same as above (ADR 0031) |
| `Transition` per Zone | Transition exists per **item**, not per Zone |
| Text tool / image tool in the canvas toolbar | Authoring content inside a Layout — §2.1 again, and no player-side text renderer exists (the styled ticker is audit item **B2**, still unbuilt) |
| Weather / news / clock widgets, `Widgets` tab | "Widget or live-data Zones" are explicitly out of the contract. The weather panel in mockup 3 is a whole live-data subsystem |
| `Safe Margin 30 px` | Not in the model; would need a Layout-level column and player-side inset |

**Recommendation:** none of these ship in release one. Where a control is genuinely wanted soon,
`Fill Mode` and `Mute` are the cheapest — both already have a storage home and only need the player
to read them — and both belong to the player A1 work, not to Layout.

## 4. What release one actually is

Three screens, in this order, all behind ADR 0045 landing first.

**Screen 1 — Layouts list** (`src/app/(dashboard)/(application)/media-workspace/layouts`, feature folder
`src/features/media-workspace/layouts`)
Reuses the Playlist list wholesale — search, status filter, sort, URL state persistence, empty state
— plus the shared folder sidebar from ADR 0046, whose selection composes with those filters and lives
in the URL alongside them. Columns: wireframe thumbnail, name, aspect ratio, Zones, Used In, last modified,
status, row actions (edit / duplicate / archive). Stats row is optional and cheap — Total, Active,
Unused — computed, not stored.

**Screen 2 — Layout editor, step 1 (geometry)** — mockup 1 with §2.3 and §2.4 removed
Template rail as constants, canvas with drag-resize, aspect-ratio selector, orientation toggle, Zone
properties limited to name / role / position / size / note. Live validation on the ADR's own rules:
≤ 4 Zones, no overlap, `x + width ≤ 100`, `y + height ≤ 100`, at least one Zone.

**Screen 2b — step 2 (settings)** — Layout name, aspect ratio, background colour for uncovered area,
active/inactive. Small.

**Screen 3 — Publication wizard step 2 (`Content`), Layout mode** — mockup 3, re-homed per §2.1
Existing `ContentStep.tsx` gains a full-screen / Layout switch. In Layout mode: left rail =
media/playlist picker, canvas = read-only Layout geometry with click-to-select, right panel =
`Content` (source Playlist) + `Behavior` (play mode, repeat, start position). No `Publish` button.
`step-validation.ts` gains the rule that every Zone of the chosen Layout has a source bound. The
geometry fit check surfaces at step 3 and the overlap block at step 5. Device capacity is neither
warned about nor blocked on, per ADR 0054.

### Sequencing

```
ADR 0045 (snapshot materialization)  →  Layout migration  →  Screen 1 + 2  →  Screen 3  →  player A1
```

Screens 1 and 2 can ship and be used before the player renders anything: an operator can author
Layouts that no Publication uses yet. Screen 3 must not ship before the player can render Zones, or
it publishes payloads that play as a black screen.

## 5. Open decisions

1. ~~**§2.1 — is the Layout editor allowed to bind content and publish?**~~ Decided 2026-08-25: it
   is not; the screen becomes Layout mode inside wizard step 2. Recorded in ADR 0044 §1.
2. ~~**§2.2 — folders and tags**~~ Decided 2026-08-25: flat, shared, delete-blocked folders ship
   (`docs/adr/0046-content-folders.md`); tags do not.
3. ~~**Wireframe thumbnail vs no thumbnail**~~ Decided 2026-08-25: wireframe, rendered as inline
   SVG from the Zone percentages (§2.5).
4. ~~**Does step 2 need anything besides name / aspect ratio / background / status?**~~ Decided
   2026-08-25: no. Those four are the whole of step 2.

All open decisions on this plan are closed.
