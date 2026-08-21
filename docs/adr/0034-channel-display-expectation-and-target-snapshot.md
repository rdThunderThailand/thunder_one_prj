# 0034 — Channel Display Expectation is an assignment gate; the Publication Target Snapshot stays frozen

Part of the Channel set: 0030 (membership and exclusivity), 0033 (lifecycle and concurrency), this
ADR, 0035 (monitoring, alerts, notifications).

## Context

Three geometry vocabularies already exist in this codebase and a fourth was about to be invented:

- **Playlist Output Profile** — ADR 0032, `src/features/playlists/output-profile.ts`: the
  `resolution` selector plus derived `width`/`height` and a computed aspect ratio, stored in
  `playlists.metadata.info`, validated field-by-field on the Thunder_Core routes.
- **Content compatibility** — ADR 0019: an asset whose geometry differs from the playlist's profile
  produces a `"aspect" | "resolution" | null` **warning, never a block**, with a 1% aspect
  tolerance. That ADR explicitly considered special-casing orientation and **dropped it**, on the
  grounds that a single aspect comparison already catches portrait-on-landscape.
- **Reported device geometry** — what a Media Device actually says it is running.

`media_core.channels` has no column for any of this today (verified 2026-08-19/20: the table is
`id, tenant_id, name, status, metadata, created_at, updated_at, channel_type, location_id,
estimated_daily_impressions`).

Separately, `CONTEXT.md`'s Publication entry guarantees that a Publication captures an immutable
snapshot of content **and targets** at publish time. ADR 0030 lets a Media Device move between
Channels. Those two facts collide: what happens to a running Publication when the Channel it
targeted loses the device it was actually playing on?

## Decision

### The term is **Channel Display Expectation**, and it is an expectation, not a fact

A Channel stores what its screens are *expected* to be — orientation and resolution. The Media
Device remains authoritative for what it *reports*. The Channel value never overwrites, corrects or
back-fills the device's reported values; it exists to be compared against them.

"Output Profile" is deliberately not reused: that name is taken by the playlist's own profile
(ADR 0032) and the two are compared against different things at different moments. Two concepts
sharing a name in the same wizard is how the wrong one gets read.

### Expectation checks gate **assignment**, with orientation as the only block

When a Media Device is assigned to a Channel:

| comparison | outcome |
| --- | --- |
| orientation mismatch (landscape expectation, portrait device) | **block** |
| resolution or aspect mismatch, same orientation | **warning + explicit operator confirmation** |

**This intentionally diverges from ADR 0019, which rejected an orientation special-case.** The
divergence is justified by the boundary, not by a change of mind: ADR 0019 governs *content vs.
playlist profile*, where the operator can see the result and a warning is the honest signal —
letterboxed video still plays. This rule governs *hardware vs. Channel expectation*, where a
portrait screen assigned to a landscape Channel produces content rotated 90° on a physical screen
in a shopping mall, discovered by a customer rather than by the operator. Same geometry maths,
different cost of being wrong.

Playlist and content geometry keep ADR 0019's rules unchanged. Nothing in this ADR makes any
content check a block.

### Default Playlist prefills; it is never a fallback

A Channel's Default Playlist **preselects the Playlist field when a Publication is created against
that Channel**. That is its entire behaviour.

- The operator may change it, and the Publication stores the operator's choice.
- If the Default Playlist is missing or inactive at that moment, the field is left empty and a
  warning is shown. Creation is not blocked.
- **The Player and the Publish Job Engine must never read it.** There is no "nothing is scheduled,
  so play the Channel default" path.

A fallback that plays content nobody scheduled is content airing with no Publication, no Schedule,
no snapshot and no audit record of who put it on screen. Prefill is a convenience in the wizard;
fallback would be an unlogged publishing path.

### The Target Snapshot stays frozen; membership change is blocked instead

A Publication's target snapshot is captured at activation and **is not rewritten** when Channel
membership later changes. This preserves what `CONTEXT.md` already guarantees and what ADR 0028's
delete guard and ADR 0025's reference guard both depend on: history that still resolves.

The collision is therefore prevented at the other end. **Removing or moving a Media Device out of a
Channel is blocked while any Active or Scheduled Publication targets that Channel.** The refusal
lists the specific Publications and what the operator can do about each — Cancel it, or wait for it
to End. Deriving "Active"/"Scheduled" uses the existing derived-status rules (ADR 0004), not a
stored column.

This is the guard that stops the double-playback state: without it, a device removed from Channel A
keeps receiving A's frozen-snapshot Publication while becoming reservable by Channel B (ADR 0030),
and one screen ends up driven by two Publications with no rule for which wins.

## Rejected alternatives

**Re-target the snapshot when membership changes ("keep it current").** The intuitive fix, and it
removes the block entirely. Rejected: it silently changes where an already-approved Publication
plays. An operator who published to three lobby screens would find it playing on a fourth they
never targeted, with no event recording the change. Immutability is the property that makes the
snapshot worth having.

**Let the Publication keep playing on the moved device (follow the device).** Rejected for the same
reason in the other direction — the Publication would play on a Channel it was never targeted at,
and the Publish Job's `Publication × Channel × Device` identity (`CONTEXT.md`) would no longer
describe reality.

**Warn on orientation mismatch instead of blocking, for consistency with ADR 0019.** Consistency is
a real argument and it was the starting position. Rejected on cost asymmetry: a warning the
operator clicks through produces a physically rotated screen that stays wrong until someone visits
the site. ADR 0019's own reasoning — "a warning the operator cannot act on teaches them to ignore
every warning" — cuts the other way here, because this warning *is* actionable at assignment time
and the block is the action.

**Block resolution/aspect mismatches too.** Rejected: a 1280×720 device on a 1920×1080 Channel
plays correctly, just softer. Blocking it would make mixed-hardware Channels — the normal case in a
mall retrofit — impossible to assemble, and the workaround would be to lie in the expectation
field, which is worse than the warning (the same failure mode ADR 0019 names).

**Store the expectation as a free-form string, or reuse `channels.metadata` jsonb.** Rejected: this
value is compared numerically on every assignment, and a jsonb key that is validated nowhere is how
`playlists.metadata.playback` sat unread for two ADRs (0010 → 0031).

**Give Channels their own resolution vocabulary.** Rejected: ADR 0032 already trimmed and pinned
the list, and `src/features/playlists/output-profile.ts` is import-free precisely so other code can
reuse it. A second list would drift.

## Consequences

- Two new Channel columns (orientation, resolution expectation) plus their CHECK constraints; shape
  and migration order live in `docs/channels/plan-channels-monitoring.md`.
- Assignment gains a confirmation step that the API must model, not just the UI: the warning
  confirmation is a parameter on the assign RPC, so an API caller cannot bypass what the UI
  enforces.
- Removing a Media Device can now fail with a list of blocking Publications. That list is part of
  the error payload, in the shape ADR 0025's delete guard established for playlists.
- The same guard covers deactivation, not just device removal: ADR 0033 blocks deactivating a
  Channel while an Active or Scheduled Publication targets it. Without that, deactivation would
  release the reservations and re-open the double-playback path from the other side.
- `channels.default_playlist_id` is a new nullable column referencing `media_core.playlists`,
  `ON DELETE SET NULL` — a prefill pointer must never keep a playlist alive against ADR 0025's
  delete guard.
- A Channel whose expectation is left empty performs no check. Empty is allowed, and it means
  "unknown", not "matches everything" — the plan's acceptance criteria assert the no-check path
  shows no false confirmation prompt.
