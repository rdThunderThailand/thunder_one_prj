# A quarantined video is transcoded instead of refused

**Status:** proposed (2026-09-09) — **revised 2026-09-17 to a one-rule v1**; becomes `accepted` when the
deployed Vercel benchmark (plan T1) passes. The 2026-09-10 draft — ffprobe assessment against ten
provisional ceilings, `unverified_preset` conversion, a manual admin CLI, recipe versioning, soft/hard
timeout accounting — is not withdrawn; it is the v2 re-encode campaign, deferred under "Deferred to
v2" with the triggers that bring it back. Nothing in this ADR is built yet.

Builds on ADR 0070, which refuses on intake a video whose H.264 profile the players cannot decode. This
ADR keeps that byte-walk verdict as the only trigger and adds an automatic repair: a video that is
High, Main or HEVC is re-encoded by a Vercel function inside Thunder_Core to MP4 / H.264 Constrained
Baseline / ≤ 1080p30 / yuv420p / AAC-LC, the output is recorded on the Asset as its **Rendition**, and
`media_job_poll` serves the Rendition whenever one exists. The original is kept. No new
infrastructure is introduced.

## Why automatic, when the count says otherwise

The 2026-09-17 count is prod 3 of 25 video Assets refused (0 airing), develop 6 of 9 (4 airing), every
one of them H.264 High. The 2026-09-10 draft made that count an acceptance gate and by its own rule the
gate fails. **This revision overrides that gate on purpose and records why:** the population is small
because there are no customers yet, not because High is rare. A phone camera, CapCut and most NLE
presets export High by default, and the person uploading does not know what a profile is. The
alternative — Operations converts the current three by hand and a queue is built when a fourth
appears — is smaller and was rejected because it assigns every future incompatible customer upload to
Operations before the queue exists.

## Decision — v1

**Trigger.** ADR 0070's byte walk (`src/lib/media-codec/probe.ts`) already distinguishes Baseline /
Constrained Baseline from Main, High and HEVC. That verdict is the whole admission predicate:

| Intake verdict (ADR 0070) | Status at register | Job |
| --- | --- | --- |
| Baseline / Constrained Baseline | `ready` | none |
| Main (`unverified_preset`) | `ready` — unchanged, the original keeps playing | enqueued, converts in the background |
| High / HEVC (`unsupported_profile`) | `processing` (was `failed`) | enqueued |
| `unreadable` | `failed` — unchanged | none |
| original larger than the envelope (provisionally 200 MB; T1 sets the number) | `failed` + `too_large_to_convert` | none — operator converts and re-uploads (ADR 0070's flow) |

No ffprobe on intake. Level, resolution, frame rate and audio are encode targets, not admission tests;
using them to quarantine anything waits for the hardware campaign (v2).

**Status semantics.** `processing` means "the players cannot play what was uploaded and the platform
is repairing it". It ends in `ready` when a Rendition is installed or `failed` after two attempts.
ADR 0070's activation guard already refuses a non-`ready` Asset, so nothing new blocks publishing.
A Main Asset never leaves `ready`: it was admitted, and a failed optional conversion must not turn an
accepted upload into a refusal.

**Where it runs.** A route in Thunder_Core on Vercel Pro, region `sin1` (the Storage bucket's region),
with ffmpeg and ffprobe static binaries bundled into the function. The route carries its own
`maxDuration`; Thunder_Core's `vercel.json` currently pins all of `src/app/api/**` to 30 s and T1 must
prove the override wins. A Vercel Cron at `* * * * *` is the **only** trigger — there is no kick from
Thunder One after registration. Worst-case latency is one minute plus the encode, which nobody
notices on a file that used to be refused outright, and one trigger removes the kick-versus-sweep
race the earlier draft spent a page on. The route is gated by `CRON_SECRET` exactly like
`/api/core/v1/media/uploads/sweep`.

**Job row.** `media_core.media_transcode_jobs(id, asset_id, status, attempt, lease_until, output_key,
checksum, error, created_at, updated_at)` with `status ∈ queued | running | ready_to_install | done |
failed` and a partial unique index allowing one unfinished job per Asset. Two RPCs read the queue and
both are atomic, because Vercel states cron invocations may overlap or repeat.

`media_transcode_claim(p_lease interval)` — encode work only, **two attempts and never a third**:

```sql
-- 1. an expired lease on a job that has already spent both attempts is a crash, not a retry
UPDATE media_core.media_transcode_jobs
SET status = 'failed', error = 'lease_expired_after_final_attempt'
WHERE status = 'running' AND lease_until < now() AND attempt >= 2;
-- (the same statement returns a `processing` Asset to `failed`; a `ready` Asset is untouched)
-- 2. claim one candidate that still has an attempt left
WITH j AS (
  SELECT id FROM media_core.media_transcode_jobs
  WHERE (status = 'queued' OR (status = 'running' AND lease_until < now())) AND attempt < 2
  ORDER BY created_at LIMIT 1
  FOR UPDATE SKIP LOCKED
)
UPDATE media_core.media_transcode_jobs t
SET status = 'running', attempt = t.attempt + 1, lease_until = now() + p_lease
FROM j WHERE t.id = j.id RETURNING t.*;
```

The RPC can therefore never return `attempt > 2`. `p_lease` is the route's `maxDuration` plus a
margin, so a lease always outlives the function that holds it; a function cannot run past
`maxDuration`, so no heartbeat is needed. The attempt is counted **before** ffmpeg starts, which is
what makes the bound real — a function killed mid-encode is indistinguishable from one that never
started, and the counter already says it ran.

`media_transcode_install_ready()` — installation only, **never touches `attempt`**: selects one
`ready_to_install` job whose Asset is not on air (definition below), `FOR UPDATE SKIP LOCKED` on the
job, locks the Asset `FOR UPDATE`, re-checks on-air under the lock, installs the generation already
recorded on the job (`output_key`, `checksum`) and returns it, or returns nothing. Because it only
returns installable jobs, an always-on Asset is never selected and cannot starve the others.

`media_transcode_fail(p_job_id, p_error)` — the only way an attempt ends short of a Rendition, and
its transitions are fixed: `attempt < 2` → job back to `queued`, lease cleared, error kept, Asset
untouched; `attempt >= 2` → job `failed`, a `processing` Asset becomes `failed` (reason stays the
source verdict), a `ready` Asset (Main) keeps `ready`. A crash that never reaches this RPC is
handled by the expired-lease rule in claim with the same outcome.

**One encode per invocation.** A sweep invocation does exactly three things and returns: install at
most one `ready_to_install` job, claim and encode at most one job, exit. There is no "loop while time
remains" — a loop would claim a second job with too little of `maxDuration` left to finish it, be
killed by Vercel, and spend an attempt on an encode that never ran. The cron fires every minute, so
throughput is one encode per minute per environment, which the backlog (nine files today) does not
notice. A multi-job loop needs the soft-deadline accounting deferred to v2 and comes back with it.

**Encode.** `libx264 -profile:v baseline -level 4.0 -pix_fmt yuv420p`, scaled so
`max(w,h) ≤ 1920 and min(w,h) ≤ 1080` (portrait 1080×1920 allowed, no upscaling, even dimensions),
frame rate capped at 30, `-b:v 6M -maxrate 8M -bufsize 12M`, `-c:a aac -b:a 128k -ar 48000 -ac 2`,
`-movflags +faststart`. Audio is never stripped: the per-zone mute flag is not applied on either
player (found while answering Q4 on 2026-09-09; a separate ADR 0064 defect), so a stripped track is
silence nobody asked for. A 4K source is downscaled to 1080p — 4K is uncertified on every device and
4K60 is the case where CPU exhausts the clock.

The input is downloaded to `/tmp` rather than streamed from a signed URL: a phone recording without
`faststart` makes ffmpeg seek backwards over HTTP, and one code path is worth more than the `/tmp`
saved. `/tmp` is 500 MB, so the envelope is the original's size: **200 MB** to start, leaving room for
a Constrained Baseline output that runs 10–25 % larger than its source. T1 confirms or moves it.

**Validation.** Before anything observable changes, ffprobe reads the output and every property the
players are promised must hold: MP4, H.264, Constrained Baseline (or Baseline with the constraint
flags), level ≤ 4.0, yuv420p 8-bit, the geometry rule above, ≤ 30 fps, and AAC-LC ≤ 2 channels
≤ 48 kHz. An output with no audio track passes **only when ffprobe shows the input had none** — that
is how "audio is never stripped" is enforced rather than assumed. An output that fails is a failed
attempt, not a Rendition.

**Output identity.** `videos/renditions/<asset_id>-<job_id>-<attempt>.mp4`. The job id is in the key
because the partial unique index permits a new job after `done` or `failed`, and its attempt counter
restarts; `<asset>-<attempt>` alone would let a later job overwrite bytes a player may be reading.
Failed and superseded objects are unreferenced; cleanup waits until their storage cost is measurable.

**Permanent delete leaves the Rendition object behind, and that is accepted, not overlooked.**
`media_asset_permanent_delete` → `media_video_delete` removes the rows and does not touch Storage
today, so the *original* object is already orphaned by a permanent delete; the Rendition joins the
same class rather than creating a new one. It stays traceable without its row: every Rendition lives
under `videos/renditions/` and its key begins with the Asset id, so the orphan set is "objects under
that prefix whose Asset id no longer exists", one Storage list against `media_assets`. Adding Storage
removal to permanent delete is the fix for both originals and Renditions together and is not done
here — it is the same cleanup trigger as failed/superseded outputs (measured storage cost), and the
`ponytail:` note in the worker names all three: the original after playback is confirmed, orphaned
attempt outputs, and Renditions of permanently deleted Assets.

**Rendition.** Two nullable columns on `media_core.media_assets`: `rendition_storage_key` and
`rendition_checksum`. `media_job_poll` changes on two lines —
`COALESCE(ma.rendition_storage_key, fv.storage_key, f.storage_key)` and the same for the checksum.
`mime_type` and `original_filename` stay the original's. `media_asset_get` gains
`rendition: { present: bool }` and nothing else; `probe_verdict` keeps describing the source. The
completed job records `metadata.rendition_recipe = 'cb-1080p30-v1'` and `rendition_completed_at` on
the Asset so a later campaign can find what an older recipe produced — a constant, not a versioning
mechanism.

**"On air" has one SQL definition.** An Asset is on air when it appears in the snapshot of the
**latest** Publish Job (`ORDER BY pj.created_at DESC, pj.id DESC`, the same tie-break as
`media_job_poll`) of a Publication whose stored `status = 'active'` **and**
`media_core.publication_playback_window(s.starts_at, s.ends_at, s.recurrence, s.timezone, now())
->> 'state' = 'open'` — the recurrence-aware helper Thunder_Core already ships
(`20260821065750_publication_download_report.sql`). Stored status alone would count Publications that
have ended; `publication_effective_status` deliberately ignores recurrence; and joining every
historical snapshot would leave a Main Asset `ready_to_install` forever after one republish.
`media_job_poll` still evaluates the same window with its own inline predicate and this ADR does not
rewrite it — the two are meant to agree and the helper is the reference; if they ever drift, the poll
is what a device sees and the transcode RPCs are what must be corrected. "Not on air" is therefore
"no device would be handed this Asset if it polled now" — the safest moment to swap, and it makes a
weekly Publication's off-hours the change window without anyone scheduling one.

**Installation.** `media_transcode_finalize(p_job_id, p_output_key, p_checksum, p_allow_active_swap
default false)` locks the job and the Asset `FOR UPDATE`, re-checks that the lease is still held by
this attempt, and then:

- a `processing` Asset (High / HEVC) installs immediately — the screen showing the original is black
  already, so the swap *is* the repair, and its status becomes `ready`;
- a `ready` Asset (Main) that is **not on air** installs immediately;
- a `ready` Asset (Main) that **is on air** does not install: the job moves to `ready_to_install`
  holding the validated `output_key` and `checksum`, the Asset pointer is untouched and the original
  keeps playing. `media_transcode_install_ready()` installs it on a later sweep, the first time the
  Asset is off air. No human step, no CLI; a 24/7 Publication that never leaves its window keeps
  playing the Main original, which is exactly what it does today. Operations may force the swap by
  calling `media_transcode_finalize` with its service-role-only `p_allow_active_swap => true`.

The check is serialized, not advisory: this ADR's replacement of `media_publication_activate` locks
the snapshot's Asset rows `FOR SHARE` in id order while it runs the readiness guard and changes the
Publication to `active`, and both finalize and install-ready hold the Asset `FOR UPDATE` while they
evaluate on-air. Either the Rendition is installed before activation, or activation wins and the job
stays `ready_to_install`. There is no window in which both believe they ran first. A Schedule window
opening is not an activation and takes no lock — a Rendition installed while the Publication was off
air is simply what the device downloads when the window opens, which is the intended outcome.

## Consequences accepted

- A device already playing a High original (only possible for a Publication activated before ADR
  0070's backfill; prod has 0 such today) re-downloads on its next poll. Intended: that is the repair.
- `publication_snapshot_items.duration_seconds` was pinned at materialization and is not rewritten; a
  Rendition whose duration differs by a frame schedules the old length. Recorded, not fixed —
  rewriting snapshot rows reaches into the mechanism that makes an active Publication immune to edits.
- The Rendition wins over a `file_versions` pin. `file_versions` holds 0 rows today; the day it is
  used for real, this line is where the surprise comes from.
- Storage roughly doubles for converted videos: 377 MB of video today against a 100 GB allowance.
  Deleting the original after playback is confirmed is deliberately not built (`ponytail:` note in the
  worker with that upgrade path).
- The 5 GB upload limit (ADR 0059, verified on both buckets 2026-09-09) is untouched. The 200 MB
  envelope lives in worker policy, not in Storage configuration.

## Rollout order (why the migration is not first)

`processing` is already refused by the activation guard, so a migration applied before the worker
exists would strand every new High upload with nothing to move it to `ready`. Order: deploy the worker
route with the cron **absent** → apply the migration → smoke claim/finalize over HTTP by invoking the
route by hand → add the cron → backfill last, as its own migration (develop 6 + prod 3 `failed` →
`processing` + job; Main `ready` → job, status unchanged). Prod repeats the same order after the
develop run is verified, and the real-player check comes after prod backfill. Replaced functions keep
their signatures and use `CREATE OR REPLACE`; only a new signature is dropped first. Detail in
`docs/media-library/plan-transcode.md`.

## Considered and rejected

- **Normalize every upload** — one fewer predicate, but re-encodes files that are already correct,
  costs the quality loss and doubles CPU and storage on every video.
- **Overwrite `files.storage_key`** — no poll change, but destroys the pre-conversion state, and the
  original is what a future campaign re-encodes from (encoding an already-Baseline file compounds the
  loss).
- **Manual-only v1** — least code; assigns every incompatible customer upload to Operations.
- **Kick from Thunder One + sweep** — halves the worst-case latency, doubles the trigger paths and
  reintroduces the ownership race the job row then has to absorb.
- **Install a Main Rendition immediately even on air** — the 2026-09-17 draft's first shape; rejected
  in review because it swaps a file mid-flight on an Asset that is not broken, and the same lock
  that closes the race makes waiting for off-air free.
- **`ready_to_install` with a human change window and an admin CLI** (the 2026-09-10 draft) —
  correct, but a step nobody is scheduled to perform; kept as the forced-swap RPC parameter only.
- **ffmpeg.wasm in the browser; a managed transcoding service; a container we operate** — reasoning
  unchanged from the 2026-09-10 draft; a container becomes the executor when a v2 trigger fires and
  changes only the process that calls claim/finalize.

## Deferred to v2 — the re-encode campaign

Returns when any of these is observed: manual conversion needed ≥ 3 times in a rolling 30 days; 4K
becomes the normal source; the player team supplies measured Level / resolution / concurrent-decoder
figures for the weakest device; conversions reach the thousands per month; or the benchmark shows a
Vercel function cannot hold the envelope. Contents, all reasoned through in the 2026-09-10 draft
(`git log` of this file): ffprobe assessment on intake against a versioned ten-property predicate,
`unverified_preset` conversion policy, recipe versioning and generation keys, soft-timeout accounting,
the admin CLI with dry-run and blast radius, a second smaller Rendition per zone size, and the device
inventory and playback campaign that certifies any ceiling at all.

## What this decision waits for

**T1 only** — a benchmark on a real Vercel **preview** deployment of Thunder_Core, driven by manual
GET: bundle size with both binaries (Large Functions opt-in is available up to 5 GB if the 250 MB
default is exceeded), the maximum `maxDuration` the project's plan actually grants (Pro 300 s, Fluid
up to 800 s, 30-minute beta), a route observed running past 30 s, and four encodes: today's largest
file (144 MB), a 4K60 source, a file at the 200 MB envelope, and a file without `faststart`. Cron
cadence is **not** part of T1 — Vercel runs crons on production deployments only, so the one-minute
cadence is proven in plan T4 on the develop environment's production deployment. Passing T1 makes
this ADR `accepted`. The real-player playback check (plan T8) is a production rollout gate, not an
acceptance gate: failing it revises or supersedes this ADR rather than returning it to proposed.
