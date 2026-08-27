# 17 — Unprofiled Devices are refused a Composition

**Spec:** `docs/layouts/spec-composition-content.md` · **Decided by:** `docs/adr/0044-multi-zone-layout.md` §4
(the staged exception recorded there; this ticket is what expires it)

**What to build:** the second half of ADR 0044 §4's rule — a Media Device that has **never reported**
its geometry is refused a composition Publication, instead of warning and publishing. One condition
flips; everything it depends on was built in ticket 16.

**Why it is a separate ticket:** ticket 16 is complete the moment a known-unfitting Device is refused
and `profile_required` prompts for geometry — that is what unblocks ticket 10, and it should be
closable then. This flip cannot be closed on the same schedule: it waits on the fleet, which is
outside anyone's control here. Keeping both lifecycles in one ticket would leave ticket 16
permanently open behind a measurement it does not need.

**Blocked by:** 16 — Layout ↔ target geometry fit (the check, and the widened `profile_required` that
makes recovery real)

**Blocks:** nothing. Ticket 10 deliberately does not wait on this — see ticket 16's *Blocks*.

**Status:** blocked — waits on a fleet readiness threshold that is **not yet set**.

## The readiness threshold

Not decided here, and it must be a number rather than a judgement call. Set it at grooming, against a
re-run of the measurement below, and write the chosen figure into this ticket before implementation.

**Baseline, read-only, 2026-08-27** — complete geometry means `orientation` and both
`screen_width`/`screen_height` are non-null:

| Environment | Complete | Total |
|---|---|---|
| `develop` (`ftfmokgphewzyxzwjitv`) | 4 | 13 |
| production (`sfiefevtxalqjizdkcsw`) | 4 | 12 |

```sql
select count(*) as devices,
       count(*) filter (where a.orientation is not null
                          and a.screen_width is not null
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
- [ ] `media_publication_activate` refuses a composition Publication whose resolved target set holds a
      Device with no reported geometry, naming the Devices, in the same place and the same message
      shape ticket 16 built for known mismatches
- [ ] Step 3's existing unprofiled-Device warning becomes a step 5 block, reusing ticket 16's
      component and copy rather than adding a second path
- [ ] `publish-eligibility.check.mts` gains the unprofiled-Device block case
- [ ] The staged exception note in ADR 0044 §4 is **marked expired, not deleted** — carrying the
      date it expired, the threshold that was chosen, and the measurement that met it. The reasoning
      for why unknown geometry was once allowed through must survive; deleting it would leave §4
      reading as if the rule had always been enforced. Same treatment §11 got from ADR 0054
- [ ] ADR 0054's geometry bullet is rewritten from present-tense staged behaviour into historical
      completion — what the two stages were, and when the second landed — rather than being cut
- [ ] Post-apply verification: `pg_get_functiondef` diffed against the migration file, exactly one
      overload, grants confirmed with `has_function_privilege`, advisors show no new finding
- [ ] Scratch-tenant SQL probe: an unprofiled Device is refused by name; a Device that reports
      geometry after being prompted then publishes successfully
- [ ] Verified in the browser at steps 3 and 5

## Explicitly not this ticket

- The fit rule itself, and the `profile_required` widening — **ticket 16**.
- Decoder capacity — deferred by ADR 0054, ticket 08.
