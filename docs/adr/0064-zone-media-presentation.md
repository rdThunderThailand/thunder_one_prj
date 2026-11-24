# A Zone decides how its content is framed and whether it makes a sound

**Status:** accepted · 2026-09-08
**Amends:** `0063-create-layout-flow-phase-1.md` §6 (the row that deferred per-Zone Fill Mode and Mute)
**Extends:** `0049-composition-layout-with-content.md` §1, `0060-playlist-editor-single-page.md`, `0062-the-preview-plays-what-the-playlist-says.md`

## Context

A Zone today carries three playback settings — `play_mode`, `repeat`, `start_from` — and nothing
else. Everything about *presentation* is resolved from the content: media fit comes from the item,
then the Playlist, then the literal default `fit`; audio comes from the item's `audio_enabled` and
the device's own policy. ADR 0063 §6 saw the Fill Mode and Mute controls in the Phase 1 frames and
deferred them deliberately, keeping Transition per item.

Two facts make that deferral stop working.

**A Playlist does not know the shape of the frame it will play in.** Media fit was set when the
Playlist was authored, against no particular geometry. The same Playlist is legitimately bound to a
wide main Zone in one Composition and a narrow ticker in another; a `fill` that crops tastefully in
the first crops the subject's head off in the second. The Zone is the only place in the model that
knows the aspect ratio the content will actually occupy.

**Nothing in the model prevents every Zone playing audio at once.** Audio is decided per item, and
a Composition merges several independent Zone loops onto one screen. A three-Zone Composition whose
Playlists all carry sound produces three simultaneous audio tracks with no place to say "the ticker
is silent". Muting each item of each bound Playlist is both tedious and wrong — it edits shared
content to fix one Composition's arrangement.

`CONTEXT.md`'s *Playback Preview* entry already asserts that content inside a Zone follows "that
Zone's `media_fit`". No such field exists; this ADR makes that sentence true rather than deleting it.

## Decision

### 1. `media_fit` moves onto the Zone and wins

`composition_zones.playback` gains `media_fit: 'fit' | 'fill' | 'stretch'`, default `fit`, with the
existing semantics unchanged — `fit` = contain, `fill` = cover/crop, `stretch` = distort to bounds
(`PreviewSurface.tsx` already maps all three).

For a **zoned payload the Zone's value wins outright**: it overrides the item's and the Playlist's.
The Zone was chosen precisely because it is the only party that knows the frame, so a value authored
without knowledge of that frame must not beat it. This is an override, not a default layer.

A **flat (Layout-less) Publication is untouched** — one implicit whole-screen Zone, no Zone row, and
the existing item → Playlist → `fit` chain continues to resolve it.

### 2. `muted` is per Zone, and a new Zone is silent

`playback` gains `muted: boolean`. The two values are deliberately asymmetric:

- `muted: true` **forces silence**. Nothing downstream can re-enable audio for that Zone.
- `muted: false` **decides nothing** — it hands the question back to the existing item / Playlist /
  device / global audio policy, exactly as today.

Forcing silence is safe; forcing sound is not, so only one direction is an override. **A newly
created Zone binding defaults to `muted: true`** — the useful default for a multi-Zone screen is a
quiet one, with the operator deliberately granting audio to the one Zone that should have it.

### 3. Transition stays on the item

No Zone-level transition field, and no `transitions_enabled` kill switch. Fit and mute exist because
the Zone knows something the item cannot (the frame's shape, the presence of sibling Zones); a Zone
knows nothing about transitions that the item does not. A kill switch would be a second control whose
only effect is reachable already by setting `cut` on the items. ADR 0063's per-item transition
resolution stands unamended.

### 4. Templates stay geometry-only

These values are not added to `layouts`, to the frontend template constants, or to `CreateSeed`. They
are created as defaults on a Composition's Zone binding. A Template that carried playback would break
the geometry/content boundary ADR 0052 §4 drew and that ADR 0063 §1 reaffirmed.

### 5. Delivery scope is authoring, Core and Preview — not the Players

Phase A (this decision): ThunderOne editor, Core schema/RPC/snapshot/poll, browser Playback Preview.
Phase B (separate project, not scheduled here): the Windows and Android players.

This is recorded because the consequence is blunt and must not surprise anyone: **after Phase A the
new settings change nothing on a physical screen.** Both players consume only flat top-level `slots`
and never read `zones[]` at all — Windows hardcodes a uniform fit, Android hardcodes `FIT_CENTER`,
and neither has any concept of Zone audio. Honouring per-Zone fit and mute on a device is not a patch
to those players; it is the multi-zone renderer they do not yet have. The signage directories are
also not Git repositories, so their ownership and delivery process must be established before Phase B
is planned.

### 6. Compatibility

**Core ships before ThunderOne.** The Core Zod schema strips unknown keys and
`media_composition_set_zones` reconstructs `playback` from the keys it knows, so a ThunderOne deploy
that lands first would discard `media_fit` and `muted` on save **with no error visible to the
operator**. The ordering is the whole mitigation: migration + schema + swagger reach the deployed
Core first, ThunderOne follows. No capability negotiation is added to the frontend for a one-time
release-ordering problem.

**Hydrating a Composition saved before this change uses `muted ?? false`, not the `true` of a new
Zone.** The two defaults differ on purpose: flipping the default to `true` for existing rows would
silence Compositions that are airing with sound today, the first time an operator opens one and
presses Save. `media_fit ?? 'fit'` needs no such split — `fit` is what those rows already resolve to.

**Publication snapshots are not backfilled.** A snapshot is immutable and a published screen must not
change because a Composition was edited; accepted settings reach devices on republish, through the
existing drift flag. Nothing reads live Composition state over a snapshot.

### 7. Surfaces

The **Content tab** of Zone Properties gains a `Media fit` select and a `Mute` checkbox alongside the
three existing selects, in the same shape as its neighbours. *Apply to All Zones* needs no change:
`applyPlaybackToAll` copies the whole `ZonePlayback` object, so the new fields travel with it, and it
still copies no Playlist or asset binding.

**Playback Preview honours `media_fit` and only labels `muted`.** The preview surface renders the
Zone's fit for real; mute is drawn as a state marker on the Zone frame and is not wired to element
audio, because browser autoplay policy keeps the preview silent regardless — wiring it would prove
nothing while making the operator believe the preview had verified the setting.

## Rejected alternatives

**Zone fit as the bottom default layer** (item → Playlist → Zone → `fit`). Preserves every value ever
authored, and thereby fails at the one job: an item that already carries `fill` keeps cropping badly
in a narrow Zone, which is the case that prompted the request.

**`muted` defaulting to `false`.** Matches today's behaviour most literally and produces the wrong
first result — a three-Zone Composition that shouts three ways until the operator mutes two.

**One audio Zone per Composition, as a Composition-level radio.** Structurally prevents overlapping
audio instead of relying on the operator, but adds a Composition-level field and a player rule for a
constraint nobody has reported hitting. Reachable later from the per-Zone boolean without rework.

**`transitions_enabled` at the Zone.** See §3.

**Frontend capability detection against the deployed Core.** A negotiation path used once, kept
forever. Release ordering costs nothing and expires by itself.

## Consequences

- `CompositionZonePlayback`, the editor's `ZonePlayback`, its defaults, serialization and hydration
  all grow two fields; `applyPlaybackToAll` and its checks are unchanged in shape.
- Core needs a migration (`playback` JSONB validation and reconstruction in
  `media_composition_set_zones`, snapshot copy, poll payload), a Zod change and a swagger update.
  **Authoring the migration is not applying it — applying to production is R0 and needs explicit
  approval.**
- `CONTEXT.md`'s existing claim about a Zone's `media_fit` becomes accurate; the *Zone* entry gains
  media fit and mute as Zone-owned settings.
- Per-Zone fit and mute are visible only in the browser Preview until Phase B ships.
