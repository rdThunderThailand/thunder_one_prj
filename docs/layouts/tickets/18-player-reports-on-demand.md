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
| `Ads_Manager_AndroidApp-dev/.../MainActivity.kt:307` | `sendDeviceProfileOnce(reason = "player_shell")` — `device-profile` is sent **once at startup**, never again |

Shipping the server flag alone would put an R0 migration into production with nothing at the far end
to verify it against, which the working agreement's definition of "done" rules out: a flag no client
fetches cannot be verified at the layer anybody uses.

**Blocked by:** nothing on the server side. It needs player-repo work, which is the actual
constraint.

**Blocks:** 17 — geometry enforcement. Not 16, and not 10: both proceed without this, and ADR 0055
is explicit that they must not be made to wait on player teams.

**Status:** ready-for-grooming. Cross-repo; the player half needs an owner on each platform before
this can be scheduled.

## Acceptance criteria

**Server** (`Thunder_Core`, one migration, `CREATE OR REPLACE` — signature unchanged)

- [ ] `media_heartbeat`'s `profile_required` includes missing geometry: a Device lacking
      `screen_width` or `screen_height` is prompted
- [ ] Its identity clause is corrected from `AND` to `OR` in the same change, so a Device with a
      partial profile is prompted rather than slipping through
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

- [ ] The heartbeat response is parsed rather than reduced to a boolean or a status code
- [ ] `profile_required: true` triggers a `device-profile` send. The call is idempotent by contract,
      so a redundant send is harmless
- [ ] The send is rate-limited — the heartbeat runs every 60 seconds, and a Device the server cannot
      satisfy (a field the build never populates) must not turn that into a profile call per minute.
      Back off, or send at most once per session per prompt
- [ ] The existing startup send is kept. This adds a recovery path; it does not replace the boot path
- [ ] Whatever the build can report, it reports — a build that cannot determine `screen_width` must
      still send the fields it has, or it will be prompted forever

**End to end**

- [ ] A real Device with geometry nulled server-side is prompted on its next heartbeat, sends its
      profile, and stops being prompted — observed on `develop` against an actual player build, not
      simulated with SQL
- [ ] Geometry coverage on production is re-measured afterwards and the figure recorded in ticket 17

## Explicitly not this ticket

- The fit rule, the warnings, the band — **ticket 16**.
- Refusing anything — **ticket 17**, which this unblocks.
- Capability reporting (`player_capabilities`) — deferred by ADR 0054, ticket 08. The flag already
  covers it; no build reports it either, and that is the same problem for a different field.
- Removing the deprecated `screen_ratio` / `screen_dimension` double-write from `media_heartbeat` —
  recorded as debt by ADR 0055 §9. If it is ever done, this is the natural ticket to do it in, but
  it changes a documented player contract and needs its own decision.
