# Session Log — Now & Next

## Scope

Implemented the first Now & Next frontend slice and added the Core read-model migration/route
without applying or deploying either.

## Changes

- `/media-workspace/publications` now mounts `NowNextPage`.
- Existing Publication management remains available at `/media-workspace/publications/manage`.
- Added typed `GET /media/now-next` client contract and UI controls for search, 60-minute/3-hour
  horizon, idle Channels and 60-second refresh.
- Added Core `media_now_next_get` migration and authenticated HTTP route. The first server slice
  reuses `media_publication_get`; effective player-resolver parity and conflict fixtures remain a
  follow-up before production use.

## Verification

- Frontend `next typegen`: passed.
- Frontend `tsc --noEmit`: passed.
- Frontend `pnpm lint`: passed.
- Frontend build: blocked by unavailable Google Fonts network fetch.
- Core route-specific ESLint: passed.
- Supabase develop branch (`ftfmokgphewzyxzwjitv`): applied
  `now_next_read_model`, `now_next_idle_channels` and `now_next_deduplicate_idle` after explicit
  approval. The main project was not touched.
- Function ACL: `postgres` and `service_role` only; `PUBLIC`, `anon` and `authenticated` cannot
  execute the tenant-id-taking `SECURITY DEFINER` function.
- RPC: default hidden-idle response returns 0 rows and reports 3 active Channels; include-idle
  returns exactly the 3 active Channels rather than one row per Publication target.
- HTTP/browser: authenticated frontend request succeeds with no backend-error state. The 60m/3h
  horizon, Show idle Channels and Channel search were exercised successfully; controls were reset
  to their defaults afterward.
- Core full TypeScript: baseline failures and `tsconfig.tsbuildinfo` permission error; unrelated
  existing errors remain.
- Browser verification: authenticated read-only check passed for the Now & Next shell and the
  `/media-workspace/publications/manage` route. The Now & Next page correctly shows disabled
  controls and an honest "backend read model is not available yet" state because Core has not been
  deployed/restarted with the new route. An initial hydration issue from placing a Skeleton `div`
  inside a paragraph was reproduced from browser logs, fixed by using a block container, and the
  page was reloaded without the issue overlay. No mutations were performed.

## Blockers

- Core migrations are applied only to the Supabase develop branch; main remains unchanged.
- The read model must gain resolver-parity fixtures before it is considered production-ready.
