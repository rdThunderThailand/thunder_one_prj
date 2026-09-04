# The preview plays what the Playlist says

**Status:** accepted · **Date:** 2026-09-04
**Supersedes:** ADR 0061 §7 (play mode, repeat, start-from and transition are stated, not played)
**Constrained by:** ADR 0051 §2 (one code path), ADR 0051 §4 (every frame a pure function of one `t`)
**Issue:** #42

## Context

ADR 0061 §7 deferred four playback settings deliberately: `previewFrameAt()` reads `items` and
`timeSeconds` alone, so `play_mode`, `repeat`, `start_from` and per-item `transition` are carried
through the payload and never read. This ADR takes them.

Three facts found while scoping the work reshape what "taking them" means.

**`repeat` is per-Zone, not per-Playlist.** `composition-preview.ts:38` maps each Composition Zone's
own `zone.playback`. A three-Zone Composition can hold `once` and `loop` side by side on one shared
`t`, so `once` cannot be expressed by stopping the clock.

**`repeat: loop` is the setting that is broken today, not `once`.** `PreviewStage.tsx:145` clamps the
clock with `Math.min(timelineSeconds, …)` and `:154` stops playback at the end, while
`timelineSeconds` is one loop long. A single-Zone Playlist therefore plays through once and stops —
whatever its `repeat` says. ADR 0061 §7 proposed labelling this state `Once (preview loops)`, which
is backwards.

**A fifth setting has the same defect, and one of them is a lie in a comment.** `media_fit`
(`fit | fill | stretch`) is stored, edited per item and per Playlist, and shipped — and
`PreviewSurface.tsx:33` hardcodes `object-cover` for every asset. `PreviewStage.tsx:96` states in a
comment that "each Zone's own media_fit govern[s] the content inside". Nothing reads it. #42 is
widened to cover `media_fit` rather than leave one member of the set behind.

**The labels ADR 0061 §7 promised were never shipped.** `PlaylistPreviewPanel.tsx:77-79` renders bare
`Shuffle`, `Once` and `Resume`. §7's own argument — that a panel reading "Shuffle" beside a stage
playing in order misleads the operator the preview exists to inform — has been true in production
since #39 landed. That is the cost of a deferral whose mitigation is only written down.

## Decision

### 1. One schedule, computed once, is the primitive the rest reads

Item start times are computed in three independent places today: `previewFrameAt()` subtracts
durations in a loop, the filmstrip builds its own `starts[]` (`FullPreviewPage.tsx:261`), and
`zoneLoopDurationSeconds()` sums them again. Adding shuffle and transition time to three separate
calculations is three chances to disagree.

```ts
// preview-clock.ts
type ZoneSchedule = {
  order: number[];        // authored index, in playback order
  starts: number[];       // start second of order[i], transitions included
  fades: number[];        // incoming fade seconds of order[i]; 0 for a cut
  totalSeconds: number;   // one full cycle
  repeat: "loop" | "once";
};
zoneSchedule(items, playback, seed): ZoneSchedule   // seed: the Zone id, §2
previewFrameAt(schedule, items, timeSeconds): ZonePreviewFrame
```

`repeat` lives **on the schedule** because §3 makes it a per-Zone frame decision, and a Zone's frame
function must not have to be told twice what its own Playlist already says.

`seed` is passed in rather than the whole Zone: `zone.id` lives on neither `items` nor
`PlaybackPreviewSettings`, and handing the clock module a Zone would hand it geometry and a name it
has no business reading.

`previewFrameAt()` becomes a lookup against a schedule the caller memoises. The filmstrip seeks with
`schedule.starts[schedule.order.indexOf(authoredIndex)]` instead of its own cursor, and the "Total"
it prints comes from `schedule.totalSeconds`. `zoneLoopDurationSeconds()` stays as the thin wrapper
existing callers use.

The count is five, not three, once the Playlist editor is included: `totalItemsDurationSeconds()` and
`itemStartSeconds()` (`playlist-editor-state.ts:49`, `:54`) compute the same two answers a third way
for `PlaylistTimelinePane` and `PlaylistItemsPane`. §5 makes them derive from `zoneSchedule()` too,
which is what "one schedule" has to mean if it is to mean anything.

The schedule is a pure function of `(items, playback, seed)` and holds no time, so ADR 0051 §4 survives
intact: the frame is still a pure function of one `t`.

### 2. Shuffle is seeded from the Zone id

`play_mode: "shuffle"` permutes `schedule.order` with a small deterministic PRNG seeded by a hash of
`zone.id`. The same Zone shuffles the same way on every render, every scrub, every speed change and
every reload, and two people looking at the same preview see the same order.

`Math.random()` per tick contradicts scrubbing outright — dragging the scrubber backwards would
produce a different past. A per-session random seed would satisfy the purity rule but throws away
reproducibility for nothing: an operator who reports "the third item looks wrong" could not be
answered. No reshuffle control is added; if one is ever wanted it is a seed input, not a redesign.

### 3. `repeat` is resolved per Zone, inside the frame function

Two different jobs were conflated in an earlier draft of this ADR and are separated here.

**Per Zone, inside `previewFrameAt()`** — the Zone's own `schedule.repeat` decides what it shows at
`t`:

- **`loop`** — `previewFrameAt` reads `t % schedule.totalSeconds`, as it does today.
- **`once`** — `t` is clamped: past `totalSeconds` the Zone holds its **last frame** and the returned
  frame carries `ended: true`, which the Zone's corner badge renders as `Ended`.

This is what makes a mixed Composition correct. A Zone A on `loop` with a 20s cycle beside a Zone B
on `once` with a 300s cycle must run A through fifteen cycles while B plays straight through, and
only a per-Zone modulo can express that — ADR 0051's independent Zone loops depend on it.

**Globally, on the clock** — whether playback continues at all past `timelineSeconds`
(`max(schedule.totalSeconds)`). When **any** Zone is `loop`, the clock wraps to `0` there instead of
stopping, so a single-Zone Playlist on `loop` keeps playing rather than halting after one cycle,
which is the defect described in Context. When every Zone is `once`, the clock stops as it does
today and every Zone is by then holding its last frame.

The scrubber stays exactly one `timelineSeconds` long in both cases, and no frame anywhere depends on
anything but `t` and the schedule. A timeline stretched to N cycles was rejected: it implies later
cycles differ, and per §2 they cannot.

### 4. `start_from: resume` previews from the first item, and the panel says so

A browser preview has no previous playback session to resume from. The stage plays from the first
item and Playlist Information renders `Resume · previews from first`.

This is the one place ADR 0061 §7's instinct to label survives, and the only one still needed once
§§2, 3, 5 and 6 make the rest real. Simulating a resume point from an invented anchor was rejected:
it is the same lie as today, told more convincingly.

### 5. Transitions borrow the editor's duration model, and `fade` is a crossfade

AC 10-12 of ticket 86d3xxk5u already settled the timing: a transition **adds** time, `cut` costs `0`,
`item[i].transition` is that item's **incoming** transition, and `repeat: loop` counts the first
item's transition once more for the wrap. `durationPerLoopSeconds()` (`playlists/duration.ts:28`) was
written to that AC — **and never wired to anything.** Its only caller is its own check file. Nothing
in the product counts transition time: the preview sums media durations, and so do
`totalItemsDurationSeconds()` and `itemStartSeconds()` behind the editor's "Total duration" and
timeline ruler.

So this is not a disagreement between two models to be reconciled. It is one model, specified and
shipped nowhere. `zoneSchedule()` becomes it, for the preview **and the editor**;
`durationPerLoopSeconds()` is **deleted** rather than fixed, because after the consolidation it has
no caller left and a second implementation of the rule is the thing §1 exists to prevent.

A transition resolves in two steps, both of which the implementation must read the same way:

- **kind** — item `transition` → Playlist `defaultTransition` → `"fade"`
- **length** — item `transitionDurationSeconds` → Playlist `transitionDuration` → `1`, and `0` for
  a `cut` whatever the numbers say

The kind's fallback is what makes §5's blast radius as wide as it is: an item with no `transition` of
its own inherits `fade`, and a Playlist with no `defaultTransition` still lands on `fade`, so almost
every Playlist pays transition time.
The per-item override is a real field (`playlists/types/index.ts:94`), edited per item
(`PlaylistPropertiesPane.tsx:110`) and round-tripped from the backend (`draft-from-detail.ts:27`);
`duration.ts:37` read only the Playlist default, and that defect does not survive into
`zoneSchedule()`.

The consequence is deliberate and is the widest change in this ADR: because the default transition is
`fade` at `1s` (`playlist-editor-state.ts:14`), the editor's total and item start times move for
almost every Playlist — a three-item Playlist reads `32s` where it read `30s`. That number is what
the device will actually take per cycle, and an operator scheduling against `30s` was being given a
wrong answer.

**The fade window and the frame contract.** For `k > 0` the incoming fade of the item at playback
position `k` occupies `[starts[k], starts[k] + fades[k])`. **`k = 0` has no fade at the start of a
cycle** — `durationPerLoopSeconds()` does not count one there, and a preview that fades the first
item up from nothing at `t = 0` would both contradict the schedule and double-count `fades[0]`
against the wrap. `fades[0]` is therefore used in exactly one place: the wrap window of a `loop`
Zone, below. Because the model is additive, the outgoing item's
media has finished by then: it holds its **last frame** for the width of the fade, which also stops a
video from running past its own duration. The wrap fade of a `loop` Zone sits at the **end** of the
cycle, `[totalSeconds - fades[0], totalSeconds)`, outgoing `order.at(-1)` and incoming `order[0]`;
a `once` Zone has no wrap fade, exactly as `durationPerLoopSeconds()` already counts it.

A frame therefore has to describe two items, which today's `ZonePreviewFrame` cannot:

```ts
type ZonePreviewFrame = {
  item; itemIndex; offsetSeconds; loopDurationSeconds;   // the incoming/current item
  ended: boolean;                                        // §3, `once` past its cycle
  transition: {
    outgoingItem: PlaybackPreviewItem;
    outgoingIndex: number;
    outgoingOffsetSeconds: number;   // the outgoing item's last frame
    progress: number;                // 0 → 1 across the fade window
  } | null;
};
```

Both surfaces are mounted for the width of the window and crossfaded by an opacity read from
`progress`, never a CSS mount animation. Crossfade applies to video as much as to stills; the
alternative — fading through black, or branching on asset kind — is a rule that has to be explained
forever to save one second of two decoded videos on a preview surface.

`ZonePreviewFrame` reports the incoming item as `item` from the instant its fade begins, since the
fade seconds belong to it under the model above. `onFrameChange` still fires only on identity change
as ADR 0061 §6 requires, which means **`progress` must be excluded from the key that gates it** — it
advances every animation frame, and that callback re-rendering the host sixty times a second is the
exact failure §6 exists to prevent.

### 6. `media_fit` is honoured, and unset means `fit`

`PlaybackPreviewItem` and `PlaybackPreviewSettings` gain `mediaFit`, both adapters map it, and
`PreviewSurface` resolves **item override → Playlist default → `fit`** onto
`object-contain` / `object-cover` / `object-fill`. The Zone background is already black, so `fit`
letterboxes without further work.

The default is `fit` because the editor already tells the operator so — `PlaylistPropertiesPane.tsx:131`
renders the placeholder `Playlist default (fit)`. Defaulting to `fill` to preserve today's rendering
would keep the preview and the editor disagreeing, which is the defect this ADR exists to remove.
Previews of existing Playlists will change appearance; that is the fix, not a regression.

### 7. Four mapping sites collapse to two shared mappers

`StagePreview` is not built in two places but in four, and the two undocumented ones drop settings
on the floor:

| site | shape | today |
|---|---|---|
| `playlist-preview.ts` `playlistPreviewStage()` | Playlist → one full-frame Zone | complete |
| `composition-preview.ts` `loadCompositionPreview()` | Composition Zone → Zone | no transition/fit |
| `CompositionEditorPage.tsx:255` | Composition Zone → Zone, live | inline, no transition/fit |
| `PublicationPlaybackPreviewButton.tsx:53` | Playlist → one full-frame Zone | inline, 3 fields only |

The Publication site is the plainest: it calls `decodeMetadata()` and holds the whole `playback`
object, then copies `playMode`, `repeat` and `startFrom` out of it — a hand-written re-implementation
of `playlistPreviewStage()` that has already drifted from the function it duplicates. It is changed
to call `playlistPreviewStage()`.

The two Composition sites share a new `compositionZonePreview(zone, items, playlistPlayback?)` in
`composition-preview.ts`, which is where §7's original decision now lives: a Zone binding carries
`play_mode`, `repeat` and `start_from` only (`zone-bindings.ts:102`), so `default_transition`,
`transition_duration` and `media_fit` are filled from the bound Playlist's `metadata.playback`. The
three the binding does carry win, because a Composition sets them over the Playlist deliberately.
`loadCompositionPreview()` already fetches each bound Playlist; the editor page already holds them in
`playlistItemsById` and fetches the same Playlists, so neither gains a request it did not make.

Adding the fields to two mappers and leaving two inline copies would have shipped a preview that is
correct from the Playlist editor and wrong from the Publication wizard, which is the class of bug
this ADR is about. No schema change, no RPC change, no migration.

**A shared mapper is not enough on its own.** `mediaFit` and `transitionDurationSeconds` are dropped
by the projections that run *before* it — every caller rebuilds each item by hand with four fields,
so the mapper receives values that were already thrown away. There are five such projections in two
source shapes:

| projection | source shape |
|---|---|
| `use-playlist-preview-handoff.ts:53` | `DraftItem`, camelCase |
| `PlaylistTimelinePane.tsx:46` | `DraftItem`, camelCase |
| `FullPreviewPage.tsx:154` `loadPlaylistPreview()` | `PlaylistItem`, snake_case |
| `PublicationPlaybackPreviewButton.tsx:53` | `PlaylistItem`, snake_case |
| `CompositionEditorPage.tsx:266` | `PlaylistItem`, snake_case |

Because there are two shapes and not five, `playlist-preview.ts` exports one converter per shape —
`draftItemToPreview()` and `playlistItemToPreview()` — and every projection above becomes a call to
one of them. Listing the five and widening each by two fields would work today and drift again the
next time a field is added, which is the argument §1 already made about start times.

### 8. This ADR records that ADR 0061 §7's labels never shipped

Stated here rather than silently corrected, because §7 is otherwise a reasonable-looking mitigation
that a future reader would assume was in the product for the six days it was not.

## Considered options

- **Stopping the global clock for `repeat: once`** — rejected in §3: `repeat` is per-Zone, so this is
  not expressible, and it would make a mixed Composition preview wrong in the common case.
- **A timeline several cycles long** — rejected in §3.
- **A per-session random shuffle seed** — rejected in §2: satisfies purity, discards reproducibility.
- **Simulating a `resume` anchor** — rejected in §4.
- **Crossfading stills but cutting video** — rejected in §5.
- **Defaulting `media_fit` to `fill` to preserve current output** — rejected in §6.
- **Leaving `media_fit` to a fifth issue** — rejected: same files, same ADR, same verification pass.
  #42's title is widened instead of the scope being smuggled.
- **Keeping the five independent start-time calculations** — rejected in §1: shuffle and transition
  time would have to be added to each, correctly, forever.
- **Applying `repeat` at the clock only** — rejected in §3: it cannot express a `loop` Zone beside a
  longer `once` Zone, which is the ordinary mixed Composition.
- **Counting transitions in the preview but not the editor** — rejected in §5: it manufactures the
  disagreement this ADR was drafted (on a wrong premise) to end.
- **A crossfade that overlaps the outgoing item instead of adding time** — everything would then
  agree at media-only length and the editor would need no change at all. Rejected: it contradicts
  AC 10-12, and overturning a signed acceptance criterion is not this ADR's to do quietly.
- **Fixing `durationPerLoopSeconds()` in place** — rejected in §5: it has no callers, so fixing it
  leaves two implementations of one rule, one of them dead.
- **Adding the fields to the two named adapters only** — rejected in §7: two further inline mappers
  exist and would silently drop them.

## Consequences

- **Shuffle shows one order per preview, not a fresh order each cycle.** §3's wrap makes `t` in cycle
  two identical to cycle one, so a reshuffling player is not reproduced. This is the price of ADR
  0051 §4 and is accepted.
- Composition preview changes too, in every respect above — it is the shared path (ADR 0051 §2).
  Zones with `repeat: once` now freeze rather than silently restarting.
- The preview's timeline gets longer for any Playlist using `fade`, and matches the editor for the
  first time — both counting transitions, where today neither does.
- `previewFrameAt()` changes signature and `ZonePreviewFrame` gains two fields;
  `preview-clock.check.mts`, `playlist-preview.check.mts`, the filmstrip, `PreviewStage` and
  `PlaylistPreviewPanel` are the call sites that move with them.
- **The Playlist editor's "Total duration" and timeline ruler change for almost every Playlist**
  (§5), since `fade`/`1s` is the default. `PlaylistTimelinePane` and `PlaylistItemsPane` are edited,
  and the browser verification pass must cover the editor, not the preview alone.
- `duration.ts`'s `durationPerLoopSeconds()` and its check are deleted; `duration.check.mts` keeps
  its `formatDuration` and `totalDurationSeconds` cases.
- `PublicationPlaybackPreviewButton` and `CompositionEditorPage` are edited outside `preview/`. That
  is where the regression risk of §7 sits, and both are entry points the browser pass must cover.
- Playlist Information loses nothing and gains one qualifier (`Resume · previews from first`); the
  four labels ADR 0061 §7 specified are not added, because three of them become true and the fourth
  is §4.
