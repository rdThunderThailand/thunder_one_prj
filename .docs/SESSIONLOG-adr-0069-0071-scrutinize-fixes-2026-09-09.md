# Session log: ADR 0069-0071 scrutinize fixes

## Requested

Revise the media compatibility ADRs to close the blockers and major findings from the `scrutinize`
review.

## Implemented

- Made ADR 0069's ranged parser follow top-level box offsets to a tail-positioned `moov` and required
  a non-`faststart` regression fixture.
- Made ADR 0070 distinguish Android's profile constant from raw H.264 `profile_idc`, own the WebP
  intake migration, and use a compatible route-first/backfill-last rollout with no unprobed interval.
- Made ADR 0071 use recipe-versioned rendition generations with an atomic pointer swap, separate soft
  timeout handling from hard termination, and close the admission predicate for container, codec,
  geometry, channels, and sample rate.
- Synchronized the Player question document with ADR 0070's `ready + unverified_preset` treatment of
  H.264 Main Profile.
- Removed the grandfathered `ready` status for condemned airing Assets: every condemned Asset becomes
  `failed`, while existing snapshot playback continues because `media_job_poll` has no Asset-status
  filter and future activation is refused.
- Removed `flagged-but-airing` as a conversion-queue branch and assigned the conversion-job table,
  claim/reaper RPCs, lease, attempts, and `timeout_count` to ADR 0071's first migration.
- Replaced ADR 0070's broad failed-status rollback with the exact UUID literal set owned by the
  backfill migration, preserving Assets quarantined by the already-deployed probing route.

## Verification

- Re-read every changed contract section against the current Thunder_Core registration RPC, upload
  route, `media_job_poll`, and Player signing route.
- Searched all affected documents for the seven original superseded claims plus the grandfathered
  airing, special queue-population, and incomplete migration-ownership claims; none remained.
- Ran whitespace checks on every changed document.

No implementation, database migration, browser flow, or production state was changed or tested.
