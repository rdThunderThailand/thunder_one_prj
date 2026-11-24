# Synchronized playback ignores shuffle and resume

**Status:** accepted · 2026-10-14
**Source:** player team contract response `PLAYER_CONTRACT_RESPONSE_2026-10-14.md` Q6; owner chose the recommended option
**Related:** `0031-playback-behavior-reaches-the-player.md` (left this open), `0041-server-anchored-synchronized-playback.md` (proposed a seed formula, never accepted), `0042-epoch-phase-synchronized-playback.md`, `0062-the-preview-plays-what-the-playlist-says.md`, `0074-channel-one-player-and-channel-group.md`

## Context

`playback.play_mode: "shuffle"` and `playback.start_from: "resume"` reach the player per slot (ADR
0031), and the server deliberately does not shuffle: slot order and `start_offset_seconds` are the
shared axis every device uses to find its place in the loop.

When `sync_enabled` is true (top-level on the `media_job_poll` response, Channel Group boundary per
ADR 0074), every device must show the same slot at the same moment. A per-device shuffle breaks that
on the first loop, and so does resume, which is each device's own memory of where it stopped. No
accepted ADR says what a player does here. ADR 0041 proposed
`hash(timeline_id, timeline_version, publication_id, loop_index)` as a shared seed, but it was
superseded before acceptance and the poll carries none of those inputs.

## Decision

1. **With `sync_enabled: true`, the player treats `play_mode: "shuffle"` as `"sequential"` and
   `start_from: "resume"` as `"first"`.** Order and position come only from the slot list,
   `loop_anchor_at` and `server_now`, as ADR 0042/0043 already define.
2. **With `sync_enabled: false`, shuffle and resume stay per-device.** Two devices may show
   different orders, and a device does not have to reproduce the web preview's order (the preview
   seeds from `zone.id`, ADR 0062, so its scrubber is reproducible; that is a preview concern only).
3. The server contract does not change: no new field, and `playback` is sent as stored.

## Alternatives

- **Shared deterministic shuffle (pinned PRNG + seed from `publication_id` and loop index):** keeps
  shuffle under sync, but Android and Windows must implement a bit-identical algorithm, and every
  future player must match it. Nobody has asked for shuffle on a synchronized group yet.
- **Server sends `shuffle_seed`:** needs a migration and still needs the pinned PRNG above, so it
  costs everything the previous option does plus a contract field.
- **Server reorders slots when shuffle is on:** breaks the `start_offset_seconds` axis from one poll
  to the next (ADR 0031).

## Consequences

An operator who sets Shuffle or Resume on content that airs on a synchronized Channel Group gets
sequential, from-the-start playback on screen. The setting is saved and takes effect again if sync
is turned off. Thunder One does not warn about this yet; a warning beside the Play Mode / Start From
controls when the content targets a synced group is a separate UI change. If shuffle under sync is
wanted later, alternative 1 is the upgrade path; this decision does not block it.
