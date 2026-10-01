# SESSIONLOG — Ticket 20 Phase B (full preview tab) — 2026-08-28

Continues Phase A from `.docs/SESSIONLOG-ticket20-phaseA-2026-08-28.md` and follows the frozen
plan at `docs/layouts/plan-ticket-20-full-preview-tab.md` lines 46–98.

## Implemented

- Added the shell-free authenticated `(preview)` route group. It repeats `getSession()` and sends
  forbidden users to `/no-access`, but renders no dashboard chrome or spacing.
- Added read-only routes for Composition and Publication ids. A Publication resolves through
  `fetchPublication()` and previews its linked Composition; a non-Composition Publication reports
  the unavailable preview rather than pretending a Layout has playable items.
- Extracted `loadCompositionPreview()` from `PublicationPlaybackPreviewButton`: Composition →
  Layout → each Zone Playlist. The existing modal now uses the same loader as the route.
- Added `Open full preview` in the saved Composition editor and Composition Publication detail.
  Clean editor state opens the id route directly. Dirty saved Composition state opens a random
  same-origin `BroadcastChannel`; its opaque random channel id is carried as a `previewSession`
  query parameter, never the draft or any durable storage.
- The handoff includes the current resolved Zones, Layout geometry, and only assets referenced by
  those Zones. The preview pings every two seconds; an editor reply resets the pure reducer, two
  missed replies expire the session, and editor unload sends a best-effort close message.

## Static verification

- `pnpm exec next typegen` — passed.
- `pnpm exec tsc --noEmit` — passed.
- ESLint on all changed files — passed.
- `node src/features/media-workspace/preview/preview-session.check.mts` — passed: connect,
  reconnect, heartbeat reply, two missed heartbeats, explicit close.
- `git diff --check` — passed.

The bare-node check prints the repository's existing `MODULE_TYPELESS_PACKAGE_JSON` warning; it
does not affect the assertion result.

## Browser verification

- Signed-out Composition preview route with a dummy id — passed: redirected to `/login`.
- Signed-out Publication preview route with a dummy id — passed: redirected to `/login`.
- Signed-in saved Composition route — passed: rendered both resolved Zones, timeline and controls;
  Sidebar and Topbar were absent (`0` each).
- Signed-in saved Composition route after browser refresh — passed: reloaded by Composition id,
  retained the stage and controls, with no console errors.
- Signed-in saved Publication route — passed: `fetchPublication()` resolved the linked Composition,
  then rendered the same stage and controls without dashboard chrome.
- Dirty saved Composition handoff — passed: opened a new tab with an opaque random
  `previewSession`, rendered the handoff stage, and kept the URL free of draft fields.
- Dirty preview refresh while the editor stayed open — passed: reconnected and stayed active;
  expiry message was absent and Sidebar/Topbar remained `0`.
- Editor navigation-away cleanup — passed: preview changed to `Preview session expired — reopen from
  editor`, and the stage disappeared.
- Browser console logs for the exercised app routes — no application errors or warnings.

The first dirty-tab attempt exposed a Chromium behavior where a named `window.open` with `noopener`
did not preserve `window.name`; the implementation now passes only the random channel id in the
query and keeps `noopener`.

Phase A's `Unknown (n)` Device geometry check remains separately unverified. A no-tenant account
redirect to `/no-access` was not exercised in this authenticated session.

## Boundaries

- No migration, production write, deletion, push, commit, or PR action was performed.
- The two Phase A `ZZTEST-` rows remain in production and still require explicit R0 approval to
  delete.
