# 17 — Geometry enforcement turns on

**Spec:** `docs/layouts/spec-composition-content.md` · **Decided by:**
`docs/adr/0055-geometry-fit-is-advisory.md` §10 (which made the whole rule advisory and put both
halves of enforcement behind this ticket) · originally `docs/adr/0044-multi-zone-layout.md` §4

**What to build:** geometry stops being advisory. A composition Publication is refused when a
targeted Media Device's reported geometry does **not fit** the Layout, and when a Device has **never
reported** geometry at all. Both conditions flip together; everything they depend on was built in
ticket 16, which computes both outcomes and today only warns about them.

**Why both halves are here, and not one in ticket 16:** ADR 0055 §10. They are gated on the same
condition — enough Devices reporting complete geometry, and a recovery path that actually prompts —
so splitting them invents a dependency between two switches that flip together. Ticket 16 is complete
the moment the warning ships and `profile_required` prompts for geometry; that is what unblocks
ticket 10 and it should be closable then. This ticket cannot be closed on the same schedule: it waits
on the fleet, which is outside anyone's control here.

**Blocked by:** 16 — Layout ↔ target geometry fit (the fit module, the warnings, and the widened
`profile_required` that makes recovery real)

**Blocks:** nothing. Ticket 10 deliberately does not wait on this — see ticket 16's *Blocks*.

**Status:** blocked — waits on a fleet readiness threshold that is **not yet set**.

## The readiness threshold

Not decided here, and it must be a number rather than a judgement call. Set it at grooming, against a
re-run of the measurement below, and write the chosen figure into this ticket before implementation.

**Baseline, read-only, 2026-08-27** — complete geometry means both `screen_width` and
`screen_height` are non-null. `orientation` is **not** part of it: ADR 0055 derives orientation from
the two dimensions rather than trusting the column, so a Device is measurable the moment it reports
them. Re-run the query below rather than reusing this number; the `profile_required` widening in
ticket 16 is expected to move it without any player-side work.

| Environment | Complete | Total |
|---|---|---|
| `develop` (`ftfmokgphewzyxzwjitv`) | 4 | 13 |
| production (`sfiefevtxalqjizdkcsw`) | 4 | 12 |

```sql
select count(*) as devices,
       count(*) filter (where a.screen_width is not null
                          and a.screen_height is not null) as complete_geometry
from public.assets a
join public.device_credentials dc on dc.asset_id = a.id and dc.is_revoked = false;
```

Before ticket 16, the ratio may change when a player profiles for another reason — a boot, a config
change, a monitor being plugged in — which is how the 4 in each column got there. What does not exist
yet is a **guaranteed or bounded convergence mechanism**: until `profile_required` prompts for
geometry, nothing asks an unprofiled Device again, so the ratio can drift upward by luck but cannot
be driven to a target. Ticket 16 is what makes the number something this ticket can wait on.

## Acceptance criteria

- [ ] The readiness threshold is written into this ticket as a figure, with the date and the
      measurement it was taken from
- [ ] The measurement is re-run against production and meets that threshold **before** any code
      changes — if it does not, the ticket goes back to blocked rather than shipping a refusal
- [ ] `media_publication_activate` refuses a composition Publication whose resolved target set holds
      a Device that does not fit **or** has no reported geometry, naming the Devices and which of the
      two it is, in the message shape activation's existing refusals use (`Invalid input: …`, names
      aggregated). It reuses the target Device array activation already resolves exactly once and
      never re-queries Channel membership (ADR 0045 §8)
- [ ] The refusal uses ticket 16's fit module verbatim — the same orientation derivation and the same
      15% band — so the server and the wizard cannot disagree about what fits
- [ ] Step 3's warnings stay warnings; step 5's warning becomes a block, reusing ticket 16's
      component and copy rather than adding a second path
- [ ] `publish-eligibility.ts` gains its gating row and `publish-eligibility.check.mts` the
      corresponding cases — both were deliberately left untouched by ticket 16 (ADR 0055 §7)
- [ ] A new ADR supersedes `docs/adr/0055-geometry-fit-is-advisory.md`, recording the threshold, the
      measurement that met it, and the date. 0055 is **marked superseded, not deleted** — the
      measured reasons geometry was advisory must survive, or the rule reads as if it had always been
      enforced. Same treatment §11 got from ADR 0054 and §4 got from 0055
- [ ] ADR 0054's geometry bullet and ADR 0044 §4's superseded-by note are rewritten from present-tense
      staged behaviour into historical completion — what the stages were, and when the last landed —
      rather than being cut
- [ ] Post-apply verification: `pg_get_functiondef` diffed against the migration file, exactly one
      overload, grants confirmed with `has_function_privilege`, advisors show no new finding
- [ ] Scratch-tenant SQL probe: an unprofiled Device is refused by name; a Device whose geometry does
      not fit is refused by name; a fitting Device publishes; a Device that reports geometry after
      being prompted then publishes successfully
- [ ] Verified in the browser at steps 3 and 5

## Explicitly not this ticket

- The fit module, the wizard warnings, and the `profile_required` widening — **ticket 16**.
- Decoder capacity — deferred by ADR 0054, ticket 08.
- Re-tuning the 15% aspect band. If the threshold measurement shows the band is wrong, that is a
  finding to record and decide on its own evidence, not a knob to turn while flipping enforcement.
