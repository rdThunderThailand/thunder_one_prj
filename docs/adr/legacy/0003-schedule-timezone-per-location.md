# Schedule times are wall-clock, resolved per-Channel via Location time zone

§4.7 lists a single "Time zone" field on Publication, but Publications can target multiple Channels (see Publication in `CONTEXT.md`) whose Locations may span different time zones.

We chose **local wall-clock per Channel**: Schedule start/end times carry no baked-in time zone of their own. At Job-evaluation time, each Channel's own Location time zone is applied — a "09:00–18:00" Schedule fires at 09:00 local time in every target Location independently, not at one shared instant. The Publication's own "Time zone" field (§4.7) is demoted to a display default (useful when a Publication happens to target a single time zone) — it is not the evaluation source of truth.

**Why:** this matches what a DOOH operator actually means by "run 9-to-6" across multiple locations — local business hours everywhere, not one shared UTC-anchored instant. The alternative (shared instant) would fire Publications at odd local hours for Channels outside the Publication's nominal time zone.

**Status:** accepted.
