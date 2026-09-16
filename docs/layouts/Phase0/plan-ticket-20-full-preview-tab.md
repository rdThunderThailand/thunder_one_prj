# Ticket 20 — Target geometry profiles and full preview tab

## Outcome

An operator previewing a draft sees it in the shape of the screen it is going to — portrait, ultrawide
or a target Device's reported geometry — from the preview surface that already exists.

## Delivery order

Build the geometry selector and host-free stage first, then mount that stage in a separate tab. This
keeps the risky extraction independently verifiable without deferring the confirmed full-preview
workflow. The tab adds a route, live draft handoff, session lifetime and expiry state; it does not add
a second playback engine.

## Baseline (verified)

- `PlaybackPreviewModal` locks its frame with `parseAspectRatio(aspectRatio)` — a target-shaped frame
  is one prop, and percentage Zones then stretch with it exactly as the player does.
- It takes Zones carrying items, durations and `assets`; that is **Composition** content, not Layout.
- The publish wizard already holds `device.resolution` (`WxH`) — `channels-logic.ts:98`
  `summarizeGeometryFit` reads it. No new query, no schema, no persisted Device group.
- `PublicationPlaybackPreviewButton.tsx:31-45` already loads Composition → Layout → each Zone's
  Playlist. Extract and reuse this loader; do not rewrite it.
- Authentication is enforced by `src/app/(dashboard)/layout.tsx`, not middleware. A preview route
  outside that group must provide its own gate.

## Phase A — geometry and shared stage

1. Extract the player out of `PlaybackPreviewModal` into a host-free stage component; the modal
   becomes a host around it. Do this first: it touches all three existing mount points (Playlist
   editor, Composition editor, wizard step 5) and is where the regression risk of this ticket sits.
2. Controls on the stage: Play/Pause, one scrubber, 1× / 2× / 4×, Fit-to-window, full-screen, and a
   geometry selector.
3. **Editor**: the geometry selector offers the Authoring Reference Resolution only. The editor has no
   target with which to narrow a Device list, and "every Device in the tenant" is not a useful list.
4. **Step 5**: default to the geometry the selected targets report. Group Devices by the `WxH` string
   alone — orientation is `width > height`, not a third key — and show a count per group
   (`1080x1920 (3)`, `1920x1080 (7)`). Devices with no reported geometry group as `Unknown (n)` and
   show a warning. Resolve the frame with `reference_resolution` → valid `aspect_ratio` → `16:9`.
   Ticket 20 may run in parallel with Ticket 19; until 19 lands, unknown targets retain a correct
   aspect-ratio fallback but cannot show reference-pixel dimensions.
5. On a shape mismatch, render the target-shaped frame, let percentage Zones stretch into it, keep
   each Zone's `media_fit` for content inside it, add no Layout-level letterbox, and show an advisory
   that blocks neither preview nor publish (ADR 0055).

## Phase B — full preview tab

6. Add a shell-free authenticated route group at `src/app/(preview)/layout.tsx`. It deliberately
   repeats `getSession()` and redirects `forbidden` to `/no-access`, matching the dashboard gate, but
   renders no Sidebar, Topbar, ShortcutsBar or dashboard padding. Add read-only routes beneath it for
   `/media-workspace/preview/composition/[compositionId]` and
   `/media-workspace/preview/publication/[publicationId]`.
7. Extract the existing Composition preview loader from `PublicationPlaybackPreviewButton` and reuse
   it in the modal and full route. Saved work loads by Composition id, or by Publication id through
   the existing `fetchPublication` path, as the default. Never load by Layout id: it has no items.
8. Use a random same-origin `BroadcastChannel` session only when the editor draft is dirty. Filter the
   handoff payload to the asset ids referenced by its resolved Zones; do not clone the tenant's full
   asset list. The tab pings every 2 seconds, the editor replies, and two missed replies transition a
   pure session reducer to expired; `beforeunload` is a best-effort fast path. Reconnect on refresh
   while the editor lives, otherwise show `Preview session expired — reopen from editor`. Never place
   the draft in the URL or durable browser storage.

## Out of scope

- Device screen capture, remote rehearsal, or any write to a physical Device.
- Pixel-perfect claims about bezels, colour, decoding or hardware output.
- Editing, saving or publishing from a preview surface.
- Persisted Target Geometry Profiles or Device groups; a second preview engine.

## Acceptance checks

- The geometry selector changes the frame shape without touching stored Layout geometry; a portrait
  profile gives a portrait frame.
- Duplicate Device geometries collapse into one counted option; `Unknown (n)` is visible and falls
  back through `reference_resolution` → `aspect_ratio` → `16:9` with a warning.
- At the same `t`, the stage renders the same Zone and item state wherever it is mounted — clocks are
  per-surface and are deliberately not synchronised.
- Mismatch warnings are advisory; the renderer follows percentage Zone geometry plus Zone `media_fit`,
  with no Layout-level letterbox.
- Fit-to-window and full-screen work at every window size (a tab's opening size is not controllable
  and is not asserted).
- Playlist, Composition and step 5 previews behave exactly as before the extraction.
- `Open full preview` opens the same stage in a separate tab; an unsaved draft reconnects while its
  editor is open and expires after it closes, while saved work reloads by Composition id or
  Publication id as appropriate.
- Direct navigation while signed out redirects to `/login`; a signed-in user with no served tenant
  redirects to `/no-access`; an authorised user sees no dashboard chrome around the preview.
- The cross-tab payload contains only assets referenced by the preview Zones.

## Verification

- One runnable check for the pure preview-session reducer: connect, reconnect, heartbeat reply,
  two-missed-heartbeat expiry and explicit close. Geometry grouping remains a direct `WxH` grouping
  with no dedicated check.
- `tsc` and `lint` clean on changed files.
- Browser-check: quick modal from all three mount points, geometry selector landscape/portrait,
  mismatch advisory, unknown-geometry fallback, scrub and speed, full-screen, full-preview tab,
  auth redirects/no-chrome, filtered dirty-draft handoff, unsaved refresh/expiry and saved-id reload.

## Decision sources

`CONTEXT.md` — Playback Preview and Target Geometry Profile; ADR 0051 §4; ADR 0055 advisory fit.
