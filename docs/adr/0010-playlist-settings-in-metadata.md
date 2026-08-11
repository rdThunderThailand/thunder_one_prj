# 0010 — Playlist playback settings live in `metadata` jsonb, unread by the player

## Context

The Create Playlist mockup has a whole step of playback settings — play mode, repeat,
start-from, media fit, video audio + default volume, default transition and its duration,
and failure handling with a "warn when an item is skipped" toggle.

`media_core.playlists` stores `id, tenant_id, name, status, metadata jsonb, created_at,
updated_at` and nothing else. `media_playlist_upsert` accepts only `name` and `status`;
`metadata` has never been written or read by any RPC.

More decisively: `media_job_poll` (migration 068) is the only path from a playlist to a
screen, and it reads exactly two fields off `playlist_items` —
`COALESCE(pi.duration_seconds, ma.duration_seconds)` and `pi.transition`. Of the settings
above, only the default image duration and the default transition have any effect at all,
and only because the wizard bakes them into each item row. Play mode, repeat, media fit,
volume and failure handling reach no player, today or after any amount of frontend work.

## Decision

Store the full settings block in `playlists.metadata` under a versioned envelope
(`{ v: 1, info: {...}, playback: {...} }`), write only keys that have a value, and render
the settings step as the mockup draws it — without a warning banner on the UI.

`media_playlist_upsert` gains a `p_metadata jsonb` parameter to carry it (requires a
`DROP FUNCTION` of the old four-argument signature first — adding a parameter to
`CREATE OR REPLACE` silently creates a second overload and makes existing calls ambiguous).

Rejected: **dropping the inert fields from the UI.** It would shrink step 3 to two controls,
collapsing the agreed four-step wizard to three, and would have to be rebuilt field-by-field
when the player catches up.

Rejected: **real columns for each setting.** Eleven columns for values nothing consumes, each
needing its own migration to change while the shape is still in flux. `metadata jsonb` already
exists for exactly this.

Rejected: **a "does not affect playback yet" banner on the settings step.** It is true, but a
screenful of caveats trains operators to ignore the UI. The honesty is recorded here and in a
`ponytail:` comment at the service boundary, where the next person to touch the code reads it.

Rejected: **denormalising the resolved cover into its own column.** `cover_asset_id` is written
only on an explicit pick; the `?? items[0]` fallback resolves at read time, so reordering items
never triggers a write-back.

## Consequences

The UI shows controls that change nothing on a real screen. That is a deliberate, recorded
trade-off, not an oversight — anyone finding it should read this file before "fixing" it.

Making these settings real is a player-side project (Aurora / whatever polls
`media_job_poll`), not a database one. When it happens, `media_job_poll` should read the
playlist's `metadata.playback` and emit it alongside the slot data; the storage shape does not
need to change, and the `v` field is there to renegotiate it if it does.

Nothing validates `metadata` server-side. A malformed write is a frontend bug that surfaces as
a decode failure on read, not as a rejected request. Acceptable while one client writes it;
revisit if a second client starts writing playlists.
