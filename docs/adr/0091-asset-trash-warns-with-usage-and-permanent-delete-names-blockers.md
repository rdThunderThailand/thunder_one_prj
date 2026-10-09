# Asset Trash warns with its Usage, and Permanent delete names its blockers

**Status:** accepted · 2026-10-09
**Source:** issue #262 (QA batch 2026-10-08, item 13); revised after design review the same day
**Related:** `0045` (snapshot history blocks hard delete), `0056-nested-feature-folders-and-trash.md`, `0066-layout-trash-is-blocked-by-live-programs.md`, `0089-playback-proof-records-player-reported-outcomes.md`

## Context

`media_asset_trash` hides an Asset with no usage check, and no contract says where an Asset is used, so
Media Detail's Usage panel is a placeholder. Trash does not stop playback: the Player poll reads
`publication_snapshot_items` joined to `media_assets` without filtering `deleted_at`. Nothing stops a
trashed Asset from airing again either: activation's `not_ready` check
(`20260930110000_activate_refuses_zero_devices.sql:296`) ignores `deleted_at`, and
`media_playlist_set_items` accepts a trashed Asset id. Permanent delete goes through
`media_video_delete`, which refuses while any `user`/`inline` Playlist item or any Publish Job snapshot
references the Asset (ADR 0045), and a `playback_logs` row surfaces as a raw FK error. An Asset that has
ever aired can therefore never be permanently deleted.

## Decision

1. **Asset Usage** is one tenant-scoped read, `media_asset_usage(p_tenant_id, p_asset_ids uuid[])`,
   batched from the start, served by `GET /media/videos/usage?ids=` (at most 100 ids). Its first step
   intersects `p_asset_ids` with `media_assets WHERE tenant_id = p_tenant_id`; foreign ids are dropped
   silently, so no other tenant's names can leak. Per Asset it returns:
   - **playlists** — non-trashed `user` Playlists with an item for the Asset;
   - **layouts** — non-trashed Compositions that reach the Asset through their `inline` Playlist, or
     through a `user` Playlist in a Zone (the row names that Playlist);
   - **programs** — Draft, Scheduled or Active Programs (stored `status` plus schedule window; the UI may
     label Active as Publishing or Live) whose live source (a `user`, `inline`
     or `single` Playlist, or a Composition) or whose **newest Publish Job** snapshot contains the
     Asset, one row per Program, flagged `onAir` when airing now (same rule as `media_asset_on_air`).
     A Program's own `inline` or `single` Playlist appears only as this Program row, never as a Playlist;
   - **coverOf** — Playlists using the Asset as cover; informational, never a blocker;
   - **history** — whether the Asset has Broadcast history (any snapshot item or `playback_logs` row).
   Trashed Playlists/Layouts and Ended/Cancelled Programs are not Usage.
2. **A trashed Asset never enters new airtime.** Activation and Publish Changes refuse, naming the
   Asset, when the snapshot being materialised contains a trashed Asset (a `trashed` group in the
   existing `not_ready` check). Playlist item writes refuse a trashed Asset that is not already in the
   Playlist, so an edit to a Playlist that still holds one keeps saving. Restore lifts both.
   Activation is the gate; the `media_playlist_set_items` refusal is early feedback only. Other Playlist
   writers (`set_content`, `duplicate`, `publish_single`) may still store a trashed id and are caught at
   activation.
3. **Move to Trash warns, never blocks.** If any selected Asset has Usage the dialog lists it and says
   that screens keep playing the file, and that the listed Programs cannot publish changes, until it
   is removed from those Playlists/Layouts or restored. A batch shows one combined dialog (in-use
   Assets only, summary counts, expandable) with one confirm. Usage is fetched when the dialog opens;
   `media_asset_trash` gets no server guard.
4. **Permanent delete stays blocked** while the delete predicate finds a reference, but
   `media_asset_permanent_delete` returns `{deleted:false, blockers:{playlists, layouts, programs,
   history}}` instead of raising — an extension of `media_composition_permanent_delete`'s
   `{deleted, blockers}`, which only lists category names. Blockers are computed from the **same
   predicate** that refuses the delete (one shared helper), so `deleted=false` always carries at least
   one non-empty blocker — including references Usage hides, such as the `inline` Playlist of an Ended
   or Cancelled Program. A Program playing the Asset through a `single`
   wrapper is a blocker too: `media_video_delete` no longer deletes such Programs as a side effect
   (only never-published drafts were ever reachable), so the operator removes a draft Program
   deliberately before the Asset can go. The function locks the Asset row `FOR UPDATE` before evaluating blockers,
   pairing with activation's `FOR SHARE`. A batch deletes what it can and lists the blocked Assets in
   one dialog; the client reads `deleted`, not just request failure.
5. Trash shows `Has broadcast history` on Assets whose `history` is true and disables Permanent delete
   for them, so the refusal is visible before the click.
6. Media Detail's Usage panel renders the same read: three linked groups, an `On air` badge, cover
   usage as a footnote, and `Not used anywhere` when empty.

## Why warn here when ADR 0066 blocks Layout Trash

An Asset is raw material; trashing it breaks nothing that is airing, is fully recoverable, and — with
Decision 2 — cannot silently return to air. A Layout is the assembled authoring unit a Program edits
through, so hiding it strands the operator. The owner accepted warn-only for Assets on 2026-10-08.

## Considered options

- **Programs by snapshot only / live source only.** Rejected: the snapshot answers "what plays now",
  the live source "what the next Publish Changes freezes"; they diverge after an unpublished edit.
- **Block Trash while a Live Program uses the Asset** (as 0066). Rejected, see above.
- **Let Publish Changes re-freeze a trashed Asset, mitigated by warning copy.** Rejected in review: a
  trashed Asset would return to air silently and add Broadcast history.
- **Tombstone on Permanent delete** (drop the stored file, keep the row for snapshots and logs).
  Deferred to #268: it changes the Asset lifecycle and every reader.
- **Delete snapshot items and playback logs with the Asset.** Rejected: destroys Playback Proof
  evidence (ADR 0089).

## Consequences

- Core: one new read RPC + route; the activation `not_ready` check and the Playlist item write path
  learn about `deleted_at`; `media_asset_permanent_delete` / `media_video_delete` change return shape,
  share the blocker predicate and catch `playback_logs`. A changed return type or signature means
  `DROP FUNCTION` of the old one first, then EXECUTE re-granted to `service_role` only.
- A Live Program holding a trashed Asset cannot publish changes until the operator removes or restores
  it. Already-airing content is unaffected.
- Permanent delete remains unavailable for most aired Assets until #268 lands.
- Applying the migrations to develop and prod and deploying Core are separate R0 actions.
