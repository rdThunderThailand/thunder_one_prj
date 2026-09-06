# 28 — Save, Activate, Save as Template, Use in Program — and first-save recovery

**Issue:** https://github.com/rdThunderThailand/thunder_one_prj/issues/58
**Repo:** `thunder_one_prj`
**Decided by:** `docs/adr/0063-create-layout-flow-phase-1.md` §2, §7, §8
**Plan:** `docs/layouts/Phase1/plan-create-layout-flow.md` FE-5
**Design:** `docs/layouts/Phase1/Layout Editor.png` (header)
**Blocked by:** 25 (the file split)
**Status:** verified (localhost → develop DB)

**This is the riskiest ticket in the phase.** It closes two recovery holes in the shipped save path.

## Context — ADR 0063 §8

> `Save Layout` is a split button: the primary action saves and keeps the current status; the menu
> offers `Save as draft` and `Save & Activate`. `Save & Activate` is disabled while any Zone is
> unbound, and says how many are — ADR 0049 §10's rule, which the frames' single button cannot express.
>
> **There is no autosave.** A geometry edit must be able to interrupt with ADR 0052 §3's fork choice
> before it is written, and `compositions.revision` is an optimistic lock whose conflict has to surface
> to a person.

## Context — ADR 0063 §7

> ADR 0052 §6 refused the `Publish` button because the editor has no schedule and no target field.
> That holds. The frames keep the button, so it is relabelled rather than deleted: **`Use in Program
> →`** opens the Publication wizard with this Layout pre-filled.
>
> `Save as Template` is built — `media_layout_set_kind` was designed for it in ADR 0052 §4.
> `Import Layout` is not built. No format is specified, no source system is named.

## Context — ADR 0063 §2 (the write sequence)

> **Blank, or a system preset — four core writes, plus 0..N inline Playlist writes:**
>
> 1. `media_layout_upsert` · 2. `media_layout_set_kind(…, 'inline')` · 3. `media_composition_upsert`
> · **3b.** per Zone bound to picked assets: `media_playlist_upsert` then `media_playlist_set_items`
> · 4. `media_composition_set_zones`
>
> **An existing operator Template — two core writes, plus the same 3b loop.**
>
> - Blank 2 fails → a `kind = 'template'` row named by the operator is left in the Templates list.
>   Retrying re-runs from step 1 and creates a *second* row, so the editor must hold the id from step 1
>   and **resume** at step 2 rather than restart.
> - 3b fails partway → the Playlists created before the failure are `kind = 'inline'`, so they are
>   filtered out of the operator's Playlist list, and step 4 never ran, so no `composition_zones` row
>   references them. They are invisible from every screen. A naive retry makes more of them, because
>   `CompositionEditorPage.tsx:435-461` collects results into a local `resolved` array and calls
>   `setBindings(resolved)` only after the loop completes, and mints a fresh `crypto.randomUUID()`
>   idempotency key each time, which deduplicates a retried HTTP request but not a re-clicked Save.
>
>   **A Zone's `playlistId` and its idempotency key are draft state, written the moment they exist and
>   surviving a failed save.** The key is minted and stored *before* `media_playlist_upsert` is called.
>   A Zone that already carries a `playlistId` skips creation entirely on the next attempt.
>
>   This is a bug in the shipped save path, not a new requirement.

## Checklist

- [x] `Save Layout` split button: primary saves at the current status; menu has `Save as draft` and
      `Save & Activate`
- [x] `Save & Activate` is disabled while any Zone is unbound, and states how many
- [x] **No autosave**, and no timer that writes
- [x] Step 1's `layout_id` is held in state; a failure at step 2 resumes at step 2
- [x] Each Zone's idempotency key is minted and stored in draft state **before**
      `media_playlist_upsert` is called
- [x] Each Zone's `playlistId` is stored **as soon as the call returns**, not after the loop
- [x] The existing `if (!playlistId)` branch then makes a retry a no-op for Zones that already
      succeeded — verify it, do not rewrite it
- [x] Draft state kept in `localStorage` must have its **key version bumped** if its shape changes;
      an old draft that rehydrates into the new shape crashes (`CLAUDE.md` §6) — **N/A**: the
      editor's draft is React state only. The one persisted thing (`layouts/create-seed.ts`,
      sessionStorage) carries `LayoutZone[]` / a layout id, neither of which changed shape.
- [x] `Save as Template` calls `media_layout_set_kind` and names the row
- [x] `Use in Program →` opens the Publication wizard pre-filled. **Not** labelled `Publish`
- [x] No `Import Layout` button
- [x] A `revision` conflict surfaces to the operator as a readable message, not a raw DB error

## Verification

Ran against develop (`ftfmokgphewzyxzwjitv`) via `CORE_API_URL=http://localhost:3001`, two
sessions: the recovery/activate cases 2026-09-06, `Save as Template` naming 2026-09-07 (the
in-place `inline → template` flip was correct by ADR 0052 §4 — the real defect was that the row
was never named; fixed in `promoteLayoutToTemplate`, commit `c0e7773`).

- [x] **The recovery case, deliberately:** three Zones bound, failure forced on `POST /media/playlists`
      attempt 2 → `zz-t28-crec2` had **exactly 3** `kind='inline'` playlists, the first-attempt
      "Left" reused, not re-minted (2026-09-06)
- [x] Failure forced at step 2 (`PATCH /media/layouts/{id}/kind`), re-saved → `zz-t28-d` gained
      **one** `layouts` row + one composition, no dupes (2026-09-06)
- [x] `Save & Activate` disabled with an unbound Zone and states the count; binding enables it
      (2026-09-06)
- [x] `Save as Template` on a bound Composition → Templates list row named `zz-e1-tpl-3col` /
      `zz-e1-tpl-bound`, **not** `comp:<uuid>`; `composition_zones` `layout_zone_id` round-tripped,
      no Zones silently unbound (2026-09-07)
- [x] `revision` conflict surfaces as a readable message (E4, 2026-09-06)
- [x] Every scratch row deleted — 55 rows across 6 tables, one transaction, 2026-09-07
