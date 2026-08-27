# 18 — A prompted Device actually re-reports its profile

**Spec:** `docs/layouts/spec-composition-content.md` · **Decided by:**
`docs/adr/0055-geometry-fit-is-advisory.md` §8 (which moved the server half here rather than shipping
it with no reader)

**What to build:** the two halves of one contract, together. The server sets `profile_required` when
a Device's geometry is missing; the player reads that flag off the heartbeat response and re-sends
`device-profile`. Today neither half exists, so a Device that has never reported its screen size is
never asked again — and the fleet only converges when someone reboots a screen.

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

**Status:** blocked — **DECISION PENDING** on the flag's contract (below). Not ready-for-agent until
that is settled. Cross-repo; the player half also needs an owner on each platform.

## DECISION PENDING — the flag has no reachable `false`

`profile_required` is a boolean OR over independent gaps, and one of them is
`player_capabilities IS NULL`. **No build sends capabilities:** Windows `DeviceInfo`
(`Models/DeviceInfo.cs`) and Android `PlayerDeviceProfile` (`playerapi/PlayerApiClient.kt:322`) both
carry screen and identity fields only. So a player that reports its geometry perfectly is still told
`profile_required: true` on the very next heartbeat, forever. A client that loops on the flag never
terminates, and the rate limit below would only be hiding that — which is worse than no flag,
because it looks like it works.

Three ways out, to be decided before this ticket is scheduled:

1. **Drop the capabilities clause; prompt only for what a build can supply.**
   `profile_required := (identity gap) OR (geometry gap)`. Every shipped build can satisfy both, so
   `false` is reachable and the boolean stays a boolean. Capability prompting returns with
   ticket 08, alongside the build that would report it. ADR 0054 kept the clause on the grounds that
   prompting "accumulates evidence" — a rationale already retracted (see its Decision 9 correction),
   so removing it follows the correction rather than reversing a live decision.
2. **Report the reasons: `profile_required_fields: ["geometry", "capabilities"]`.** Richer, and it
   lets a client answer only what it supports. But note what it buys the player: nothing. Both
   builds construct and POST their *whole* profile regardless — they have no per-field path — so
   knowing which field is missing changes no behaviour. It is diagnostics, and it is a new contract
   field designed for a consumer that does not exist yet.
3. **Accept the stuck `true`** and weaken the acceptance criterion to "geometry becomes complete and
   the player does not re-send during the session", recording the multi-reason boolean as debt.
   Honest, but it ships a signal that is permanently on and asks every future reader to know why.

**Recommendation: 1.** It is the only option that gives the flag a terminal state, it removes a
condition rather than adding one, and it costs nothing that is not already deferred.

## Acceptance criteria

**Server** (`Thunder_Core`, one migration, `CREATE OR REPLACE` — signature unchanged)

- [ ] `media_heartbeat`'s `profile_required` includes missing geometry: a Device lacking
      `screen_width` or `screen_height` is prompted
- [ ] Its identity clause is corrected from `AND` to `OR` in the same change, so a Device with a
      partial profile is prompted rather than slipping through
- [ ] The flag has a reachable `false` — whatever the pending decision above settles on, a Device
      that reports everything a shipped build can report must stop being prompted. A check that
      cannot terminate is not shippable
- [ ] The body is copied from the live definition rather than rebuilt — it carries
      `sync_phase_error_ms` / `sync_loop_duration_seconds`, which an older body would silently drop
- [ ] The `telemetry` object is unchanged key-for-key; grants stay `service_role` only
- [ ] A SQL probe covers the partial-profile cases: identity present + geometry missing; identity
      present + capabilities present + geometry missing; geometry present + identity missing;
      everything present. The first three prompt, the last does not
- [ ] Post-apply verification on both environments: `pg_get_functiondef` matches the file, exactly
      one overload, grants confirmed with `has_function_privilege`, advisors show no new finding
- [ ] Production apply is **R0** and gets its own approval

**Player** (both platforms)

- [ ] The heartbeat response is parsed rather than reduced to a boolean or a status code, reading
      **`data.profile_required`** — the flag is inside the API envelope, not at the top level
- [ ] `data.profile_required: true` triggers a `device-profile` send. The call is idempotent by
      contract, so a redundant send is harmless
- [ ] The send is rate-limited — the heartbeat runs every 60 seconds, and a Device that genuinely
      cannot fill a prompted field must not turn that into a profile call per minute. Back off, or
      send at most once per session per prompt. **This is a backstop, not the answer to the pending
      decision above:** if the flag has no reachable `false`, rate limiting hides a permanent loop
      instead of fixing it
- [ ] The players' existing profile triggers are all kept — Windows' start / settings-change /
      display-change, Android's player-shell entry. This adds a server-triggered path; it does not
      replace the ones that already work
- [ ] Whatever the build can report, it reports — a build that cannot determine `screen_width` must
      still send the fields it has, or it will be prompted forever

**End to end**

- [ ] A real Device with geometry nulled server-side is prompted on its next heartbeat, sends its
      profile, geometry becomes complete, **and the following heartbeat returns
      `profile_required: false`** — observed on `develop` against an actual player build, not
      simulated with SQL. The last clause is the one the pending decision above exists to make
      possible; if it cannot be met, the ticket is not done
- [ ] Geometry coverage on production is re-measured afterwards and the figure recorded in ticket 17

## Explicitly not this ticket

- The fit rule, the warnings, the band — **ticket 16**.
- Refusing anything — **ticket 17**, which this unblocks.
- **Making players report `capabilities`** — deferred by ADR 0054, ticket 08. Note that this is not
  a clean separation today: the flag currently fires on `player_capabilities IS NULL`, which is
  exactly why it has no reachable `false`. Settling the pending decision above is what separates
  them.
- Removing the deprecated `screen_ratio` / `screen_dimension` double-write from `media_heartbeat` —
  recorded as debt by ADR 0055 §9. If it is ever done, this is the natural ticket to do it in, but
  it changes a documented player contract and needs its own decision.
