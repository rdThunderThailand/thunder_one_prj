# SESSIONLOG — Layout editor UI/UX rework: browser verification + 2 fixes (2026-09-07)

Branch: `feat/layoutV2` · Env: `CORE_API_URL=http://localhost:3001` (local Thunder_Core → **develop** DB `ftfmokgphewzyxzwjitv`)
Scope: run `.docs/CHECKLIST-layout-uiux-2026-09-07.md` in a real browser, then fix the two bugs it surfaced.

---

## 1. What was verified (browser, in-app pane)

Full PASS/FAIL table is in the checklist reply. Summary:

| Section | Result |
|---|---|
| A. New Layout start step | A1–A5 PASS (A3 save was blocked by BUG-1, now fixed) |
| B. Template Picker | B1–B3 PASS · B4 not run (no tenant template with zones at the time) · B5 only testable post-save |
| C. Editor 3-column + Zone Overview | C1, C3–C8 PASS · C2 = manual Zone/Layout toggle, defaults to **Zone** not Layout |
| D. Header | D1–D5, D7–D10 PASS · **D6 was FAIL (BUG-1), now fixed** |
| E. Save as Template = copy | E1–E3, E5–E7 PASS · **E4 was FAIL (BUG-2), now fixed** |
| F. Regression | F1–F3, F5 PASS · F4 undo/redo not conclusively tested (needs real mouse drag) · F6 = only the two bug-related network errors |

### §E SQL result (project `ftfmokgphewzyxzwjitv`)

Source composition was named `zz-ux-blank` (not `zz-ux-src`). Confirmed the new "copy not promote" behaviour:

| kind | name | note |
|---|---|---|
| composition | `zz-ux-blank` (`a3c93503-6b0f-4b73-b6ff-557943e09eb2`) | draft |
| layout `inline` | `comp:6da79498-…` (`6da79498-43f2-43b3-a6fb-b7d493b1e00e`) | source's own geometry — **NOT promoted to template** ✅ |
| layout `template` | `zz-ux-tpl-1` (`8b13eb3f-…`) | created by Save as Template |
| layout `template` | `zz-ux-tpl-2` (`d4b4b46f-…`) | created again — repeatable ✅ |

→ Save as Template creates a brand-new `kind=template` row; the source's inline layout is untouched. ADR 0052 §4 amendment behaviour is correct.

---

## 2. BUG-1 — every composition save aborted on `PUT /media/compositions/:id/tags` → 404

### Root cause — CORRECTED 2026-09-08

The first diagnosis in this log said the backend route did not exist. **That was wrong**, and the
sections below are kept only as the record of what was believed at the time.

- `save-composition.ts` calls `setCompositionTags` whenever `tags !== undefined` — i.e. on **every**
  save of a layout loaded into the editor, and any create-with-tags. It hits
  `PUT /media/compositions/:id/tags` (`compositions-api.ts:172`).
- The route **does exist**, on `Thunder_Core` `feat/layoutV2` (= PR Thunder_Core#50):
  `src/app/api/core/v1/media/compositions/[id]/tags/route.ts`, mirroring the playlist route, plus
  migrations `20260906091500_composition_tags.sql`, `20260906120000_composition_tag_filter_and_facet.sql`
  and `20260906133000_composition_get_folder_and_tags.sql`. Swagger documents it (commit `4d6a77b`).
- The original check looked at `hotfix/poll-payload-ms` and `origin/develop` and concluded from their
  absence there that the work had never been done. Neither branch carries Phase 1.
- **The 404 came from the local dev server**: Core on `:3001` was serving the `Thunder_Core` checkout,
  which was sitting on `hotfix/poll-payload-ms`. Switching it to `feat/layoutV2` and restarting makes
  the route resolve.
- DB state confirmed via Supabase MCP, 2026-09-08:
  - develop `ftfmokgphewzyxzwjitv` — `media_composition_set_tags(p_tenant_id, p_composition_id, p_tags)`
    present, `media_core.composition_tags` present, `media_compositions_library_list` at **15 args**
    (has `p_tag_id`).
  - prod `sfiefevtxalqjizdkcsw` — no `media_composition_set_tags`, list still at **14 args**. Prod has
    not had this phase's migrations; that is expected and happens at deploy.

**The fix below stays.** Its reasoning stands on its own — a filing step that fails must not throw away
a core save that already landed — and it is what keeps the editor usable against any deployment whose
backend is older than the frontend, prod included until #50's migrations are applied.

### Frontend behaviour that prompted the fix (as observed against the stale local backend)


`persistComposition` rejected at the tags step even though `layout_upsert` / `composition_upsert` / `set_zones` / folder-move had already returned 200 and **persisted server-side**. Result:
- `/create` (new layout) → editor stuck on "Not saved", no redirect to the real id.
- existing layout → badge stuck on stale timestamp, `isDirty` stuck true → "leave without saving?" prompt on every Cancel.

### Fix applied (this repo — frontend hardening only)

The write sequence's own comments already call folder-move + tags **"filing … last … replace wholesale"** (`save-composition.ts:196`). Made those two steps non-fatal, matching that intent:

- `save-composition.ts` — `PersistResult` gains `warnings: string[]`. `moveComposition` and `setCompositionTags` are each wrapped in `try/catch`; a failure pushes a Thai warning string instead of throwing. The core save (`layout_upsert → set_kind → composition_upsert → playlist loop → set_zones`) is unchanged and still fatal on failure.
- `hooks/useCompositionSave.ts` — after `applyResult` marks the editor saved, `result.warnings` (if any) is shown via `toast.warning(...)` (sonner, already used in playlists/publications). A toast is used, not the header error slot, because the primary "Save Layout" button navigates to the list on success (`onSaveDraft → router.push(LIST_PATH)`).

### Verified in browser (2026-09-07 19:22)

- Save `zz-ux-blank` with a tag → save **completes**, redirects to `/media-workspace/layouts`, list row timestamp updates to 19:22, toast: *"บันทึก tags ไม่สำเร็จ — ส่วนอื่นของ Layout ถูกบันทึกแล้ว"*.
- The `PUT .../tags 404` still shows in the browser Network/Console as a failed request (unavoidable at the fetch layer) — it no longer breaks the save.

### ~~Still needed — Thunder_Core backend~~ — already built, no action

Retracted with the root cause above. ADR 0063 §4 is implemented on `Thunder_Core` `feat/layoutV2`
(PR Thunder_Core#50) and applied to develop. The only outstanding step is the ordinary one already in
the handoff: **merge #50 before the frontend PR, then apply this phase's migrations to prod.**

## 3. BUG-2 — Save as Template duplicate-name guard missed templates made earlier in the session

### Root cause (frontend)

`CompositionEditorPage.tsx:233`:
```
takenTemplateNames={data.layouts.flatMap(c => c.kind === "template" ? [c.name] : []).concat(templateSavedName ?? [])}
```
`templateSavedName` is a **single** string (the most-recent Save as Template), and `saveAsTemplate` never folded the newly-created template into `data.layouts`. So on the 2nd+ Save as Template in one session, only the immediately-preceding name was blocked. Any other collision (incl. templates from a prior session) passed the disabled-check, then came back as `POST /media/layouts → 409 Conflict` **with no visible error** — exactly what the ADR 0052 comment in `SaveAsTemplateDialog.tsx` says the client guard exists to prevent.

### Fix applied

`CompositionEditorPage.tsx` `saveAsTemplate` — after `upsertLayout`, `fetchLayout(layout_id)` and fold the row into `data.setLayouts(...)` (same pattern as `absorbLayout` / the seed loader already in this file). `data.layouts` now contains every template created this session, so `takenTemplateNames` catches them all. Side benefit: the Template Picker (also fed by `data.layouts`) sees new templates immediately.

### Verified in browser

- `zz-ux-tpl-3` (new) → confirm enabled, saves.
- `zz-ux-tpl-3` again → confirm **disabled** + red "ชื่อนี้ถูกใช้ไปแล้ว".
- `zz-ux-tpl-1` (from earlier session) → confirm **disabled** + red. (Was the failing case.)

---

## 4. Minor observations (not fixed — no ticket)

- `CompositionEditorPage` C2: right panel is a manual Zone/Layout toggle defaulting to **Zone**, not "Layout when nothing selected" as the checklist wording implies. Selecting a zone does force the Zone panel (`LayoutPropertiesPanel.tsx:55`). Behaviour may be fine — flag for design sign-off.
- Leave-confirmation dialog copy in the Layout editor says *"…ถูกทับเมื่อเปิด **playlist** อื่น"* — leftover wording from the playlist editor.
- Undo/Redo (F4) not verified — synthetic input events don't register on the undo stack; needs a real drag test.

---

## 5. Gates

- `tsc` — no new errors in the 3 changed files (repo-wide tsc is never clean; gated on changed files per auto-memory).
- `eslint` — clean on the 3 changed files.
- No `*.check.mts` added: `save-composition.ts` has no existing test and mocking the full layout/composition/playlist API surface for a `try/catch` branch is not worth it — verified via browser at the layer the user uses (§3).

## 6. Files changed

```
src/features/media-workspace/compositions/save-composition.ts          (+warnings, try/catch filing)
src/features/media-workspace/compositions/hooks/useCompositionSave.ts   (+toast.warning on warnings)
src/features/media-workspace/compositions/components/CompositionEditorPage.tsx  (BUG-2: fold new template into data.layouts)
```

Nothing committed. No PR opened.

## 7. §H — test data to clean up (develop DB `ftfmokgphewzyxzwjitv`, all `zz-ux-*`)

Delete is R0 — list first, then approve. As of end of session:

| type | id | name |
|---|---|---|
| composition | `a3c93503-6b0f-4b73-b6ff-557943e09eb2` | `zz-ux-blank` |
| layout (inline) | `6da79498-43f2-43b3-a6fb-b7d493b1e00e` | `comp:6da79498-…` |
| layout (template) | `8b13eb3f-6d43-434a-a0b1-f074155c5d32` | `zz-ux-tpl-1` |
| layout (template) | `d4b4b46f-66b2-4c20-99e8-39676997d3e2` | `zz-ux-tpl-2` |
| layout (template) | `e8a2615b-ffe5-4c14-9f2d-7b77b77fae26` | `zz-ux-tpl-3` |

`ZZTEST-T15-browser-layout` had a test rename during F3 — **reverted, not saved**, original untouched.
