# An unplayable video is quarantined and cannot be published

**Status:** proposed (2026-09-09) — new-upload admission, activation guard, UI handling and WebP closure can proceed; only the existing-video backfill waits for ADR 0069's report

Builds on ADR 0069, which measures what every Asset actually contains without acting on it or writing
anything down. This ADR acts: Thunder_Core's upload route probes a newly uploaded video before
registering it and admits the Asset only when the players can decode it. H.264 High, HEVC, and
anything whose profile cannot be read register as `failed` with the reason stated in terms the
operator can act on. Existing Assets the probe condemns are quarantined too. Those already airing are
reported separately but receive the same `failed` status. Existing Publications
continue from their snapshots because `media_job_poll` does not filter on Asset status; Publication
activation stops accepting a non-`ready` Asset, so the same file cannot be published to another
screen.

This ADR is also where `media_assets.codec` finally gets written. ADR 0069 deliberately persists
nothing, because a write path to an existing Asset does not exist and creating one is a migration.
Here that migration happens anyway — `media_video_register` gains the probe verdict — so `codec` and
the predicate-set version in `media_assets.metadata` ride along in the same write. The backfill of
existing Assets is a separate mechanism reaching rows that registration never revisits, and the read
path has to widen too or the reason for a refusal never leaves the database. Both are counted below
rather than assumed free.

This ADR does not convert anything; that is ADR 0071. Its new-upload admission, activation guard,
Upload Queue and Media Detail handling, and WebP closure are correct without knowing the existing
library count and do not wait for ADR 0069. Only the backfill that changes existing video Assets waits
for that report and a separate go/no-go decision: how proportionate a bulk quarantine is depends on a
number nobody has yet.

## Why the picker is not where this belongs

Hiding non-`ready` Assets in the Playlist and Publication pickers is a courtesy to the operator, not
a control. It is worth doing — nobody should be offered something that will be refused — but the
guarantee has to sit lower.

The RPCs are `REVOKE ALL … FROM PUBLIC, anon, authenticated` with `GRANT EXECUTE … TO service_role`,
so Thunder_Core's route layer is the only caller and is the actual trust boundary; there is no
anonymous path into `media_playlist_set_items`. What remains is not an attacker but a race: an
operator with a Playlist editor open when the ADR 0069 backfill quarantines one of its items, a
Publication activated in the same second an upload is condemned, a retry of a request composed
before the status changed. Those are ordinary and they are enough.

`media_playlist_set_items` verifies only that each referenced Asset belongs to the tenant, and
`media_publication_activate` snapshots content with no readiness check at all. Adding the check to
both is defence in depth against a window we are about to widen, not a fix for a hole in
authorization.

## The check goes on activation, not on saving a Playlist

`media_playlist_set_items` receives the entire item list, not a delta. Requiring `status = 'ready'`
for every referenced Asset would mean that the moment the backfill quarantines one item, the whole
Playlist becomes unsaveable — and the error would name a file the operator did not touch, in a
Playlist they were editing for an unrelated reason.

So: saving a Playlist that contains a quarantined Asset is allowed, and **`media_publication_activate`
refuses**, naming the offending files. Activation is where the consequence is real — it is the step
that puts content on a screen — and it is the step where an operator can act on the message, by
removing or replacing the item.

**The check goes in one place: after the snapshot is materialized, before `SET status = 'active'`.**
`media_publication_activate` builds `publication_snapshot_items` down two separate paths — a per-zone
`LOOP` for a Composition, a single insert for a flat Playlist — which converge just before the status
update, where `v_item_count` is already validated in both branches. Checking there rather than inside
each branch avoids duplicating the guard, and matters for the message: a Composition checked
per-branch raises on its first bad zone and never mentions the other zones, while one query over the
finished snapshot returns every offending title at once. Naming all of them is the point; an operator
who fixes one item and is refused again has been told the truth twice and helped neither time.

The message distinguishes the two reasons an Asset is not `ready`. `failed` means the file is
unusable and the operator should replace it; `processing` — which only exists once ADR 0071 is
running — means automatic conversion of an otherwise unusable Asset is in flight and the answer is to wait. A
single "not ready" would invite an operator to delete a file that would have been usable a minute
later.

`media_publication_activate` raises `Already active: publication is not a draft` for anything that is
not a draft, so this check runs exactly once in a Publication's life, at draft → active. That is a
real limit and it is stated here rather than glossed: once a Publication is active, the player is
served from `publication_snapshot_items`, and a later status change on the source Asset has no effect
on what is airing. This ADR does not add a mechanism to retract airing content, and the section below
explains why that is deliberate.

`composition_zones` references `playlist_id` only and carries no direct `media_asset_id`, so
Compositions reach Assets through Playlists and there is no third path that would need its own guard.

## Which files are admitted

Constrained Baseline and Baseline are admitted. High, HEVC, and any file whose profile cannot be read
are quarantined. **Main is admitted and flagged** — a third outcome, and the one this ADR changed
after the player team answered.

The damage is asymmetric, and that asymmetry settles every borderline case here. Refusing a file that
would have played costs an operator a conversion at their desk and an annoyed message. Admitting a
file that turns out not to play costs a black screen at a customer site that nobody is told about —
the failure this work exists to end.

**But the asymmetry only bites where the player actually refuses the file.** High and HEVC are
blocked in `VideoCompatibilityInspector`; a file that cannot be parsed is unknown and unknown is
where the argument is strongest. Main is neither: Android does not block it, the player team asked
that it be converted rather than called broken, and the earlier reading of "not blocked is not
plays" quietly treated an uncertified profile as a refused one. Quarantining Main buys a black screen
we have no evidence of, and costs an operator a conversion on a file that in all likelihood plays —
for however long ADR 0071 stays blocked, which is now a campaign rather than a wait.

So Main registers `ready`, with `probe_verdict` recording `unverified_preset` and the profile that
was read. It is what puts Main at the front of ADR 0071's queue: a flagged Asset is a query, not a
rescan. If the campaign comes back saying a device refuses Main, this decision reverses by moving one
profile from the flagged list to the quarantined one, and the Assets to re-examine are already
labelled.

The player team confirmed on 2026-09-09 that this guard is not redundant with theirs. Android blocks
AVC High when Media3 reports
`MediaCodecInfo.CodecProfileLevel.AVCProfileHigh` (`8` in Android's profile-constant namespace), and
blocks HEVC. That `8` is not the raw H.264 `profile_idc`; the container probe reads `100` for High.
The player check does not cover every advanced profile, and it does not cover a file whose metadata
it cannot read, which are the two cases a backend allowlist exists for. They recommended a backend
allowlist themselves and marked widening the player-side check as future work not done in this round.

Profile is not the only property that matters. Level, resolution, frame rate, bit depth and audio all
have limits we do not know — and after the player team's reply of 2026-09-09 we know that they do not
know them either: there is no hardware inventory and no certified Level, resolution or frame rate for
any device model. This ADR therefore enforces the one rule they state as hard — profile and codec —
and the rest stays pending, now against a measurement campaign rather than against an unanswered
question. Widening the predicate set later widens the quarantine; it does not change the shape of
this decision. Each Asset
records the predicate-set version that admitted it, written here rather than by ADR 0069, so a
widened rule turns into a
query rather than a rescan.

## The refusal needs somewhere to live, and a way out

A refusal an operator cannot read is the original defect wearing a new label, so where the reason is
stored and how it reaches a screen is part of this decision rather than an implementation detail.
Today it has neither a place nor a route: `media_assets` has no column for it, and
`media_asset_get` returns `status`, `codec` and `approval_status` but not `metadata`.

The probe's verdict is written into `media_assets.metadata` under `probe_verdict`, not into a new
column. It is one key for both outcomes — the reason a file was refused, and the flag on a file that
was admitted without certainty.
`metadata` is `jsonb NOT NULL DEFAULT '{}'` with no CHECK, this ADR already writes the predicate-set
version there, and a dedicated column would be a second surface for the same class of fact.

It holds a code and the facts the probe actually read — `{"code": "unsupported_profile", "profile":
"High"}` — not a finished sentence. The same reason has to surface in two places, the upload queue at
registration time and Media Detail afterwards, and the backend is the wrong layer to decide what
language an operator reads or how much of it fits in a queue row. Rendering the sentence is the
frontend's job.

The vocabulary carries three verdicts, not two, and the third is the reason this key is not called a
reason. `unsupported_profile` is a refusal the player enforces — High, HEVC — and the Asset is
`failed`. `unreadable` is a refusal on ignorance and is also `failed`. **`unverified_preset` is not a
refusal at all**: the Asset is `ready` and playing, and the verdict records that it was admitted on a
profile nobody has certified. One key holds all three because they are the same fact — what the probe
concluded — and because Media Detail has to show the third as plainly as the first two. An operator
whose file was admitted with a caveat is entitled to know that before a screen goes dark.

`media_asset_get` therefore gains `'probe_verdict', ma.metadata -> 'probe_verdict'` — the
single key, not the whole object. Returning `metadata` wholesale would publish every future key
written into that column to the frontend by accident, which is how an internal field becomes an
unintended contract. `media_videos_list` is deliberately left alone: the grid carries a status badge,
and the explanation belongs where the operator went to look for it.

**So the migration touches three RPCs, not one** — `media_video_register` to write the verdict,
`media_asset_get` to read the reason back out, and `media_publication_activate` for the guard.

## There is no `processing` state here

The probe runs in the route before `media_video_register` is called, so registration writes `ready`
or `failed` directly and no Asset is ever observably `processing`. The column's `'processing'`
default and the `media_assets_status_check` constraint already permit the value, and ADR 0071 is what
gives it meaning — a video the Player already rejects while automatic conversion is running.
Implementing an entry state here would create one nothing advances out of.

Adding the probe verdict to `media_video_register` means adding a parameter, and
`CREATE OR REPLACE FUNCTION` does not replace a function when the signature changes — it creates an
overload. The compatibility migration therefore drops the existing 13-argument signature and creates
one replacement whose new trailing verdict parameter defaults to null, so the deployed old route and
the later probing route both have exactly one callable function during rollout. It re-grants
afterwards: `CREATE FUNCTION` grants `EXECUTE` to `PUBLIC`, so the original
`REVOKE … FROM PUBLIC, anon, authenticated` has to be reissued or the function silently becomes
callable by roles it was closed to.

## Images are untouched

`media_video_register` serves both kinds — it infers `image` from the MIME type and hardcodes
`'ready'` for both. Only `kind = 'video'` is probed and only a video can be quarantined; images
continue to register `ready` exactly as they do now.

This is not because images are safe, and Q6 has since been answered — unfavourably. **WebP cannot be
certified on Windows.** The image path there is WPF `BitmapImage` through WIC, not mpv, and the app
bundles no WebP decoder, so whether a machine renders one depends on a WIC extension being installed.
Android decodes static WebP above its `minSdk 24`, but the player team declined to certify it without
testing on the target devices, and animated WebP and APNG are uncertified on both platforms. Their
recommended central format is JPEG without alpha and PNG with it.

**The exposure today is two files.** Measured on production 2026-09-09, the 15 image Assets are
8 JPEG, 5 PNG and 2 WebP, and both WebP files are 400×550. Building an image rendition pipeline for
that is not proportionate — but "only two files" is a statement about the past, and the bucket still
lists `image/webp` in `allowed_mime_types`, which is what would let the number grow while nobody is
watching.

**So the intake closes and the pipeline is not built.** `image/webp` is dropped from the bucket's
`allowed_mime_types` and from `upload-limits.ts`, and the two existing files are converted by hand;
JPEG without alpha and PNG with it is the player team's recommended central format and is what the
bucket already accepts. Guarding on `kind = 'video'` still keeps the `'ready'` change from stranding
every uploaded image.

"Converted by hand" is an explicit replacement flow, not a Storage overwrite. Before any write,
Operations lists the two WebP Assets, every Playlist that references them, and every active or
scheduled Publication whose snapshot contains them. For each Asset, Operations downloads and converts
the original locally, uploads the JPEG or PNG through the ordinary Upload Queue as a new Asset, and a
Media Operator replaces the old Asset in each source Playlist. An active Publication keeps its old
snapshot until the operator deliberately republishes it during an agreed change window; closing the
intake alone does not repair what is already airing. The old WebP Asset stays in place until no live
snapshot requires it and is not deleted by this rollout. Each upload, Playlist update and republish is
a production write and uses the normal approval boundary rather than a migration that silently
rewrites customer content.

**This ADR owns the bucket change now.** Its rollout includes a small migration that reconciles the
live `allowed_mime_types` and drops `image/webp`, paired with the `upload-limits.ts` change. It does
not wait for ADR 0071 and does not change `file_size_limit`; ADR 0071's automatic-conversion envelope
is worker policy and does not change the bucket limit. No bucket setting is edited by hand.

The same reply noted that neither renderer caps image dimensions, and that an 8000×8000 source
expands to roughly 256 MB as a bitmap before decoder and GPU overhead. That is a real hazard and not
a present one: the largest image in the library is 2048×2048, about 16 MB expanded.

## The backfill quarantines without pulling current media off air

Every Asset the probe condemns is set to `failed`. Whether an active Publication references it is a
separate report column, not a different status transition.

That status change does not retract current content. `media_job_poll` joins
`publication_snapshot_items` to `media_assets` to resolve the file but has no `ma.status` predicate,
so an already-active Publication continues to receive the original file whether the Asset is `ready`
or `failed`. The report still names those Publications so an operator can inspect the affected
screens.

The distinction appears on the next activation: `media_publication_activate` rejects the `failed`
Asset, so known-bad media cannot be published to another screen or republished from a new draft. ADR
0071 therefore consumes the same quarantined population whether or not an Asset is currently airing;
it needs no `flagged-but-airing` exception. Its atomic rendition swap repairs existing Publications
without touching their snapshots.

### How the backfill runs, and how it is undone

The probe cannot run inside SQL — that is why ADR 0069 is a task and not a query — so the verdicts
are computed by a fresh ADR 0069 run and the migration carries the resulting Asset ids as a literal
`UPDATE`. No second RPC is introduced for it. What gets committed is UUIDs; the titles and filenames
that keep ADR 0069's report out of the repository are not in the migration.

Registration and backfill close the interval through a staged rollout; probing starts at route deploy
time, not migration apply time:

1. Apply the compatible `media_video_register` signature above. The old route keeps working because
   the new trailing verdict parameter has a default.
2. Deploy the probing route. Every Asset registered after this point is judged on intake.
3. Run ADR 0069 again after that deployment, then generate and apply a second migration whose literal
   Asset ids backfill the older library. Any Asset created between steps 1 and 2 is included in this
   run; any Asset created after step 2 is already covered by registration.

The backfill is not generated from a report that predates the probing route, and it needs no
`created_at` cutoff to pretend those two clocks are atomic.

Rollback uses the exact UUID literal set embedded in the backfill migration:
`UPDATE … SET status = 'ready' WHERE id IN (<backfilled Asset ids>) AND status = 'failed'`. It never
uses a broad status predicate. The probing route is already live before the backfill is applied, so a
different Asset may legitimately become `failed` at any point and must remain quarantined during a
backfill rollback.

## Consequences

`media_assets.status` stops being a constant. `media_assets_status_check` already permits
`processing`, `ready` and `failed`, so no constraint migration is needed — only the conditional
`'ready'` in `media_video_register` and the guard in `media_publication_activate`.

A quarantined Asset is terminal until ADR 0071 exists. There is no retry, because the cause is the
file; the operator converts it and uploads again, and the refusal message carries the target format
so that is possible. Media Detail shows the reason ("this file is HEVC, which the players cannot
decode") rather than a bare failure, since a refusal nobody can act on is the original problem
wearing a different label. This is also where the `Codec` fact on Media Detail stops reading `—`,
and it is deliberately the first place it does: the value arrives with an explanation attached.

What is refused is the registration, not the upload. Bytes reach the `media` bucket before
`media_video_register` is called, so a quarantined Asset leaves its file in Storage, attached to a
`failed` Asset. `media_list_abandoned_uploads` sweeps reservations that were never registered and
does not cover this case. At the current volume — 400 MB of media in total — that is acceptable, and
deleting the Asset is the operator's action; a sweep for `failed` Assets is not built and would be
premature.

**This ADR obliges work in `thunder_one_prj`, not only in Thunder_Core.** The videos route answers
`{ success: true, data: result }` with HTTP 201 whatever the verdict, and `RegisteredVideo`
(`src/features/media-workspace/publications/services/upload-api.ts`) already carries `status` — but
`useUploadQueue` (`src/features/media-workspace/assets/upload/useUploadQueue.ts`) treats a resolved
promise as success and never reads it. Left as it is, a quarantined file finishes with a green tick
and is discovered at Publish time: the silent failure this work exists to end, moved up one layer.
The upload queue has to branch on `status` and render a refused item with its reason. Without that
the backend guard is correct and the operator is still misinformed.

Operators will be refused new files that used to be accepted, and some of those files did play. That
is the trade, and it is what ADR 0071 removes by converting rather than refusing. The same trade for
the existing library is the only part ADR 0069's report decides: a handful of condemned Assets argues
for deferring the backfill, while a large share argues for applying it before ADR 0071 lands.

`approval_status` is a separate dimension — defaulted to `approved` by
`20260909081713_auto_approve_uploaded_media.sql` — and is untouched. Technical playability lives in
`status`; editorial approval lives in `approval_status`; neither overrides the other.
