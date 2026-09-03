# Playlist authoring is one editor page with no targeting authority

**Status:** accepted · **Date:** 2026-09-02
**Supersedes:** ADR 0012 and ADR 0013 (the four-step create wizard and its browser-local draft)
**Extends:** ADR 0028 (playlist active/inactive is derived) · ADR 0031 (playback behaviour reaching the player) · ADR 0045 (publication snapshot materialization) · ADR 0056 (nested feature folders and Trash)
**Design guideline:** `docs/playlists/v1/design-guideline-playlist-editor.md` (Figma reference for this area)

## Context

Playlist authoring today is a four-step wizard (`BasicInfoStep` → `ContentStep` → `SettingsStep` →
`ReviewStep`) whose working copy lives in browser `localStorage` until the last step. Every other
content area of the Media Workspace — Layouts, Compositions — is a list plus one editor page. A new
Figma design draws Playlist the same way, and in doing so also draws several controls that the
system's own model does not permit: a Publish button inside the editor, a Zones tab, a Layout used
as a Playlist item, and a `Scheduled` playlist status.

Separately, per-item playback intent (fit, background colour, transition duration) is drawn per item
in the design while the schema stores only `media_asset_id`, `position`, `duration_seconds` and
`transition`, and while `metadata.playback` holds one playlist-wide value for some of the same
concerns.

## Decision

**1. One editor page replaces the wizard.** `/media-workspace/playlists/[id]` is a three-pane editor:
item list, preview and timeline with playback settings, and a properties pane for the selected item.
The stepper components and `step-validation.ts` are removed. The row is created on the first save,
not on entering the page, so abandoning a new Playlist leaves nothing behind — Trash exists but
should not be a garbage collector for rows nobody meant to make.

**2. Saving is manual and optimistic-locked.** The editor's only save control is *Save Draft*, which
sends `expected_revision` and surfaces a conflict rather than overwriting. There is no autosave:
debounced writes would race their own revision check. Leaving with unsaved edits is confirmed.

**3. The editor has no targeting authority.** There is no Publish button on the editor or the
preview. A Playlist decides ordering and per-item playback; deciding where and when it airs remains
a Publication (`CONTEXT.md`, ADR 0045). The editor holds no state-changing control beyond saving. A
shortcut into Publication creation may be added later; it is not this phase's Publish button under
another name.

Leaving `draft` is therefore the one stored transition, and it is a row action on the list page —
*Mark as ready*, one way. It exists because without it a Playlist authored in the editor could never
enter the Publication content picker, which excludes drafts. It is not a three-way status toggle:
under ADR 0028 `active` and `inactive` are **derived** from how many Publications reference the
Playlist, and `playlistDisplayStatus()` remains the single place that derivation happens. The list
therefore shows one status column and no separate "used by N publications" badge — both would be
rendering the same number twice.

**3b. Playlist-level playback settings apply to flat Publications only.** `media_publication_activate`
takes a Zone's playback from `composition_zones.playback` on the zoned path and reads
`playlists.metadata.playback` only on the flat path, so a Playlist bound into a Composition Zone has
its play mode, repeat and start-from overridden by that Zone — as ADR 0049 intends. The editor says
so where those controls are, rather than presenting them as universal.

`metadata.playback` serves two different readers, and the distinction decides what the editor may
offer. Three keys — `play_mode`, `repeat`, `start_from` — are copied into the snapshot Zone's
`playback` object and reach the player (ADR 0031). A second group is read by
`media_publication_activate` as the **default an item inherits when its own column is `NULL`** (§5),
which is a legitimate role even though no player ever sees the key itself. A key in neither group is
written and read by nobody: the wizard has been leaving several such keys on production rows
(`audio_enabled`, `default_volume`, `failure_handling`, `warn_on_skip`, `default_image_duration`),
and the new editor adds no control that produces another one. Those keys stay where they are —
inert, not harmful — rather than being stripped in a migration that buys nothing.

**4. A Playlist item is an Asset, and only an Asset.** Compositions bind Playlists per Zone; letting
a Playlist hold a Composition inverts that containment and admits cycles (Composition → Zone →
Playlist → the same Composition). Supporting it would require a polymorphic `playlist_items`, cycle
detection in the database, a redefinition of what a Composition's duration means inside a linear
sequence, and changes to snapshot materialization and the player contract. The Zones tab drawn in
the editor is likewise not built: it is the Composition editor, which already exists.

**5. Per-item playback intent becomes real columns that reach the snapshot.**
`playlist_items` gains `transition_duration_seconds`, `fit`, `background_color` and `notes`, all
nullable, where `NULL` means *inherit the playlist's value* — the rule `duration_seconds` already
follows.

The two that already have a playlist-level counterpart reuse it rather than introducing a parallel
one. `fit` inherits `metadata.playback.media_fit` and shares its vocabulary (`fit` / `fill` /
`stretch`). `transition_duration_seconds` inherits `metadata.playback.transition_duration`, and is
named in seconds for that reason: the existing key is in seconds, `playlist_items.duration_seconds`
beside it is in seconds, and a millisecond column between them would be a unit split inside one
table — the same shape of trap this ADR is otherwise closing.

Reusing the key has a consequence worth stating plainly: **those stored values begin to take effect
for the first time.** They are not new intent being invented, they are a promise the product has
been making and not keeping — `ReviewStep` and `PlaylistSummary` have been rendering `fade (1s)` and
`durationPerLoopSeconds()` has been adding that second into the loop length shown on screen, while
no player ever received the value. Honouring it makes the screen match the number the UI already
displays. Measured against production on 2026-09-02, the reach is small: of 86 Playlists, 7 carry a
stored `transition_duration`, and 17 of 133 items across 8 Playlists resolve to a transition other
than `cut`. Seventeen items is the ceiling on what can change. (The wizard store seeds
`transitionDuration: 1` into every draft it creates, but most production Playlists never came from
the wizard — they are the `inline` Playlists a Composition Zone owns and the single-asset wrappers a
Publication owns.)

Materialization applies the same rule the frontend's duration maths already uses: a `cut` resolves
to a transition duration of `0`, rather than carrying a fade length on a slot that does not fade.
Inheritance is **resolved when the snapshot is written**, exactly as `duration_seconds` is today
(`COALESCE(pi.duration_seconds, ma.duration_seconds)`): `publication_snapshot_items` stores the
effective value, never a `NULL` awaiting a default that the poll response does not carry. Copying the
columns across verbatim would hand the player a null it has nothing to fall back to.
Playlist-wide defaults stay in `metadata.playback` and are resolved at materialization time; lifting
them into columns would require migrating every existing playlist's metadata on production for no
behavioural gain. The four columns are carried through `publication_snapshot_items` and the
`media_job_poll` payload in the same change: a field that stops at the schema is lost at activation,
silently, because the poll reads snapshots and never `playlist_items`. Whether the Windows and
Android players act on them is their own repository's work, tracked through
`docs/layouts/contract-v2-zones.md`.

**5a. What the four columns resolve to when nobody set them** (settled 2026-09-03, implementing §5).
Only two of the four inherit, because only two have a playlist-level counterpart. `fit` and
`transition_duration_seconds` resolve through `metadata.playback` and land `NOT NULL` in the
snapshot; `background_color` and `notes` are per-item and stay nullable there, because a `NULL`
background means *paint none* — a real value the Layout's own `background` already answers — not a
default the player is missing. Forcing them `NOT NULL` would paint black behind every existing slot.

With nothing set anywhere, a `fade` resolves to **1 second** and `fit` resolves to **`fit`**. The
`1` mirrors `duration.ts` (`transition === "cut" ? 0 : transitionDuration ?? 1`), the number the
editor already counts into the loop length shown on screen; choosing `0` would open a new
screen-versus-player gap on the same day this ADR closes the old one. `fit` is the only fit value
that neither crops nor distorts, and cropping must always be something someone chose.

Inheritance resolves against `playlists.metadata.playback` on **both** activation paths. §3b is
about the Zone's `playback` object, whose three keys a Composition Zone genuinely overrides; it
says nothing about per-item inheritance, and `duration_seconds` already COALESCEs identically on
both paths. Resolving differently would make one Playlist look different depending on whether a
Composition happened to contain it.

`notes` reaches the snapshot but **not the poll payload**: no player acts on an authoring
annotation, and every device would carry it every poll. `playlist_items.transition` also stays as
it is — `NOT NULL DEFAULT 'cut'`, seeded from `default_transition` when the item is added, never
re-resolved. One table thus holds two inheritance rules; that is a deliberate stopping point, not
an oversight. Unifying it means migrating production rows while guessing which `cut` was chosen and
which was merely the default.

`lock_duration` from the design is not built — it has no meaning until a Composition constrains a
Zone's length. The transition vocabulary stays `cut` and `fade`: a new value is a player effect, not
an enum entry, and shipping one without the effect yields a control that silently does nothing.

**6. Playlist status stays `draft / active / inactive` with ADR 0028's meaning.** The design's
`Scheduled` belongs to a Publication and is derived from its Schedule (ADR 0004); nothing in the
Playlist's own vocabulary can express it. `active` and `inactive` continue to mean *referenced by at
least one Publication* and *referenced by none*, derived from the `publication_count` that
`media_playlists_list` and `media_playlist_get` already return (Thunder_Core migration 098). No
backend change is needed for the list's status column, and none should be made: adding a second,
stored notion of active would put the same word in two places with different answers.

**7. Trash is blocked while a `draft` or `active` Publication references the Playlist.** ADR 0056
lets a trashed Asset keep resolving for materialized playback, because the snapshot pins
`file_version_no`. A Playlist needs a stricter rule, and not for the reason one might expect: the
poll is already snapshot-only and never reads `playlist_items` (ADR 0045, applied). The live read
happens at **activation** — `media_publication_activate` materializes the snapshot straight from
`playlist_items`, and `media_publication_republish` re-runs that same activation in one transaction.

So the dangerous window is not a Publication that is airing; it is a Publication that has *not yet*
materialized. A `draft` Publication pointing at a trashed Playlist would, on the day someone
activates it, pull items out of the Trash and put them on a screen with no error anywhere. Guarding
only `active` would leave exactly that path open. Trashing therefore refuses while any Publication
with status `draft` or `active` references the Playlist, naming it. That pair is not a margin of
safety, it is the exact reachable set: `media_publication_activate` refuses anything whose status is
not `draft`, and `media_publication_republish` refuses anything not `active` before flipping the row
to `draft` and calling activate within the same transaction. A `cancelled` or ended Publication can
reach neither entry point, so it cannot resurrect a trashed Playlist and does not block trashing it.
(`status` here is the stored column — ADR 0004's derived `Scheduled` and `Ended` are read-time
labels over `active`.)

Permanent deletion keeps `media_playlist_delete`'s existing guard, which counts **every**
Publication regardless of status. That is deliberately a dead end for now: a Playlist that has ever
been published can be trashed and restored but never permanently deleted, because
`publications.playlist_id` is `ON DELETE RESTRICT` and the row is what a historical Publication
still points at. Loosening it — allowing deletion once every referencing Publication has ended and
its snapshot stands on its own — is a separate decision with its own referential-integrity work, and
is not made here. The UI states the restriction rather than offering an action that always fails.

**8. Playlist tags share the tenant's one tag vocabulary.** A `playlist_tags` join follows
`publication_tags` and `media_asset_tags` against `media_core.tags`. The `metadata.info.tags` array
the wizard wrote is backfilled into that table and the key removed, so one concept does not live in
two places.

## Considered options

- **Keeping the wizard and restyling it** was rejected because it leaves Playlist as the only content
  area with a different authoring shape, and the design's value is precisely the single canvas.
- **Creating the draft row on entering the editor** is simpler to build but strews `Untitled Playlist`
  rows through the library every time someone changes their mind.
- **Storing the per-item fields in `metadata`** would match the design without a migration, but
  produces a shadow schema with no foreign keys, no validation, and no defined behaviour when an item
  is removed.
- **Carrying the new columns only as far as `playlist_items`** was rejected because activation would
  drop them without error — the worst available failure mode.
- **A separate tag vocabulary per feature** was rejected because the same word typed in two places
  would become two tags and break reporting.

## Consequences

- ADR 0012 and ADR 0013 no longer describe how a Playlist is authored; the browser-local draft and
  its resume prompt are removed along with the wizard. `usePlaylistDraftStore` is that draft's only
  reader, so removing it leaves the old `localStorage` key as inert data — no rehydration path and
  nothing to version.
- ADR 0028 is untouched and its single derivation point stays where it is.
- Preview gains a third source. `FullPreviewPage` accepts `composition` and `publication` only, and
  its handoff payload is a `CompositionPreview` of zones and an aspect ratio. A Playlist has neither,
  so previewing one means a new route and an adapter that presents the Playlist as a single
  full-frame zone at the operator's chosen aspect ratio. The Playlist's current preview lives inside
  the wizard's review step and disappears with it, so the two must land together.
- Folder, Tag and Trash adoption for Playlist — left open by ADR 0056 — is completed by this work.
- A Playlist created in the editor is a draft until someone marks it as ready from the list; the
  Publication content picker continues to exclude drafts. Marking one ready moves its badge from
  `Draft` to `Inactive`, not to `Active`, because ADR 0028 derives `Active` from having at least one
  referencing Publication and a freshly authored Playlist has none. That is correct behaviour, and
  the temptation to "fix" it by storing `active` is the thing ADR 0028 exists to prevent.
- Composition-as-item remains an open design question with a known cost, not a rejected idea.
