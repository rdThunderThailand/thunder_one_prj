# SESSIONLOG — capacity deferral (ADR 0054) + geometry fit gets an owner (2026-08-27)

Second half of the same session as `SESSIONLOG-ticket07-develop-rehearsal-2026-08-27.md`.
Model: Opus (design fork), doc execution stayed on Opus because reviews kept surfacing forks.

## How it started

Picked up ticket 08 (capability gate). Stopped before writing code: it was a design fork, not
execute work. Ran `grilling` over four rounds — 16 questions, every one answered — and wrote
ADR 0054 specifying a gate with an operator override.

**Then the PO changed the requirement.** Direction became: Composition publish and `zones[]` ship
now; decoder capacity is deferred, with no fake gate and no fake override. ADR 0054 was rewritten
from scratch to the opposite decision.

The first ADR 0054 was not wasted — its Consequences section had already named the thing that killed
it: *"Composition publishing is refused for the entire fleet the day this reaches production."*

## Decided

- **ADR 0054** — `Composition publishing proceeds without device-capacity enforcement`. Separates
  **publish contract** (server materializes a snapshot, payload carries `zones[]`) from
  **device-capacity policy** (how many video Zones a player can decode). First ships, second waits.
- ADR 0044 **§11 marked superseded, not deleted**. Same treatment applied everywhere since.
- **Ticket 08** rewritten as deferred future work. First prerequisite is *a new ADR superseding
  ADR 0054* — the deferral cannot authorise its own reversal.
- **`capability_override` withdrawn entirely**, not deferred. Its input would be an operator's guess
  about a number the build hardcoded untested.
- **Ticket 16 created** — Layout ↔ target geometry fit. Found during review: ADR 0044 §4 defines fit
  as *two* rules; Channel↔Device ships, Layout↔target was marked "new" and never had a ticket. It had
  been riding along beside §11, and deferring §11 nearly took it with it.
- **Ticket 17 created** — the unknown-geometry flip, holding the readiness threshold. Split out of 16
  so 16 can actually close.

## Found the hard way

- **`layout_zones.role` is `main|sidebar|ticker|secondary`** — positional, not media kind. Ticket 08's
  "max_video_zones below what the **Layout** requires" was impossible as written; the count is a
  property of the Composition's bindings.
- **`media_heartbeat`'s `profile_required` does not check geometry.** It is
  `(os_version IS NULL AND machine_name IS NULL) OR player_capabilities IS NULL`. A Device missing
  only `orientation` is never re-prompted. The fleet *looks* self-healing purely because no Device is
  in that state yet. I claimed self-heal as a property in an earlier draft; it is not, and ticket 16
  now owns widening the flag.
- **`media_heartbeat` has diverged between environments.** develop has the column, the capabilities
  clause and 3-arg `media_device_profile_set`; production has none of them. So ticket 16's
  `CREATE OR REPLACE` cannot serve both, which makes **ticket 07's production apply a schema
  prerequisite for ticket 16** — pulled forward out of the enforcement phase.
- **Fleet geometry, measured read-only:** develop 4/13, production 4/12 have `orientation` +
  dimensions. Enforcing §4's "unknown fails" today refuses 8 of 12 production Devices — the same
  failure shape ADR 0054 had just rejected for capability, at 67% instead of 100%.

## Committed (branch `feat/layout`, NOT pushed)

| repo | hash | what |
|---|---|---|
| thunder_one_prj | `a2d8f1e` | `fix(auth)` — proxy login-loop fix (someone else's, committed alone) |
| thunder_one_prj | `8e1ba50` | capacity deferral — 13 files, ADR 0054 + supersede annotations + spec/contract/plans + tickets 07/08/12 |
| thunder_one_prj | `a8f47ae` | geometry fit owner — 8 files, tickets 16/17 + §4 staged exception + 07 sequencing + ticket 10 |

6 files carried both concerns; split at hunk level with `-U0`, verified commit 1 has no ticket 16/17
leakage. Working tree byte-identical to the pre-split snapshot afterwards.

Thunder_Core unchanged this half (still `4a830e4`, 11 unpushed).

## NOT done

- **Nothing pushed.** thunder_one_prj +12, Thunder_Core +11.
- **No code or migration touched** — deliberate, this was a documentation round.
- Ticket 06 scenario G still unverified → PR opens as **Draft**.
- Ticket 07 production apply — R0, not done, now a prerequisite for 16.
- Ticket 17's readiness threshold — no number set.

## Gotchas for next time

- **zsh does not word-split unquoted variables.** `git checkout HEAD -- $FILES` passed the whole
  string as one pathspec and silently did nothing. List paths explicitly.
- **Hunk splitting needs `-U0` + `--unidiff-zero`.** Default context merges adjacent hunks and any
  index-based classification silently misassigns them.
- **Take a filesystem snapshot before splitting commits.** Restoring from it is how both failed
  attempts cost nothing.
- The migration `20260826093000_media_device_capabilities.sql` still says *"that is ticket 05"* in two
  comments. Correct value is ticket 08. Left alone — this round did not touch code.
