# Plan: synchronized playback (ADR 0042)

Short R1 plan. No test runner in either repo (`Thunder_Core` and `thunder_one_prj` both ship
`dev/build/start/lint` only) — no red-green TDD; one runnable self-check is left where logic is
non-trivial per ponytail.

Spec: `docs/adr/0042-epoch-phase-synchronized-playback.md`.

## Thunder_Core — one migration file

`supabase/migrations/20260824120000_synchronized_playback_epoch_phase.sql`, not applied this
session (R0).

1. `ALTER TABLE media_core.channels ADD COLUMN sync_enabled boolean NOT NULL DEFAULT false`
2. `ALTER TABLE public.assets ADD COLUMN sync_phase_error_ms integer, ADD COLUMN sync_loop_duration_seconds integer`
3. `media_job_poll` (`public`, no signature change): add `server_now` via `clock_timestamp()`, add
   `sync_enabled` looked up through `channel_device_reservations` (unique per device — the row that
   actually reserves the device, not every Draft membership), append `s.id` to the `DISTINCT ON`
   `ORDER BY` tiebreaker.
4. `media_heartbeat` (`public`, no signature change): read `phase_error_ms` /
   `loop_duration_seconds` from `p_payload`, write to the two new `assets` columns, echo them in the
   `telemetry` object.
5. `media_publication_activate` (`public`, no signature change): before mutating, block a
   `device`-type target whose device sits in a `sync_enabled` channel. Error prefixed
   `Invalid input:` (the only prefix `callMedia` passes through unmodified).
6. `media_core.channel_set_devices` (no signature change): block only *new* device additions
   (`NOT EXISTS` in current `channel_devices`) to a `sync_enabled` channel that already carry an
   active/scheduled direct-target Publication. Existing members are grandfathered — that's decision
   Q6.
7. `media_core.channel_rows` (no signature change): add `'sync_enabled', c.sync_enabled` and
   `'direct_target_conflicts'` — a `jsonb` array of Publication names, from a new lateral join
   mirroring `channel_blocking_publications`'s query shape but scoped to `target_type = 'device'`.
8. `public.media_channel_create`, `public.media_channel_update`: **signature change** — append
   `p_sync_enabled boolean DEFAULT false`. Both need `DROP FUNCTION IF EXISTS <exact old signature>`
   first (CLAUDE.md §6 trap) and `GRANT EXECUTE ... TO service_role` re-added after, since DROP+CREATE
   is a new function OID and grants do not carry over. Confirmed today: both are currently granted to
   `service_role` only.

Self-check: `docs/media/check-synchronized-playback-guards.sql` — two `DO` blocks exercising both
guards (`channel_set_devices` blocking a new addition, `media_publication_activate` blocking a
fresh direct-target activation). Deliberately **not** embedded in the migration file: a migration
typically applies as one wrapping transaction, so a check that ends in `ROLLBACK` there would
discard the whole migration, not just its own fixture rows. Run by hand, in its own session,
against a branch — never directly against prod. Ponytail: this is the one non-trivial logic added
(the two guards); the rest is column additions and payload plumbing, no check needed there.

## Thunder_Core — route/schema files

- `src/app/api/core/v1/media/channels/schema.ts`: add `sync_enabled: z.boolean()` to
  `channelCreateSchema` (inherited by `channelUpdateSchema`).
- `src/app/api/core/v1/media/channels/route.ts` (POST): pass `p_sync_enabled: input.sync_enabled`.
- `src/app/api/core/v1/media/channels/[id]/route.ts` (PATCH): same.
- `src/app/api/core/v1/media/player/heartbeat/route.ts`: add `phase_error_ms: z.number().optional()`
  and `loop_duration_seconds: z.number().int().nonnegative().optional()` to `heartbeatSchema`.
- `src/app/api/core/v1/media/player/jobs/route.ts`: no change — `PlayerJobsResult` already has a
  catch-all index signature, `server_now`/`sync_enabled` pass through.

## thunder_one_prj — types and API layer

`src/features/communication/channels/`

- `types/index.ts`: add `sync_enabled: boolean` and `direct_target_conflicts: string[]` to
  `ChannelListItem`; add `sync_enabled: boolean` to `ChannelDraftInput`.
- `services/channels-api.ts`: `parseChannelListItem` validates the two new fields;
  `CreateChannelBody`/`UpdateChannelBody` gain `sync_enabled: boolean`;
  `buildCreateChannelBody` sends `draft.sync_enabled`.

## thunder_one_prj — editor wiring

- `hooks/useChannelEditorData.ts`: `ChannelFormValue` gains `syncEnabled: boolean`.
- `hooks/editor-mapping.ts`: `emptyForm.syncEnabled = false`; `detailToForm` reads
  `detail.sync_enabled`; `toDraft` sets `sync_enabled: form.syncEnabled`; also pass through
  `detail.direct_target_conflicts` for the warning (read directly from `data.detail`, not form state
  — it isn't user-editable).
- `components/ChannelBasicInfoSection.tsx`: `ChannelBasicInfoValue` gains `syncEnabled: boolean`; a
  new checkbox + inline warning listing `direct_target_conflicts` when non-empty and the toggle is on.
  Not blocking — matches Q6 (b).

## Verification this session

Done:
- `thunder_one_prj`: `tsc --noEmit` repo-wide — 0 errors. `eslint` on every changed file — clean.
  All 6 runnable checks touched or added pass:
  `channels/channel-logic.check.mts`, `channels/services/channels-api-contract.check.mts`,
  `channels/list-filtering.check.mts`, `publications/channels-logic.check.mts` (all updated for the
  two new `ChannelListItem`/`ChannelDraftInput` fields), plus `list-url-state.check.mts` and
  `list-filtering.check.mts` re-run unchanged for regression.
- `Thunder_Core`: `eslint` on every changed route/schema file — clean. `tsc --noEmit` on the changed
  files — 0 new errors (repo baseline is ~127 pre-existing errors, unrelated to this change — see
  `thunder-core-tsc-never-clean` memory). `schema.check.mts` updated for the new required
  `sync_enabled` field and re-run — passes.

Not done (needs the migration applied first, which is R0 — separate approval):
- The migration itself: not applied to prod or any branch.
- `docs/media/check-synchronized-playback-guards.sql`: not run.
- HTTP-level or browser verification of any kind.
