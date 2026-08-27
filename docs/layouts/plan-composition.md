# Plan — Composition re-model execution

**Written** 2026-08-26 · branch `feat/layout` · repos `thunder_one_prj` + `Thunder_Core`
**Spec:** `docs/layouts/spec-composition-content.md`
**ADRs:** 0049 (Composition) · 0050 (wide Layouts) · 0051 (preview) · 0052 (merged authoring) ·
0044 §2–§12 · 0045
**Supersedes:** `plan-layout-execution.md`'s per-Zone-binding phases (the ADR 0048 model)

## Order and why

```
01 Zone identity + precision  ─┬─→ 02 Composition schema/RPCs ──→ 03 Composition editor ──→ 12 Preview
   (backend + geometry.ts)     │            │                              │
                               │            │                    14 Template kind → 15 Merged editor
                               │            │                              │
                               │            └──→ 04 publication_type ──→ 05 Activation ──┬──→ 06 Drift
                               │                                                         │
                               └─→ 11 Layout editor wide-screen tools                    ├──→ 09 Overlap block
                                                                                         │
07 Device capabilities (parallel, independent) ──────────────────→ 08 Capability gate ───┴──→ 10 zones[] payload

13 Player span — other repo, not this branch
```

Four orderings are load-bearing and everything else is convenience:

1. **01 first.** Every Composition binding is an FK to a `layout_zones.id`. Today that id is minted
   fresh on every Layout save, so binding anything before 01 lands guarantees the bindings are wiped
   the first time somebody renames a Zone. Precision rides along because it alters the same two
   tables and the same RPC.
2. **05 before 08, 09 and 10.** The gates and the payload all read the snapshot.
3. **10 last.** The `zones[]` payload must not reach a screen before the capability gate that protects
   it — the whole argument of ADR 0044 §9.
4. **14 before 15, and 15 replaces 03's pages.** ADR 0052 merges the two authoring pages into one.
   15 cannot start until `layouts.kind` exists, because an operator drawing geometry without picking a
   Template needs somewhere private to put it.

07 shares nothing with the Composition track and can run at any time. 14 is additive and shares
nothing with 04 or 05, so it can run at any time too.

## Phases

| Phase | Tickets | Repos | Ends when |
|---|---|---|---|
| A — foundations | 01, 07 | both | a Zone survives a Layout rename; a Device *can* report capabilities (stored, unused) |
| B — the entity | 02, 03 | both | an operator can author and activate a Composition |
| C — publishing | 04, 05 | both | a composition Publication activates and snapshots correctly |
| B2 — one page *(runs after C)* | 14, 15 | both | geometry and content are authored on one page, reachable from the sidebar |
| D — safety | 06, 08, 09 | both | drift is visible; incapable and contending targets are refused |
| E — the screen | 10 | Thunder_Core | a zoned payload reaches a player |
| F — polish | 11, 12 | frontend | wide Layouts are drawable; drafts are watchable |
| — | 13 | player repo | separate instruction |

Phase F is independent of C–E and can be pulled forward if the wide-screen customer needs the editor
before the pipeline is finished.

Phase B2 was added on 2026-08-26 after the UX mockups were read against the shipped ticket-03 pages
(ADR 0052). It is sequenced **after C** by decision, not by dependency — the table row sits below C
for that reason, and keeps the B2 name only because the dependency graph puts 14/15 off 03. Three
reasons, re-confirmed 2026-08-26 when ADR 0052 §8 was written:

- **04 is the only thing blocking 05, and 05 blocks 06, 08, 09 and 10.** B2 is a leaf; nothing waits
  on it. Clearing the trunk first keeps five tickets from queueing behind a decision.
- **04's frontend is written and uncommitted right now.** Ticket 15 moves the very routes it links
  to, so running B2 first would rewrite the working tree under 44 modified files and force 04's
  browser verification to be redone after the move.
- **04's migration folds in the unapplied migration 095** — a schedule-wipe and playlist-wipe bugfix
  that has been sitting unapplied on production since 2026-08-18. Deferring 04 defers that fix.

## Standing rules for every phase

- **Every migration applied to production is R0** — including the additive ones. Rehearse the whole
  set on `develop` (`ftfmokgphewzyxzwjitv`, a full data clone) first, then stop and ask before
  production (`sfiefevtxalqjizdkcsw`).
- `DROP FUNCTION` by exact old signature before `CREATE` whenever an argument list changes. Adding a
  parameter to `CREATE OR REPLACE` makes an overload, and every existing call then fails as ambiguous.
- `CREATE FUNCTION` grants `EXECUTE` to `PUBLIC`. `REVOKE FROM PUBLIC, anon, authenticated` then
  `GRANT` to `service_role`, and verify with `has_function_privilege` after apply.
- Tenant isolation lives inside the RPC, not in RLS.
- After apply, dump `pg_get_functiondef` and diff it against the migration file. Assert exactly one
  overload. Re-run the advisors.
- The frontend calls the **deployed** `Thunder_Core` (`CORE_API_URL` → `thundercore.vercel.app`,
  confirmable at `/api/proxy/__config`). A route change is invisible through the UI until deployed,
  while a migration applied over MCP is live immediately. `Thunder_Core` deploys from `develop`.
- `tsc` in `Thunder_Core` is never clean (~127 pre-existing errors). Gate on changed files.
- Each ticket names the layers it verified and the layers it did not. Verify at the layer the operator
  uses; **ask before every browser verification point**, every time.
- Nothing is committed or pushed without being asked. Verification incomplete → PR opens as Draft.

## Known unknowns carried into execution

- **B1, the player's multi-Zone renderer, does not exist.** Everything here is verifiable up to the
  payload; none of it can be seen on a real screen until B1 lands. That is the actual ship gate for
  the three-monitor customer, and it is in neither of these repos.
- **Rollout risk: server-side publish does not guarantee decoder capacity.** `max_video_zones` per
  platform is unmeasured and no player build reports it, so ADR 0054 defers enforcement rather than
  gate on a number nobody has taken. A composition Publication may reach a Device that cannot decode
  all of its video Zones concurrently; playback may stutter, drop video, or fail there. Knowingly
  accepted for this phase. See **Deferred** below.
- Nobody has measured what a real three-monitor machine reports for `screen_width`. ADR 0050 §5
  predicts 1920 until the window is made to span.
- `apply_migration` assigns its own timestamp, so local migration filenames will not match production
  migration history. Expected; not repaired.
- **The UX mockups are ahead of this plan in seven named areas** — Widgets as a content source,
  folders/category/tags, Z-Index and per-Zone border/radius/gradient backgrounds, safe margin, per-Zone
  Fill Mode and Mute, drag-and-drop media, and the editor toolbar. ADR 0052 §7 records the reason each
  is deferred and which are refused outright (`role`). Tickets 06–13 have **not** been audited against
  the mockups; only 04, 05 and the Layout/Composition pages were.

## Working tree at the time of writing

- The three uncommitted `Thunder_Core` migrations were **never applied to either environment** —
  `publication_zones`, `publications.layout_id`, `assets.player_capabilities` and
  `media_publication_set_zones` are all absent from production. They are rewritten in place.
- Production holds one Layout with two Zones, created during testing. No backfill anywhere.
- `publication_snapshot_zones` holds 99 rows, all `role = 'main'`. Dropping `role` destroys nothing
  meaningful but still rewrites 99 live rows, and stays R0.
- The frontend index holds the superseded Ticket 02 implementation. ADR 0049 names what survives — the
  implicit-Playlist mechanism, the clear-bindings confirmation, and the wireframe Zone selector — all
  of which move into the Composition editor (ticket 03). `hasLayoutZoneDrift` is deleted, not moved.
