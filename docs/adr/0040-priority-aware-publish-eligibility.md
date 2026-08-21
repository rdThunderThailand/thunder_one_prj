# Priority-aware Publish eligibility

**Status:** accepted (2026-08-21)

Schedule overlap is not an automatic Publish failure. A Draft may be published when every overlapping Publication has lower or equal Publication Priority: lower tiers will be suppressed and equal tiers will share the playback loop. Publish is blocked when any overlap has a higher tier, or while the conflict result is loading or unavailable. This supersedes only the conflict rule in ADR 0002; its single-source-of-truth eligibility design remains accepted.

## Considered options

- **Block every overlap:** rejected because it prevents the priority-override behavior already enforced by playback.
- **Allow every overlap as a warning:** rejected because an operator could knowingly activate a Publication that will not air during the overlap.
- **Allow higher or equal priority:** chosen because it matches playback while preventing a lower-priority Draft from being activated into a known fully suppressed window.

## Consequences

Schedule and Review surfaces must distinguish whether the Draft suppresses, appends with, or would be suppressed by each conflict. Allowed warnings publish directly without an additional confirmation step.
