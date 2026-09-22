# 13: M2 — cleanup migration and contract contraction

**Repo:** Thunder_Core + thunder_one_prj
**Blocked by:** 06, 09, 11, 12 (all deployed)
**Status:** shipped — migrated (develop and prod), production HTTP/browser smoke passed, fixtures removed — GitHub [#111](https://github.com/rdThunderThailand/thunder_one_prj/issues/111)
**Recommended model / effort:** execution tier — the contract and cleanup order are fixed; return to a frontier reasoning model only if the smoke test exposes a design fork

## What to build

Remove the compatibility layer once nothing reads it: drop `channels.sync_enabled`, stop writing `channel_category`, drop `expected_orientation` as an input path, remove legacy `devices[]` / `p_device_ids` / `direct_target_conflicts` from RPCs and routes, and delete the matching frontend fallbacks.

## Closing conditions

- [x] Before dropping `sync_enabled`: develop had 5 Channels and 0 with `sync_enabled = true`; prod had 0 Channels / 0 Publications
- [x] Consumer sweep documented: grep across both repos showed no remaining deployed reader of each removed field before the drop
- [x] Migration `20260915100000_channel_v02_m2_cleanup.sql` applied to develop after both deploys; the full seven-file v02 stack plus M2 then applied to prod as a separate approved R0 batch; schema/signature/privilege post-checks passed
- [x] RPC signatures changed with `DROP FUNCTION IF EXISTS`; routes/zod updated; frontend types drop legacy fields; static checks passed before the PRs merged
- [x] HTTP + browser smoke: deployed Player heartbeat made the fixture selectable; Channel and Group drafts reloaded; an active Group-targeted Publication created one frozen member/job target and completed Player delivery; cancellation then removed effective content
- [x] ADR 0074 Consequences updated to say M2 landed; SESSIONLOG

## Production smoke-test runbook

Goal: prove the deployed path end to end, not merely make the picker look enabled:

`Player heartbeat → Player candidate → Channel draft/reload/activate → synchronized Group → Publication activate → frozen Group expansion → Player poll`

Every production fixture write and the final cleanup are R0. Before each batch, show the exact IDs and affected-row counts and wait for explicit approval.

### Known deployed state

- Frontend: `https://app.thunderone.asia`
- Core: `https://thundercore.vercel.app`
- Tenant: `Thunder Enterprise Master` (`1fa281a7-aff4-4d1d-b22e-e1ed86344157`)
- Production had 0 Channels, 0 Publications, 0 media assets, and 0 playlists before this smoke run
- Dashboard Quick Action `Add Channel` incorrectly links to `/media-workspace/channels/create` and returns 404; tracked by [#115](https://github.com/rdThunderThailand/thunder_one_prj/issues/115). This does not block the `Create Channel` button on the Channels page.

### Fixture naming and identity

Use the prefix `M2 Smoke` and the suffix `DELETE AFTER TEST` for every fixture. Capture every generated database ID before creating the next object; cleanup uses IDs, never name-only deletes.

The Player fixture used in the completed smoke run was:

- `public.assets.id = 68ee7047-0dac-4738-911c-c7ed9a479b76`
- `public.device_credentials.id = 491d1c03-9103-45eb-83b2-cb76f65e5b86`
- name: `M2 Smoke Player — DELETE AFTER TEST`
- `mqtt_client_id = m2-smoke-player-20260915`
- credential token remains secret and must never be logged, copied into documentation, or exposed to the browser

The fixture and all associated smoke data were removed after the verified run. Do not recreate it unless another explicitly approved smoke run is needed.

### Execute

1. Read the fixture token server-side and keep it in memory only. Send `POST /api/core/v1/media/player/heartbeat` to deployed Core with `Authorization: Bearer <token>` and a minimal `1920x1080` heartbeat payload. Assert HTTP 200, `last_heartbeat_at IS NOT NULL`, `connection_status = 'online'`, and `media_channel_player_candidates.never_connected = false`.
2. Reload the deployed Create Channel wizard. Assert the fixture moved from `Unavailable — Never connected` to Available and is selectable.
3. Production has no media asset or playlist. Upload one small test image through the deployed Media Library and create one user playlist containing it. Capture the asset, storage object, playlist, and playlist-item IDs. Do not use a DB-only media row: the publication must exercise the same storage/preview contract an operator uses.
4. In the deployed UI, create `M2 Smoke Channel — DELETE AFTER TEST` as a Draft using the Player. Reload the Draft and assert the same `player.id` round-trips, then activate it and capture the Channel ID/revision.
5. Create `M2 Smoke Group — DELETE AFTER TEST` with `playback_mode = synchronized`, add the Channel, reload, and capture the Group/member IDs.
6. Create `M2 Smoke Publication — DELETE AFTER TEST` with the test playlist and the Group target. Save/reload the Draft before activation and assert the target remains `target_type = 'group'` with the same `group_id`.
7. Activate the Publication. Verify one frozen `publication_snapshot_group_members` row and one `publish_job_targets` row point at the fixture Channel/Player, then call the deployed Player poll endpoint with the same device credential and assert the published job is returned.

### Cleanup

Activation creates history that the normal delete APIs intentionally preserve: `media_publication_cancel` cancels rather than erases an active Publication, and `media_channel_delete` rejects a Channel whose `activated_at` is set. Full fixture removal therefore needs a separately approved transaction after the browser proof.

1. Cancel the active test Publication through deployed Core and verify the Player poll no longer returns its job.
2. Preflight every row reachable from the captured Publication, Group, Channel, playlist/media, and Player IDs. Abort if any dependent row is not one of the captured `M2 Smoke` fixtures.
3. Back up the exact fixture rows needed for recovery, then delete in FK-safe order inside one transaction: Publication-owned targets/snapshots/jobs/history → Publication → Group membership/Group → Channel reservation/device mapping/Channel → playlist items/playlist → media asset and storage object → Player asset. `public.device_credentials` cascades from the Player asset.
4. Commit only after the transaction's internal assertions report the expected row counts. After commit, query every captured ID plus the storage key and prove zero fixture rows/objects remain.

Do not reuse this fixture for later tests: a stale heartbeat, reservation, snapshot, or publication would make subsequent results ambiguous.

### Verified result — 2026-09-15

The deployed frontend and Core completed the full fixture-backed path: heartbeat → candidate → Channel draft/reload → synchronized Group → Group-targeted Publication draft/reload/activation → frozen Group expansion → Player poll/delivery. The Publication was cancelled through the deployed UI, then every captured fixture ID was checked after cleanup. The final production post-check returned zero rows/objects for the Publication, Group, Channel, playlist, media asset, file, Storage object, Player asset, and device credential.

## Artifacts

- `docs/adr/0074-channel-one-player-and-channel-group.md` §2, §3, §5, §7 (what is deferred to cleanup)
- `docs/channels/v02/plan-channel-v02.md` §2 M2
- Memory: `CREATE FUNCTION` grants PUBLIC → re-REVOKE after every recreate
