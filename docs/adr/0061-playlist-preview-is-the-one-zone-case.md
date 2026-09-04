# Playlist preview is the one-Zone case of the existing stage

**Status:** accepted · **Date:** 2026-09-03
**Extends:** ADR 0051 (pre-publish preview) · ADR 0060 §1, §3 (playlist editor, no publish authority)
**Amends:** ADR 0051 §4 — the lifecycle sentence "saved work loads by id first", for `source: "playlist"` only
**Design guideline:** `docs/playlists/v1/design-guideline-playlist-editor.md` (Preview section)
**Issue:** #39, landing with #33

## Context

ADR 0051 §2 already ruled that "a Playlist is the one-Zone case, not a second code path": previewing
a Playlist means previewing one Zone at `x=0 y=0 w=100 h=100`. What was never built is the way in.
The Playlist's only preview today is `PlaybackPreviewModal` mounted inside `ReviewStep.tsx`, which
ADR 0060 deletes with the wizard. Without a replacement in the same branch, Playlist preview leaves
the product entirely.

The preview feature as built accepts two sources:

```ts
// FullPreviewPage.tsx:27
source: "composition" | "publication"
// composition-preview.ts:7 — the handoff payload's shape
export type CompositionPreview = { zones; aspectRatio; referenceResolution };
```

Two routes exist under `(preview)`, and `isHandoff()` validates a field literally named
`compositionId`. A Playlist has neither a Composition nor geometry of its own.

## Decision

### 1. The `source` union widens; the payload does not split

The handoff identity changes in two ways: the `source` union gains `"playlist"`, and the handoff
carries a source-neutral identity instead of a Composition-shaped one. The payload's *shape* is what
does not split — §2 adds two optional fields inside it, but there is still one payload type.

```ts
type PreviewSource  = "composition" | "publication" | "playlist";
type StagePreview   = { zones; aspectRatio; referenceResolution };   // was CompositionPreview
type PreviewHandoff = StagePreview & { source: PreviewSource; id: string; assets: MediaAsset[] };
isHandoff(value, source, id)
```

The payload is deliberately **not** a discriminated union. A Playlist adapter produces a
`StagePreview` holding exactly one full-frame Zone, which is what ADR 0051 §2 decided; a union would
reintroduce the second code path that ruling exists to prevent. `CompositionPreview` is renamed
`StagePreview` because with three sources the old name is no longer true.

`composition-preview.ts` keeps the Composition loader. The Playlist adapter is a new
`playlist-preview.ts` exposing one pure function — `playlistPreviewStage({ name, items, playback })`
— reached identically by every entry point, so no two callers can drift. The chosen frame is **not**
an input: the Zone is `0/0/100/100` at every aspect ratio, and geometry selection is already
`PreviewStage`'s own state. The host passes `geometryOptions` to the stage; the adapter never sees
them. It is the
mapping that `ReviewStep.tsx:54` performs inline today, lifted rather than rewritten, and it is where
this work's one `.check.mts` lives.

`PlaybackPreviewModal` is untouched: the Composition editor and the Publication wizard still mount
it, and this issue has no reason to disturb them.

### 2. `PlaybackPreviewSettings` widens by two fields so the panel has a typed path

Playlist Information shows Transition and Transition Duration, which the design guideline defines at
**Playlist level** — `metadata.playback` as the default for items whose own value is `NULL`.
`PlaybackPreviewSettings` carries `playMode`, `repeat` and `startFrom` only, so today there is no
typed way to move those two values through `StagePreview` to the panel.

```ts
// preview-clock.ts — types only; previewFrameAt() is not touched
type PlaybackPreviewSettings = {
  playMode?: "sequential" | "shuffle";
  repeat?: "loop" | "once";
  startFrom?: "first" | "resume";
  defaultTransition?: string | null;   // added
  transitionDurationSeconds?: number | null;   // added
};
```

The adapter maps them onto `zone.playback` — `defaultTransition: playback.defaultTransition` and
`transitionDurationSeconds: playback.transitionDuration`. The name gains its unit at the preview
boundary deliberately: ADR 0060 already had to resolve what `transition_duration` counts in, and a
preview field that says `Seconds` cannot be misread. Reading the *current item's* `transition` instead
was rejected: it is a different value with a different meaning, and both the guideline and the
mockup place a Playlist-level pair in this panel.

### 3. Duration is resolved in one place, and it is not the adapter

`PreviewStage` already applies ADR 0051 §3's `COALESCE(item, asset)`:

```ts
// PreviewStage.tsx:59
durationSeconds: item.durationSeconds ?? assetsById[item.mediaAssetId]?.duration_seconds
```

The adapter therefore passes `duration_seconds` through nullable and writes no second rule. ADR 0051
§3 states plainly what a divergent rule costs: the number of loop restarts the preview shows becomes
wrong, which is the one thing that section exists to get right.

### 4. Handoff is the only way in, and this amends ADR 0051 §4

ADR 0051 §4 says saved work loads by id and reserves the `BroadcastChannel` session for a dirty
unsaved draft; `FullPreviewPage.tsx:60` implements exactly that fallback. **For `source: "playlist"`
that sentence does not hold, and this ADR amends it rather than leaving two contracts in the docs.**

Under ADR 0060 §1 a Playlist row is created on first save, not on entering the editor, so a Playlist
being previewed may have no id to load by. Preview opens from the live editor and nowhere else, so a
`previewSession` is always present; a Playlist preview URL opened without one shows the existing
expired state. No `loadPlaylistPreview(id)` is built, because on the day it ships nothing would reach
it.

The reversal path is deliberate and cheap: the adapter is already a pure function, so the by-id
loader is a fetch plus one call, to be added when a caller outside the editor exists — #38's list
page being the likely one.

An unsaved Playlist uses the literal path segment `new`
(`/media-workspace/preview/playlist/new?previewSession=…`), which reads as what it is. Session
identity is the random channel name, not the id; the id is a guard. The editor captures the id when
it opens the preview and keeps sending that value for the channel's lifetime, so saving mid-preview
neither invalidates the handoff nor restarts the clock.

The handoff carries only the assets its Zone references, per ADR 0051, and no preview URLs:
`PreviewStage` fetches its own, and a URL that expires in transit between windows is worse than none.

### 5. The frame is three synthetic geometry options, and the pixel claim is withdrawn

A Playlist has no geometry, so the operator picks the frame — 16:9, 9:16, 4:3. These are expressed as
three `GeometryOption`s carrying representative resolutions (`1920x1080`, `1080x1920`, `1440x1080`),
which `resolveFrameAspectRatio` already turns into the right shape. `preview-geometry.ts` is not
touched. Options are ordered so the first is 16:9, which is what `defaultGeometry()` selects when all
counts tie. The choice is view state and is not persisted, per ADR 0055.

Those representative resolutions are a means of stating a ratio and are not a claim about pixels, but
`resolveFramePixels` reads `option.resolution` before anything else, so they would light up the
`Actual size (1920×1080)` control at `PreviewStage.tsx:256` and assert a resolution the Playlist does
not have. Passing `referenceResolution: null` does not prevent this. `PreviewStage` therefore gains
`allowActualSize?: boolean` (default `true`); the Playlist host passes `false` and the control is
hidden. The alternative — widening `GeometryOption` with an `aspectRatio` field — was rejected as a
change to a tested helper shared by two other hosts in exchange for a boolean.

### 6. Now Playing and Playlist Information read the stage's clock, they do not keep one

`timeSeconds` and `previewFrameAt()` stay inside `PreviewStage`, which owns the single `t` that ADR
0051 §4 requires. The panels are a sibling component fed by a new
`onFrameChange?: (frame: ZonePreviewFrame | null) => void`.

The callback fires when the **displayed frame's identity or metadata changes, and never when only
`offsetSeconds` advances** — in practice an effect depending on `frame.itemIndex` and `frame.item`.
It yields `null` unless the preview holds exactly one Zone.

Both constraints are load-bearing. `PreviewStage.tsx:120` advances `timeSeconds` from a
`requestAnimationFrame` loop and `:158` builds a fresh frame object every render, so a callback wired
naively to that object re-renders the whole page around sixty times a second. Keying on `itemIndex`
alone is equally wrong in the other direction: a live handoff can replace the asset, title or
duration of the item at the *same* index without resetting the clock, and the panel would keep
showing what the stage no longer plays. The one-Zone guard states in the type what §1 decided in
prose — this callback answers "what is playing", a question only a single-Zone preview has one answer
to. The consequence is accepted: the panel has no per-frame progress readout, and the stage's own
timeline already shows elapsed time.

### 7. The preview shows timing and geometry; play mode, repeat, start-from and transition are stated, not played

`previewFrameAt()` reads `items` and `timeSeconds` alone. `playMode`, `repeat` and `startFrom` are
carried on `PlaybackPreviewSettings`, and `transition` on `PlaybackPreviewItem`, and nothing reads
any of them — in Composition preview today as much as in Playlist preview tomorrow.

Making them real is a separate issue, not an omission to be smuggled into this one. Each is
constrained by ADR 0051 §4's rule that every frame is a pure function of one shared `t`: shuffle
needs a deterministic seed or scrubbing contradicts itself, `repeat: once` changes what the timeline
means, `startFrom: resume` has no player state to resume from in a browser, and a transition must be
evaluated across the boundary between two items rather than animated on mount.

**Because this gap is visible to the operator, it is stated in the interface and not only here.**
Playlist Information labels the values it cannot honour — `Shuffle (not simulated)`, `Once (preview
loops)`, `Resume (not simulated)`, `Transition (not simulated)`, or one notice covering all four. A
panel that reads "Shuffle" beside a stage playing in order misleads exactly the operator the preview
exists to inform, and an ADR the operator will never read does not repair that.

### 8. Nothing here publishes

There is no Publish control in `preview/` today and none is added, in the editor or the preview
(ADR 0060 §3). Preview of an empty Playlist is prevented at the entry point — the Preview action is
disabled at zero items, as `ReviewStep` disables it today — rather than by designing an empty state
for a tab with nothing to show.

## Considered options

- **A discriminated payload union (`CompositionPreview | PlaylistPreview`)** — rejected: ADR 0051 §2
  ruled the Playlist is the one-Zone reduction, and a union is the second code path that ruling
  forbids, kept in step by hand forever after.
- **Reversing §4 to conform to ADR 0051 as written** — building `loadPlaylistPreview(id)` so saved
  Playlists load by id and only dirty ones use the channel. Rejected: two production paths from day
  one to satisfy a sentence, when the operator has one way in. Amending the sentence is the honest
  move, and §4 records the reversal.
- **Widening `GeometryOption` with an explicit `aspectRatio`** — rejected in §5.
- **Honouring play mode and repeat in the clock now** — rejected in §7; it changes Composition
  preview through the shared path and each behaviour is its own design problem.
- **A modal entry point beside the tab** — rejected: Figma and #39 both describe a full-screen
  surface, and two hosts would mean maintaining Now Playing and Playlist Information twice from the
  first day, for a duplicate no one asked for.

## Consequences

- Playlist preview survives the wizard's deletion, and #33 and #39 must land together.
- `CompositionPreview` → `StagePreview` and `compositionId` → `{ source, id }` touch both existing
  preview routes; that rename is where this change's regression risk sits.
- `PreviewStage` gains two props (`allowActualSize`, `onFrameChange`) and no new state.
  `preview-clock.ts` gains two optional fields on `PlaybackPreviewSettings`; `previewFrameAt()`,
  `preview-geometry.ts` and the duration rule are unchanged.
- No schema change, no RPC change, no migration. The preview reads state the editor already holds.
- A Playlist preview URL is not shareable or bookmarkable; without a live editor it reports expired.
- Play mode, repeat, start-from and transition remain stated-not-played until a separate issue takes
  them, and the interface says so.
