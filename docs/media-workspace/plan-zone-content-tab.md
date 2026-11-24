# Plan — Zone Properties › Content tab shows the Zone's content

Status: implemented, unverified in browser (2026-09-22; decided via grilling, no ADR — UI only, data model unchanged)
Branch: `style/lovable` (stacked on `style/media-workspace-tokens`) → `dev`

## Why

The Composition editor lets an operator *add* content to a Zone (Insert to Zone column) but
nowhere shows what a Zone already holds. Removing one item, reordering, or unbinding a
Playlist is impossible without clearing everything. Clicking a Media item while a Playlist is
bound silently drops the Playlist (`appendPickedAssets` nulls `playlistId`).

The binding model already carries everything needed (`assetItems[].duration_seconds`,
`transition`, `playlistName`) and `save-composition.ts` persists per-item duration, so this is
UI only.

## Decisions (all recommended answers accepted)

| # | Decision |
|---|---|
| Q1 | Assets Zone: editable list — thumb, name, kind, duration; remove, move ↑↓, edit image seconds |
| Q2 | Transition (cut/fade) stays hidden, default `cut` — separate ticket |
| Q3 | Playlist Zone: name + `item_count` + total duration + "Open playlist" (new tab); no item fetch |
| Q4 | "Remove content" button, no confirm (draft-level; Save / unsaved-leave guard is the real gate) |
| Q5 | Clicking Media while a Playlist is bound → `window.confirm` before replacing |
| Q6 | Section order: content list → playback settings → Apply to all Zones; Duration moves under the list |
| Q7 | Unbound Zone: dashed "No content — pick from Insert to Zone"; playback settings stay visible |
| Q8 | New `ZoneContentList.tsx` on Lovable primitives; delete dead `ZoneContentPicker.tsx` |

Defaults taken without asking: image duration min 1s; video duration read-only; Remove keeps
`playback`; orphaned inline Playlists after clear+rebind are pre-existing backend debt, not fixed here.

## Tasks

1. `compositions/components/ZoneContentList.tsx` (new, ≤ 150 lines)
   - Props: `binding`, `assets`, `previews`, `playlistDurations`, `playlists` (for `item_count`), `onBindingChange`
   - Assets branch: one row per `assetItems[]` — `MediaThumb` h-8 w-12, label, `Video · 12s` / `Image · [10] s` input, ↑ ↓ ✕ icon buttons; uses `reorderAssetItem` from `zone-bindings.ts`
   - Playlist branch: card with name, `N items · M:SS`, "Open playlist ↗" (`/media-workspace/playlists/{id}`, `target=_blank noopener`)
   - Empty branch: dashed box text
   - Footer row: `Duration` … `Ns` (moved from `ZonePropertiesPanel`) + `Remove content` ghost/destructive button (hidden when empty)
2. `ZonePropertiesPanel.tsx`: render `ZoneContentList` first inside the Content tab, drop the inline Duration row, pass through the new props. Keep under 300 lines.
3. `CompositionEditorPage.tsx`: pass `previews`/`playlists` to the panel (already in `data`).
4. `CompositionContentBrowser.tsx`: in the asset `onClick`, `if (binding.source === "playlist" && binding.playlistId && !window.confirm(...)) return;`
5. Delete `ZoneContentPicker.tsx` (only self-referenced).
6. `tsc` on touched files, `eslint` on touched files.

## Verify (browser, ask before each point — CLAUDE.md §3)

- Open a Composition with a Media-bound Zone: list shows items in saved order with durations
- Change an image's seconds → Duration total updates; Save → reopen → persisted
- ↑/↓ reorder → Save → reopen → order persisted
- ✕ on one item → list shrinks; ✕ on the last → empty state, Zone Overview says Unbound
- Playlist-bound Zone: name, count, duration, Open playlist opens a new tab
- Click a Media item while Playlist bound → confirm appears; Cancel keeps the Playlist
- Remove content on a Playlist Zone → empty state; playback settings unchanged
- Unbound Zone: empty state visible, settings visible, Apply to all still works
