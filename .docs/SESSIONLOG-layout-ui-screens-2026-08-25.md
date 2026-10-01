# SESSIONLOG — Layout UI (ADR 0044), Task 1 doc/spec + Tasks 6–8 (Screens 1 & 2) — 2026-08-25

Continuation of `.docs/SESSIONLOG-layout-ui-2026-08-25.md` (Tasks 1–5, migration applied to
production). This session picked up from `.docs/HANDOFF-layout-ui-2026-08-25.md`, executing
the rest of `docs/layouts/plan-layout-execution.md`: the four skipped doc/spec files, then
Screen 1 (Layouts list) and Screen 2 (Layout editor).

## What was done

**Task 2 Step 5 (Thunder_Core)** — the four doc/spec files skipped last session:
`docs/media/media-core-schema.dbml` (added `layouts`/`layout_zones` table blocks),
`docs/media/media-core-mapping.md` (corrected the stale "Phase 3 ค่อยเพิ่ม" line — layouts
shipped ahead of that schedule — with a pointer to the migration/RPCs/routes),
`docs/api/api-overview.md` (four endpoints, mirroring the Playlists block's style),
`public/swagger-core-v1.json` (two paths, four operations).

One correction mid-task: a Python `json.dump` rewrite of the swagger file reformatted the
entire 1727-line file (indent 2 vs the file's hand-written indent 4, ~6700-line diff). Reverted
with `git checkout`, then inserted the new block as raw text at the exact line before
`/media/publish` — a clean 94-line diff. `jq empty public/swagger-core-v1.json` passes.

**Task 6 — Screen 1, the Layouts list.** Every file mirrors its named counterpart in
`src/features/communication/playlists/`: `list-filtering.ts`/`.check.mts` (no ownership tab,
no type/campaign filter — just `query` + `status`; `SORT_KEYS` includes `zones` sorting on
`zone_count`), `list-url-state.ts`/`.check.mts`, `status-display.ts`/`.check.mts` (status is
the stored column directly, never derived, unlike Playlist's ADR 0028 logic — and
`describeSaveError` maps the four `Invalid input:` wordings from `media_layout_upsert` to
Thai copy), `services/layouts-api.ts` (reads kept feature-local per the plan's `ponytail:`
note — move to `media-api.ts` when Screen 3 needs them), `LayoutsFilters.tsx`,
`LayoutsTable.tsx` (wireframe thumbnail column, no Type/Resolution/Used In), `LayoutsListPage.tsx`,
`LayoutsListStates.tsx`, the route `page.tsx`, and one nav entry under Playlists. Archive goes
through a confirm `Modal.tsx` and only ever sets `status: "inactive"` — no delete call exists
anywhere in the feature.

One bug caught by the check file itself: `aspectRatio` sort test initially asserted the wrong
order (`"16:9"` sorts before `"9:16"` lexically, `'1' < '9'`) — fixed the assertion, not the
code, after confirming the comparator's own logic was right.

**Task 7 — Screen 2, the Layout editor.** `TemplateRail.tsx` (seven templates plus a
"Start blank" tile seeding one full-screen `main` Zone — a Layout must have ≥1 Zone, so empty
is never a legal canvas state), `LayoutCanvas.tsx` (the one genuinely new piece — pointer-based
drag/8-handle resize, all math in percent so the container's own measured box is the only unit
conversion, `roundPercent` on drop, snap-to-grid toggle switches rounding to whole percent and
draws gridlines, overlapping Zones get a live red outline sourced from `validateZones()` without
blocking the drag), `ZoneProperties.tsx`, `LayoutSettingsStep.tsx` (exactly four fields), and
`LayoutEditorPage.tsx` (two-step shell, dirty-check via `JSON.stringify` diff against the loaded
snapshot, `UnsavedLeaveConfirm.tsx` reused directly from the Playlists feature per the plan's
explicit instruction rather than duplicated, Save disabled with a stated reason while geometry
errors exist or the name is empty). Plus `create/page.tsx` and `[layoutId]/page.tsx`.

**No Publish button, no content picker, no Z-Index control, no per-Zone
background/border/radius anywhere** — verified by re-reading every new component against the
plan's "Global constraints" and "Scope" sections before marking Task 7 done.

## Verification

- All 6 `.check.mts` files pass: `geometry`, `templates`, `list-filtering`, `list-url-state`,
  `status-display` (thunder_one_prj) and `schema` (Thunder_Core).
- `npx tsc --noEmit` in thunder_one_prj: **zero errors, repo-wide** (this repo has no
  pre-existing error baseline, unlike Thunder_Core).
- `npx tsc --noEmit` in Thunder_Core: 131 errors total, all pre-existing except the same
  `TS5097` on `schema.check.mts` already documented last session as the repo's convention for
  files run directly by `node`. No error touches any `layouts/` file beyond that one line.
- `npx eslint` on every new/changed file in both repos: clean, no output.

**Not verified — browser.** Asked the user at this checkpoint per `CLAUDE.md` §3; the user
chose "ให้ checklist ไปเช็คเอง" (checklist handed off, not run by the assistant). The 10-item
checklist from the plan's Task 8 Step 3 was posted in-conversation. **As of this log, none of
list rendering, filter/sort/URL round-trip, template selection, drag/resize, live overlap
detection, save, edit-and-reload, archive/restore, or the duplicate-name Thai error message
have been exercised through an actual browser.** The Thunder_Core layouts routes have likewise
still never been called over HTTP by anything — the smoke test proposed at the start of this
session (`GET /media/layouts` via the dev server) was also deferred to the same checklist path
rather than driven directly, because it requires a logged-in session's `to_at` cookie.

## Still open

- Browser verification (see above) — 10-item checklist outstanding, result not yet reported
  back to this session.
- Screen 3 (Layout mode in the Publication wizard) stays blocked on player work (audit A1) and
  the two open `playback_logs` defects. Unchanged by this session.
- Content folders (ADR 0046) deliberately not touched — independent work, to be done once for
  Layouts, Playlists and Media Library together.

## Repo state

thunder_one_prj: `feat/layout`. New this session: `list-filtering.ts`/`.check.mts`,
`list-url-state.ts`/`.check.mts`, `status-display.ts`/`.check.mts`,
`services/layouts-api.ts`, nine components (`LayoutsFilters`, `LayoutsTable`,
`LayoutsListPage`, `LayoutsListStates`, `TemplateRail`, `LayoutCanvas`, `ZoneProperties`,
`LayoutSettingsStep`, `LayoutEditorPage`), three route files
(`layouts/page.tsx`, `layouts/create/page.tsx`, `layouts/[layoutId]/page.tsx`). Modified:
`src/config/nav/communication.tsx` (one nav entry).

Thunder_Core: same branch. Modified this session: `docs/media/media-core-schema.dbml`,
`docs/media/media-core-mapping.md`, `docs/api/api-overview.md`,
`public/swagger-core-v1.json`. The `layouts/` route files themselves were written last
session, untouched this one.

Nothing committed or pushed in either repo this session — all of the above is uncommitted,
matching last session's state. Last commits unchanged: `449496b` (thunder_one_prj), `babe2e9`
(Thunder_Core).
