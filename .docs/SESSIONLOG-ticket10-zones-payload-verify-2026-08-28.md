# SESSIONLOG — Ticket 10 zoned job-poll verification — 2026-08-28

## Outcome

Ticket 10's server payload and Core HTTP route were verified against the persistent `develop`
Supabase branch `ftfmokgphewzyxzwjitv`. No migration was applied in this session: the migration was
already present on develop and production as `zones_payload_in_job_poll`.

## Develop evidence

- `public.media_job_poll(text)` has one overload, emits `zones`, and contains no DML.
- A real composition Publication job was polled without exposing its device token. The payload had
  `zones` and no top-level `slots`: 2 Zones, 6 total nested slots, one shared `loop_anchor_at`, and
  every Zone had flat percent geometry keys (`x`, `y`, `width`, `height`),
  `loop_duration_seconds`, and `slots`.
- A real flat Publication still returned top-level `slots` only: 1 slot and no `zones`.
- Core `POST /api/core/v1/media/player/jobs` returned HTTP 200 for the composition Device. It had
  2 Zones / 6 nested slots and all 6 nested `file.url` values were signed. The server-side test read
  the token only inside the process and printed no secret.
- `node src/app/api/core/v1/media/player/jobs/signable-slots.check.mts` passed.

## Production read-only evidence

- `public.media_job_poll(text)` has one overload, emits `zones`, and is executable by
  `service_role` only; `anon` and `authenticated` cannot execute it.
- Security Advisor reported existing INFO findings for unrelated public tables; none were introduced
  by this function-only migration.

## Remaining boundary

This proves RPC and HTTP delivery shape, not screen rendering. A real player build still has to
consume `zones[]` to claim playback verification.
