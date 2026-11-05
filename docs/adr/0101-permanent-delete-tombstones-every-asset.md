# Permanent delete tombstones every Asset

**Status:** accepted · 2026-11-04
**Source:** issue #268; owner decisions the same day, revised after a scrutiny review
**Amends:** `0091` Decisions 4 and 5 (Broadcast history no longer blocks Permanent delete)
**Related:** `0045` (snapshot materialization), `0056-nested-feature-folders-and-trash.md`, `0089-playback-proof-records-player-reported-outcomes.md`

## Context

An Asset that has aired can never leave Trash: `publication_snapshot_items` and `playback_logs` hold its
id with `ON DELETE RESTRICT`, and `media_asset_delete_blockers` reports `history`. Those rows do not copy
the Asset's title or kind; they resolve them through `media_assets`, so that row is already the record a
snapshot needs. Facts from ThunderCore prod on 2026-11-04: 13 Assets in Trash, 8 of them with history
(275 MB of 9.2 GB in all); all 8 sit only in one Cancelled Program; no `file_id` is shared between Assets;
127 of 621 Assets have a separate thumbnail; 88 have a Rendition.

`media_asset_delete_blockers` cannot simply lose its `history` check. Its `programs` list reads live
sources only, so a Live Program edited but not republished still plays a snapshot the list does not see;
`history` is what protects that case today. The same list also counts Ended and Cancelled Programs, so
an `inline` Playlist of a finished Program would block the Asset forever.

Permanent delete has also never freed Storage: `media_video_delete` removes the row only, and the upload
sweep lists only `uploading` and `canceled` files. Prod holds 51 `ready` media files that no Asset
references (1.3 GB); their cause is not yet established.

## Decision

1. **Every Permanent delete is a Tombstone.** It hides the Asset at once and keeps the `media_assets`
   row, so snapshots, logs and Playback Proof still resolve. There is no hard-delete path:
   `media_asset_permanent_delete` is the only entry and `media_video_delete` is dropped. The purge carries
   over its cleanup of Program-less `single` wrappers.
2. **Blockers follow Usage.** Permanent delete is refused while the Asset is held by a non-trashed `user`
   Playlist, a non-trashed Layout, or a Draft, Scheduled or Active Program through its live source **or
   its newest Publish Job snapshot**. Ended and Cancelled Programs no longer block. `history` stays in the
   result as information and never refuses. `deleted=false` still always carries a non-empty blocker.
3. **A cron job is the only thing that removes files.** The RPC locks the row, evaluates blockers and sets
   `purged_at`, `purged_by` and `files.is_deleted` in one transaction, and returns no storage keys. A new
   hourly route, `media/purged-files/sweep`, reads a batch where `purged_at` is set and `file_removed_at`
   is empty, removes the objects, confirms each one, then sets `file_removed_at`. A failure is logged and
   the row stays queued for the next run. Until the run, the file exists but no reader can reach it.
4. **What goes and what stays.** The cron removes the original, every `file_versions` object, the
   Rendition and any `media_transcode_jobs.output_key`. `thumbnail_storage_key`, `rendition_storage_key`,
   title, kind, dimensions, duration and the `public.files` row stay, so the key list can be recomputed.
   `is_deleted` is set so that a retried `media_video_register` cannot create an Asset on a dead file.
   Where a reader needs a purged Asset's thumbnail or type, it stops filtering on the flag for that
   Asset. An Asset with no separate thumbnail shows its kind icon.
5. **Purged is final.** `deleted_at` stays set, so activation and the Playlist write refusal keep working.
   `media_asset_restore` refuses with `purged_at IS NULL` in its `UPDATE` condition. A purged Asset is out
   of the library and Trash; preview signing returns its thumbnail only. It appears only in Playback Proof and history,
   labelled `File deleted`, with no play action. There is no undo and no grace period: Trash is the grace
   period.
6. **Transcoding stops at purge.** The purge fails open `queued`, `running` and `ready_to_install` jobs,
   locking them before the Asset as finalize does. That is enough: `media_transcode_finalize` already
   refuses a job that is not `running`, install reads only `ready_to_install`, and only
   `media_video_register` enqueues, so the transcode functions stay as they are.
7. **Holders left behind.** A trashed Playlist or Layout keeps its item when the Asset is purged. Restoring
   it is allowed; the editor marks the item `File deleted`, and activation refuses until it is replaced.
   A Playlist cover that names a purged Asset keeps showing the kept thumbnail, and shows the kind icon when
   there is none. Activation's refusal says the file was deleted and must be replaced, not restored.
8. **UI.** Trash keeps `Has broadcast history` but Delete is always enabled unless a blocker exists. The
   confirm dialog says the file goes permanently, and for such an Asset that its broadcast history stays.
   Permissions are unchanged.

## Considered options

- **Keep hard delete for Assets with no history.** Rejected after review: it needs a branch and its own
  Storage removal, and today's version leaks files. One path covers both. Its cost is a row and a thumbnail
  kept for Assets that never aired.
- **Remove files in the route.** Rejected: returning keys through the RPC would pass them to the browser,
  because the route returns the result verbatim, and a failed removal needs the cron anyway.
- **Reuse `media/uploads/sweep`.** Rejected: its list and mark RPCs exclude any file an Asset references,
  it returns early when no upload is abandoned, and it runs daily.
- **Hide from Trash and never remove the file.** Rejected by the owner: no storage comes back.
- **Copy title and details into snapshots and logs, then delete the row.** Rejected: a backfill plus a
  change to every reader, for the same result as keeping the row.
- **Delete snapshots and logs with the Asset.** Rejected in ADR 0091: destroys Playback Proof.
- **A grace period before the file goes.** Rejected: it would be a second Trash.

## Consequences

- Core migration: three columns and new versions of `media_asset_delete_blockers`,
  `media_asset_permanent_delete`, `media_asset_restore`, `media_videos_list`, `media_asset_get`,
  `media_asset_signing_keys`, `media_playlist_get`, `media_publication_activate`,
  `media_playback_proof_list`, `playback_proof_rows` and `media_core.publication_cover`, plus two RPCs for
  the cron. `media_asset_delete_blockers` becomes a read of `media_asset_usage`. Dropping `media_video_delete` and changing a signature
  need `DROP FUNCTION` first, then EXECUTE re-granted to `service_role` only.
- `playback_proof_rows` must return the thumbnail only for a purged Asset, never `f.storage_key`.
- Core also gains the cron route and its `vercel.json` schedule.
- FE: `isDeleteBlocked` is unchanged; Permanent delete stops depending on `hasHistory`, and the dialog,
  Playlist editor and Playback Proof gain the new copy. Core must deploy first: until the FE ships the
  button stays disabled, which is safe.
- A worker already past its upload when the purge lands leaves one Rendition object behind, the leftover
  `transcode/sweep` already accepts for superseded outputs.
- The file cannot be replayed from Playback Proof afterwards, and thumbnails of purged Assets stay in
  Storage. An Ended Program that held a purged Asset can be duplicated, but activation refuses it by name.
- Removing a file is irreversible, and Storage is isolated per branch (Core ADR 0011), so each environment
  is tested separately. Applying the migration to develop and prod is a separate R0 action. No backfill:
  operators delete the existing 8 Assets themselves. The 51 unreferenced files are not covered here.
