# SESSIONLOG — ticket #28 checklist run (2026-09-06)

Ran `.docs/CHECKLIST-28-save-activate-2026-09-06.md` in the in-app browser against
`http://localhost:3000` with `CORE_API_URL=http://localhost:3001` (local Thunder_Core →
ThunderCore **develop** DB). User logged in as `piyapat@thunder.co.th`.

## Result summary

| Section | Verdict |
|---|---|
| A. Split button | **PASS** (A1–A7) |
| B. Geometry before first save | **PASS** (B1–B5) — minor: brief "Template Picker" flash on reopen before zones load |
| C. Recovery, fail at 3b | **PASS after defect-2 fix** — C1 ✅ · C2 ⚠️ (see note) · C3 ✅ (English "Network Error" on 1st, Thai fallback after) · C4 ✅ retry succeeds · C5 ✅ `zz-t28-crec2` = exactly **3** inline playlists (Left reused from failed attempt) |
| D. Recovery, fail at step 2 | **PASS after fix** — failed the `kind` flip, retried, `zz-t28-d` = **1** layouts row + 1 composition, no dupes |
| E. Save as Template / Use in Program / revision conflict | E1 ⚠️ PARTIAL · E2 ✅ · E3 ✅ · E4 ✅ · E5 ✅ |
| F. Cleanup | pending — test rows listed below, nothing deleted |

## Second run (after defect-2 fix)

- **C4/C5**: `zz-t28-crec2`, 3 KFC-bound zones, injected failure on 2nd `POST /media/playlists`
  → attempt 1 "Network Error", Left bound only. Retry → **success**, 3/3 bound. SQL:
  3 inline playlists (`zz-t28-crec2 · Left/Middle/Right`), Left `14:01:51` (attempt 1) reused,
  Middle/Right `14:02:09–10` (attempt 2). No duplicate.
- **D**: `zz-t28-d` start-from-scratch, injected failure on `PATCH /media/layouts/{id}/kind`
  → attempt 1 "Network Error". Retry → **success**. SQL: layout `29daedca` reused (name now
  `comp:29daedca…`, kind flipped inline), 1 composition `07417c0c` linked. **1 layouts row.**
- **E1** ⚠️: `Save as Template` on `zz-t28-b` redirects to `/media-workspace/layouts/templates`
  and a new template row appears, **but** it is named `comp:9af4e90a-…` (raw layout id, not
  `zz-t28-b`) and it is `zz-t28-b`'s own layout row flipped to `kind='template'` **in place**
  (the composition still points at it) rather than a separate template copy. Checklist E1
  expected a row named `zz-t28-b`.
- **E2** ✅ (verified in A phase): unsaved Layout → `Use in Program →` disabled, title
  "บันทึก Layout ก่อนนำไปใช้ใน Program".
- **E3** ✅: `Use in Program →` on saved `zz-t28-c` → `/media-workspace/publications/create?compositionId=5c7c319c…`,
  persisted draft has `publicationType: "composition"` + `compositionId` set, `step: 1`.
- **E4** ✅: two tabs on `zz-t28-c`; tab 1 rename+save (→ rev 4), tab 2 (stale rev 3) change+save
  → red banner **"Composition นี้ถูกแก้ไขจากที่อื่น กรุณาโหลดใหม่แล้วลองอีกครั้ง"**.
- **E5** ✅: Active composition → `▾` → `Save as draft` disabled, title
  **"Composition นี้เปิดใช้งานแล้ว ย้อนกลับเป็น Draft ไม่ได้"**.

## Defect 2 fix (applied this session)

Added the missing seam — `PersistInput.onCompositionCreated`, called right after
`upsertComposition` when `!input.compositionId`, wired `onCompositionCreated: setId` in
`CompositionEditorPage`. `tsc` clean. C4 + D now pass (see second run above).

- `src/features/media-workspace/compositions/save-composition.ts`
- `src/features/media-workspace/compositions/components/CompositionEditorPage.tsx`

## Defect 1 (fixed this session) — Template Picker seed lost on client-side navigation

`CompositionEditorPage` consumed the Template Picker seed inside a `useEffect` that Strict
Mode double-invokes. `takeCreateSeed()` is one-shot (removes the sessionStorage key), so:
run 1 read the seed but its `.then` bailed on `!alive` after cleanup; run 2 found the key
already gone. Net: `blankZones` never set → editor showed "Start from the Template Picker to
see Zones here" with **zero zones** after every `+ New Layout → Use this layout` / `Create
from Scratch`. Full page reload worked (different first-commit path), SPA nav did not.

Fix: consume the seed once via a lazy `useState` initializer and pass it into
`resolveCreateSeed(seed)`.

- `src/features/media-workspace/compositions/components/CompositionEditorPage.tsx` — `takeCreateSeed()` in `useState`, passed to `resolveCreateSeed`
- `src/features/media-workspace/compositions/load-composition-draft.ts` — `resolveCreateSeed(seed: CreateSeed | null)` takes the pre-consumed seed

Verified: SPA nav via preset and "Create from Scratch" both seed zones correctly now.
`tsc` clean on the changed files.

## Defect 2 (found, NOT fixed) — first-save recovery does not bank the `compositions` row id

Ticket #28's recovery banks the `layouts` row id (`onLayoutCreated`/`onLayoutSaved`) and the
inline-Playlist idempotency keys / ids (`onBindingsChanged`), but **`persistComposition`
never hands `upserted.composition_id` back to the draft**. `setId` runs only in
`applyResult`, i.e. on full success.

Repro (C1–C4): 3-zone Layout `zz-t28-crec`, 3 zones bound with picked assets, injected a
one-shot failure on the 2nd `POST /media/playlists` (XHR-level, equivalent to a brief
offline blip mid-loop).

- Attempt 1: `POST /media/layouts` 201 → `POST /media/compositions` 201 (`58c05162…`) →
  `POST /media/playlists` 201 (Left) → 2nd `POST /media/playlists` fails → banner
  **"Network Error"** (English — see note), editor stays, Zone Overview shows
  Left = *Bound · Media*, Middle/Right = *Unbound*. Layout + composition + Left's playlist
  are now persisted.
- Attempt 2 (failure cleared): retry re-sends `POST /media/compositions` with
  `compositionId: null` (layout id *was* correctly reused, no new layout row) →
  **400 `Invalid input: an inline Layout may belong to only one Composition`** because the
  layout is already owned by `58c05162…`. User sees Thai fallback *"บันทึก Composition
  ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"* and is stuck — every retry 400s.

Proposed fix (small, symmetric with the existing seams): add
`onCompositionCreated?: (id: string) => void` to `PersistInput`, call it right after
`upsertComposition`, wire `onCompositionCreated: setId` in `CompositionEditorPage`.

### Note — C3 error copy

First failure surfaced axios's raw **"Network Error"** (English). The intent of C3 ("Thai,
not a raw DB/Postgres error") is half-met: no DB internals leak, but the message isn't
localised. `classifyApiError` fallback should Thai-ify the no-response case.

### Note — C2 "unbound" badge

By design (`zone-bindings.ts` `isBound` = `Boolean(playlistId)`), a zone with picked assets
reads as **Unbound** in the Zone Overview until the first save mints its inline Playlist.
C2 expects all 3 zones to lose the unbound badge pre-save — that can't happen on the
picked-assets path. (A7 only passed because it used *Existing Playlist*, which has a
`playlistId` immediately.)

### Environment note

All 77 assets on page 1 of the picker are `approval_status: "draft"` and unselectable
("สื่อนี้ยังไม่ผ่านการอนุมัติ"). 15 approved assets exist (search "KFC", "sample", "Predator"…).

## Test rows created (develop DB `ftfmokgphewzyxzwjitv`) — for section F cleanup, nothing deleted yet

| composition | id | layout id | inline playlists | state |
|---|---|---|---|---|
| zz-t28-b | `dc63ddb3-76f1-4a9b-b303-44539debb442` | `9af4e90a-c399-4664-b126-ea1179ecac66` (now `kind='template'` after E1) | — | draft, 2 zones, geometry OK, 0 bound |
| zz-t28-czz-t28-c-tab1 (was `zz-t28-c`, renamed in E4) | `5c7c319c-f20e-4ec2-9a4a-60bd80f4cb82` | `371d336b-79b5-41b0-9bbb-21e84c80a1db` | `de804d44`, `cf409c9a`, `1026dc16` | draft, 3 zones, 3 bound, rev 4 |
| zz-t28-crec | `58c05162-ad8a-4972-96e8-18d0aaa88765` | `4b2e2a6f-ad46-4ba5-b1b1-42dffb1ab6f8` | `7adc9338` (Left only) | **pre-fix orphan** — rev 1, 0 bound, unrecoverable via UI |
| zz-t28-crec2 | `4f6a3397-eadb-4530-a2ad-0690056372b5` | `583dc8e2-cde6-4bfe-8286-1a6aa14d1b17` | `37d48571`, `f561604b`, `2724c93b` | draft, 3 zones, 3 bound (recovery test) |
| zz-t28-d | `07417c0c-6dc6-4cbb-adb9-4d3e522cc4d1` | `29daedca-63cf-4b44-94b7-e30d84b70edb` | — | draft, 1 zone, 0 bound (recovery test) |

`zz-t28-a` was never saved (only checked the split-menu enable states).

Also worth reviewing separately: **defect 1** and **defect 2** were pre-existing gaps
(seed handoff predates #28; the composition-id seam was simply missing from #28). The
`classifyApiError` "Network Error" localisation and the E1 template-name/in-place-flip
behaviour are smaller follow-ups.
