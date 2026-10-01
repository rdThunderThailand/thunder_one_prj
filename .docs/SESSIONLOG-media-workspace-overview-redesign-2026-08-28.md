# Media Workspace Overview Redesign — 2026-08-28

## Scope

Redesign `/media-workspace` around the supplied operator dashboard mockup.

## Changes

- Updated the page header to `Overview` with focused Create and AI Assistant actions.
- Rebuilt the responsive dashboard hierarchy around status tiles, current publication state, alerts, schedule, channel health, quick actions, and activity.
- Kept `NowNextPublicationsCard` connected to the existing publications API.
- Marked all other overview data as placeholders in `mock-data.ts`; no monitoring or reporting API contract was inferred.
- Linked quick actions only to existing routes and left unavailable actions disabled.
- Replaced the generic Channel Distribution donut with Channels by Type icon tiles
  for Screens, TV, PA / Audio, and Kiosks.
- Split the middle dashboard row into Now Playing, Next Program, and Needs
  Attention cards to match the supplied mockup.
- Rebuilt the lower dashboard zone with real Channel and Publication reads:
  device health, channel types, today's schedules, and a `updated_at`-derived
  activity feed. There is no event-log endpoint, so the feed is not an audit log.
- Fixed Activity Feed SVG icons to use explicit `h-4 w-4 shrink-0` sizing after
  the color class overrode their default intrinsic dimensions.
- Moved Activity Feed below Quick Actions in the lower right dashboard column.
- Integrated Now Playing and Next Up with real Publication details. Now Playing
  requires a target in `playing`; Next Up selects the earliest future
  `playback_window.next_opens_at`; both refresh every 60 seconds.
- Added skeleton loading states for every Overview surface that fetches data:
  program status, schedule, channel health, channels by type, and activity.
- Fixed Now Playing selection: it now requires both a `playing` target and
  `playback_window.state = 'open'`, so ended Publications cannot remain visible.

## Verification

- `pnpm exec tsc --noEmit` passed.
- `pnpm lint` passed with three pre-existing warnings in Playlist ReviewStep and PreviewStage.
- `git diff --check` passed.
- Authenticated browser verification at `http://localhost:3000/media-workspace`
  rendered the Overview with no browser console errors.
- Desktop comparison at `1600x1000` exposed a visual gap: the shell/dashboard
  only consumes the left half of the viewport, unlike the full-width mockup.
