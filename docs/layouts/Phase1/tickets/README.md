# Phase 1 tickets — Create Layout flow

Numbering continues the Phase 0 series (which ended at 20); each ticket is also a GitHub issue, ticket + 30. Each ticket carries the ADR text it
depends on, so it can be worked without reading the whole ADR first.

**Plan:** `../plan-create-layout-flow.md` · **Decisions:** `docs/adr/0063-create-layout-flow-phase-1.md`
· **Design frames:** `../README.md` says which frame governs what.

## Board

| # | Issue | Ticket | Repo | Blocked by | Status |
|---|---|---|---|---|---|
| 21 | [#51](https://github.com/rdThunderThailand/thunder_one_prj/issues/51) | [`last_used_at` on `media_layouts_list`](21-layout-last-used-at.md) | Core | — | verified (develop) |
| 22 | [#52](https://github.com/rdThunderThailand/thunder_one_prj/issues/52) | [Composition tags](22-composition-tags.md) | Core | — | verified (develop) |
| 23 | [#53](https://github.com/rdThunderThailand/thunder_one_prj/issues/53) | [API route for `set_tags`](23-composition-tags-route.md) | Core | 22 | verified (localhost → develop DB) |
| 24 | [#54](https://github.com/rdThunderThailand/thunder_one_prj/issues/54) | [Template Picker](24-template-picker.md) | One | 21¹ | verified (localhost → develop DB) |
| 25 | [#55](https://github.com/rdThunderThailand/thunder_one_prj/issues/55) | [Layout Properties panel + file split](25-layout-properties-panel.md) | One + **Core**⁴ | 24, 23 | verified (localhost → develop DB) |
| 26 | [#56](https://github.com/rdThunderThailand/thunder_one_prj/issues/56) | [Canvas tools](26-canvas-tools.md) | One | 25 | not started |
| 27 | [#57](https://github.com/rdThunderThailand/thunder_one_prj/issues/57) | [Zone Properties tabs](27-zone-properties-tabs.md) | One | 25 | not started |
| 28 | [#58](https://github.com/rdThunderThailand/thunder_one_prj/issues/58) | [Save / Activate / first-save recovery](28-save-activate-and-first-save-recovery.md) | One | 25 | not started |
| 29 | [#59](https://github.com/rdThunderThailand/thunder_one_prj/issues/59) | [List page rails](29-list-page-rails.md) | One + **Core**² | 23 | verified (localhost → develop DB) |

¹ 24 needs 21 only for its *Recently Used* group; the rest of the picker can be built first.

² 29 acquired a Core migration it was not planned to have —
`20260906120000_composition_tag_filter_and_facet.sql`, applied to `develop` 2026-09-06. The ticket
assumed the Playlist page's client-side rail; this list is server-paginated. ADR 0063 §4 carries the
amendment and the rejected alternatives.

⁴ 25 also acquired a Core migration — `20260906133000_composition_get_folder_and_tags.sql`, applied
to `develop` 2026-09-06. `media_composition_get` returned neither field, so the Properties panel had
nothing to open on. Body-only `CREATE OR REPLACE`: no new parameter, no DROP, grants survive.

Statuses: `not started` → `in progress` → `verified` (browser-checked at the layer an operator uses,
per `CLAUDE.md` §3) → `shipped`. Edit the row and the ticket's own **Status** line together.

## What can run in parallel

```
┌ 21 ─────────────────────────────┐
│                                 ├─► 24 ─► 25 ─┬─► 26 ─┐
└ 22 ─► 23 ─┬─────────────────────┘             ├─► 27 ─┼─► done
            │                                   └─► 28 ─┘
            └─► 29 ────────────────────────────────────┘
```

- **21 ‖ 22** — different objects, one branch, no shared function.
- **24 ‖ 29** — different pages; 29 only needs the backend.
- **26 ‖ 27 ‖ 28** — all three edit the editor, so **25 must land first**. Done: the 734-line
  `CompositionEditorPage.tsx` is now 300, and each of the three has a file of its own —
  26 → `CompositionCanvasPane.tsx`, 27 → `ZoneContentPicker.tsx`,
  28 → `save-composition.ts` + `hooks/useCompositionSave.ts` + `CompositionEditorHeader.tsx`.

## Ship order

**Backend merges first.** `Thunder_Core` deploys from `develop`, and the deployed frontend calls the
deployed backend — a frontend PR merged ahead of its backend reaches production broken. Migrations
applied through MCP are live the moment they are applied, whether or not the branch merged.

Two PRs, opened **Draft** until verified: `Thunder_Core` → `develop`, `thunder_one_prj` → `dev`.
Claude does not mark them ready (`CLAUDE.md` §4).

## Standing rules these tickets inherit

- `CREATE FUNCTION` grants `EXECUTE` to `PUBLIC` — the REVOKE/GRANT pair is not optional.
- `CREATE OR REPLACE FUNCTION` does **not** replace when a parameter is added; it creates an
  overload and breaks every existing call. One thing in this phase does add a parameter —
  `p_tag_id` on `media_compositions_library_list` (ticket 29) — and it drops the old signature
  first, then re-applies the REVOKE/GRANT pair. Copy that shape if a second one ever appears.
- Tenant isolation lives inside the RPC, not in RLS.
- Applying to production is R0: stop, show the real rows, ask.
- Frontend: files ≤ 300 lines, no `any`, no new dependency for what a few lines can do, checks are
  `*.check.mts` with plain `node:assert` — this repo has no test runner by design.

## Not in this phase

**Widgets** (Clock, Text, Image, Weather, RSS Feed, Web Page). They appear in both editor frames and
two are rendered on the canvas, and the string `widget` appears nowhere in this repository. They need
their own ADR, a schema, per-type configuration, a refresh policy, and a renderer in the player
repository. Do not let a ticket here acquire them — it moves this phase's completion into another
repo.

Also out, each with its reason in ADR 0063 §5–§7: ruler, zoom, Fit to Screen, lock, hide, Safe
Margin, Fill Mode, Mute, editable Duration, `Import Layout`, `Publish`, Category.
