# Plan — #199 follow-up: Layout Zone play mode in wizard How to Play

Decision: ADR 0083 item 6 (and its Rejected / Consequences additions). Branch `feat/199-layout-zone-play-mode`, based on `dev` (PR #202 merged 2026-10-01). Open as a Draft PR → `dev`.

## 0. Facts already confirmed — do not re-derive

- The working tree already holds **option A** (read-only Zone rows), uncommitted: `publications/content-info.ts` (`compositionZonePlayback`, `ZonePlayback` type), `publications/content-info.check.mts` (passing), `publications/components/HowToPlayPanel.tsx` (`CompositionHowTo` renders the rows via `usePublicationStagePreview`). Build on it; do not discard.
- Preview Zone `id` **is** `layout_zone_id` (`preview/composition-preview.ts` → `id: zone.layout_zone_id`).
- Zone playback lives on the Composition's Zone binding (`composition_zones.playback`); Core `activate` copies it into the snapshot, so it wins over the Zone Playlist's own playback. Writing it touches no Playlist.
- Write path (same as the Layout editor, `compositions/save-composition.ts:199`):
  - `fetchComposition(id)` → `CompositionDetail { revision, zones: CompositionZone[] }`.
  - `bindingsFromCompositionZones(detail.zones)` (`compositions/zone-bindings.ts:226`) → one `ZoneBindingDraft` per Zone with a `playlist_id`; a `null` playback hydrates to `{ ...DEFAULT_ZONE_PLAYBACK, muted: false }`, matching Core's COALESCE defaults.
  - `toSetZonesPayload(layoutZoneIds, bindings)` keeps bindings that pass `hasContent` (`source: "playlist"` + `playlistId` → true) and sends all five playback keys.
  - `setCompositionZones(id, payload, expectedRevision)` (`compositions/services/compositions-api.ts:119`) full-replaces every Zone; a stale `expected_revision` fails.
  - `isConflict(message)` (`lib/api/api-error.ts:51`) recognises the revision-conflict error.
- Core source read (repo, not the live function; Core checkout is on `feat/newest-job-readers-2`): `media_composition_set_zones` COALESCEs each key to `sequential` / `loop` / `first` / `fit` / `false`.
- `fetchAffectedPrograms("compositions", id)` exists (`ChangesKind = "playlists" | "compositions"`).
- `applyPlaybackPattern({ fetchCount, confirm, write })` (`publications/playback-pattern-apply.ts`) is generic; reuse as-is. Its check already covers saved / cancelled / count-failed / save-failed.
- `PlaylistPatternControl.tsx` holds the confirm `AlertDialog` and the "saved immediately" note for the Playlist; Task 2 extracts them so both controls share one.
- `ProgramStep` owns `playlistRevision` and passes `onPlaylistChanged` to `HowToPlayPanel` and `refreshKey` to the rail. `usePublicationStagePreview(assets, enabled, refreshKey)` reloads on `refreshKey`.
- Primitives: `ui/lovable/button`, `ui/lovable/alert-dialog`. Tokens only. Files ≤ 300 lines. Checks: `node <file>.check.mts`.

## Task 1 — Pure play-mode merge + check

File: `compositions/zone-bindings.ts` (+ its existing check if one exists, else `compositions/zone-play-modes.check.mts`)

- [ ] `export function withZonePlayModes(bindings: ZoneBindingDraft[], changes: Record<string, ZonePlayback["playMode"]>): ZoneBindingDraft[]` — returns bindings with `playback.playMode` replaced for the `layoutZoneId`s in `changes`; every other field and every other binding unchanged (same object identity not required).
- [ ] Check: a changed Zone gets the new mode and keeps repeat/startFrom/mediaFit/muted; an unchanged Zone is deep-equal to its input; a `changes` key with no binding is ignored.

## Task 2 — Shared confirm dialog + note

Files: new `publications/components/SharedWriteConfirm.tsx`; `PlaylistPatternControl.tsx`

- [ ] Move the `AlertDialog` and its `ask/settle` promise wiring into `SharedWriteConfirm` with props `{ subject: "Playlist" | "Layout"; count: number | null; onAnswer(confirmed: boolean) }` (open when `count !== null`). Body text = the current Playlist text with `{subject}` substituted.
- [ ] Export the note text as `sharedWriteNote(subject)` (or a tiny component) so both controls show the same sentence with "Playlist" / "Layout".
- [ ] `PlaylistPatternControl` uses both; behaviour unchanged (re-run its browser case 8 cancel path if cheap).

## Task 3 — Layout control

Files: new `publications/components/LayoutZonePlayModeControl.tsx`; `HowToPlayPanel.tsx`

- [ ] Props: `{ compositionId: string; zones: ZonePlayback[]; onLayoutChanged?: () => void }` (zones from `compositionZonePlayback`).
- [ ] `compositionZonePlayback` gains `hasContent: zone.items.length > 0`; add it to the `content-info.check.mts` assertions. Render each Zone row as option A does; rows with `hasContent` get a Sequential / Shuffle radio pair, locked while saving. A Zone with no content keeps "ยังไม่มีสื่อ" and no radios (its binding, if any, is still written unchanged).
- [ ] Local `changes: Record<string, PlayMode>` holding only Zones whose choice differs from the loaded mode. When non-empty: the shared note + **Apply** (disabled while saving).
- [ ] Apply: capture `id = compositionId` and `next = { ...changes }`, set saving, then `applyPlaybackPattern({ fetchCount: () => fetchAffectedPrograms("compositions", id).then((a) => a.programCount), confirm: <SharedWriteConfirm subject="Layout">, write: async () => { const detail = await fetchComposition(id); const bindings = withZonePlayModes(bindingsFromCompositionZones(detail.zones), next); await setCompositionZones(id, toSetZonesPayload(detail.zones.map((z) => z.layout_zone_id), bindings), detail.revision); } })`.
- [ ] Outcomes: `saved` → clear `changes`, call `onLayoutChanged()`; `cancelled` → nothing; `count-failed` → "ตรวจสอบ Program ที่ใช้ Layout นี้ไม่สำเร็จ — ยังไม่ได้บันทึก ลองอีกครั้ง"; `save-failed` → if the error is a conflict, "Layout ถูกแก้ไขจากที่อื่น — โหลดใหม่แล้วลองอีกครั้ง" and call `onLayoutChanged()` to reload; otherwise "บันทึกรูปแบบการเล่นไม่สำเร็จ — ลองอีกครั้ง". `applyPlaybackPattern` swallows the error, so either let `write` rethrow a tagged error or check conflict inside `write` and record it in a ref before rethrowing — keep the function's outcome union unchanged.
- [ ] `CompositionHowTo` renders the control instead of the bare rows; keep the "แก้ไขใน Layout editor ↗" link and the intro line.

## Task 4 — Refresh wiring

Files: `ProgramStep.tsx`, `HowToPlayPanel.tsx`

- [ ] Rename `playlistRevision` / `onPlaylistChanged` → `contentRevision` / `onContentChanged` (both controls use it).
- [ ] `HowToPlayPanel` takes `refreshKey` too and passes it to `CompositionHowTo`'s `usePublicationStagePreview(assets, true, refreshKey)`, so the rows show the saved modes after Apply; the rail already reloads.

## Gates

- `npx eslint src/features/media-workspace`, `npx tsc --noEmit -p .` = 0 errors, every `publications/*.check.mts` and the new/updated composition check pass.

## Browser verification — ask the owner first (CLAUDE.md §3)

localhost:3000 → develop DB. Writes only on a Layout the owner approves; no Program saved or published.

1. Layout draft (`zz-fe-c-layout-draft`, `4152229e…`, Composition "Test Layout 1"): How to Play lists Header / Main / Side with length, mode, repeat; bound Zones show the radios.
2. On an approved Composition used by **0** active/scheduled Programs: switch one Zone to Shuffle → note shows → Apply → no dialog, radios locked while saving, request order `affected-programs` → GET composition → PUT zones; the row and the rail reload; the other Zones' stored playback is unchanged (read the Composition before/after). Restore the original mode.
3. On a Composition with N > 0: Apply → dialog names N → **ยกเลิก** only; no PUT.
4. Conflict: change a mode, then save the same Layout once in the Layout editor in another tab, then Apply here → conflict message, no overwrite. (Only on the approved Composition.)
5. Playlist control still behaves as before (cancel path).

## Out of scope

- Editing repeat / start from / media fit / muted from the wizard.
- `PreviewStage` clipped overlay controls (separate issue, not yet filed).
