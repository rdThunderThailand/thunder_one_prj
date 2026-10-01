# SESSIONLOG — Create Layout flow (Phase 1 design) · 2026-09-05

Design session only. **No code changed.** Three documents written.

## Input

`docs/layouts/Phase1/` — four Figma frames (Create Modal, Template Picker, Layout Editor,
Layout Editor With Content), added by the user this session.

## Method

`grill-with-docs` — three rounds of frontier questions, every question carrying a recommendation.
All facts gathered from the repo and from `Thunder_Core/supabase/migrations/`, none asked of the user.

## Decisions (all 16 questions answered; frontier closed)

| # | Decision |
|---|---|
| 1 | Canvas Settings (resolution, background) move out of creation into the editor's Properties panel |
| 2 | Creation writes nothing — modal seeds client draft state, first Save performs ADR 0052 §4's two calls |
| 3 | **Widgets out of Phase 1** — string `widget` appears nowhere in the repo; needs its own ADR + player work |
| 4 | Folders + Tags on Layouts — folders already exist; `composition_tags` copies `playlist_tags` |
| 5 | Template catalogue = three columns on `media_core.layouts`, not a new table |
| 6 | `Publish` → `Use in Program →`; `Save as Template` built; `Import Layout` not built |
| 7 | System Templates seeded lazily per tenant via idempotent RPC + `is_system`; no backfill, no `tenant_id IS NULL` |
| 8 | One modal (Template Picker with a blank tile inside), no modal on a modal, no name field |
| 9 | Toolbar: take undo/redo, align/distribute, duplicate Zone. Refuse ruler, zoom, Fit to Screen, lock, hide, Safe Margin |
| 10 | Zone Behavior = existing `play_mode`/`repeat`/`start_from`; Duration read-only; Fill Mode and Mute stay out |
| 11 | Explicit save with a split button; `Save & Activate` gated on all Zones bound; no autosave |
| 12 | Recently Used derived from `compositions.layout_id` per tenant; all picker filtering client-side |
| 13 | Two PRs as in the Playlist v1 epic — Thunder_Core → develop first, then thunder_one_prj → dev |
| 14 | New ADR rather than editing ADR 0052 in place |

## Reversals of ADR 0052 §7

Folders/Tags on Layouts (was "out of scope"), undo/redo (was deferred to ticket 11), and the
`Publish` button (§6 refusal refined into `Use in Program →`). Recorded in ADR 0063 with reasons.
Widgets, Fill Mode, Mute, Safe Margin, ruler/zoom/Fit-to-Screen remain refused.

## Facts established from the schema

- `composition_tags` does not exist; `20260903150000_playlist_tags.sql` is a line-for-line template
- folder scope `'composition'` applied in `20260829040259`
- `media_core.layouts` has only name / aspect_ratio / background / status / kind, `UNIQUE (tenant_id, name)`
- `layout_zones.role` was dropped in `20260826110000`
- layout RPCs: `media_layout_get|set_kind|set_status|upsert`, `media_layouts_list`

## Written

- `docs/adr/0063-create-layout-flow-phase-1.md`
- `docs/layouts/Phase1/plan-create-layout-flow.md`
- `docs/layouts/Phase1/README.md` (design-source index)

## Not done

Nothing committed (§4 — commit only when told). No code, no migration, no browser verification —
this session produced no runnable change.

## Next

Backend BE-1…BE-4 in Thunder_Core off `develop`. Execution against a settled plan — Sonnet is enough.

---

## Rework after review (same day)

Review raised 1 blocker + 2 major + 1 minor. All four accepted; two were my errors of fact.

**Blocker — first-save sequence was wrong.** ADR 0063 §2 said "ADR 0052 §4's two calls
(`media_composition_upsert`, then `media_layout_set_kind`)". A Composition cannot exist before the
geometry it points at. Verified against `CompositionEditorPage.tsx:410-437`, which already does it
right. Cause: copied ADR 0052 §4's loose prose without opening the code. §2 now gives two explicit
sequences — blank/preset = `media_layout_upsert` → `media_layout_set_kind` → `media_composition_upsert`
→ `media_composition_set_zones`; existing Template = the last two only — plus a partial-failure
boundary per step, including that a step-2 failure must **resume**, not restart (a restart mints a
second `layouts` row).

**Major — smaller path taken: system presets stay frontend constants.** Reviewer proposed merging
FE constants with fetched operator Templates instead of seeding rows. Checking further showed the 7
presets already reach the editor through `blankZones`, i.e. copy-on-use — so BE-1/BE-2 as first
written were changing working behaviour to acquire a per-tenant seeding problem with no requirement
behind it. My Q5 objection ("one source is better") was wrong: presets and Templates are not one
collection. A preset is a **starting point that is copied**; a Template is a **shared reference**.
Nobody wants a preset edit to propagate. Two origins is the honest model.

Cut: `description`/`use_cases`/`is_system` columns, `media_layout_seed_system_templates`,
`UNIQUE (tenant_id, name)` collisions, the silent-skip failure where a second orientation never
lands. Backend for this phase drops from 4 tickets to 3, and from a schema change on `layouts` to
none.

**Major — `Recently Used` had no data path.** `fetchLayouts` returns Layouts only. Took the derived
field: `media_layouts_list` gains `last_used_at` = `max(compositions.created_at)` per row. Body-only,
signature untouched.

**Minor — docs.** Replaced the "seven things"/"four rows" mismatch with an authoritative amendment
table (ADR 0052 §6/§7 row → reversed / refined / still refused, with the reason). Fixed the
`0062-…` placeholder path in the Phase 1 README.

### Backend after rework

| | |
|---|---|
| BE-1 | `last_used_at` in `media_layouts_list` — body-only |
| BE-2 | `composition_tags` + `media_composition_set_tags` + tags array in `media_compositions_library_list` |
| BE-3 | one route for the tags RPC |

No column added to `layouts`, no signature changed, no `DROP FUNCTION`.

## Rework round 2

**Major — the four-write count omitted the inline Playlist loop.** Verified at
`CompositionEditorPage.tsx:435-461`. Two defects, both pre-existing and both invisible today because
ADR 0052 §5's pages were never reachable:

- `setBindings(resolved)` runs only after the loop (`:461`), so a throw at Zone 3 discards the
  `playlistId`s already earned for Zones 1 and 2.
- `crypto.randomUUID()` is minted inside the loop (`:447`), which deduplicates a retried HTTP
  request but not a re-clicked Save.

Result: every failed save mints another set of `kind = 'inline'` Playlists. They are filtered out of
the operator's Playlist list, and `media_composition_set_zones` never ran, so nothing references
them — garbage visible from no screen.

ADR 0063 §2 now reads "four core writes, plus 0..N inline Playlist writes", names step 3b, and states
the invariant: **a Zone's playlist id and idempotency key are draft state, the key written before the
call, the id written the moment it returns.** The existing `if (!playlistId)` branch then makes a
retry a no-op for Zones that already succeeded.

Plan FE-5 carries the fix plus a deliberate verification: bind three Zones by picking assets, fail
the third, re-save, confirm three inline Playlists exist and not five.

**Minor.** FE-1 ticket now also deletes the stale opening comment in `layouts/templates.ts` — it
claims `Save as Template` is out of release one and proposes `is_template`, both superseded by
`layouts.kind` (ADR 0052 §4) and ADR 0063 §7.

Still documents only. Nothing run, no browser verification, nothing committed.

## Tickets

Split into 9 tickets under `docs/layouts/Phase1/tickets/`, numbered 21–29 continuing the Phase 0
series. Format follows `docs/layouts/Phase0/tickets/`. Each ticket quotes the ADR sections it depends
on inline, so it can be worked without reading ADR 0063 end to end.

`tickets/README.md` is the board: status column, dependency graph, what runs in parallel, ship order,
and the standing traps (PUBLIC grant, CREATE OR REPLACE overload, tenant isolation in the RPC).

| # | | Blocked by |
|---|---|---|
| 21 | `last_used_at` on `media_layouts_list` (Core) | — |
| 22 | Composition tags (Core) | — |
| 23 | `set_tags` route (Core) | 22 |
| 24 | Template Picker (One) | 21 for Recently Used only |
| 25 | Layout Properties panel + editor file split (One) | 24, 23 |
| 26 | Canvas tools (One) | 25 |
| 27 | Zone Properties tabs (One) | 25 |
| 28 | Save / Activate / first-save recovery (One) | 25 |
| 29 | List page rails (One) | 23 |

21 ‖ 22 and 24 ‖ 29 run in parallel. 26 ‖ 27 ‖ 28 only after 25, because 25 splits
`CompositionEditorPage.tsx` (734 lines) — without it those three are three merge conflicts.

Ticket 28 is flagged as the riskiest: it carries both first-save recovery holes.

Nothing committed. No GitHub issues created — that is an outward-facing write and was not asked for.

## GitHub issues created (2026-09-06)

Nine issues in `rdThunderThailand/thunder_one_prj`, one per ticket. Backend tickets are tracked here
too, matching the Playlist v1 pattern where the issue lives in `thunder_one_prj` and the PR lands in
`Thunder_Core`.

`ticket + 30 = issue`: 21=#51 · 22=#52 · 23=#53 · 24=#54 · 25=#55 · 26=#56 · 27=#57 · 28=#58 · 29=#59

Labels: `enhancement` + `ready-for-agent` on all nine; `bug` additionally on #58, which fixes two
recovery holes in the shipped save path.

Each body carries the full ticket including its ADR excerpts, plus the ticket→issue mapping so the
"Blocked by" lines resolve. `docs/layouts/Phase1/tickets/README.md` gained an Issue column, and each
ticket file gained an `**Issue:**` link.

No epic issue was created — nine were asked for and nine exist.

Note: links inside the issue bodies point at `docs/layouts/Phase1/...`, which is still untracked.
They resolve once the docs are committed.
