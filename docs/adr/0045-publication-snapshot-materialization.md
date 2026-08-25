# Publication snapshot materialization

**Status:** accepted (2026-08-25)

`CONTEXT.md` has described Publication as binding *"an immutable snapshot of content (single Asset
or Playlist, captured at publish time)"* since the glossary was written, and states the consequence
plainly: *"editing the source Playlist later never affects an already-published Publication's
running Jobs."*

**That snapshot does not exist.** This ADR builds it.

Materializing content at publish time is also the prerequisite for
`docs/adr/0044-multi-zone-layout.md`, which cannot copy Zone geometry into a snapshot that has no
rows.

## What today actually does

`media_job_poll` resolves content live on every poll:

```sql
JOIN media_core.playlist_items pi ON pi.playlist_id = pub.playlist_id
JOIN media_core.playlists     pl ON pl.id = pub.playlist_id      -- pl.metadata->'playback'
LEFT JOIN public.file_versions fv
       ON fv.file_id = f.id AND fv.version_no = pi.file_version_no
```

Three consequences, all currently live in production:

1. **Editing a Playlist changes what is airing, immediately.** `media_playlist_set_items` deletes
   and rewrites the rows `media_job_poll` reads. No publish action is involved; the next poll (~60 s)
   carries the change to every screen running any Publication of that Playlist. Editing the
   Playlist's `metadata.playback` does the same to play mode, repeat and start position.
2. **The only thing pinned is the file version, and it is pinned in the wrong place.**
   `media_publication_activate` writes `file_version_no` back into `media_core.playlist_items` —
   the *shared* Playlist rows. Activating Publication A therefore mutates state that Publication B
   reads. Two Publications of one Playlist cannot pin different versions, because there is only one
   row to pin.
3. **Republish is indistinguishable from editing.** Both are "the rows changed"; nothing records
   which content a given Publish Job was created against.

## Decision

Content is copied at activation into snapshot tables owned by the Publication, and
`media_job_poll` reads only those.

```
media_core.publication_snapshots
  id, tenant_id, publication_id, created_at,
  layout_id (nullable), aspect_ratio, background,
  materialization_source           -- 'activation' | 'legacy_backfill'

media_core.publication_snapshot_zones
  id, snapshot_id, source_layout_zone_id (nullable, trace only),
  name, role, x, y, width, height, -- percent
  playback jsonb                   -- play_mode / repeat / start_from, validated and defaulted

media_core.publication_snapshot_items
  id, snapshot_id, snapshot_zone_id NOT NULL, position,
  media_asset_id, file_version_no, duration_seconds, transition

media_core.publish_jobs
  + snapshot_id
```

### 1. Every snapshot has at least one Zone row; flat Publications get an implicit one

A Publication with no Layout produces a snapshot with `layout_id NULL` and exactly one Zone row at
`x=0, y=0, width=100, height=100`, role `main`. Zoned Publications produce up to four.

`snapshot_zone_id` on items is therefore `NOT NULL`, and there is exactly one meaning of "snapshot"
in the system. The alternative — nullable zone ids for flat content — makes every downstream query
carry a special case for the majority path.

Rejected: **snapshot only the zoned path, leave flat reading live.** Two meanings of the word, two
code paths in `media_job_poll`, and the existing defect left in place forever.

### 2. Playback settings live on the Zone

`play_mode`, `repeat` and `start_from` (ADR 0031) are read today from `playlists.metadata->'playback'`
and stamped onto every slot on the wire. Once poll stops reading `playlists`, they must come from
the snapshot or they vanish.

They belong on the **Zone**, not the item: they are properties of an ordered sequence, and once
Zones exist each Zone has its own sequence and can legitimately differ — a looping main Zone beside
a play-once ticker. Storing them per item would duplicate one value across every row and admit
states that have no meaning (two items in one Zone disagreeing about `repeat`).

The wire contract does not change: `media_job_poll` keeps emitting `playback` on every slot, copied
down from the slot's Zone. Values are validated and defaulted at materialization time
(`sequential` / `loop` / `first`), so poll never applies a `COALESCE` again.

### 3. The snapshot belongs to the Publish Job, not only to the Publication

`publish_jobs.snapshot_id` is what makes republish coherent: republishing takes a fresh snapshot and
generates new Jobs against it, while the old Jobs keep pointing at what they actually delivered.
This is what `CONTEXT.md` already promises about republishing editing "the same Publication in place
(same ID)... it does not create a new Publication".

### 4. `file_version_no` moves onto the snapshot item and stops being written back

`media_publication_activate` stops mutating `media_core.playlist_items`. The version is resolved
once, into `publication_snapshot_items.file_version_no`. Playlist rows become read-only from the
publication path, which is what they should always have been.

### 5. `media_job_poll` reads snapshots only

It joins `publish_jobs.snapshot_id → publication_snapshot_zones → publication_snapshot_items`, and
never touches `playlist_items` or `playlists`.

**The Job must be chosen before items are expanded, and nothing may be deduplicated afterwards.**
Today `media_job_poll` expands every Job's items first and then collapses them with
`DISTINCT ON (pub.id, pi.position) ... ORDER BY pub.id, pi.position, pj.created_at DESC`
(`20260824140000_loop_anchor_at.sql`). That is safe only while every Job of a Publication reads the
same live Playlist, so the rows being collapsed are identical. Once each Job carries its own
snapshot they are not:

- old snapshot `[A, B]`, new snapshot `[A]`
- `position 0` — both Jobs offer a row, the newer Job wins, correct
- `position 1` — only the old Job offers a row, nothing outranks it, **`B` keeps airing**

The zoned path is worse: a Zone deleted on republish reappears the same way, because no row from the
new snapshot exists at that `(zone, position)` key to displace it.

`DISTINCT ON` is not only masking stale Jobs, though — it is also masking **duplicate Schedules**.
`media_core.schedules` has no `UNIQUE (publication_id)` (`048_media_core_schema.sql`); the join to
`schedules` happens before the dedup, and the existing `ORDER BY ... s.id` tie-breaker is what keeps
a second row from doubling anything. Removing the dedup without replacing that guard turns two
Schedule rows into every snapshot item emitted twice.

**Both parents are therefore selected before items are expanded**, and `DISTINCT ON` over expanded
items is removed, not re-keyed:

1. **One Job per `(publication_id, device_id)`** — the latest, ordered `pj.created_at DESC, pj.id DESC`.
   The `pj.id` tie-breaker is required, not cosmetic: two Jobs created in the same transaction share
   a `created_at`, and an unbroken tie makes the choice non-deterministic per poll.
2. **One Schedule per Publication.**

For (2) the clean fix is to make the duplicate unrepresentable: audit for existing duplicates, keep
the earliest `created_at` per Publication, then add `UNIQUE (media_core.schedules.publication_id)`.
The domain has always treated Schedule as singular — the poll comment on the `s.id` tie-breaker says
a second row is "never seen in production today" — so the constraint records what the code already
assumes. **The audit is a prerequisite, not a formality**: the constraint fails to create if any
duplicate exists, and any row it would delete is a live schedule.

If the constraint is deferred, (2) still has to happen in the query: pick one Schedule per
Publication in its own CTE, with the same deterministic ordering, before joining snapshot items.
Deferring the constraint does not defer the selection.

Ordering within a Zone and the cumulative `start_offset_seconds` window function keep their shape,
and `playback` now comes from the Zone instead of `playlists.metadata`.

The merge of multiple equal-priority Publications into one `slots[]`
(`docs/adr/0031-playback-behavior-reaches-the-player.md`, 069's priority-override logic) still merges
*across Publications* — that is unaffected. What changes is that it no longer merges across Jobs of
the same Publication.

### 6. Every existing Job is backfilled, and legacy rows say so

`snapshot_id` is `NOT NULL`. That is only reachable if **every** Publish Job gets a snapshot, not
only those of `active` and `scheduled` Publications — Jobs belonging to `ended` and `cancelled`
Publications are retained (cancelling does not delete Jobs) and would otherwise block the
constraint.

Those historical snapshots are generated from the Playlist state as it stands on migration day, and
`materialization_source = 'legacy_backfill'` records that. **A `legacy_backfill` row is not evidence
of what that Job actually played.** The true content was never stored — that is the defect this ADR
closes — and backfilling cannot invent it. Reports and any future audit view must treat
`legacy_backfill` snapshots as reconstruction, not proof.

Rejected: **nullable `snapshot_id` for legacy Jobs, enforced non-null for new ones via trigger.**
It leaves `media_job_poll` carrying a "no snapshot" branch forever, which is the two-code-paths
outcome §1 rejects, wearing a different name.

### 7. Proof-of-play gains snapshot-scoped identity

`media_core.playback_logs` gains `publication_snapshot_id` and `snapshot_zone_id` (both nullable;
NULL preserves the meaning of every existing row). A log line can then be resolved back to the
geometry and playback settings that actually aired, which raw `layout_id` + `zone_id` cannot do once
a Layout has been edited. `source_layout_zone_id` on the snapshot Zone exists for tracing which
Layout a Zone came from — never for resolving geometry.

Both ids are **attacker-supplied**, so the reporting RPC must validate them rather than store them.
Today it checks only that the asset belongs to the reporting Device's tenant, which leaves any
snapshot/Zone pairing inside the tenant forgeable. Three invariants are required, all rejected as an
error rather than silently nulled:

1. `snapshot_zone_id` belongs to `publication_snapshot_id`.
2. The reported asset is an item of that Zone.
3. `publication_snapshot_id` is the snapshot of a Job that has a `publish_job_targets` row for the
   Device the token resolves to.

Invariant 3 is what ties the claim to the reporter; 1 and 2 alone still admit reporting another
Device's airtime.

Invariant 3 deliberately accepts **any** snapshot ever targeted at that Device, including
superseded ones. A player that was offline across a republish uploads logs for what it really
aired, and that snapshot is the correct record of it — rejecting historical snapshots would discard
exactly the proof-of-play that is hardest to reconstruct. "Stale" is not a rejection reason; only a
mismatched pair or a snapshot never targeted at this Device is.

Rejection is **per batch, transactionally**: one invalid row rejects the whole upload and nothing is
stored. Per-row results would need the response contract to carry a per-row outcome, and a player
that cannot tell which rows landed will either re-send everything (duplicates) or nothing (loss).
Whole-batch rejection makes retry unambiguous. The device contract states the same.

Airtime reporting is unaffected: `media_publication_airtime_explain` derives from schedules, not
from `playback_logs`.

### 8. Activation resolves its target set once, inside one transaction

Capability and geometry checks (`docs/adr/0044-multi-zone-layout.md` §4, §11) are only meaningful if
the device set they validate is the same set the Job Targets are created for. Channel membership can
change between resolving targets, validating them, and inserting `publish_job_targets`.

The lock the existing activation path takes (`070_media_publication_activate_row_lock.sql`) does not
cover this: it locks the **Publication row only**, not Channel membership, not the target Device
rows, not the capability rows the geometry and `max_video_zones` checks read. Citing it as the
guarantee would repeat the mistake §8 exists to prevent.

The executable requirement is:

- resolve the device set **once**, into a CTE or an array, at the top of the activation transaction;
- run every capability and geometry check, and the `publish_job_targets` insert, against that same
  CTE or array — never by re-querying Channel membership;
- if the implementation cannot stay a single statement, take `FOR SHARE` row locks on the resolved
  target Device rows, or persist the checked capability result alongside the Job, so a concurrent
  membership or profile change cannot invalidate a check that already passed.

No check re-resolves membership on its own.

### 9. The download report validates against the Job's snapshot too

`media_publication_download_report` is the other consumer that resolves content live. It derives the
expected Asset set and checksums through `publications.playlist_id → playlist_items`
(`20260821065750_publication_download_report.sql`), so once poll is snapshot-backed the report for an
old Job would still be graded against an edited Playlist — the same defect this ADR closes, one seam
over.

It resolves its already-validated `target_id` through
`publish_job_targets → publish_jobs.snapshot_id → publication_snapshot_items` instead, and stops
joining `publications.playlist_id` for Job-specific delivery evidence. Signature, route and the
existing distinct-Asset semantics are unchanged.

### 10. Hard deletion protects the Asset, not the Publication

A snapshot is only an immutable record if deleting something else cannot quietly erase it. The two
parents are treated differently, on purpose.

**`publication_snapshot_items.media_asset_id → media_assets(id) ON DELETE RESTRICT.`** Once an Asset
has been materialized into a Publish Job snapshot, hard deletion is refused; Archive stays the
reversible operator action. This matches `playback_logs.media_asset_id` and
`playlist_items.media_asset_id`, which are already `RESTRICT` — the broadcast record and the
proof-of-play that references it are protected by the same rule.

**`publication_snapshots.publication_id → publications(id) ON DELETE CASCADE.`**
`publish_jobs.publication_id` is already `ON DELETE CASCADE` (`048_media_core_schema.sql`), so
deleting a Publication destroys its Jobs and Targets today. `RESTRICT` on the snapshot alone would
protect the record that hangs off the Job while the Job itself still cascades — a dangling
half-record, and a raw FK error in a path that currently works. Deleting a Publication is an explicit
destructive operator action; the snapshot follows the Job it belongs to. Tightening `publish_jobs` to
`RESTRICT` is a coherent alternative but is a retention decision about Publications, not about
snapshots, and belongs to its own ADR.

**Consequence — `media_video_delete` changes behaviour, not just its error text.** Its guard today
only refuses Assets referenced by a playlist of `kind IN ('user','inline')`
(`085_playlist_inline_kind_and_multi_asset_content.sql`). An Asset whose only playlist is
`kind = 'single'` is deletable, and the function then hard-deletes the Publications on those
playlists. After this ADR, **any single-asset video that has ever been published becomes
undeletable.** The guard must be extended to detect snapshot-item references and raise the existing
`Already in use:` domain error, so operators see a domain message rather than an FK violation — but
the refusal itself is new, and the UI copy and sales need telling. Retention-driven purging of old
snapshots is a separate destructive workflow and a separate ADR.

Rejected: **`ON DELETE CASCADE` on the Asset** — silently destroys the immutable record, which is the
whole point of the ADR. **`SET NULL`** — breaks poll, checksum resolution and proof-of-play
association at once. **No FK** — permits dangling snapshot content and untrustworthy reports.

## Deployment order

**No function in this ADR changes its identity arguments**, so every one of them is replaced with
`CREATE OR REPLACE FUNCTION`, keeping its OID and its dependencies. `DROP` + `CREATE` is reserved for
the case that actually needs it — adding or retyping an identity argument, where `CREATE OR REPLACE`
silently creates an overload and the old call becomes ambiguous. Dropping a function whose signature
is unchanged buys nothing and costs dependency and ACL risk.

`EXECUTE` privileges are reasserted explicitly either way. `DROP` + `CREATE` re-grants `EXECUTE` to
`PUBLIC`, so a revoke must be reapplied rather than the intended grant merely re-issued; and
`CREATE OR REPLACE` preserves whatever ACL is there today — which, for `media_publication_activate`
in production, is `PUBLIC`. Neither form is safe without stating the grants.

Order: tables → backfill every Job → `SET NOT NULL` → `media_publication_activate` (write snapshots,
stop writing back to `playlist_items`) → `media_job_poll` (read snapshots). The activate change must
be live before the poll change, or Publications activated in between produce Jobs with no snapshot
to read.

## Consequence for other work

- `docs/adr/0044-multi-zone-layout.md` §5 depended on a snapshot that did not exist. It now depends
  on this ADR, which is why Layout is not the next piece of work.
- Two open `playback_logs` defects (constant 1.2–1.8 s under-report; ~50% of one asset's entries
  never arriving) are untouched by this ADR and remain prerequisites for Zone-level proof of play.
