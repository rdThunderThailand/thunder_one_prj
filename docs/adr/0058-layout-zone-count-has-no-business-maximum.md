# Layout Zone count has no business maximum

**Status:** accepted · **Date:** 2026-08-31 · **Supersedes:** ADR 0044 §3 only where it caps a Layout at four Zones

A Layout must contain at least one positive-area, in-bounds Zone and its Zones still may not overlap, but authoring and persistence impose no business maximum on their count. The former cap of four came from the first UI slice and made valid five- and six-Zone designs impossible; transport-level request-size and timeout protection remain trust-boundary safeguards, not a hidden Zone-count rule.

## Consequences

- Frontend and backend validators remove `MAX_ZONES` and every `> 4` branch while retaining completeness, bounds and overlap checks.
- Split Zone remains available regardless of current count when the selected Zone can be split into positive-area children.
- Overlap validation may remain simple until profiling shows it is a bottleneck, but it must no longer rely on four Zones for correctness or safety; the backend uses a set-based check rather than a cap-dependent procedural loop.
- ADR 0054 remains in force: publish does not read `max_video_zones`. A high-Zone Composition can reach hardware that cannot decode every video Zone concurrently, and may stutter, drop video or fail. Capacity enforcement requires its own future ADR backed by player reporting and real hardware measurements.

## Rejected alternatives

- A larger or tenant-configurable cap preserves an arbitrary product rule without evidence.
- Removing request-size protection together with the business cap exposes an avoidable resource-exhaustion path.
- Enabling a guessed device-capacity gate in this change would present unmeasured hardware assumptions as safety.
