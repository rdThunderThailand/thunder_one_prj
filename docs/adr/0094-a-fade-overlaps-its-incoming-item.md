# A fade overlaps its incoming item

**Status:** accepted · 2026-10-14
**Supersedes:** ADR 0062 §5 (transition timing only — the kind/length fallback chain and the crossfade stay)
**Source:** player team `PLAYER_LAYOUT_CONTRACT_REQUIREMENTS_2026-10-14.md` §3.4; owner chose option A
**Related:** `0042-epoch-phase-synchronized-playback.md`, `0060-playlist-editor-single-page.md` (§5a, background), `0064-zone-media-presentation.md`

## Context

ADR 0062 §5 made a transition **add** time: a three-item Playlist of 10 s items with the default
`fade`/1 s read 32 s in the editor and the preview, and the ADR stated that this was what the device
would take per cycle. It never was. `media_job_poll` builds `start_offset_seconds` and
`loop_duration_seconds` from `duration_seconds` alone, and synchronized playback (ADR 0042) anchors
every device to that axis. The device loop is 30 s, so the editor and the preview disagreed with
every screen for any Playlist using `fade`, which is almost every Playlist.

The player team proposed the device-side rule for Android and Windows: the transition belongs to
the incoming slot, counts inside that slot's time and never moves the timeline.

While checking that contract, the preview was also found to paint neither the Layout `background`
nor a slot's `background_color`. Every Zone was black.

## Decision

1. **A transition adds no time.** Item starts and the cycle length are media durations only, the
   same `start_offset_seconds` / `loop_duration_seconds` the device receives. This applies to the
   editor's Total duration and ruler too, since they read the same `zoneSchedule()`.
2. **A fade plays over the first seconds of its incoming item's slot.** It starts on the slot
   boundary and lasts `min(transition_duration, item duration)`. The outgoing item holds its last
   frame and the incoming item plays from its own start. The outgoing item is never cut short.
3. **The wrap fade sits at the start of the cycle on the device.** On `repeat: loop` with more than
   one item, the first item fades in from the last over its own first seconds. On `repeat: once` it
   has nothing to fade from. The preview does not draw the wrap fade: its clock gives every cycle the
   same `t`, so a fade at `t = 0` would leave a paused preview showing the last item.
4. **The preview paints the background.** The Layout's `background` goes under every Zone, and a
   slot's `background_color` goes under that slot's media, where `fit` leaves the frame uncovered.
   `null` paints nothing, so the Layout colour shows (ADR 0060 §5a). A Playlist on its own has no
   Layout and stays black.

## Alternatives

- **Backend adds transition time to the loop** (keep ADR 0062 §5 and move the device to it): needs
  a change to `media_job_poll` on production and shifts the time sync and proof-of-play axis for
  every device. That costs far more than fixing the preview.
- **Fade over the tail of the outgoing item** (ending on the boundary): cuts content the operator
  timed, and contradicts the player's own rule that the transition belongs to the incoming slot.

## Consequences

- The editor's Total duration drops back to media-only for every Playlist that uses `fade`. A
  three-item 10 s Playlist reads 30 s again, and now that number matches the screen.
- ADR 0062's rejected alternative ("a crossfade that overlaps the outgoing item instead of adding
  time") is effectively what this ADR accepts, with the overlap moved into the incoming slot. That
  reopens AC 10-12 of ticket 86d3xxk5u, which asked for transitions to add time.
- The preview cuts into the first item at each wrap where the device crossfades. To fix that, the
  frame function needs the unwrapped clock time.
