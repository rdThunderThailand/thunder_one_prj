# Session log — ADR 0041 scrutinize review + clock-uncertainty spike prep (2026-08-21)

Branch `feat/pubcheck` (thunder_one_prj) and `feat/channel` (Thunder_Core).

## What was asked

Recheck `docs/adr/0041-server-anchored-synchronized-playback.md` (server-anchored synchronized
playback) for whether it's practical against the current system, using the `scrutinize` skill.
Then: what must be settled before implementation, and what does the current poll/heartbeat flow
risk breaking. Then: build the clock-uncertainty measurement spike the review surfaced as the
load-bearing open risk.

## Scrutinize findings (ADR 0041)

Traced every factual claim in the ADR's Context section against the real `media_job_poll` RPC
(`Thunder_Core/supabase/migrations/099_playback_reaches_the_player.sql`) and referenced ADRs
0001/0030/0031/0038/0039/0040. All claims about the current system checked out (poll cadence
55–65s, no server time/version/anchor in the response today, `start_offset_seconds` +
`loop_duration_seconds` shape, mixed-repeat seam deliberately left undefined by ADR 0031, Channel
Group has zero prior art in either repo).

Two real findings, both fixed in the ADR text:

1. **Blocker** — the whole design assumes `clock_uncertainty_ms <= 100` at READY, but no Media
   Device today reports clock quality (only a free-form `app_version`). If real hardware can't hit
   that bound, no device ever reaches READY and every boundary stays permanently `Sync Degraded`.
   Added as a named "Open validation" risk under Consequences, with an inline note at the READY
   definition.
2. **Scope bundling** — the ADR mixes a committed core (anchor/version/capability/READY) with
   several separable, larger decisions (Channel Group persistence, wake-to-poll transport behind
   the Cancel SLO, deterministic shuffle, idempotent enable/disable API) inside one accept/reject
   gate. Added a "Scope status" section splitting committed-now vs. direction-pending.

Two nits also fixed: pinned the pre-shuffle canonical slot order to the existing `099` merge order
(`start_offset_seconds, activated_at, publication_id, position`) so two capable players can't
shuffle from different baselines; softened CONTEXT.md's "applies automatically within one Channel"
to name the legacy-member/Sync-Degraded exception it already implied.

ADR status left as `proposed` — not accepted this session, per the operator's own gate.

## Clock-uncertainty spike

The blocker above needs a number, not an argument. Built a measurement-only path, explicitly not
part of the synchronized-playback protocol:

- `Thunder_Core/supabase/migrations/20260821101500_media_server_time_spike.sql` — new RPC
  `media_server_time(p_device_token)`, same auth as every other player endpoint
  (`media_core.resolve_device`), returns `clock_timestamp()` at microsecond precision. New function
  name, so no `DROP FUNCTION` requirement.
- `Thunder_Core/src/app/api/core/v1/media/player/server-time/route.ts` — GET route following the
  `heartbeat` route's pattern, reports the server-side processing window (`db_start_ms`/
  `db_end_ms`/`xmit_ms`) alongside `db_at` so a client can separate network delay from server time.
- `Thunder_Core/scripts/clock-spike/clock_spike.py` — stdlib-only measurement + report tool. Runs
  a min-of-N NTP-style round trip every poll interval, records cold/single/best-of-burst
  uncertainty, computes clock drift (ppm) via linear regression, and projects uncertainty at 0/60/
  300/900s since last sync against the 100ms READY gate.

Why DB clock, not the API node's clock: `effective_at` is computed and compared inside Postgres, so
measuring against the Vercel node's clock would leave an unmeasured node↔DB skew silently eating
the alignment budget.

## Verified

- `clock_spike.py selfcheck` — recovers a known offset through a simulated round trip (network
  delay 40ms, server window 110ms, stamp taken 60ms into that window) to within 0.1ms; recovered
  uncertainty within 1ms of the expected ~40ms bound.
- Negative control: manually broke the mid-window correction term in a copy of the script — offset
  recovery failed by 79.9ms, confirming the self-check actually catches a broken formula rather than
  passing regardless.
- `report` subcommand run against synthetic (fabricated, clearly labeled) data to confirm the
  percentile/drift/verdict output renders correctly — not a real measurement.
- `npx tsc --noEmit` in Thunder_Core — zero errors attributable to the new route
  (`src/app/api/core/v1/media/player/server-time/route.ts`); the repo's pre-existing ~127 errors
  elsewhere are unrelated and untouched.

## Not verified / explicitly out of scope this session

- The migration has **not** been applied to Supabase (would be live on prod immediately via MCP —
  requires separate approval).
- The route has **not** been deployed (Thunder_Core deploys from `develop`; branch is
  `feat/channel`).
- No real device has ever hit this endpoint. The formula is verified in isolation; the actual
  clock-uncertainty numbers for real hardware do not exist yet — that is the next step, not
  something this session produced.
- ADR 0041 was not marked `accepted`; the `_Provisional_` glossary tags in `CONTEXT.md` were left
  in place.

## Next steps

1. Get approval to apply the spike migration + deploy the route (both prod-affecting, R0).
2. Run `clock_spike.py measure` on real Media Device hardware, ≥24h, across the worst-connected
   network the fleet has.
3. Feed the `report` output's p95-at-60s number back into ADR 0041's 100/125/250ms budgets — either
   confirms them or forces a redesign of the READY gate.
4. Only then reconsider ADR 0041 acceptance.
