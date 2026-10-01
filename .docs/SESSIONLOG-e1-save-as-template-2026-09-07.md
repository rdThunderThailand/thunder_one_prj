# SESSIONLOG — E1 `Save as Template` naming (2026-09-07)

Follows `.docs/SESSIONLOG-ticket28-commit-2026-09-06.md`. Closes the E1 ⚠️ left open by the
ticket-#28 checklist run.

## Finding — E1 was half a false alarm

The previous session flagged two things and called both suspect. Only one is a defect.

**Not a defect: the in-place flip.** ADR 0052 §4 settles it —

> `inline → template` is always allowed; that is *Save as Template*, and it only ever widens
> who may point at the row.

`media_layout_set_kind`'s own body agrees: the usage-count guard exists only on the
`template → inline` direction. So the Composition keeping its `layout_id` after promotion is
the designed behaviour (component/instance model, ADR 0052 §2/§3). **No change made.**

**A real defect: the row is never named.** ADR 0052 §4's other half — "*Save as Template* names
the row and flips it to `template`" — was never built. The RPC renames in one direction only,
by design:

```sql
name = CASE WHEN p_kind = 'inline' THEN 'comp:' || id::text ELSE name END
```

so flipping to `template` keeps whatever name the row has, which for an inline row is always
`comp:<uuid>`. `CompositionEditorPage` called `setLayoutKind(layoutId, "template")` and nothing
else. Net: every operator Template made this way lands in the Templates list as
`comp:9af4e90a-c399-…`.

The ticket-#28 checklist line `- [x] Save as Template calls media_layout_set_kind and names the
row` was ticked on the first half only. It is genuinely true after this change.

## Decision — the name is asked for, not derived

`media_core.layouts` is `UNIQUE (tenant_id, name)` (confirmed against develop), so the name had
to come from somewhere deliberate. Two options were put to the user:

- **Derive from the Composition + `copyName()`** — ~6 lines, reuses the existing helper.
  Rejected: it names the shared thing after one instance of it, which is the confusion ADR 0052
  §2 spends its whole section preventing, and a collision would silently produce
  `"Menu Board (Copy)"` as the name of a Template that is not a copy of anything.
- **Ask the operator** ← chosen. ADR 0052 §4 defines `template` as geometry "named by an
  operator", and the promotion click is the moment they have decided it is shared.

ADR 0063 §2's "a name field would be the third place one Layout is named" argues against naming
at *creation*, not against naming at promotion — the Template is a different entity from the
Composition, so this is its first and only name.

## Changes

- **`layouts/services/layouts-api.ts`** — new `promoteLayoutToTemplate(layoutId, name)`:
  `fetchLayout` → `upsertLayout` (rename, Zone ids round-tripped) → `setLayoutKind('template')`.
  - Two calls because there is no rename-only endpoint: `PATCH /media/layouts/:id` reads a body
    **without** `zones` as a status change (`Thunder_Core/src/app/api/core/v1/media/layouts/[id]/route.ts:31`),
    so a name has to travel with the geometry.
  - **Rename before flip** is deliberate. A failure then leaves the row still `inline` and
    invisible, so a retry is clean; flip-first-then-fail leaves a `comp:<uuid>` row in the
    operator's Templates list, which is the bug being fixed.
  - Zone ids are round-tripped so `media_layout_upsert` updates the Zones in place. Confirmed
    from its `prosrc`: it deletes only zones absent from the incoming set, so sending all of
    them deletes nothing and `composition_zones.layout_zone_id` stays valid.
- **`compositions/components/SaveAsTemplateDialog.tsx`** (new, 59 lines) — collects the name,
  prefilled with the Composition's, with a client-side collision check against the Templates
  already in memory (`data.layouts` is loaded with `fetchLayouts()`, whose default is
  `kind="template"`). Writes nothing itself. Mounted only while open, so the prefill re-reads
  the current name on every open — reset by remounting, not by effect (precedent: `e877e4c`).
- **`compositions/components/CompositionEditorPage.tsx`** — `onSaveAsTemplate` opens the dialog;
  the dialog is **closed before** the save runs, so a failure reaches the header's error slot
  instead of being hidden behind the modal.

`media_layout_upsert` has no `kind` guard (checked its `prosrc`), so renaming a still-`inline`
row is accepted. Its unique violation raises `Already exists: a layout named "%"`, which
`classifyApiError`'s `isDuplicateName` already renders as
*ชื่อนี้ถูกใช้ไปแล้ว กรุณาตั้งชื่ออื่นแล้วลองใหม่* — so the case the client-side check cannot
see (a Template created by someone else since page load) still degrades to readable Thai.

## Verification

- `tsc --noEmit` → **clean** (whole project, not just changed files)
- `eslint` on the changed/added files → **clean**
- `node src/features/media-workspace/compositions/status-display.check.mts` → **pass**
- No backend change, no migration, nothing applied to any database.

### Browser — run by the user against localhost → develop, results in `CHECKLIST-E1-…-RESULT.md`

| Section | Verdict |
|---|---|
| A. Dialog (A1–A5) | **PASS** — button only on a saved Composition, prefill correct, remount re-reads a renamed Composition, Cancel writes nothing |
| B. Duplicate name (B2–B4) | **PASS** — an active Template's name disables the button with the red line; empty disables; a fresh name enables |
| C. Happy path (C1–C6) | **PASS** — **C3 is the fix**: the Templates row reads `zz-e1-tpl-3col`, not `comp:<uuid>`. Geometry matches (Main + Main 2, 50/50), the Composition reopens with its Zones, and `Save as Template` is gone afterwards |
| §F SQL | **PASS** — `zz-e1-tpl-3col \| kind=template \| used_by=1`. The leftover `comp:9af4e90a…` row is ticket 28's, not from this run |
| D. Binding round-trip | **deferred to round 2** — `zz-e1-a` had 0/2 Zones bound |
| E1. Error path (optional) | **PASS on behaviour, FAIL on copy** — failed cleanly, Thai text, banner in the error slot not hidden, no orphan row (rename-before-flip held). Wrong wording — see below |

### Round 2 — `CHECKLIST-E1-round2-2026-09-07.md`, both gaps closed

| Section | Verdict |
|---|---|
| D. Binding round-trip | **PASS** — `zz-e1-b`, 2 Zones both bound to Playlists, promoted to `zz-e1-tpl-bound`. `composition_zones` before and after are identical: `Main → 08082118-…beb6`, `Main 2 → 84d424b5-…e03d`, same `playlist_id`s, 2 rows. No `zone is used by composition(s)` error. D4 reopened with both Zones still *Bound*; D5 preview played both (Subway video / wildlife video). **The Zone-id round-trip is now observed, not just argued from `prosrc`.** |
| E. Corrected copy | **PASS** — collided against the inactive Template `I1 Test Layout`, which the client cannot see (`fetchLayouts()` omits inactive), so the button stayed enabled and the server rejected it: **`บันทึกไม่ได้ — มี Template ชื่อนี้อยู่แล้ว กรุณาตั้งชื่ออื่น`**. Banner in the header's error slot. No new `kind='template'` row — rename-before-flip held again |
| §F final state | `zz-e1-tpl-3col` and `zz-e1-tpl-bound` both `kind=template`, `used_by=1`. The leftover `comp:9af4e90a…` is ticket 28's |

**Everything in this session is now verified at the layer the operator uses.** No open
verification gaps.

## Follow-up found by E1 and fixed — the collision was blamed on the wrong entity

E1 surfaced `บันทึกไม่ได้ — มี Composition ชื่อนี้อยู่แล้ว` where the spec expected
`isDuplicateName`'s wording, and it said *Composition* for a collision that was really against a
Template.

Root cause, and it was introduced by this session's change. `useCompositionSave.run` routes on
the raw prefix:

```ts
message.startsWith("Invalid input:") || message.startsWith("Already")
  ? describeActivateError(message)          // ← never reaches classifyApiError
  : classifyApiError(err, fallback).message
```

`media_layout_upsert` raises `Already exists: a layout named "T25 Layout" exists`, which starts
with `Already`, so it went to `describeActivateError` → `describeSaveError` → the generic
`Already exists` branch, whose text names the Composition. `describeSaveError`'s own doc comment
scoped it to `media_composition_*` RPCs; `promoteLayoutToTemplate` put a *layouts* error through
it for the first time.

Fix: one branch in `describeSaveError`, before the generic one, keyed on the only discriminator
the two RPCs offer — `a layout named …` vs `a composition named …`:

```
บันทึกไม่ได้ — มี Template ชื่อนี้อยู่แล้ว กรุณาตั้งชื่ออื่น
```

*Template* rather than *Layout* because every `layouts` row an operator can name **is** a
Template — private geometry is named `comp:<uuid>` and cannot collide with anything typed.

This also covers a case that predates the promotion path: a **first save** names the `layouts`
row after the Composition (`save-composition.ts`, step 1), so an operator whose Composition name
matches an existing Template has always been told the wrong entity collided.

Assertions added to `status-display.check.mts` for both `describeSaveError` and
`describeActivateError`. Confirmed in the browser in round 2 (section E above).

## Known, not fixed

- **`CompositionEditorPage.tsx` is now 318 lines**, over the 300-line ceiling in CLAUDE.md §8.
  It was already 302 before this change (it shipped over-limit in `bd92370`). Left alone rather
  than folded in as scope creep; splitting it is a separate task the user has been offered.

## Open

- Not committed. Awaiting the user's word.
- Cleanup on develop spans three runs, nothing deleted, pending one combined list + explicit
  approval (R0):
  - ticket 28: 18 rows (`zz-t28-*` — 5 compositions, 9 inline playlists, 4 layouts)
  - E1 round 1: `zz-e1-a`, `zz-e1-e`, `zz-e1-tpl-3col`, `comp:dcc5c958…`
  - E1 round 2: `zz-e1-b`, `zz-e1-tpl-bound`, plus their inline Playlists
