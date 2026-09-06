# 27 — Zone Properties: Content / Layout / Behavior

**Issue:** https://github.com/rdThunderThailand/thunder_one_prj/issues/57
**Repo:** `thunder_one_prj`
**Decided by:** `docs/adr/0063-create-layout-flow-phase-1.md` §6
**Plan:** `docs/layouts/Phase1/plan-create-layout-flow.md` FE-4
**Design:** `docs/layouts/Phase1/Layout Editor With Content.png`
**Blocked by:** 25 (the file split)
**Runs in parallel with:** 26
**Status:** not started

## What to build

Three tabs on the right-hand Zone panel, showing only what the player actually reads.

## Context — ADR 0063 §6

> The *Behavior* tab exposes `composition_zones.playback` as it already exists — `play_mode`,
> `repeat`, `start_from` (ADR 0062). Duration is **read-only**, derived by `totalZoneDurationSeconds`;
> the frames show it as an editable field on a Zone bound to a Playlist, where the number is the sum of
> the Playlist's items and cannot be set at the Zone.
>
> **Fill Mode and Mute stay out**, on ADR 0052 §7's reasoning, which the schema confirms: `media_fit`
> exists on *Playlist* metadata, not per Zone, and `mute` exists nowhere. A per-Zone Fill Mode would
> also silently override the Playlist's own. Both need the player, which is another repository.
>
> **Transition stays per item**, where it is today.
>
> **`Apply to All Zones` applies the Behavior tab only**, and the button says so. Unqualified, it reads
> like it copies content.

## Checklist

- [ ] Content tab: the existing `ZoneContentPicker` — Playlist or picked assets
- [ ] Layout tab: the Zone's x / y / width / height as percentages, with the pixel readout beside them
      when `reference_resolution` is known (`geometry.ts`)
- [ ] Behavior tab: `play_mode`, `repeat`, `start_from`. **Nothing else**
- [ ] Duration is read-only, from `totalZoneDurationSeconds`
- [ ] `Apply to All Zones` is labelled with its scope, e.g. *Apply playback settings to all Zones*
- [ ] No Fill Mode control, no Mute toggle, no editable Duration
- [ ] Zone Overview under the canvas reports each Zone's **actual** bound source — Playlist, Media, or
      unbound. The frames label a widget-rendered Zone as `Media`; with Widgets deferred there is no
      such case

## Verification

- [ ] Browser: set a Zone to shuffle + once, save, reload, preview — the preview plays it that way
      (ADR 0062 is the contract the preview follows)
- [ ] `Apply to All Zones` changes playback on every Zone and changes no binding
- [ ] A Zone bound to a Playlist shows that Playlist's summed duration and offers no way to edit it
