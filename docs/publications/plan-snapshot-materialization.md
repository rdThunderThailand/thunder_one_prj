# Plan: Publication snapshot materialization (ADR 0045)

Implementation plan for `docs/adr/0045-publication-snapshot-materialization.md`.
This foundation lands before `docs/adr/0044-multi-zone-layout.md`; it preserves the current flat
player payload while making every Publish Job point to immutable content.

**Plan status:** ready for execution. Every design decision is settled and recorded in ADR 0045;
nothing in this plan is waiting on a product answer.
Writing code and migrations is R1. Applying a migration, deploying Core, deleting duplicate
Schedules, activating a test Publication, uploading playback logs, and cleaning production test
data are separate R0 actions and require action-time approval.

## Repositories and ownership

- Plan and design authority: `/Users/arty/Desktop/Thunder/project/thunder_one_prj`
- Implementation: `/Users/arty/Desktop/Thunder/project/Thunder_Core`
- No ThunderOne source change is expected in this slice. Its existing activation path and proxy
  request/response contract stay unchanged.
- No Windows or Android player change is required while the server continues returning flat
  `slots[]`. Player A1/A2 and `zones[].slots` URL signing belong to the later Layout plan.

Before editing either repository, inspect its branch, `git status`, applicable `AGENTS.md` /
`CLAUDE.md`, and preserve all unrelated changes. At plan-writing time both repositories were on
`feat/layout`; Thunder_Core also had an untracked
`docs/media/PAYLOAD-media-player-jobs-2026-08-25.md`. Do not absorb or overwrite it implicitly.

## Settled decisions — implement these, do not re-open

Both items below were open when this plan was first drafted. Both are now decided and recorded in
`docs/adr/0045-publication-snapshot-materialization.md`. The earlier text of this section recommended
`ON DELETE RESTRICT` on **both** parents; that is **not** what was accepted. Implement what follows.

### Hard deletion — ADR 0045 §10

| FK | Rule |
|---|---|
| `publication_snapshot_items.media_asset_id → media_assets(id)` | **`ON DELETE RESTRICT`** |
| `publication_snapshots.publication_id → publications(id)` | **`ON DELETE CASCADE`** |

The Asset is protected: once materialized into a Publish Job snapshot it cannot be hard-deleted, and
Archive stays the reversible action. This matches `playback_logs.media_asset_id` and
`playlist_items.media_asset_id`, already `RESTRICT`.

The Publication is **not** protected, and `RESTRICT` there would be a mistake:
`publish_jobs.publication_id` is already `ON DELETE CASCADE` (`048_media_core_schema.sql`), so
deleting a Publication destroys its Jobs and Targets today. Restricting the snapshot alone would
protect a record hanging off a Job that still cascades — a dangling half-record and a raw FK error in
a path that currently works. The snapshot follows its Job.

`media_video_delete` gains a snapshot-item guard raising its existing `Already in use:` domain error
before it reaches the DELETE, so the refusal reads as a domain message rather than an FK violation.
**This is a user-visible behaviour change, not a nicer error string**: its current guard only covers
playlists of `kind IN ('user','inline')`, so an Asset whose only playlist is `kind = 'single'` is
deletable today and the function hard-deletes that playlist's Publications. After this change, any
such video that was ever published is permanently undeletable. UI copy and sales need telling.

Retention-driven purging of old snapshots remains a separate destructive workflow and a separate ADR.

Rejected and recorded in the ADR: `CASCADE` on the Asset (destroys the immutable record), `SET NULL`
(breaks poll, checksum and proof-of-play association at once), no FK (dangling content), and
`RESTRICT` on the Publication (half-protection, inconsistent with `publish_jobs`).

### Function replacement — ADR 0045 deployment section

`CREATE OR REPLACE FUNCTION` for all five. No function in this plan changes its identity arguments,
so `DROP` + `CREATE` would add dependency and OID risk without resolving an overload. `DROP` +
`CREATE` is reserved for adding or retyping an identity argument, where `CREATE OR REPLACE` silently
creates an overload instead. Explicit ACL restoration is required either way — see the grants under
"Confirmed facts" below.

## Confirmed facts — do not re-derive from older migrations

### Current implementation bases

Use the latest effective function bodies below. Do not copy older bodies from migrations `070`,
`099`, or `20260821065750` when a later migration exists.

| Function | Identity arguments | Authoritative local body |
|---|---|---|
| `public.media_publication_activate` | `uuid, uuid, uuid` | `supabase/migrations/20260824130000_synchronized_playback_epoch_phase.sql:258` |
| `public.media_job_poll` | `text` | `supabase/migrations/20260824140000_loop_anchor_at.sql:14` |
| `public.media_playback_log` | `text, jsonb` | `supabase/migrations/049_media_core_functions.sql:489` |
| `public.media_publication_download_report` | `text, uuid, integer, timestamptz, jsonb` | `supabase/migrations/20260821065750_publication_download_report.sql:288` |
| `public.media_video_delete` | `uuid, uuid` | `supabase/migrations/085_playlist_inline_kind_and_multi_asset_content.sql:205` |

Immediately before implementation and again before apply, dump `pg_get_functiondef`,
`pg_get_function_identity_arguments`, and current ACLs from the target database. Migration history
has drifted before; the live body is the final authority for preserving unrelated behavior.

The signatures above do not need to change. Prefer `CREATE OR REPLACE FUNCTION` so the function OID
and dependencies survive. Whether replaced or recreated, explicitly enforce:

```sql
REVOKE ALL ON FUNCTION <exact identity> FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION <exact identity> TO service_role;
```

Every function remains `SECURITY DEFINER SET search_path = ''`. Never accept `tenant_id`,
`device_id`, snapshot ownership, or Zone ownership from player input.

### Required consumer that ADR 0045 does not name

`media_publication_download_report` currently validates expected Asset IDs and checksums through
`publications -> playlist_items`. That would make a report for an old Job validate against an edited
Playlist even after poll is snapshot-backed.

Keep its HTTP shape and function signature unchanged. Resolve its already-validated `target_id`
through:

```text
publish_job_targets.target_id
  -> publish_job_targets.job_id
  -> publish_jobs.snapshot_id
  -> publication_snapshot_items
```

Both the expected distinct Asset set and version/checksum verification must come from the Job's
snapshot. It must not rejoin `publications.playlist_id` for Job-specific delivery evidence.

### Production discovery snapshot — refresh before apply

Read-only production discovery on 2026-08-25 found:

- 97 `publish_jobs`
- projected backfill: 97 snapshots, 97 implicit Zones, 192 snapshot items
- 0 Jobs without a Playlist, 0 Jobs with an empty Playlist, 0 Jobs without Targets
- 5 Jobs without a Schedule; all belong to cancelled Publications
- 0 Publications with duplicate Schedules
- 0 Publications with multiple Jobs
- 0 invalid Playlist playback objects and 0 unresolved effective durations
- 12 `playlist_items.file_version_no IS NULL`
- 0 rows in `public.file_versions`
- 12,018 existing `playback_logs`
- production `media_publication_activate` currently has PUBLIC execute privilege even though the
  private Media API contract requires service-role-only access

These counts are evidence, not migration constants. Refresh them immediately before apply. In
particular, backfill every Job independently of Schedule presence, and preserve the current version
fallback `COALESCE(pi.file_version_no, f.current_version_no)` because production has no
`file_versions` rows today.

## Scope

In scope:

- snapshot tables and relational invariants;
- backfill of every existing Publish Job;
- one Schedule per Publication invariant;
- snapshot materialization during activation;
- snapshot-only flat polling;
- snapshot-scoped download-report validation;
- optional snapshot identity in proof of play with whole-batch rejection;
- playback request schema/checks, schema/API documentation, and deployment evidence.

Out of scope:

- Layout tables, Layout editor/wizard, `zones[]`, capability gates, geometry validation, and nested
  signed-URL traversal;
- republish UI/API semantics — current activation accepts `draft` only;
- changing retry or `media_publication_get` for multiple Jobs; record these as follow-ups before a
  real republish endpoint lands;
- playback-log idempotency after a committed response is lost;
- the known `duration_played_seconds` under-report and missing-log defects;
- opportunistic tightening of `played_at` or duration rules;
- historical truth claims for `legacy_backfill` snapshots.

## Phase 0 — documentation and live-contract discovery

### What to inspect

1. Re-read ADR 0045, ADR 0044's dependency boundary, ADR 0031 playback behavior, ADR 0043 loop
   anchor, the device contract, and ADR 0015 broadcast-history retention.
2. Read the latest migrations named in “Confirmed facts” and current routes:
   - `src/app/api/core/v1/media/publications/[id]/activate/route.ts`
   - `src/app/api/core/v1/media/player/jobs/route.ts`
   - `src/app/api/core/v1/media/player/playback/route.ts`
   - `src/app/api/core/v1/media/player/jobs/[id]/publication/route.ts`
   - `src/lib/core/media.ts`
3. Before changing a Next.js Route Handler, read
   `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` in Thunder_Core.
4. Query the target database read-only for table/column/constraint/index state, all five function
   definitions and ACLs, Schedule duplicates, backfill counts, invalid playback metadata,
   unresolved durations, and unresolved file versions.
5. Check current Supabase CLI/MCP help and current official migration/security guidance before using
   a command; do not guess a CLI shape.

### Allowed patterns

- Operator activation: `requireMediaTenant` + `callMedia`.
- Player poll/playback: `requireDeviceToken` + `callMedia`.
- Device resolution: `media_core.resolve_device(text)` inside trusted RPCs.
- Private `media_core` tables with RLS as defense in depth; browser code never queries them.
- `CREATE OR REPLACE FUNCTION` for unchanged identities; exact grants reasserted explicitly.

### Exit checklist

- [ ] The settled decisions above are re-read; the FK directions match ADR 0045 §10 (Asset
      `RESTRICT`, Publication `CASCADE`) and no `DROP FUNCTION` is planned.
- [ ] Both worktrees and applicable instructions are inspected.
- [ ] Live definitions are captured from the intended environment, not inferred from migration
      order.
- [ ] Preflight query returns exact row counts and any offending row IDs without writing data.
- [ ] Any newly discovered invalid legacy value has an explicit handling decision; nothing is
      silently defaulted merely to make the migration pass.

### Guards

- Do not expose `media_core.*` through browser/client code.
- Do not treat localhost as a non-production database; current environment files point to
  production.
- Do not run write-capable E2E suites or fixtures during discovery.
- Do not proceed from stale counts or stale function bodies.

## Phase 1 — author one transactional migration locally

Generate the local filename with `supabase migration new publication_snapshot_materialization`
only after confirming the installed CLI shape with `supabase migration --help`. If the CLI is not
available, stop and restore the approved generator rather than hand-inventing a filename. Do not
apply the migration while authoring.

Keep all compatibility-sensitive DDL, backfill, assertions, and RPC replacements in one migration
transaction so activation and poll cannot be externally observed in incompatible states. Preserve
this internal order.

### 1.1 Create snapshot schema

Create:

```text
media_core.publication_snapshots
media_core.publication_snapshot_zones
media_core.publication_snapshot_items
```

Implement the ADR shape with named checks, explicit comments, indexes, RLS, and tenant-member
SELECT policies copied from the current private Media table pattern. Writes stay RPC-only.

Required relational rules:

- `publication_snapshots.materialization_source` is only `activation` or `legacy_backfill`.
- Asset history uses `ON DELETE RESTRICT`; Publication uses `ON DELETE CASCADE` (ADR 0045 §10).
- Zone geometry is bounded to 0–100 and `x + width <= 100`, `y + height <= 100`.
- Zone playback is a validated, normalized object with `sequential` / `loop` / `first` defaults.
- `(snapshot_id, id)` is unique on Zones so Items can use a composite FK
  `(snapshot_id, snapshot_zone_id)` and cannot point across snapshots.
- `(snapshot_zone_id, position)` is unique; `position >= 0`.
- effective `duration_seconds` is positive and `file_version_no` is resolved at materialization.
- `publish_jobs.snapshot_id` ultimately references a snapshot and is indexed.

`layout_id` and `source_layout_zone_id` are nullable provenance UUIDs with no FK in this migration,
because Layout tables do not exist yet. `aspect_ratio` and `background` remain nullable for flat
snapshots; the later Layout migration owns their zoned constraints and Layout FKs. Do not invent
placeholder Layout tables.

Add `publication_snapshot_id` and `snapshot_zone_id` to `playback_logs`, both nullable for existing
flat/legacy reports. Add a pair CHECK: both are NULL or both are non-NULL. Add a composite FK that
proves the Zone belongs to the snapshot; the RPC still validates Asset-in-Zone and Device targeting.

### 1.2 Audit and constrain Schedule parent cardinality

Fail loudly if any Publication has more than one Schedule. The read-only preflight must show each
duplicate row, ordered by `created_at ASC, id ASC`, and identify which earliest row would be kept.

Do not embed blind duplicate deletion in the generic migration. If duplicates exist at apply time,
stop. Deleting the later live Schedules is a separate R0 action with exact UUIDs and active windows
shown to the user immediately before approval.

Once the audit is clean:

- add `UNIQUE (media_core.schedules.publication_id)`;
- remove the now-redundant non-unique `idx_schedules_publication`.

### 1.3 Backfill every existing Job

1. Add `publish_jobs.snapshot_id` nullable.
2. Create one `legacy_backfill` snapshot per existing Job, regardless of Publication status or
   Schedule presence.
3. Create exactly one implicit full-screen Zone per snapshot:
   `x=0, y=0, width=100, height=100`, role `main`.
4. Normalize that Zone's playback from the source Playlist once, using the current accepted values
   and defaults.
5. Copy the ordered Playlist items into the implicit Zone. Store effective duration and resolve
   `file_version_no` with `COALESCE(pi.file_version_no, f.current_version_no)`; retain the existing
   `file_versions -> files` byte/checksum fallback.
6. Attach each Job to its snapshot.
7. Assert counts and integrity inside the migration: one snapshot and one Zone per Job, no Job with
   null snapshot, no empty snapshot, no cross-snapshot Zone/item pair, and no unresolved duration or
   version.
8. Only after the assertions pass, set `publish_jobs.snapshot_id NOT NULL`.

Use migration-time `created_at` for reconstructed snapshots; do not imply they existed at the
historical Job timestamp. `materialization_source='legacy_backfill'` remains the canonical warning
that the content is reconstructed, not proof of what aired.

### 1.4 Replace activation without changing its API

Start from the latest live/effective `media_publication_activate` body and preserve its synchronized
Channel/direct-target guards and result shape.

Within the existing transaction:

1. lock and validate the Publication as today;
2. resolve the target Device set once into a CTE/array and reuse it for the target count and
   `publish_job_targets` insert; never re-query membership independently;
3. **refuse an empty Playlist.** The function checks only `playlist_id IS NOT NULL` today, which was
   harmless while poll read the Playlist live and simply emitted nothing. A snapshot with zero items
   is a permanent empty broadcast record, and §1.3's backfill assertion already forbids one — the
   activation path must forbid it too, with an `Invalid input:` error naming the Playlist. Cover it
   with a focused check;
4. materialize one `activation` snapshot, one implicit Zone, normalized playback, and snapshot
   items with resolved versions/effective durations;
5. create the Job with its `snapshot_id`;
6. insert Targets from the already-resolved Device set;
7. stop updating `playlist_items.file_version_no`.

Keep the existing function identity and response:
`publication_id`, `job_id`, `target_device_count`.

### 1.5 Replace Job-specific download-report validation

Start from the latest `media_publication_download_report` body. After its existing Device,
`target_id`, delivery-attempt, and Job ownership checks, derive expected Assets and checksums from
that Job's snapshot items. Preserve the route and five-argument RPC identity.

Repeated Assets in different snapshot positions remain one expected downloaded file, matching the
current distinct-Asset report semantics. Version/checksum comes from each snapshot item's pinned
`file_version_no`, with current file fallback where no `file_versions` row exists.

### 1.6 Replace proof-of-play validation

Keep `media_playback_log(text, jsonb)` and existing flat compatibility. Validate the entire JSON
array before a single INSERT:

- both new IDs are null/omitted, or both are non-null UUIDs;
- `snapshot_zone_id` belongs to `publication_snapshot_id`;
- `media_asset_id` appears in that Zone;
- the snapshot belongs to any Job that has ever targeted the reporting Device.

Accept superseded historical snapshots targeted to that Device. Reject mismatched pairs,
Asset/Zone mismatches, never-targeted snapshots, and invalid Assets with an `Invalid input:` error.
One invalid row rejects the whole batch transactionally; do not silently filter rows and do not add
per-row results.

### 1.7 Replace poll last

Start from the latest `media_job_poll` body and preserve priority selection, recurrence/timezone
filters, `delivery_attempt`, flat slot fields/order, signed-file metadata inputs, `server_now`,
`sync_enabled`, `loop_anchor_at`, and jitter.

Select parents before expanding content:

1. one latest Job per `(publication_id, device_id)` ordered
   `pj.created_at DESC, pj.id DESC`;
2. one Schedule per Publication before content expansion;
3. then `publish_jobs.snapshot_id -> snapshot Zone -> snapshot items`.

Remove the expanded-item `DISTINCT ON` completely. Do not re-key it. Poll must never read
`playlist_items` or `playlists`, and Zone playback must be copied to each unchanged flat slot.

### 1.8 Deletion guard and privileges

- Extend `media_video_delete`'s “still in use” guard to detect snapshot-item references and raise its
  existing `Already in use:` error before attempting DELETE.
- Reassert exact function privileges; all changed public Media RPCs are callable only by
  `service_role`.
- Add `COMMENT ON` for every new table/column/constraint-facing concept per ADR 0006.

### Migration exit checklist

- [ ] The migration contains no automatic Schedule deletion.
- [ ] Every Job is backfilled before `SET NOT NULL`.
- [ ] Activation writes snapshots before poll switches to snapshot reads within the transaction.
- [ ] Poll and download report contain no live Playlist join.
- [ ] Snapshot Items cannot point to a Zone in another snapshot.
- [ ] All five changed RPC identities and result/request shapes remain compatible.
- [ ] Function ACLs do not expose `SECURITY DEFINER` RPCs to `PUBLIC`, `anon`, or `authenticated`.
- [ ] Layout provenance columns have no premature FK.

## Phase 2 — playback route schema and focused checks

Files in Thunder_Core:

- extract the inline schema from
  `src/app/api/core/v1/media/player/playback/route.ts` to
  `src/app/api/core/v1/media/player/playback/schema.ts`;
- add optional/nullable UUID fields `publication_snapshot_id` and `snapshot_zone_id`;
- add a schema refinement requiring both to be absent/null or both valid UUIDs;
- pass the parsed pair through unchanged to `media_playback_log`;
- add `schema.check.mts`, copying the standalone `node:assert` pattern from
  `player/jobs/[id]/publication/schema.check.mts`.

Required pure cases:

- [ ] both IDs omitted — accepted;
- [ ] both IDs null — accepted;
- [ ] both valid UUIDs — accepted;
- [ ] only one ID — rejected before RPC;
- [ ] malformed UUID — rejected before RPC.

No change is needed to the activation route or Jobs route for snapshot materialization. Nested
`zones[].slots` signing remains Layout work because this phase still returns only flat `slots[]`.

## Phase 3 — update Core contract documentation

After the SQL and route shapes settle, update from latest code/migration authority:

- `public/swagger-core-v1.json` — playback fields and current jobs/activation descriptions;
- `docs/api/api-overview.md` — snapshot-backed poll, PoP pair, auth/ACL boundary;
- `docs/media/media-core-mapping.md` — snapshot ownership and Job relationship;
- `docs/media/media-core-schema.dbml` — new tables, columns, FKs, checks, and indexes;
- the current player payload reference only if it is intentionally adopted into this change;
- `docs/hidden/SESSION_HANDOFF.md` and a new
  `.docs/SESSIONLOG-publication-snapshot-materialization-<date>.md` after implementation.

The API overview and DBML are already stale in places. Do not copy them back into code; update them
from the latest routes, migration, and post-apply catalog.

## Phase 4 — local/static verification before any R0 action

Run only commands that exist. Do not invent `pnpm test` or add a test runner.

```bash
node "src/app/api/core/v1/media/player/playback/schema.check.mts"
pnpm exec eslint "src/app/api/core/v1/media/player/playback/route.ts" \
  "src/app/api/core/v1/media/player/playback/schema.ts" \
  "src/app/api/core/v1/media/player/playback/schema.check.mts"
jq empty public/swagger-core-v1.json
git diff --check
```

Run `pnpm exec tsc --noEmit`, but report known repository baseline failures separately from any new
errors. A clean focused schema check and ESLint do not prove SQL or HTTP behavior.

If an isolated non-production Supabase database is available, run the migration there, read back
the schema/functions/ACLs, and execute a self-cleaning SQL assertion script copied from
`docs/media/check-synchronized-playback-guards.sql`. Do not embed rollback fixtures inside the
migration transaction itself.

**The fixture must be hostile, not merely foreign.** A snapshot of tenant B that was never targeted
at the Device is rejected by the association invariants long before any tenant check runs, so it
proves nothing. Build it so every association invariant *passes*:

- the Job, snapshot, Zone and Asset all belong to **tenant B**, internally consistent — the Zone
  belongs to the snapshot, the Asset is an item of that Zone;
- a `publish_job_targets` row is deliberately created pointing tenant B's Job at a Device of
  **tenant A**, so invariant 3 is satisfied too;
- tenant A's Device then reports that pair.

The only thing left that can refuse it is an explicit `tenant_id` guard in the RPC. If the report
succeeds, the guard was never written — tenant isolation lives in the RPCs, not in RLS.

Required DB behavior matrix:

- [ ] activation creates snapshot + implicit Zone + items + `job.snapshot_id`;
- [ ] activation no longer changes `playlist_items.file_version_no`;
- [ ] editing the source Playlist after activation changes neither existing Job poll nor download
      report expected files/checksums;
- [ ] republish model `[A,B] -> [A]` emits only `A`, never stale `B`;
- [ ] equal `created_at` Jobs select deterministically by `pj.id DESC`;
- [ ] legacy backfill covers ended/cancelled Jobs and all Job snapshot IDs are non-null;
- [ ] valid snapshot PoP inserts; each invalid invariant stores zero rows for the entire batch;
- [ ] cross-tenant negative: a Device of tenant A is refused a snapshot, Zone and Asset belonging to
      tenant B — see the hostile fixture below;
- [ ] a superseded snapshot previously targeted at the same Device is accepted;
- [ ] flat PoP with both IDs absent remains compatible;
- [ ] hard-delete of a snapshotted Asset returns the domain “in use” error;
- [ ] flat `POST /api/core/v1/media/player/jobs` retains every current slot field and obtains a
      signed URL.

## Phase 5 — production preflight and migration apply (R0)

Immediately before apply, show the user the exact imminent effects and refreshed counts:

- number of Jobs/snapshots/Zones/items to be written;
- any invalid legacy values that would block the transaction;
- exact duplicate Schedule rows, retained row, and would-delete rows if any;
- constraints/tables/columns/functions/ACLs to be changed;
- confirmation that no Layout/player/UI change is included.

Obtain action-time approval. If duplicate Schedules now exist, the generic migration must fail.
Request a separate R0 approval for the exact deletion set, perform it only if authorized, re-audit,
then request approval to apply the migration.

Apply through the project's approved Supabase MCP migration workflow only. Do not use
`supabase db push`, `migration up`, or direct production SQL to bypass migration history.

After apply, read back and compare:

- all new columns, checks, FKs, indexes, comments, RLS, and policies;
- zero `publish_jobs.snapshot_id IS NULL`;
- backfill counts against the refreshed expected counts;
- exactly one function identity for each changed RPC;
- `pg_get_functiondef` against the authored migration;
- ACLs showing `service_role` only;
- Supabase security/performance advisors, with unrelated findings separated.

Do not call catalog checks “behavior verified.” They prove deployment shape only.

## Phase 6 — Core deploy and HTTP/user-layer verification (separate R0)

Deploying the playback route is a separate production mutation and needs its own approval. The DB
function remains backward compatible with old flat payloads, so do not combine deploy approval with
fixture creation or cleanup implicitly.

For HTTP verification, prefer an isolated environment. If none exists, disclose the exact dedicated
production Publication, Playlist, Device, snapshot/log rows, and cleanup effects, then request fresh
R0 approval at the moment of the write.

Verify through actual routes, not direct RPC alone:

- `POST /api/core/v1/media/publications/{id}/activate` — unchanged response shape;
- `POST /api/core/v1/media/player/jobs` — unchanged flat slots and signed URL;
- `POST /api/core/v1/media/player/jobs/{publication_id}/publication` — expected files/checksums
  remain bound to the Job snapshot after source Playlist editing;
- `POST /api/core/v1/media/player/playback` — flat compatibility, valid historical pair, all three
  invalid association cases, and whole-batch rollback.

Do not run the whole existing `player-api.spec.ts` casually against production; heartbeat cases
write telemetry. Do not use general tests under `tests/api/` against production because several
create/delete fixtures. Browser verification of the ThunderOne activation flow requires a fresh
user choice at that point; if skipped, record it as unverified and keep any PR Draft.

## Phase 7 — final evidence and handoff

Record evidence by layer:

1. local/static — exact check, lint, TypeScript, JSON, and diff commands;
2. database shape — applied migration, counts, catalog/function/ACL readback, advisors;
3. HTTP — route requests and responses against the named environment;
4. browser/player — only what was actually exercised on the user-facing path/device.

Update the Core session handoff and session log with exact files, migration status, production side
effects, remaining unverified layers, and prohibited shortcuts. Do not commit, push, deploy, clean
fixtures, or open/merge a PR unless separately instructed.

## Follow-ups that do not block ADR 0045 today

- `media_publication_retry_targets` selects Targets across all Jobs of a Publication; constrain it
  before real republish creates multiple Jobs.
- `media_publication_get` joins Jobs by `publication_id` without selecting a deterministic latest
  parent; fix it with republish semantics.
- Proof-of-play transport idempotency still needs a stable event key if committed-response loss must
  be retry-safe.
- Fix the known duration under-report and missing-log defects before Zone-level PoP multiplies them.
- ADR 0044/Layout adds real Layout FKs, zoned constraints, capabilities, `zones[]`, and nested URL
  signing only after this foundation is verified.
