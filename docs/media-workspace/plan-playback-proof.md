# Plan — Playback Proof

ADR: `docs/adr/0089-playback-proof-records-player-reported-outcomes.md` · Player spec:
`docs/media-workspace/spec-playback-proof-player-contract.md` · Glossary: CONTEXT.md **Playback Proof**.
Board: "Playback Proof — Key User Flow" (Section 2), visual source; data and behaviour follow the ADR.

Order: **A → B**, with **C** started as soon as the ADR is accepted. B does not wait for C: the existing
rows (all `played`, all Unattributed) are enough to build the page; Failed and attribution are tested
with develop fixtures.

## A — Thunder_Core (backend)

**A1 · Migration: schema + dedupe** — R0 on apply (deletes rows).
- Delete duplicate rows keeping the oldest per `(device_id, media_asset_id, played_at, snapshot_zone_id)`;
  show the count per DB before applying (prod: 2,071 on 2026-10-08).
- Add `outcome` (default `played`, CHECK in `played|failed`), `failure_reason` (CHECK enum, required iff
  failed), `failure_message` (≤ 500), `channel_id` (FK channels, `ON DELETE SET NULL`).
- Backfill `channel_id` from `channel_device_reservations`.
- `UNIQUE NULLS NOT DISTINCT (device_id, media_asset_id, played_at, snapshot_zone_id)`; index
  `(tenant_id, played_at DESC)`.
- Closing: applied develop → prod, schema dumped and compared; duplicate count 0.

**A2 · Ingest: `media_playback_log` + route.**
- `DROP FUNCTION` / re-`CREATE` keeping the existing REVOKE/GRANT (service_role only).
- Accept the new fields, resolve `channel_id` from reservations, `ON CONFLICT DO NOTHING`, return
  `{ logged, duplicates }` counted from `ROW_COUNT`.
- Route zod schema: add the three fields, `.max(500)` on `logs`; extend `schema.check.mts`.
- Closing: HTTP POST with a device token on develop — old-shape batch stored as `played`; failed entry
  stored; resend → `duplicates`; bad entry → 4xx and nothing stored.

**A2b · Poll emits ids per slot.** `media_job_poll`: add `publication_snapshot_id` + `snapshot_zone_id`
to `slot_base`, so every slot carries them on the flat and the Layout path (ADR 0089 §3). Additive only;
signature unchanged, so `CREATE OR REPLACE` is safe — keep its existing grants. Closing: HTTP poll on develop for a flat and a Layout
Program shows both ids on every slot; an existing Player still plays. **C cannot finish before this.**

**A3 · Read RPCs + routes.**
- `media_playback_proof_list` (filters ADR §7, page ≤ 100, ≤ 92 days, tenant filter inside) returns KPI
  counts + one page; each row already carries everything the drawer shows (channel/program/source/media,
  Trash flags, cover), so there is **no get RPC**. `media_playback_proof_export` feeds the CSV route
  (> 50,000 → 400, UTC + local columns, raw `failure_message`, formula-safe cells, BOM).
- Routes: `GET /api/core/v1/media/playback-proof` (`from`, `to`, `channel_id` | `group_id`,
  `publication_id` | `unattributed=true`, `q`, `page`, `page_size`) and `GET …/playback-proof/export`.
- Closing: each route exercised over HTTP on develop for two tenants; cross-tenant id returns not found.

## B — thunder_one_prj (frontend)

**B1 · Route + nav + list.** `/media-workspace/playback-proof`, nav item replaces disabled "Reports";
filters in the URL; KPI cards (Plays, Failed, Airtime, Screens reporting); table (Played at, Channel +
device, Program or "—" with tooltip, Source, Media thumb + name, Duration, Result); server paging.
Lovable primitives + globals.css tokens only (ADR 0075/0076).

**B2 · Drawer.** Media preview, metadata, failure label, Related objects with Open buttons to existing
routes, Trash/disabled states, "may have changed since it aired" on Source; closing keeps scroll + filters.

**B3 · Export.** Button downloads the CSV of the current filter.

Closing for B: browser check on localhost against develop (ask before each verify point, CLAUDE.md §3),
including Failed and attributed rows from fixtures, empty state, 92-day limit, Viewer role.

## C — Player (outside both repos)

Hand `spec-playback-proof-player-contract.md` to the Player team. Closing: entries on develop carry
snapshot ids and at least one `failed` entry from a real Player.

## Out of scope / follow-ups

- v2 schedule coverage (ADR 0089 Considered options).
- Device FK CASCADE + retention policy (rdThunderThailand/Thunder_Core#181).
- Meaning of 0-second `played` entries (ask Player team).
