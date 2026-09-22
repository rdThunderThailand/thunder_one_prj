# 14: Live View (sub-project D) — parked, needs its own design session

**Repo:** Thunder_Core + thunder_one_prj
**Blocked by:** 07 (Channel detail panel exists), and a new `/grill-with-docs` session — **do not start from this file alone**
**Status:** parked — GitHub [#97](https://github.com/rdThunderThailand/thunder_one_prj/issues/97) (the issue carries the approach guidance; not part of the Channel v02 publish)
**Recommended model / effort:** **frontier reasoning tier, high effort** for the design session (player protocol, telemetry storage, snapshot/CDN decisions are hard-to-reverse); implementation tier decided by that session.

## Why this ticket exists

Every Channel v02 document says Live View is out of scope, but the mockups for it sit in the same
design folder, so an agent working ticket 07 will see "Open Live View" on D1 and wonder where it
went. It went **here**: ticket 07 renders the button disabled or hidden, and nothing else in
01–13 touches Live View.

## What the mockups describe (evidence only — no decision made)

- `00.5.1 Live view Modal (single screen).png` / `(multi screen).png` — a modal from the Channel
  detail showing what the Player reports is playing, per screen for multi.
- `02 Live view - Architecture & Development Roadmap.png` — three phases: **1** playback proof
  from player telemetry (heartbeat, current program/media, playback position, output status,
  device health); **2** periodic/on-demand screenshots via object storage + CDN; **3** WebRTC
  real-time stream.

## What already exists that Phase 1 could reuse (facts, verified 2026-09-11)

- `publish_job_targets.status` (`pending → downloading → delivered → playing`), `acked_at`.
- Heartbeat route and `assets.last_heartbeat_at`; `media_screen_get` returns current playback.
- Now & Next (ADR 0057) already distinguishes Scheduled Now / Playback Confirmed / Playback stale.
- Player reports one `screen_dimension`; **no per-output status, no screenshot, no stream** —
  Phases 2–3 need a player protocol change outside both repos.

## Closing conditions (for the design session, not for code)

- [ ] `/grill-with-docs` run on Phase 1 scope only; ADR written if any decision is hard to reverse
- [ ] Decide whether Phase 1 is a new modal or an entry point into Now & Next
- [ ] Tickets produced with the same closing-conditions + artifacts format as this folder

## Artifacts

- `docs/channels/v02/plan-channel-v02.md` §0 rows D10, D17 (out of scope), §2 "Out of scope"
- `docs/adr/0074-channel-one-player-and-channel-group.md` Consequences (Live View deferred)
- `docs/adr/0057-channel-first-now-and-next.md`; CONTEXT.md **Now & Next**, **Publish Job Target**
- Mockups: `00.5.1 Live view Modal (single screen).png`, `00.5.1 Live view Modal (multi screen).png`, `02 Live view - Architecture & Development Roadmap.png`
