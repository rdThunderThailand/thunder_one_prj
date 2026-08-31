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

> **Accepted and stored; not enforced.** ADR 0054 defers device-capacity enforcement until a player
> build actually reports and the number has been measured on real hardware. The wire shape below is
> final and a player may send it today, but in this phase the server compares nothing, refuses
> nothing, and a missing field or a `NULL` blocks no publish.

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

When enforcement is eventually turned on, `max_video_zones` will be compared against **the number of
Zones holding at least one item of `kind: "video"`**, not the number of video items — Zone loops run
independently, so all such Zones can be playing video at the same phase. That counting rule is
settled; the enforcement is not.

Cheapest correct implementation: **hardcode both per build.** No runtime probing. Change the number
when it has been measured on real hardware and it ships with the next release — no migration, no
backend deploy.

### How the server uses it today

- **It stores it, and nothing more.** `media_device_profile_set` accepts `capabilities` and writes
  `public.assets.player_capabilities`. A non-object value is rejected with
  `Invalid input: capabilities must be an object`; a call that omits the field leaves the stored
  value untouched.
- **Reporting is not required of a player in this phase.** A build that never sends `capabilities` is
  fully supported.
- **`NULL`, an absent `capabilities` object, or a missing `max_video_zones` key blocks no publish.**
  Every Device receives a zoned payload for a composition Publication regardless of what it has or
  has not reported.
- **Enforcement is deferred** (ADR 0054) until there is a player implementation that reports and a
  hardware validation of the number. Turning it on is a new ADR and ticket, not a config change.

## `profile_required` — shipped 2026-08-28, server half only (ticket 18)

> **Status: on `develop` only. Not yet on production.** The contract below is final and safe to
> build against, but no player build reads it yet — that is the work this section hands off.

The heartbeat response (`POST /api/core/v1/media/player/heartbeat` →
`public.media_heartbeat`) wraps the RPC result the same way every route does:
`{ "success": true, "data": { ... } }`. **The flag is `data.profile_required`, not top-level.**

```jsonc
// POST /api/core/v1/media/player/heartbeat response
{
  "success": true,
  "data": {
    "device_id": "…",
    "received_at": "2026-08-28T09:00:00Z",
    "profile_required": true,
    "telemetry": { /* unchanged — app_version, storage, sync_phase_error_ms, … */ }
  }
}
```

`profile_required` is `true` when any of these four fields is missing on the server's stored Device
record: `os_version`, `machine_name`, `screen_width`, `screen_height`. It is `false` once all four
are present — **every shipped build can satisfy all four today**, so `false` is a reachable, real
target, not a permanent `true` as the previous (superseded) version of this flag was.

**`player_capabilities` is deliberately not part of this flag.** No shipped build sends
`capabilities` (see the section above), so including it made the flag permanently stuck at `true`.
Capability prompting returns with ticket 08, alongside a build that can answer it — do not read
`profile_required` as a signal about capabilities in the meantime.

### What a player build must do

- Parse the heartbeat response body and read `data.profile_required`. Today's builds discard it
  entirely — Windows reduces the response to a `bool`, Android to an HTTP status code. Both must
  start reading the body.
- `data.profile_required === true` → send `device-profile` (`POST …/device-profile` →
  `media_device_profile_set`). The call is idempotent by contract; a redundant send is harmless.
- **Rate-limit the send.** The heartbeat runs every ~60 seconds; a Device that genuinely cannot
  determine one of the four fields must not turn that into a `device-profile` call every minute.
  Back off, or send at most once per session per prompt. This is a backstop, not the mechanism — the
  flag reaching `false` is what stops the loop for every build that *can* fill the fields.
- **Keep every existing profile trigger.** Windows' start / settings-change / display-change,
  Android's player-shell entry. This flag adds one more, server-triggered, path — it replaces none
  of the ones that already work.
- Send whatever the build can determine, even if one field is unknown. A build that cannot read
  `screen_width` must still send the fields it has, or the flag never clears and it is prompted
  forever.

### Verified so far (SQL layer, `develop` only)

`pg_get_functiondef` diff, single overload, `service_role`-only grant, and a 6-case probe over
identity/geometry combinations — full detail in `docs/layouts/tickets/18-player-reports-on-demand.md`.
**Not yet verified:** a real player build actually reading the flag and the following heartbeat
returning `false` — that is the acceptance criterion this hand-off exists to satisfy, and production
will not receive this change until it has been.

## Known prerequisites on the player side

From `AUDIT_Player_Gaps_Priority.md`:

- **A1 — content component abstraction.** Playback is currently inlined as `if Image / else if Video`
  in `PlayerViewModel.ExecutePlay` with no disposal contract. Zoned rendering means N concurrent
  component lifecycles; the audit already names A1 the prerequisite for all of Bucket B. The Android
  player has no equivalent abstraction either.
- **A2 — MPV.** Aurora ran three concurrent video Zones on MPV. This stack uses WPF `MediaElement`
  and `android.widget.VideoView` (`minSdk 24`, no ExoPlayer/media3), targeting Android 7 boxes that
  commonly expose one hardware H.264 decoder. Until A2, a single screen realistically decodes one
  video Zone. Nothing refuses a Layout that asks for more (ADR 0054) — it will simply play badly on
  hardware that cannot keep up, which is the accepted risk of this phase.
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
