# Player contract v2 — zoned payload

Hand-off spec for the Windows (`Ads_Manager_WindowApp`) and Android (`Ads_Manager_AndroidApp`)
players. Decisions and rationale: `docs/adr/0044-multi-zone-layout.md`,
`docs/adr/0049-composition-layout-with-content.md` (a Layout's content lives on a **Composition**, and
`role` is dropped), `docs/adr/0050-wide-layouts-across-monitors.md` (geometry precision, spanning
several monitors). Snapshot semantics this depends on:
`docs/adr/0045-publication-snapshot-materialization.md`. This document is the shape only.

**Nothing here changes the existing single-zone path.** A Publication without a Composition returns
the same `slots[]` payload it returns today, forever. Zones are an alternative shape, not a
replacement.

## Endpoint

`POST /api/core/v1/media/player/jobs` — unchanged, device token in the request as today. Only the
response body gains a branch.

**Server-side change required in the route, not just in the RPC:** the handler currently signs asset
URLs by walking `result.slots` only. It must also walk `result.zones[].slots`, or every asset in a
zoned payload arrives with `file.url = null`.

## Branching rule

```
if (response.data.zones != null)  → zoned rendering
else                              → existing flat slots[] rendering, untouched
```

`zones` and `slots` are mutually exclusive; the server never sends both. The server also guarantees
that a zoned response comes from exactly **one** Publication — equal-priority overlap involving a
Layout is refused at publish time (ADR 0044 §8), so the player never has to merge or arbitrate
between competing Layouts.

## Zoned response

```jsonc
{
  "success": true,
  "data": {
    "device_id": "…",
    "server_now": "2026-08-25T09:14:02Z",       // ADR 0042
    "loop_anchor_at": "2026-08-25T09:00:00Z",   // ADR 0043 — top-level, shared by every zone
    "sync_enabled": true,                        // ADR 0042
    "next_poll_after_seconds": 61,               // unchanged
    "publication_snapshot_id": "…",              // ADR 0045 — echo back in playback logs
    "layout": {
      "name": "Corporate Lobby 3-Zone",
      "aspect_ratio": "16:9",
      "background": "#000000"
    },
    "zones": [
      {
        "snapshot_zone_id": "…",                 // NOT the Layout's zone id — see below
        "name": "Main Content",
        "x": 0, "y": 0, "width": 100, "height": 55,
        "loop_duration_seconds": 62,
        "slots": [ /* identical to today's slot objects */ ]
      },
      {
        "snapshot_zone_id": "…", "name": "News",
        "x": 0, "y": 55, "width": 50, "height": 45,
        "loop_duration_seconds": 45,
        "slots": [ /* … */ ]
      }
    ]
  }
}
```

### Zone object

| Field | Type | Notes |
|---|---|---|
| `snapshot_zone_id` | uuid | stable for the life of this snapshot; echo it back verbatim in playback logs. Same name on the wire, in the schema (`publication_snapshot_zones.id` as referenced by `playback_logs.snapshot_zone_id`) and in the ADRs |
| `name` | string | operator-facing label, not a rendering input. There is no `role` field: it was advisory, duplicated `name`, and is dropped (ADR 0049 §2) |
| `x`, `y`, `width`, `height` | number | **percent of display area**, 0–100, **three decimal places** — three equal columns are `33.333`, and at 5760 px wide one tenth of a percent is 5.76 px (ADR 0050 §1) |
| `loop_duration_seconds` | int | this Zone's own loop, independent of every other Zone |
| `slots` | array | **the existing slot object, unchanged in every field** |

The id is deliberately the snapshot's, not the Layout's: a Layout can be edited after publish, so a
Layout zone id maps to several geometries over time and cannot identify what actually aired. The
Layout's own zone id is never sent to the player.

### Guarantees the server holds to

- At most **4** Zones, from exactly **one** Publication.
- Zones **never overlap**. There is no `z` field and no compositing order to resolve.
- Zones **may not tile the display**. Paint uncovered area with `layout.background`.
- Each Zone has at least one slot; empty Zones are not sent.
- `x + width <= 100` and `y + height <= 100`.
- Geometry is percent against `layout.aspect_ratio`, and stays percent however wide the surface is.
  One machine may span several monitors — `SpanAllDisplays` positions the window across the virtual
  desktop and the reported `screen_width` follows (ADR 0050 §5). Several machines driving one image
  in step is still out of scope.

### Slot object

**Identical to whatever the flat path emits today — every field, no exceptions.** That currently
means `start_offset_seconds`, `duration_seconds`, `kind`, `transition`, `publication_id`,
`target_id`, `delivery_attempt`, `media_asset_id`, `starts_at`, `ends_at`, `file`, and `playback`
(`play_mode` / `repeat` / `start_from`, ADR 0031) — but this list is descriptive, not normative: the
two paths build slots from the same code and must never diverge.

`playback` is stamped per slot exactly as today. Its values come from the slot's Zone
(`docs/adr/0045-publication-snapshot-materialization.md` §2), so Zones in one Layout may carry
different play modes — a looping main Zone beside a play-once ticker.

`PlayerTimelineSlot` (C#) and `PlayerTimelineSlot` (Kotlin) need no change; only their container
does.

## Synchronization

Per ADR 0043, evaluated **per Zone** with that Zone's own duration and the shared top-level anchor:

```
phase_seconds = (server_now_unix − loop_anchor_at_unix) mod zone.loop_duration_seconds
```

`loop_anchor_at` is already returned on the flat path today; the zoned path carries the same field in
the same place. It is **not** per Zone — one Publication owns the response, so one anchor applies to
all of its Zones.

No cross-Zone coordination, no master Zone, no readiness handshake.

## Playback logs

`PlayerPlaybackLog` gains two optional fields:

```jsonc
{
  "media_asset_id": "…",
  "publication_snapshot_id": "…",   // echo from the poll response
  "snapshot_zone_id": "…",          // echo from zones[].snapshot_zone_id
  "played_at": "…",
  "duration_played_seconds": 17
}
```

Both are **omitted or null for full-screen playback** — existing single-zone reporting is unchanged
and existing rows keep their meaning. In zoned mode, report one log line per Zone.

**Echo the values verbatim; do not construct them.** The server validates all three of the following
and **rejects the log line** — it does not null the fields and store the row — if any fails:

1. `snapshot_zone_id` belongs to `publication_snapshot_id`.
2. `media_asset_id` is an item of that Zone.
3. `publication_snapshot_id` belongs to a Job targeted at the Device this token resolves to.

A mismatched pair, or a snapshot never targeted at this Device, is rejected. **Historical snapshots
remain valid** — a player that was offline across a republish uploads logs against the snapshot it
actually aired, and that upload is accepted however old the snapshot is.

Rejection is **whole-batch and transactional**: one invalid row rejects the entire upload and nothing
is stored, so a retry re-sends the same batch without risking duplicates. Fix or drop the offending
row and re-send; do not assume partial acceptance.

## Capability reporting

Capabilities go on the **device-profile** call (`POST /api/core/v1/media/player/device-profile` →
`public.media_device_profile_set`), not on the 60-second heartbeat. They change only when the app or
the hardware changes, which is exactly what that endpoint was added for (`096_media_device_profile.sql`).

```jsonc
{
  "os_version": "…", "machine_name": "…", "screen_width": 1920, "screen_height": 1080,
  "capabilities": { "multi_zone_v1": true, "max_video_zones": 1 }
}
```

| Key | Meaning |
|---|---|
| `multi_zone_v1` | this build renders the `zones[]` payload |
| `max_video_zones` | how many Zones containing video this build/hardware can decode concurrently |

The server compares `max_video_zones` against **the number of Zones holding at least one item of
`kind: "video"`**, not the number of video items — Zone loops run independently, so all such Zones
can be playing video at the same phase.

Cheapest correct implementation: **hardcode both per build.** No runtime probing. Change the number
when it has been measured on real hardware and it ships with the next release — no migration, no
backend deploy.

### How the server uses it

- A device that has not reported `multi_zone_v1` **never receives** a zoned payload; activation is
  refused at publish time. Write no defensive fallback — silently rendering only the first Zone is
  the failure mode this gate exists to prevent.
- A Layout needing more video Zones than a target device's `max_video_zones` is refused the same way.
- **Unknown counts as failing.** `media_heartbeat`'s existing `profile_required` flag is widened to
  fire when `player_capabilities` is null, so a device that has never reported is re-prompted on
  every heartbeat rather than waiting for a reboot. Players must keep honouring `profile_required`.

## Known prerequisites on the player side

From `AUDIT_Player_Gaps_Priority.md`:

- **A1 — content component abstraction.** Playback is currently inlined as `if Image / else if Video`
  in `PlayerViewModel.ExecutePlay` with no disposal contract. Zoned rendering means N concurrent
  component lifecycles; the audit already names A1 the prerequisite for all of Bucket B. The Android
  player has no equivalent abstraction either.
- **A2 — MPV.** Aurora ran three concurrent video Zones on MPV. This stack uses WPF `MediaElement`
  and `android.widget.VideoView` (`minSdk 24`, no ExoPlayer/media3), targeting Android 7 boxes that
  commonly expose one hardware H.264 decoder. Until A2, `max_video_zones` will be small, so Layouts
  with more than one video Zone are refused on a single screen.
- **A6 — multi-monitor. The audit entry is wrong and A6 is largely already done.** The current player
  already subscribes to `SystemEvents.DisplaySettingsChanged` (`App.xaml.cs:112`) with a two-second
  debounce, so plugging in a monitor already re-reports the profile. What is left is one config flag
  and one window-positioning change (ADR 0050 §5). A2 remains the real constraint on how many video
  Zones a wide Layout may hold.
- **Vestigial `MediaItems.Zone`.** `SyncService.cs:122` assigns `Zone = slot.TargetId` — an ID
  carrier, not a Zone. Remove or rename it before real Zones land.

## Deliberately not in this contract

Scenes / scene carousels, `angle`, `opacity`, `z`, `role`, per-Zone schedules, per-Zone priority,
per-Zone anchors, widget or live-data Zones, styled or scrolling ticker text, multi-**machine** video
walls, and `compositions[]` (multiple Layouts in one response — deferred, see ADR 0044 §9). See
ADR 0044 and ADR 0049 for why each was rejected or dropped.
