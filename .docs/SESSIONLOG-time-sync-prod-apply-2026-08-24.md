# SESSIONLOG — synchronized playback (ADR 0042) applied to production

**Date:** 2026-08-24 · **Branches:** `feat/timesync` in both `thunder_one_prj` and `Thunder_Core`
· **Nothing committed, nothing pushed.**

Continues the two earlier sessions (`SESSIONLOG-time-sync-2026-08-24.md` = design/ADR,
`SESSIONLOG-time-sync-implementation-2026-08-24.md` = implementation). Those left the migration
written but unapplied. This session applied it and verified it.

The earlier handoff recommended applying to a Supabase branch first. The user chose to apply
directly to production instead, after being shown the concrete DDL list and the specific risk
(the DROP+CREATE of two functions is the point where a mid-transaction failure takes the API down).

---

## What was applied

`supabase/migrations/20260824130000_synchronized_playback_epoch_phase.sql` → production project
`sfiefevtxalqjizdkcsw`, via `mcp__supabase__apply_migration`. Additive only: two `ALTER TABLE ADD
COLUMN`, five `CREATE OR REPLACE FUNCTION` (unchanged signatures), one `DROP`+`CREATE`+re-grant
pair for the two functions that gained `p_sync_enabled`. No data was updated or deleted.

Pre-apply, `pg_get_function_identity_arguments` for all seven functions was compared against the
`DROP FUNCTION` statements in the file — exact match, so the drops could not silently miss and
leave an ambiguous overload behind.

---

## Two defects found and fixed during the apply

### 1. The migration reopened PUBLIC execute on two SECURITY DEFINER functions

`CREATE FUNCTION` grants `EXECUTE` to `PUBLIC` implicitly. The originals had it revoked
(`postgres` + `service_role` only). The migration re-granted `service_role` — which the previous
session correctly identified as necessary — but nothing revoked `PUBLIC`, so after the apply
`media_channel_create` and `media_channel_update` were callable by `anon` through PostgREST. Both
are `SECURITY DEFINER` and take `p_tenant_id` as a parameter, so this was a cross-tenant write
path, not merely an information leak.

Caught by diffing `information_schema.routine_privileges` against the pre-apply snapshot. Revoked
immediately; grants now match the pre-apply state exactly. `REVOKE EXECUTE ... FROM PUBLIC` added
to the migration file ahead of each `GRANT`, so a replay elsewhere does not reopen it.

Saved to memory as `create-function-grants-public`.

### 2. The guard verification script had never been run and did not work

`docs/media/check-synchronized-playback-guards.sql` failed on its first statement:
`media_core.publications.campaign_id` is `NOT NULL` and the fixtures omitted it.

Also restructured: each `DO` block now always ends in `RAISE EXCEPTION`, pass or fail, so Postgres
discards the block's own fixture rows. The original relied on the caller remembering to wrap the
file in `BEGIN; ... ROLLBACK;` — acceptable against a throwaway branch, not against production,
where a forgotten rollback leaves a real device joined to a fake synchronized Channel.

---

## Verification

Layer by layer, because "it applied" is not "it works".

### Schema / RPC — verified

- 3 new columns present with the intended nullability and defaults.
- All 7 functions have exactly one signature — the drops worked, no ambiguous overloads.
- `md5(prosrc)` and `length(prosrc)` for all 7 match the migration file byte-for-byte.
- Guard A (`channel_set_devices`) blocks adding a Device carrying an active direct-target
  Publication to a `sync_enabled` Channel. **PASS**
- Guard B (`media_publication_activate`) blocks activating a direct-target Publication onto a
  Device in a `sync_enabled` Channel. **PASS**
- `media_job_poll`'s `sync_enabled` flips `false → true` when the Device is reserved by a
  synchronized Channel; `server_now` present in both cases.
- `media_channel_create(p_sync_enabled => true)` / `media_channel_update(... => false)` round-trip.
- `channel_rows.direct_target_conflicts` returns `[]` when clean and `["ZZZ-conflict-pub"]` when a
  conflict exists — the non-empty branch was exercised, not just the empty one.

Every one of these ran inside a self-aborting `DO` block. Residue check after each: zero rows.

### HTTP — verified

Against `localhost:3001` (Thunder_Core dev server, `feat/timesync` code, prod database). The
deployed `thundercore.vercel.app` builds from `develop` and does not carry this code, so it could
not have been used for this.

- `POST /media/player/jobs` → `server_now`, `sync_enabled` both present.
- `POST /media/player/heartbeat` with `phase_error_ms: -37`, `loop_duration_seconds: 120` → echoed
  back under `telemetry`, negative value preserved (the sign is the whole point — ahead of the
  loop and behind it are different failures).
- `loop_duration_seconds: -5` → 400.
- `POST /media/channels` with `sync_enabled: true` → created, flag round-trips.
- `GET /media/channels` → every row carries `sync_enabled` and `direct_target_conflicts`.
- `PATCH /media/channels/{id}` → flips the flag, revision increments.

### Browser / UI — NOT verified by me

The Channel editor checkbox and the conflict warning in `ChannelBasicInfoSection` were not
exercised. A checklist was handed to the user to run instead
(`CHECKLIST-sync-playback-ui-2026-08-24.md`). Per the project rule, this counts as unverified:
if a PR is opened before those results come back, it opens as Draft.

Note for whoever runs it: the amber conflict warning **cannot** currently be reproduced. There are
zero active-or-scheduled direct-target Publications anywhere in production right now (checked
across all tenants), so `direct_target_conflicts` is empty for every Channel. Seeing that warning
requires creating and activating one first.

---

## Deploy-ordering hazard found by testing, then fixed

`channelCreateSchema` had `sync_enabled: z.boolean()` — required. The frontend currently deployed
does not send that field, and the two repos deploy independently, so every Channel create/update
from the live UI would have returned 400 for the entire window between the backend deploy and the
frontend deploy.

Changed to `z.boolean().default(false)`, which is the column default, so an older client that
omits the field gets exactly its previous behaviour. `schema.check.mts` asserted the opposite
(that omission must throw) and was rewritten to assert the default instead, plus that an explicit
`true` survives and that a wrong type is still rejected — defaulting must not slide into coercion.

Re-verified over HTTP: omitted → created with `false`; `"yes"` → 400; `true` → `true`.

This is the kind of thing only HTTP-level testing finds. `tsc` and the unit-level check were both
green on the required version.

---

## Production state at end of session

Everything created for testing was removed:

- 3 test Channels deleted (`zz-synctest-151210`, `zz-synctest-oldclient`, `zz-synctest-true2`) —
  all Draft, zero devices, zero reservations, zero publication targets. The three FKs pointing at
  `media_core.channels` are all `ON DELETE CASCADE`, and all three counts were zero, so nothing
  cascaded.
- `test-asset-01` telemetry reverted: `sync_phase_error_ms`, `sync_loop_duration_seconds`,
  `last_heartbeat_at` → NULL.
- `connection_status` for that asset was set to `offline`. **This is a guess, not a restoration** —
  the pre-test value was not recorded. `offline` is what 486 of the 503 never-heartbeated Devices
  carry. Flagged to the user at the time.

Final counts: 0 `zz-%` Channels, 0 Channels with `sync_enabled = true`, 3 Channels total (the
pre-session count), 0 Assets carrying sync telemetry.

The first attempt at this cleanup was refused by the permission classifier. It was not routed
around — the user was told, shown the exact rows, and chose to approve the same statement.

---

## Files changed this session

**Thunder_Core**

- `supabase/migrations/20260824130000_synchronized_playback_epoch_phase.sql` — added
  `REVOKE EXECUTE ... FROM PUBLIC` before each `GRANT`; header comment updated.
- `docs/media/check-synchronized-playback-guards.sql` — `campaign_id` added to both fixtures;
  blocks restructured to self-abort; header rewritten (no longer says "branch only", records that
  it was run against production and passed).
- `src/app/api/core/v1/media/channels/schema.ts` — `sync_enabled` defaulted.
- `src/app/api/core/v1/media/channels/schema.check.mts` — assertion inverted and widened.

`route.ts`, `[id]/route.ts`, `player/heartbeat/route.ts` were already modified by the previous
session and were not touched here.

**thunder_one_prj** — no code changes this session. The frontend files modified by the previous
session are untouched.

Checks: `schema.check.mts` passes. `eslint` clean on both changed files. `tsc --noEmit` reports no
new errors on them (the TS5097 on the check file's `./schema.ts` import predates this work; see
memory `thunder-core-tsc-never-clean`).

---

## Open items for the next session

1. UI checklist results from the user. Item 3 (does the checkbox come back checked after save and
   reopen?) is the one that matters most — it is the only step nothing else covers, since the API
   is already known to return the flag correctly.
2. Nothing is committed. When it is: ask Thai vs. English for the PR, and open it as Draft while
   the UI layer is unverified.
3. Thunder_Core deploys from `develop`. The backend change is live in the database already (the
   migration), but the route changes are not deployed anywhere.
