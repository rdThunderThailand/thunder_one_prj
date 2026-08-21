# 0031 — Playback behavior reaches the player: per-slot `playback`, validated on save

## Context

`docs/adr/0010-playlist-settings-in-metadata.md` stored play mode, repeat, and start-from in
`playlists.metadata.playback` and stated plainly that nothing reads them: `media_job_poll` only
ever selected `duration_seconds` and `transition` off `playlist_items`, and `media_playlist_upsert`
validated no part of `metadata`. That ADR called the actual wiring a "player-side project" for
later — this ADR is that later.

Ticket 86d3xxk6n (Subtask 2 — Playback Behavior, under parent 86d3xxk5u — Create Playlist Step 3:
Settings) asks for Sequential/Shuffle, Loop/Play once, and First item/Resume last successful item
to reach a real screen, plus the backend rejecting a mode the playback engine doesn't support.

A single `media_job_poll` response can carry slots from multiple publications — and therefore
multiple playlists — in-window at the same priority tier at once (069's priority-override logic
already merges them into one `slots[]` array). Any shape for `playback` has to survive that.

## Decision

`media_job_poll` (migration 099) now emits a `playback` object on **every slot**, not once at the
top level and not in a new parallel array:

```json
{
  "start_offset_seconds": 0,
  "publication_id": "a1c4d5e6-...",
  "playback": { "play_mode": "shuffle", "repeat": "once", "start_from": "resume" }
}
```

Each slot already carries `publication_id`; a player groups slots by that key to recover which
playback settings belong to which playlist. `play_mode` defaults to `"sequential"`, `repeat` to
`"loop"`, `start_from` to `"first"` when a playlist's `metadata.playback` has no value for a key —
the field is never absent, so a new player build never needs a branch for "missing playback".

The server does not perform shuffle itself and does not touch `start_offset_seconds` or
`loop_duration_seconds` — a player computes its position in the loop from
`(elapsed time) mod loop_duration_seconds`, and reordering slots server-side on every poll would
make that computation meaningless from one poll to the next. Shuffle, and resume's own memory of
"last item successfully played", are player-side responsibilities; the server only carries the
operator's intent.

`media_playlist_upsert` (migration 099) now rejects a `play_mode` outside
`('sequential', 'shuffle')`, a `repeat` outside `('loop', 'once')`, or a `start_from` outside
`('first', 'resume')` in the same request — the validation ADR 0010 said didn't exist yet.

## Rejected alternatives

**A single top-level `playback` key**, alongside `loop_duration_seconds`. Simpler, but wrong the
moment two in-window publications at equal priority carry different settings — one playlist's
choice would silently overwrite or shadow the other's with no way to tell which slot it applied to.

**A separate `segments[]` array**, one entry per publication carrying `playback` plus its slot
offsets, with `slots[]` left untouched. Keeps `slots[]` unchanged, but doubles the payload's
structure: a player has to cross-reference two arrays to answer one question ("how does this slot
play?"), and the two arrays can drift out of sync as future fields are added to one but not
the other.

## Consequences

The timeline "seam" between two in-window publications with different `repeat` values is still
undefined: if publication A is `repeat: "once"` and finishes while publication B (sharing the
same loop) is still `repeat: "loop"`, what a player should show in A's now-empty offset range has
no answer in this contract. Left to the player team and product to resolve once shuffle/once
actually ship in a firmware build — flagged here so nobody assumes it's already decided.

`media_job_poll`'s other keys, ordering, and semantics are unchanged; a player that ignores
`playback` entirely keeps behaving exactly as it did before this migration, per the compatibility
rules already documented in `.docs/player_contract_timeline.md`.
