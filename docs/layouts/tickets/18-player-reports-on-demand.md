# 18 — A prompted Device actually re-reports its profile

**Spec:** `docs/layouts/spec-composition-content.md` · **Decided by:**
`docs/adr/0055-geometry-fit-is-advisory.md` §8 (which moved the server half here rather than shipping
it with no reader)

**What to build:** the two halves of one contract, together. The server sets `profile_required` when
a Device's geometry is missing; the player reads that flag off the heartbeat response and re-sends
`device-profile`. Today neither half exists, so nothing the server does can ask a Device for its
screen size — coverage only moves when a screen is restarted or reconfigured on its own schedule.
The flag also drops its capabilities clause so that it can reach `false` at all (ADR 0055 §9).

## Why this is its own ticket, and why it is not in ticket 16

Ticket 16 originally carried the `media_heartbeat` widening on the stated grounds that "prompting
costs nothing and starts the evidence accumulating". Reading the player sources showed that is
false — **no build fetches the heartbeat response body**:

| Where | What it does with the response |
|---|---|
| `Ads_Manager_WindowApp-main/Services/PlayerApiClient.cs:60` | `SendHeartbeatAsync` returns `bool`; the body is read only on failure, to log it |
| `Ads_Manager_WindowApp-main/Services/HeartbeatService.cs:32` | uses that boolean only to set the status string to `"Online"` |
| `Ads_Manager_AndroidApp-dev/.../playerapi/PlayerApiClient.kt:84` | keeps `httpStatusCode`, discards everything else |
| `Ads_Manager_AndroidApp-dev/.../MainActivity.kt:1595` | logs success |

`device-profile` **is** re-sent, but only on triggers the player owns — never on anything the server
says:

| Where | When it profiles |
|---|---|
| `Ads_Manager_WindowApp-main/App.xaml.cs:90` | three triggers: `ContentRendered` at start, a settings change (so a token pasted into a running app is caught), and a debounced display change |
| `Ads_Manager_AndroidApp-dev/.../MainActivity.kt:297` | `showPlayerShell()` calls `sendDeviceProfileOnce`, and four call sites reach it — including returning from Settings — so it is not once per process |

The distinction matters for ticket 17's baseline: coverage is **not** frozen until a reboot, it
drifts whenever a screen is reconfigured. What does not exist is any way for the **server** to ask.

Shipping the server flag alone would put an R0 migration into production with nothing at the far end
to verify it against, which the working agreement's definition of "done" rules out: a flag no client
fetches cannot be verified at the layer anybody uses.

**Where the flag lives in the response.** The route wraps the RPC result:
`return { success: true, data: result }` — so it is **`data.profile_required`**, not top-level. Same
for `device-profile`'s echo, which is `data.profile`.

**Blocked by:** nothing on the server side. It needs player-repo work, which is the actual
constraint.

**Blocks:** 17 — geometry enforcement. Not 16, and not 10: both proceed without this, and ADR 0055
is explicit that they must not be made to wait on player teams.

**Status:** server half **applied to both `develop` and production, verified at SQL layer only** —
production applied 2026-08-28. Migration
`Thunder_Core/supabase/migrations/20260828160000_profile_required_geometry.sql`. The ticket stays
open: the end-to-end criterion needs a real build echoing `profile_required: false` and no player
repo is available, so production's apply is verified the same way develop's was — SQL layer only, no
live device heartbeat exercised against it. Contract settled 2026-08-27 (below). Cross-repo; the
player half needs an owner on each platform before it can be scheduled.

### What was verified on production (2026-08-28)

- `pg_get_functiondef` md5 moved `d4fb6843…` → `1027002b…` — **byte-identical to develop's
  post-apply definition**, same md5 on both environments.
- Exactly one overload, `media_heartbeat(text,jsonb)`.
- Grants: `service_role` and `postgres` (owner) only — confirmed via
  `information_schema.role_routine_grants`; no `PUBLIC`, `anon`, or `authenticated`.
- Pre-apply baseline was read back first and matched the expected prior state (md5 `d4fb6843…`, one
  overload, `player_capabilities IS NULL` present, no geometry clause) before the migration ran.
- **Not done on production:** no live device heartbeat was called. Production has no device set aside
  for this kind of test, and the ticket's own end-to-end criterion targets a real player build against
  `develop`, not production — so this was left as SQL-layer verification, matching how develop's own
  apply was verified.

### What was verified on `develop` (2026-08-28)

- `pg_get_functiondef` md5 moved `d4fb6843…` → `1027002b…`; the `profile_required` expression in the
  deployed body reads exactly the three-clause OR below, and the `telemetry` object is unchanged.
- Exactly one overload, `media_heartbeat(text,jsonb)` — the signature never changed, so
  `CREATE OR REPLACE` replaced rather than overloaded.
- `has_function_privilege`: `service_role` true, `anon` false, `authenticated` false.
- Security advisors: 145 pre-existing findings, **none** naming `media_heartbeat`.
- Probe over the six profile shapes (identity-only, geometry-only, all-present-capabilities-NULL,
  all-present-capabilities-set, partial identity, partial geometry) returns
  `true,true,false,false,true,true`. The third case is the one that used to be stuck `true`.
  The probe evaluates the expression over synthetic rows — no Device records were created or
  mutated, and the RPC itself was not called with a live device token.

## The flag's contract — settled, ADR 0055 §9

`profile_required` was a boolean OR over independent gaps, one of which is
`player_capabilities IS NULL`. **No build sends capabilities:** Windows `DeviceInfo`
(`Models/DeviceInfo.cs`) and Android `PlayerDeviceProfile` (`playerapi/PlayerApiClient.kt:322`) both
carry screen and identity fields only. A player that reports its geometry perfectly was still told
`profile_required: true` on the very next heartbeat, forever — so a client looping until the flag
clears never terminates, and the rate limit below would have hidden that rather than fixed it.

**Decision: drop the capabilities clause.** The flag becomes *"something you can supply is
missing"*:

```sql
'profile_required', (
    v_row.os_version IS NULL OR v_row.machine_name IS NULL
    OR v_row.screen_width IS NULL OR v_row.screen_height IS NULL
)
```

Every shipped build can satisfy all four, so `false` is reachable and the boolean stays a boolean.
Capability prompting returns with **ticket 08**, alongside the build that would answer it.

Rejected: **`profile_required_fields: ["geometry", "capabilities"]`**, letting a client answer only
what it supports. Richer, but it buys the player nothing — both builds construct and POST their
*whole* profile and have no per-field path, so knowing which field is missing changes no behaviour.
It is diagnostics, and a new contract field designed for a consumer that does not exist.

Rejected: **accept the stuck `true`** and weaken the acceptance criterion to "the player does not
re-send during the session". Honest, but it ships a signal that is permanently on and makes every
future reader learn why.

## Acceptance criteria

**Server** (`Thunder_Core`, one migration, `CREATE OR REPLACE` — signature unchanged)

- [x] `media_heartbeat`'s `profile_required` includes missing geometry: a Device lacking
      `screen_width` or `screen_height` is prompted
- [x] Its identity clause is corrected from `AND` to `OR` in the same change, so a Device with a
      partial profile is prompted rather than slipping through
- [x] **`OR v_row.player_capabilities IS NULL` is removed** (ADR 0055 §9), so a Device that reports
      everything a shipped build can report stops being prompted. Verify the reachable `false`
      directly: it is the whole point of the change
- [x] The body is copied from the live definition rather than rebuilt — it carries
      `sync_phase_error_ms` / `sync_loop_duration_seconds`, which an older body would silently drop
- [x] The `telemetry` object is unchanged key-for-key; grants stay `service_role` only
- [x] A SQL probe covers the partial-profile cases: identity present + geometry missing; geometry
      present + identity missing; everything present **with `player_capabilities` still NULL** (the
      case that used to be stuck — it must now return `false`); everything present with
      capabilities set. The first two prompt, the last two do not
- [x] Post-apply verification on both `develop` and production: `pg_get_functiondef` matches the
      file (and matches between the two environments), exactly one overload, grants confirmed
      (`service_role` + owner only), no `PUBLIC`/`anon`/`authenticated`
- [x] Production apply is **R0** and got its own approval — applied 2026-08-28

**Player** (both platforms)

- [ ] The heartbeat response is parsed rather than reduced to a boolean or a status code, reading
      **`data.profile_required`** — the flag is inside the API envelope, not at the top level
- [ ] `data.profile_required: true` triggers a `device-profile` send. The call is idempotent by
      contract, so a redundant send is harmless
- [ ] The send is rate-limited — the heartbeat runs every 60 seconds, and a Device that genuinely
      cannot fill a prompted field must not turn that into a profile call per minute. Back off, or
      send at most once per session per prompt. **This is a backstop, not the mechanism:** the flag
      terminating is what stops the loop — rate limiting only bounds a build that genuinely cannot
      fill a prompted field
- [ ] The players' existing profile triggers are all kept — Windows' start / settings-change /
      display-change, Android's player-shell entry. This adds a server-triggered path; it does not
      replace the ones that already work
- [ ] Whatever the build can report, it reports — a build that cannot determine `screen_width` must
      still send the fields it has, or it will be prompted forever

**End to end**

- [ ] A real Device with geometry nulled server-side is prompted on its next heartbeat, sends its
      profile, geometry becomes complete, **and the following heartbeat returns
      `profile_required: false`** — observed on `develop` against an actual player build, not
      simulated with SQL. The last clause is what the contract decision above exists to make
      possible; if it cannot be met, the ticket is not done
- [ ] Geometry coverage on production is re-measured afterwards and the figure recorded in ticket 17

## Explicitly not this ticket

- The fit rule, the warnings, the band — **ticket 16**.
- Refusing anything — **ticket 17**, which this unblocks.
- **Making players report `capabilities`** — deferred by ADR 0054, ticket 08. This ticket *separates*
  the two by removing the capabilities clause from the flag; re-adding it is ticket 08's job, at the
  point where a build exists that can answer it.
- Removing the deprecated `screen_ratio` / `screen_dimension` double-write from `media_heartbeat` —
  recorded as debt by ADR 0055 §10. If it is ever done, this is the natural ticket to do it in, but
  it changes a documented player contract and needs its own decision.
