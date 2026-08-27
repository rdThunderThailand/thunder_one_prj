# Multi-zone Layout

**Status:** accepted (2026-08-25), **§1 and §13 superseded** (2026-08-26) — **§2–§12 stand.**
- §1 (a Layout carries geometry and Zone roles only; content is bound per Zone in the Publication
  wizard) → `docs/adr/0049-composition-layout-with-content.md`. Content lives on a **Composition**,
  and `role` is dropped entirely.
- §13 (multi-monitor spanning deferred) → `docs/adr/0050-wide-layouts-across-monitors.md`. One machine
  driving several monitors is in scope; several machines driving one image is not.

Originally **blocked on `docs/adr/0045-publication-snapshot-materialization.md`**, which builds the
snapshot this ADR copies into.

A **Layout** becomes a first-class entity in `media_core`: a named, reusable screen composition of
up to four non-overlapping rectangular **Zones**, expressed as percentages of the display area. A
Layout carries geometry and zone roles only — never content. Content is bound per Zone when an
operator builds a Publication, and the whole composition is materialized into the Publication
snapshot at publish time.

This is the `Layout` that `CONTEXT.md` has described since the glossary was written, and that the
player-side audit tracks as **B1**, classified `P (blocked)` on exactly this ADR existing.

## Why now

The prior art is the Aurora player, which shipped a full multi-zone engine
(`manager/LayoutDesignManager.cs`, `manager/ComponentManager.cs`, `model/LayoutDesign.cs`,
`Scene.cs`, `Component.cs`) with per-zone playlists and geometry delivered as pure config, cached to
`layoutDesign.json`. Nothing was hardcoded. The replacement stack dropped that capability, and
`AUDIT_Player_Gaps_Priority.md` §B1 records why: *"Thunder One has no layout design step... the
timeline carries no geometry."* The block is upstream of the player, and upstream is this repo.

The same audit is explicit that this was never meant to be permanent: *"the new platform is a
single-zone full-screen player by design, not by omission. That is a legitimate product position —
but it should be an explicit choice."* This ADR is that choice being made the other way.

## What a real Aurora payload contains

A production `layoutDesign.json` was reviewed while drafting this ADR. It is a **three-monitor video
wall** — three `1920×1080` components at `x = 0 / 1920 / 3840`, `allowRatio: "16:3"`, all three of
`type: "video"` — with a single scene of `duration: 0`.

Four things follow, and each changed a decision below:

- **Layouts need a reference aspect ratio.** Aurora carried `allowRatio`; absolute pixel geometry is
  meaningless without it. See §4.
- **Multi-video zones are a real customer configuration, not a hypothetical.** See §11.
- **Scenes were carried but unused** — one scene, zero duration. Confirms §2.
- **The payload is an array of layouts, each bound to `idProfileSchedule`.** This looks like the
  answer to §8, and is not: it requires the *player* to decide which layout is active now, and the
  audit records that schedule evaluation is no longer the player's job. See §9.

## Decisions

### 1. Layout holds geometry, never content

`media_core.layouts` + `media_core.layout_zones`. A Zone carries `x`, `y`, `width`, `height` (percent
of display, `0–100`), a `role` (`main` / `sidebar` / `ticker` / `secondary`) and a name. It does not
carry a `playlist_id` or a `media_asset_id`.

Content is chosen per Zone inside the Publication wizard, so Publication remains the single place
that answers "what plays where and when", exactly as `CONTEXT.md` requires.

Concretely, that is **step 2 (`Content`) of the existing five-step wizard** — `Basic Info → Content →
Channels → Schedule → Review & Publish` (`src/features/media-workspace/publications/mock-data.ts`) —
not a sixth step. Step 2 already owns "what plays"; it gains a full-screen / Layout mode switch, and
in Layout mode the operator picks a Layout, then binds a source and playback settings per Zone. The
switch mirrors the data model exactly: ADR 0045 §1 gives a flat Publication one implicit full-screen
Zone, so full-screen is the one-Zone case of the same screen rather than a separate path.

The Layout editor itself therefore never picks a Playlist and has no publish action. The geometry fit
rule (§4) needs both a Layout and a target set, so it cannot resolve at step 2, because targets are
chosen at step 3 (`Channels`). It surfaces at step 3 and again at step 5 (`Review & Publish`),
alongside the equal-priority overlap block (§8), which
needs the Schedule from step 4.

Rejected: **Layout holds content too** (Aurora's model, and what mockup 2 depicts). It turns a Layout
into a second Publication that lacks a schedule and a target, giving two answers to "what is
playing". It also breaks the real reuse case — one menu-board Layout, different content per branch.

Rejected: **content defaults on the Layout, overridable per Publication.** Two sources of truth
stacked on each other. Addable later; not undoable cheaply.

Rejected: **Layout as a property of Channel.** Attractive for fixed lobby boards and worth
revisiting, but it cannot express "same geometry, different content per Publication".

### 2. No scenes

Aurora's Layout contained a carousel of Scenes, each with its own `duration` and `bgColor`. That is
scheduling embedded inside a Layout, colliding head-on with Publication + Schedule. Not ported — and
the production payload reviewed above carried exactly one scene with `duration: 0`, so nothing real
is lost. `angle` and `opacity` are not ported either.

### 3. Zones do not overlap, so there is no `z`

At most four Zones, rejected at save time if they overlap. Zones need not tile the display;
uncovered area is painted with the Layout's `background`. Dropping overlap drops the `z` column, the
compositing-order question, and the "which Zone owns the input" question in one move.

### 4. Layout geometry is percent, against a declared aspect ratio

`layouts` carries `aspect_ratio` (e.g. `16:9`) and `background` (hex, default `#000000`). Zones are
stored as percentages of that frame and rendered as pixels by the player.

`aspect_ratio` exists from the first migration even though release one only ships single-screen
Layouts (§13). Without it, every Layout authored in release one becomes uninterpretable the day
video-wall support lands — percentages alone cannot distinguish a `16:9` split from a `16:3` one.

Fit is **two separate rules**, not one reused rule:

- **Channel ↔ Media Device** — unchanged. `media_screens_list` compares a Device's `orientation` and
  composed `resolution` against the Channel's `expected_resolution`
  (`100_channel_core_schema.sql`, `102_screens_display_profile.sql`): orientation mismatch blocks,
  resolution mismatch asks for confirmation.
- **Layout ↔ target** — new. A Layout declares `aspect_ratio`, not a resolution, so the only check it
  can make is orientation and aspect-ratio compatibility against the target Device. A Layout-level
  *resolution* warning is not possible without adding `reference_resolution` to `layouts`; it is not
  added, because release one has no case that needs it.

**One deliberate divergence, stated because it is a rule change and not a reuse:** today a Device
with `orientation` or `screen_width`/`screen_height` still `NULL` — never profiled — simply *skips*
both checks (102's own rationale notes the editor "could only ever see NULL and skip both checks").
For Layout-bearing activation, unknown geometry **fails** instead, matching §11's treatment of
unknown capability. Silently skipping a check on an unprofiled Device is acceptable when the cost is
a stretched full-screen image; it is not acceptable when the cost is a composition laid out against
a frame the server has never seen.

### 5. The composition is materialized into the Publication snapshot

At publish time, Zone geometry, each Zone's playback settings (`play_mode` / `repeat` / `start_from`)
and every Zone's resolved items are written into `publication_snapshot_zones` and
`publication_snapshot_items` (`docs/adr/0045-publication-snapshot-materialization.md`). Because
playback settings live on the Zone, Zones in one Layout can legitimately differ — a looping main
Zone beside a play-once ticker. Referencing `layout_id` and resolving at
poll time is rejected: dragging a Zone edge from 70/30 to 50/50 would reshape a screen that is
currently airing, with nobody having pressed publish.

This ADR does not get to assume that machinery exists — before 0045, `media_job_poll` reads
`playlist_items` live and pins only `file_version_no`, writing it back onto the shared Playlist rows.
Layout depends on 0045 landing first.

### 6. Lifecycle copied from Playlist

`active ↔ inactive`, no hard delete, editable at any time because §5 protects what is airing. The
platform already carries three status vocabularies (Publication's five, Channel's three, Playlist's
two); a fourth that differs slightly from an existing one is debt, not design.

### 7. Templates are frontend constants

The seven starting templates (70/30, 50/50, 3-Zone Header, Left Info Panel, Top & Bottom, 4 Grid,
3 Column) are an array of `{ name, aspect_ratio, zones: [...] }` in the frontend. No `templates`
table, no "Save as Template" — user-authored templates raise ownership, cross-tenant sharing and
edit-propagation questions for something nobody has asked for. An `is_template` flag on `layouts` is
one migration away if that changes.

### 8. Priority stays whole-screen; equal-priority overlap with a Layout is blocked

A higher-priority Publication suppresses the entire screen, Layout included — it does not preempt
individual Zones. Priority exists so an urgent announcement reaches the viewer; landing it in a 25%
weather Zone defeats that.

Equal priority is the harder case. `media_job_poll` merges slots from multiple in-window
equal-priority Publications into **one** `slots[]` array (069's priority-override logic;
`docs/adr/0031-playback-behavior-reaches-the-player.md`). A single response therefore cannot carry
"Publication A's Layout and Publication B's flat playlist, both airing".

**Release one refuses the situation rather than representing it:** activating a Publication is
blocked when it overlaps an equal-priority Publication on any shared Media Device and either side
uses a Layout. Higher-priority preemption is unaffected.

This means `media_schedule_conflicts` **does change** — it gains a Layout-aware blocking case
alongside its existing equal-priority *warning*. An earlier draft of this ADR claimed schedules and
conflict detection needed no change; that was wrong.

### 9. Payload shape switches; the flat contract is never touched

A Publication without a Layout returns `slots[]` exactly as today, unchanged, indefinitely. A
Publication with a Layout returns `zones[]`, each with its own geometry, `loop_duration_seconds` and
`slots[]`. The player branches on the presence of `zones`. §8's guard is what makes a single
`zones[]` sufficient.

Rejected: **adding `zone_id` to the flat `slots[]`.** An un-upgraded player would recognise the
familiar array and play every slot full-screen on top of the others.

Rejected: **version negotiation between player and server.** A permanent mechanism maintained to
solve what a publish-time guard (§11) solves once.

Deferred, with its shape now known: **`compositions[]`** — an ordered set of composition objects,
each carrying its own layout, zones and window, is how §8's restriction is eventually lifted. Aurora
shipped the array form, so the shape is proven; what cannot be copied is Aurora's binding of each
entry to `idProfileSchedule`, which made the player evaluate recurrence. A Thunder One
`compositions[]` must arrive server-resolved.

### 10. Each Zone loops independently, anchored per ADR 0043

Zones have unrelated loop durations (a 62 s main loop beside a 20 s weather loop). No padding to a
common multiple, no requirement that durations divide evenly.

Synchronized Playback is evaluated **per Zone**, using the anchored formula that ADR 0043 put in
place of ADR 0042's epoch:

```
phase_seconds = (server_now_unix_seconds − loop_anchor_unix_seconds) mod zone.loop_duration_seconds
```

`loop_anchor_at` is already returned by `media_job_poll`. Because §8 guarantees a single Publication
owns a Layout-bearing response, the anchor is **one top-level value shared by every Zone**, not a
per-Zone field. If `compositions[]` (§9) ever lands, the anchor moves to the composition.

Nothing in ADR 0043 needs amending; the arithmetic is stateless and simply takes each Zone's own
duration as its modulus.

### 11. Publish is gated on reported capability, not on version strings

Activating a Layout-bearing Publication is refused when any target Media Device has not reported the
required capability, or reports a lower `max_video_zones` than the Layout needs.

Capabilities travel on the **device-profile** call, not the heartbeat —
`public.media_device_profile_set` (`096_media_device_profile.sql`) exists precisely for static
device facts that change only when the app or hardware changes, and 096's own rationale is that such
facts should stay off the 60-second heartbeat:

```jsonc
{ "os_version": "…", "machine_name": "…", "screen_width": 1920,
  "capabilities": { "multi_zone_v1": true, "max_video_zones": 1 } }
```

Stored as a single `public.assets.player_capabilities jsonb` column — capabilities will keep
accruing (audio, web content, styled ticker) and are read only at publish time, never joined.

**Unknown counts as failing.** A device that has never reported capabilities cannot be published to.
The self-healing path already exists: `media_heartbeat` returns `profile_required` when a device has
never reached the profile endpoint, and the player resends on seeing it. That condition is widened
to include `player_capabilities IS NULL`, so an unreported device is re-prompted on every heartbeat
rather than waiting for a reboot.

That is *recovery*, not atomicity. Channel membership can still change between resolving the target
set, validating it, and inserting `publish_job_targets`. Activation resolves its target set once and
validates and inserts against that same set inside one transaction —
`docs/adr/0045-publication-snapshot-materialization.md` §8.

**Counting video Zones.** A Zone has no `kind`; its *items* do. `max_video_zones` is compared against
**the number of snapshot Zones holding at least one item of `kind: "video"`** — not the number of
video items. Because Zone loops run independently (§10), every such Zone can be showing video
> **Superseded by [ADR 0054](0054-capability-gate-on-publish.md) (2026-08-27).** Everything below is
> retained as the original reasoning and is **no longer in force**. Device-capacity enforcement is
> deferred: nothing reads `max_video_zones` to decide a publish, and a Device that has never reported
> is not refused. The groundwork this section specifies — `public.assets.player_capabilities`, the
> `capabilities` argument on `media_device_profile_set`, and the widened `profile_required` — was
> built (ticket 07) and remains, storing whatever a player sends without any publish semantics
> reading it. The counting rule below (Zones holding at least one video *item*, not video items)
> carries forward to whenever enforcement is reconsidered.

simultaneously at some phase, so the conservative count is the correct one.

Rejected: **gating on `app_version`.** There is no `player_platform` column, and Windows and Android
version strings are not comparable to each other or reliably to themselves. Version is a proxy for
the question; capability is the question.

Rejected: **falling back to main-Zone-only for devices that cannot render Zones.** Two devices in one
Channel would show different things with no signal, contradicting the Channel guarantee that members
"receive the same media".

**No hard cap on video Zones is written into the schema.** The production Aurora payload above runs
three video Zones, so a fixed cap of one would refuse an existing customer configuration outright.
The ceiling is whatever each device reports. Aurora achieved three concurrent videos with **MPV**;
this stack uses WPF `MediaElement` (Windows) and `android.widget.VideoView` on `minSdk 24` (Android,
no ExoPlayer/media3 dependency at all), targeting Android 7 boxes that commonly expose a single
hardware H.264 decoder. Cheapest honest implementation: each build hardcodes its number until
measured on real hardware.

*Consequence to state out loud:* audit item **A2 (MPV)** stops being a nice-to-have and becomes the
condition for **multi-video Zones on a single screen**. It does not by itself make Aurora's video
walls migratable — those additionally need multi-monitor support (§13, audit **A6**) and an ADR that
does not exist. Until A2, `max_video_zones` stays small and multi-video Layouts are refused by the
capability gate: correct behaviour, and a bad surprise if sales has not been told.

### 12. Zone-aware proof of play, unweighted

`media_core.playback_logs` gains `publication_snapshot_id` and `snapshot_zone_id` (both nullable;
NULL = full screen, preserving every existing row's meaning), per ADR 0045 §6. Logging the raw
`layout_zone_id` would not survive a Layout edit — the same id would map to several geometries — so
the snapshot is the identity that gets recorded. `source_layout_zone_id` on the snapshot Zone exists
for tracing provenance only.

Every Zone is logged; none is weighted by area. Area weighting is a commercial formula, and the
snapshot stores the geometry needed to compute it at report time.

`media_publication_airtime_explain` derives airtime from **schedules**, not from `playback_logs`, so
airtime reporting is unaffected. Proof-of-play reporting is not.

### 13. Single screen only; video walls are out of scope

Release one covers one display divided into Zones. Multi-monitor spanning — the `16:3`, 5760×1080
case in the reviewed Aurora payload — is deferred to its own ADR. Audit item **A6** records that
multi-monitor handling is *new* work rather than a port: Aurora's own
`SystemEvents_DisplaySettingsChanging` subscription is commented out.

`aspect_ratio` (§4) is added now so that release-one Layouts remain interpretable when that ADR
arrives. Sales needs telling that Aurora video-wall customers cannot migrate yet.

## Sequencing

```
ADR 0045 snapshot materialization  →  playback_logs defects  →  player A1 (+ A2 for multi-video single-screen)  →  Layout
```

- **ADR 0045 first.** §5 has nothing to write into until it exists, and it closes a live production
  defect on its own.
- **Two open `playback_logs` defects** as of 2026-08-25: `duration_played_seconds` under-reports by a
  constant 1.2–1.8 s on every asset, and roughly half the expected entries for one asset never
  arrive. Zones multiply both by the Zone count; close them before shipping §12.
- **Player A1 (content component abstraction).** The audit names it *"the prerequisite for almost
  everything in Bucket B"* — playback is an `if Image / else if Video` branch inside
  `PlayerViewModel.ExecutePlay` with no disposal contract, and the Android player has no equivalent
  abstraction either. Multi-zone rendering lands on top of A1, not beside it.

## Scope of the first release

In: the wizard from mockup 3 (template picker → per-Zone content → settings), the seven templates,
`layouts` / `layout_zones`, per-Zone content binding in the Publication wizard, the `zones[]`
payload, the equal-priority block (§8). The capability gate (§11) was in this list and has since
been deferred out of the release by ADR 0054.

Out: the free-form drag-resize canvas with live preview (mockup 2); folders, tags, summary tiles and
the three list view modes (mockup 1); user-saved templates; widget Zones (weather / news / clock —
a live-data subsystem, not a geometry feature, and their value is the data, not the split); styled or
animated tickers; video walls (§13); `compositions[]` (§9).

Terminology: mockup 1 labels a tile "Used in Programs" and the sidebar carries a `Programs` section.
`Program` is not a term in `CONTEXT.md`; the entity is **Publication** and the UI says so. A
broadcast-style day-long Program schedule, if genuinely wanted, is its own ADR.

## Open

- Whether a fixed styled ticker (audit **B2**) ships before or after this. The Windows player already
  has the `Border` and the `TickerText` binding in `PlayerView.xaml`, dead because the contract
  carries no text field — far cheaper than a layout engine, but it does not serve the lobby case that
  motivated this ADR.
- The `max_video_zones` each platform build reports, pending measurement on real Android 7 hardware.
  ADR 0054 defers all enforcement until that measurement exists and a player build actually reports.
