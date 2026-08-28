# Pre-publish preview: how this will actually play

**Status:** accepted · 2026-08-26 · amended 2026-08-28
**Extends:** `0045-publication-snapshot-materialization.md` §1 · `0049-composition-layout-with-content.md` §1

## Context

An operator assembles a Playlist, or binds content to every Zone of a Composition, and then publishes
it — without ever having seen it play. What exists today is a mock-up:

```tsx
// PreviewPanel.tsx:20 — a Preview button with no onClick
<button className="…"><EyeIcon /> Preview</button>
// :25
<p className="text-xs">Content preview will appear here</p>
```

The gap gets worse under ADR 0049. A flat Publication is one Playlist and its ordering is legible from
the list. A Composition is up to four Zones each running its own loop at its own length, and no static
view answers "does the sidebar restart while the main Zone is halfway through its second item".

A preview taken from the real device is a different feature and is not available anyway. The player
can capture its screen but has nowhere to send it:

```csharp
// ScreenshotUploadService.cs:20
// ยังไม่ upload เพราะ Thunder Core contract ยังไม่มี endpoint สำหรับ screenshot
```

Confirmed: `api/core/v1/media/player/` exposes `device-profile`, `heartbeat`, `jobs`, `playback` and
`server-time`, and nothing that accepts an image.

## Decision

### 1. One preview component, three entry points

The same component is mounted from the Playlist editor, the Composition editor, and step 5 of the
Publication wizard, where the dead button already sits.

It takes a list of Zones, each with geometry, items, per-item duration and transition, and playback
settings — which is the shape ADR 0045 §1 already defines, and the shape the player receives.

### 2. A Playlist is the one-Zone case, not a second code path

ADR 0045 §1 gives a Publication with no Layout exactly one implicit full-screen Zone. The preview
adopts the same reduction: previewing a Playlist means previewing one Zone at `x=0 y=0 w=100 h=100`.

There is no separate playlist-preview mode to keep in step with the Zone one.

### 3. Zones run independent loops from a common start

Each Zone loops on its own length, all starting together at t=0. This matches a freshly activated
Publication, where ADR 0043's `loop_anchor_at` is one shared value that every Zone's phase is measured
against (ADR 0044 §10).

A 20-second sidebar beside a five-minute main Zone will therefore restart fifteen times during one
main loop, in the preview exactly as on the screen. Showing that is most of the point.

**Loop length is resolved the way activation resolves it, not with a preview-local default.** A draft
item's duration is optional — `playlist_items.duration_seconds` is nullable and 44 of production's 113
rows are null — while `publication_snapshot_items.duration_seconds` is `NOT NULL`, because activation
fills it in:

```sql
-- media_publication_activate:89
COALESCE(pi.duration_seconds, ma.duration_seconds)
```

The preview applies the same `COALESCE(item, asset)`. Any other rule makes the number of restarts it
shows wrong, which is the one thing §3 exists to get right. `media_assets.duration_seconds` is itself
nullable — production happens to have none missing — so an item that resolves to nothing is drawn as a
marked placeholder (§5) and contributes no time, rather than silently defaulting to some number.

A Zone whose items all fail to resolve therefore has a loop length of zero. It is held on its
placeholder for the whole preview and never enters §4's `t mod length` arithmetic, which would
otherwise divide by zero and take the Zone to `NaN`.

### 4. One playback model, a target-shaped frame, and an optional full-preview tab

The quick modal stays and gains what actually answers "how will this look on that screen": a
**geometry selector** that changes the shape of the preview frame, and a Fit-to-window / full-screen
action. The modal already locks its frame to a parsed ratio, so a portrait or 16:3 target is one prop
away — the geometry selector is the whole feature, and it is independent of which window the preview
is drawn in.

An explicit **Open full preview** action opens the same stage in a separate browser tab. It makes the
preview large enough to inspect without hiding the editor and also allows moving it to another
monitor. This costs a route, a live draft handoff, a session lifetime and an expiry state, but the
separate readable surface is part of the confirmed operator workflow; `requestFullscreen()` remains
available for the quick modal rather than replacing the tab. Whichever window it is in, the preview
is read-only: no editing, saving or publishing.

The default editor view uses the Layout's Authoring Reference Resolution, and only that — the editor
has no target to narrow a Device list with. Publication step 5 is where targets exist, so it defaults
to the geometry its selected targets report. Devices are grouped by the `WxH` string
`media_screens_list` already returns, which fixes orientation too, since orientation is `width >
height` and not a third key. Each group is one runtime Target Geometry Profile with a count; Devices
with no reported geometry group as `Unknown (n)`. Frame shape resolves through
`reference_resolution`, then the Layout's existing `aspect_ratio`, then `16:9` if neither parses.
Ticket 20 can therefore ship independently of Ticket 19; until Ticket 19 supplies a resolution, an
unknown target still has the right shape but no reference-pixel dimensions to display.

When a target's shape differs, preview renders the actual target-shaped viewport and warns without
blocking preview or publish, following ADR 0055. Percentage-based Zones stretch with that viewport as
the player does; content inside each Zone keeps its configured `media_fit`. Preview adds no
Layout-level letterboxing and makes no pixel-perfect claim.

It carries a timeline scrubber and 2× / 4× speed. Real menu-board loops run for minutes; a preview
that can only be watched from the beginning at real speed gets closed after ten seconds and checks
nothing. Speed is nearly free — `<video>` already has `playbackRate`.

**Every Zone's state is a pure function of one shared `t`** — `t mod` that Zone's own loop length
gives its current item index and the offset into it. Scrubbing is then setting `t`, and speed is how
fast `t` advances; both fall out rather than being built. A timer per Zone is the obvious first
implementation and makes the scrubber a rewrite instead of an addition. The single clock is also what
§3 already describes: `loop_anchor_at` is one value shared by every Zone (ADR 0044 §10).

Saved work loads by id first. The Composition loader is extracted from
`PublicationPlaybackPreviewButton`'s existing `fetchComposition` → `fetchLayout` → `fetchPlaylist`
path and reused by both hosts; step 5 loads saved work with the existing `fetchPublication` path.
**Layout id is never a playback source:** a Layout is geometry with no items, so it would draw empty
boxes and play nothing.

Only a dirty unsaved draft uses a same-origin, random `BroadcastChannel` session. The payload carries
only assets referenced by its Zones, not the tenant's complete asset collection, and is never
autosaved, encoded into the URL or placed in durable browser storage. The tab pings every two seconds;
the editor replies, and two missed replies transition the tab to expired. A best-effort
`beforeunload` notice shortens the normal close path but is not relied upon. Refresh reconnects while
the editor is alive; otherwise the tab reports `Preview session expired — reopen from editor`.

The tab route lives in a new `(preview)` route group outside the dashboard chrome. Its own
`layout.tsx` deliberately repeats the dashboard's `getSession()` and `forbidden` → `/no-access` gate,
but renders only its children, so preview is authenticated without Sidebar, Topbar or dashboard
padding. This duplication is an explicit auth boundary, not a reason to introduce middleware.

Animating inside the editing canvas was rejected: content moving while someone is dragging a Zone edge
is a distraction, not a feature. Forcing every preview into a new tab was also rejected because the
modal is faster for a quick check. Two clocks kept in step across two windows was rejected as well:
each surface owns its own `t`, and what is guaranteed is that the same `t` produces the same frame —
which is §4's whole point and is checkable without any cross-window messaging. A storyboard table — "at 0-12s Zone A shows X, Zone B shows Y" — is
a reasonable thing to want and a separate one; it is not built here.

### 5. What the preview refuses to fake

- **Assets that are unapproved or missing** are drawn as marked placeholders carrying the asset name,
  not hidden. The operator needs to see why something will not air.
- **Decoding capacity** is not simulated and is not enforced during the current publish phase. The
  preview demonstrates timing and geometry only; it does not prove that a target Device can decode
  every video Zone concurrently. ADR 0044 §11's capability gate was meant to be that answer, and ADR
  0054 defers it — so in this phase nothing answers it, neither the browser nor the server.
- **Monitor bezels** cannot be shown — a browser draws one continuous surface. ADR 0050 §3's seam
  guides in the editor are the compensation, and this is why they exist.

### 6. The preview says so when the real screen will show more

`CONTEXT.md:60` records that one poll response *"merges every in-window equal-priority Publication
into a single loop"*. A Publication previewed alone can therefore differ from the screen.

Not everywhere: a Publication that uses a Layout is blocked from overlapping an equal-priority
Publication on a shared device (ADR 0044 §8), so a Composition preview is accurate — **but only once
that block exists**. It is ticket 06, still unbuilt, and `media_schedule_conflicts` has no blocking
outcome today. Until ticket 06 lands, the banner shows for every type; suppressing it for
Compositions before then would hide the warning in precisely the case where the screen can still
merge. The gap is otherwise confined to flat Publications.

When step 5 has detected a schedule conflict — `computeEligibility` already receives `conflicts` — the
preview shows a banner naming how many other Publications will merge into the same loop.

Simulating the merged result was rejected: resolving overlap windows and priorities inside the browser
is a second scheduler, and the accuracy bought does not repay it. Saying nothing was also rejected —
we already hold the information that the operator is about to be misled by.

### 7. Device preview stays out

Two things are sometimes meant by "see it on the real screen", and neither is built now.

*Watching what a screen is airing* needs an upload endpoint and storage the contract does not have. It
is monitoring rather than preview, and it answers "what is on the screen" rather than "what will my
draft look like" — a separate feature whenever it is wanted.

*Rehearsing unpublished content on a real screen* would need reservation, expiry, contention between
operators and a recovery path for a device that loses connectivity mid-preview — with every failure
landing on a customer's live screen. Not until there is a staging display to send it to.

## Consequences

- `PlaybackPreviewModal` today is the player and its modal chrome in one file. The player half is
  extracted into a host-free stage component first, so a second host is an addition rather than a
  copy — that extraction touches all three existing mount points and is where the regression risk of
  this work actually sits. The dead button in `PreviewPanel.tsx` becomes real.
- No schema change, no RPC change, no migration. The preview reads draft state the client already
  holds; full-preview draft transfer is ephemeral and same-origin.
- Playlist, Composition and Publication previews cannot drift apart, because there is one
  implementation and Playlist is its one-Zone case.
- Target choices are derived from already-reported Device geometry and grouped at runtime; no Device
  group or Layout-to-Device binding is persisted.
- The full-preview route repeats the existing session gate in a shell-free route-group layout. No
  middleware is introduced.
- The merge banner reuses the conflict data step 5 already fetches; nothing new is queried.
- Storyboard view, device screen capture and rehearsal-on-a-real-screen are each deliberately left
  out and can be added without revisiting this decision.
