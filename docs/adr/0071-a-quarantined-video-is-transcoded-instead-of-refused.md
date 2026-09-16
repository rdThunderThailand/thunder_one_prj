# A quarantined video is transcoded instead of refused

**Status:** proposed (2026-09-09) — blocked on ADR 0069's report, a deployed Vercel benchmark and hardware measurement; revised 2026-09-10 to keep assessment non-blocking, separate the 5 GB upload limit from Vercel's automatic-conversion envelope, and add a manual fallback

Builds on ADR 0070, which quarantines a video the players cannot decode. This ADR replaces that
refusal with a conversion when the source fits the automatic-conversion envelope. An Asset that has
not passed the full admission predicate enters an assessment job and Vercel runs ffprobe **without
downgrading the Asset's status**. A source that needs conversion and fits the envelope is re-encoded to
MP4 / H.264 Constrained Baseline / yuv420p / AAC-LC — the format the player team's
`VIDEO_CODEC_SUPPORT.md` names as accepted by both the Android and Windows players.

Status continues to express whether the original is usable under ADR 0070's hard rules, not whether
background assessment is busy. An Asset that is already `ready` stays `ready` during assessment and
an optional conversion. An Asset the Player rejects stays `failed` until automatic conversion
actually starts, when it becomes `processing`; the exception is an ADR 0070 `unreadable` false
negative that ffprobe proves satisfies every full ceiling, which assessment may recover directly to
`ready` without a rendition. A source outside the envelope stays `failed` with
`too_large_to_convert` only when it failed a hard rule. If it failed only an unverified ceiling, it
stays `ready` with `unverified_preset` and records that manual conversion is optional. Automatic work
runs as a Vercel function inside **Thunder_Core**, not on a second server; the source file is kept;
and a failed optional conversion never turns a usable Asset into a refused one.

**Do not implement this yet.** Three things gate it and all are listed under "What this decision is
waiting for": ADR 0069's report must show the workload, the packaged worker must pass a real Vercel
deployment benchmark, and a hardware campaign must replace the provisional ceilings. The player team
answered Q1–Q3 on 2026-09-09 without supplying a single figure, so that gate changed shape rather
than lifting: it is a measurement campaign we have to run, not an answer we are waiting to receive.
ADR 0069 and the non-backfill parts of ADR 0070 are independent of these gates.

## Why converting is worth building after quarantining

ADR 0070 stops bad media from reaching a screen, which is the urgent half. It does not stop the work
from landing on the operator: they are handed a refusal and a format specification and told to run
ffmpeg themselves. That is a reasonable interim state and a poor permanent one — it puts a codec
decision in front of someone whose job is scheduling content, it will be done inconsistently, and the
files that come back are judged by the same probe that refused the first attempt.

Conversion is also what repairs active Publications without rewriting their snapshots. ADR 0070 sets
every condemned Asset to `failed`, while `media_job_poll` continues serving the current snapshot
because it does not filter on Asset status. The queue applies one conversion-admission predicate to
the library; airing is not a second population or an exception. When the rendition pointer changes
atomically, a device that polls again receives the converted file, while any new activation remains
blocked until the Asset returns to `ready`.

When the player team's real Level, resolution and frame-rate limits arrive, a converting pipeline
re-encodes the library. A refusing pipeline quarantines a larger share of it and hands the operator a
longer list.

## Where the work runs

- **In the browser with ffmpeg.wasm:** rejected. It removes all server cost, but a ~30 MB wasm
  payload encoding at a fraction of native speed, in a tab the operator can close mid-job, is worse
  than the problem.
- **A managed service (Coconut, AWS MediaConvert; Mux and Cloudflare Stream are disqualified outright
  because they deliver their own HLS while our players download MP4 files):** rejected. A vendor
  relationship and a second set of credentials to run one ffmpeg invocation whose arguments the
  player team has already given us.
- **A container we run ourselves (Fly.io, Railway) polling the job table:** rejected for now, correct
  later — see the migration trigger below. Standing up a server, its secrets, its uptime and its
  monitoring is real cost, and the measured workload does not need it.
- **Manual conversion as the whole v1:** rejected. It is the least code, and it remains the exception
  path for a source outside Vercel's envelope, but making it the normal path assigns every incompatible
  customer Asset to Operations and does not meet this ADR's purpose. The automatic queue is not built
  merely because it is possible: ADR 0069's report is an acceptance gate, and a report that does not
  justify automation defers this ADR instead of shipping an unused queue.
- **A Vercel function inside Thunder_Core (chosen):** the deployment target the team already
  operates. Thunder_Core's `vercel.json` pins `regions: ["sin1"]`, the same region as the Storage
  bucket it reads and writes.

## The 5 GB upload promise and the separate automatic-conversion envelope

ADR 0059 promises 5 GB per file, and unlike most such promises this one is real: verified 2026-09-09,
the `media` bucket on production (`sfiefevtxalqjizdkcsw`) and on the `develop` branch project
(`ftfmokgphewzyxzwjitv`) both carry `file_size_limit = 5368709120`, and `upload-limits.ts`
(thunder_one_prj) and Thunder_Core's `upload-url` schema agree at 5 GB.

*(Thunder_Core's `supabase/migrations/051_media_storage_bucket.sql` still says 500 MB. It is stale —
the live bucket was changed outside the migration history. ADR 0069 records this drift; a reader
who trusts the migration will reach the opposite conclusion from the one in this section.)*

A Vercel function cannot automatically convert every file the 5 GB promise accepts. `/tmp` is the
only writable path and holds 500 MB, and no configuration raises it. That limits the output Vercel
can produce and CPU time limits the source it can finish, but neither limit applies to the signed
upload from the browser to Storage. Making the weakest worker the upload limit would refuse a large
Asset that already satisfies every player ceiling and needs no conversion.

**This ADR therefore keeps ADR 0059's 5 GB upload limit and introduces a separate automatic-conversion
envelope.** `upload-limits.ts`, Thunder_Core's `upload-url` schema and the bucket's
`file_size_limit` stay at 5 GB. The envelope is an execution decision made after upload and full
ffprobe assessment; it is not a second Storage limit:

| Result after full assessment | Outcome |
| --- | --- |
| The original satisfies every admission ceiling | Keep `ready`, or recover an ADR 0070 `unreadable` false negative to `ready`; no conversion |
| A hard rule failed and the source fits the automatic envelope | Change `failed` to `processing` when encode starts; change to `ready` only after validated atomic swap |
| A hard rule failed and the source is outside the automatic envelope | Keep `failed`; set `probe_verdict.code = too_large_to_convert`, retaining the original hard-failure facts; manual conversion is required |
| Only a provisional ceiling failed and the source fits the automatic envelope | Keep `ready + unverified_preset` while Vercel converts in the background; conversion failure does not quarantine it |
| Only a provisional ceiling failed and the source is outside the automatic envelope | Keep `ready + unverified_preset`; set `probe_verdict.conversion = manual_optional`; do not start automatic conversion |
| The source exceeds 5 GB | Refuse the upload at the existing upload boundary |

**The envelope has no number yet, and this ADR deliberately does not invent one** — it comes out of
the benchmark below. Measured 2026-09-09, the library is 34 videos averaging 16.2 seconds, longest
144 seconds, largest file 144 MB. The benchmark defines what Vercel can convert automatically; it
does not amend ADR 0059 or the live bucket.

Rejected alternatives: lowering the whole upload contract to the Vercel envelope couples Storage to
one executor and refuses compatible large files; publishing an original that failed admission
reintroduces media the players may refuse; sizing the first worker to 5 GB means operating a
container in full to serve a case that has not yet occurred.

## What actually bounds a Vercel function

Recorded because the trigger to leave Vercel should be a measurement, not a feeling that the function
has grown too big.

`/tmp` holds 500 MB and is the only writable path. Decoded frames never touch it — ffmpeg streams
them through memory, which is why 4 GB of RAM is ample — so the budget is the output file, and the
input is read from a signed Storage URL rather than downloaded, keeping the whole 500 MB for output.

Function duration depends on the deployment plan and Fluid Compute configuration. Thunder_Core's
`vercel.json` currently pins all of `src/app/api/**` to 30s, so a route-level declaration is not
accepted as proof that the transcode route receives more. The implementation gives the route an
explicit function configuration and the deployed benchmark runs longer than 30 seconds on purpose;
the observed termination time is the value this ADR uses.

The worker does not carry ffmpeg or ffprobe today. They have to be packaged with the route, and the
deployed function — application code, dependencies and binaries together — has to stay below
Vercel's standard 250 MB uncompressed bundle limit. A local binary and a successful local encode do
not satisfy this gate; the deployment artifact size and the ability to spawn both binaries are
benchmark results.

CPU is the wall that cannot be bought around. Pro functions default to 2 GB / 1 vCPU and reach
4 GB / 2 vCPU only when configured; two vCPU is the ceiling Vercel sells. It does not fail on its own
— it sets encoding speed, and therefore decides whether a job hits the duration limit. A 4K60 source
is the case where a small output file still exhausts the clock.

Cost follows Active CPU, which transcoding consumes continuously, at $0.160 per CPU-hour and $0.0133
per GB-hour in `sin1`. At the current volume that is smaller than the project's build minutes.

**Move to a container when any of these is true:** manual conversion is needed at least three times
in a rolling 30 days, 4K becomes the normal source, an Asset cannot be converted on the Operations
machine, conversions run in the thousands per month, or the retry and rate-limiting rules outgrow a
cron sweep. These are observable triggers; one exceptional large Asset is not enough to operate a
second server indefinitely.

## Why automatic assessment and conversion use a job row

A job row is what makes that later move a change of one component rather than a rewrite, and it is
needed regardless: it is where "has this Asset passed full assessment", "is it converted yet" and
"why did it fail" are answered. Job state owns assessment progress; Asset status does not. ADR 0071's
version of `media_video_register` keeps the status ADR 0070 calculated and inserts the assessment job
in the same transaction. A literal backfill inserts jobs for existing videos without changing their
status. This is the missing rollout ownership: there is no interval where registration succeeds but
the durable assessment work is absent, and no migration turns the whole library into `processing`.

An Asset that meets every ceiling completes without a rendition and may recover a prior `unreadable`
false negative to `ready`. Assessment never downgrades a `ready` Asset. If a hard rule failed, the atomic
conversion claim changes `failed` to `processing`; failure returns it to `failed`. If only a
provisional ceiling failed, the Asset remains `ready + unverified_preset` through assessment and
background conversion. A source outside the envelope gets the hard or provisional outcome in the
table above and automatic work ends without requeue.

Thunder One fires a non-blocking kick after registration so work starts immediately. The kick is a
latency optimization, not the correctness path: a dedicated Vercel cron sweep runs every five minutes
and picks up rows the kick never reached. The existing `/api/core/v1/media/uploads/sweep` cron proves
only the request pattern; its `0 18 * * *` schedule is once a day and is not reused for conversion.
Sub-daily Vercel Cron requires a Pro or Enterprise plan. If the deployment cannot schedule this
five-minute backstop, automatic conversion does not ship; leaving an Asset behind a failed kick for
up to 24 hours is not an accepted fallback. A container later replaces the cron with a poll loop and
nothing else changes. Supabase `pg_net` webhooks were rejected for the trigger because a silent
failure mode is the exact defect this work removes.

Because both a kick and a sweep can fire, and Vercel states cron invocations may overlap or be
delivered more than once, the row carries an ownership contract rather than a status column alone:
one unfinished job per Asset, a phase (`assessment` or `conversion`), an atomic claim that moves a row
to `running` and stamps a lease, and lease expiry that returns an abandoned phase to `queued`. A
validated optional conversion that cannot yet be installed uses `ready_to_install`; the same job row
holds its generation key, checksum and probe result, so no second queue or rendition table is needed.
Assessment does not spend an encode attempt. When assessment chooses conversion, one transaction
changes the phase, increments the conversion attempt **before ffmpeg starts**, and derives the output
key from Asset, recipe version and attempt. The recipe version makes a later campaign a new
generation; the attempt keeps overlapping workers from writing the same object. Without that
transition being atomic and counted before encode, "two attempts then stop" is not a bound — a
function killed during ffmpeg before it can write anything is indistinguishable from one that never
started.

The ffmpeg invocation itself is a plain function of an input URL and an output path that knows
nothing about Next.js request handling. This is not an abstraction layer and no interface is
introduced; it is a refusal to mix the two concerns in one file, which is what would make the move
expensive.

## Which file is canonical, and how it changes hands

The conversion does not overwrite the Asset's file. **The original stays where it is, and the encode
is recorded on the Asset as a rendition the player poll prefers when it is present.** An earlier
draft repointed `files.storage_key` in place; the reasoning for dropping that is under "One rendition
today, room for a second", and it is weaker than it first looked.

Concretely: `media_core.media_assets` gains two nullable columns, `rendition_storage_key` and
`rendition_checksum`. That is the whole rendition-selection mechanism — no rendition table, join or
key of its own. It is two columns because the poll needs exactly two values overridden: verified against
`20260909120000_equal_priority_publishes_with_a_warning.sql`, `media_job_poll` takes `bucket_name`, `mime_type` and
`original_filename` straight from `public.files` and does not send the Asset's `width`, `height` or
`duration_seconds` at all, so a rendition's geometry needs no storage anywhere. A table whose unique
key enforces one row per Asset would be a column wearing a table's clothes.

`media_job_poll` serves `COALESCE(fv.storage_key, f.storage_key)`, joining `public.file_versions` as
`fv.file_id = f.id AND fv.version_no = psi.file_version_no` — the row whose version number the
snapshot pinned at materialization. The poll change is one expression on each of two lines:
`COALESCE(ma.rendition_storage_key, fv.storage_key, f.storage_key)` and the same for `checksum`. The
Asset is already joined, so nothing else in that query moves.

**Putting the rendition first means it overrides a pin the snapshot set deliberately.** Today that
costs nothing — `public.file_versions` holds 0 rows and `current_version_no` is 1 on all 75 live
files (verified 2026-09-09) — but on the day versioning is used for real, a Publication pinned to
version 3 would be served a rendition instead, and this precedence is where that surprise comes from.
It is stated here so that the day it matters, the cause is written down rather than rediscovered.
`file_versions` was itself considered for holding the converted file and rejected: being the first
consumer of unexercised versioning machinery means debugging it as part of this work.

`mime_type` and `original_filename` keep coming from the original and are deliberately not
overridden. Both renditions are MP4, and the filename is what the operator uploaded — a name the
encoder invented would be worse.

`media_asset_get` also gains one narrow public fact:
`'rendition', jsonb_build_object('present', ma.rendition_storage_key IS NOT NULL, 'method',
ma.metadata ->> 'rendition_method')`. It does not expose the storage key or the rest of `metadata`.
`probe_verdict` continues to describe the source; `rendition.present` tells an operator whether that
source finding is still unresolved or a compatible file is now being served. `method` distinguishes
an automatic repair from the Operations fallback without making internal generation details part of
the frontend contract.

An Asset with no rendition pointer is served from its original. For a quarantined Asset referenced by
an already-active Publication, that is how the current snapshot keeps playing until automatic or
manual conversion reaches it; new activation is blocked by status instead.

The order matters more than the encoding does — a crash between two steps must leave a state the next
attempt recognises.

1. Write the encode to a generation key derived from Asset, current recipe version and attempt.
   Nothing observable changes; the Asset is still served from its current rendition or original.
2. Probe the output with **ffprobe**. An encode that does not itself satisfy the admission ceilings
   is a failed attempt, not a converted Asset.
3. Finalize according to the source outcome and blast radius:
   - a hard-refused Asset installs immediately, because replacing an unplayable source is the repair;
   - a provisional-only Asset with no reference from an Active Publication also installs immediately;
   - a provisional-only Asset referenced by an Active Publication leaves the Asset pointer unchanged
     and moves its job to `ready_to_install`. Operations installs that exact validated generation in
     an agreed change window through the same dry-run, `--apply` and compare-and-swap boundary as the
     manual path.

Steps 1–2 leave the Asset's current pointer unchanged and are safe to repeat; only installation is
observable to a player. The automatic-finalize RPC locks the job and Asset, rechecks the expected
generation, recipe and current Active-Publication references, then swaps key, checksum and recipe
version atomically, sets `metadata.rendition_method = 'automatic'` and
`metadata.rendition_completed_at`, and sets `status = 'ready'`. The worker may call it immediately
only for the first two cases above. For `ready_to_install`, the admin CLI prints the same active
Publication and Media Device blast radius as a manual dry run; `--apply` calls that RPC for the stored
generation with its service-role-only `p_allow_active_swap` input. Worker calls always leave that input
false. A stale worker whose lease was reclaimed cannot publish its generation. The previous
generation remains a different object, so a new campaign cannot overwrite bytes a Player is currently
reading before the pointer swap. There is no `originals/` copy; the original is never displaced.

The Active-Publication check is serialized rather than advisory. ADR 0071's replacement of
`media_publication_activate` locks the snapshot's Asset rows `FOR SHARE` in id order while it performs
the readiness guard and changes the Publication to `active`; automatic finalization locks its one
Asset `FOR UPDATE` before rechecking Active-Publication references. Therefore either the rendition is
installed before activation, or activation wins and the optional job remains `ready_to_install`.
There is no check-then-swap window in which both operations believe they ran first.

Conversion is skipped when full assessment says the original satisfies every current ceiling. It is
also skipped when `rendition_storage_key` is set and its stored recipe version equals the current
recipe version. A missing or older rendition creates a new generation only when the original still
fails the current predicate. Failed and superseded generation objects are unreferenced; cleanup is
deferred until their measured storage cost justifies a retention rule.

## Manual conversion outside the automatic envelope

`too_large_to_convert` means Vercel cannot execute a conversion required by a hard rule; it does not
mean the source is corrupt. That Asset remains visible in the Media Library as `failed`. An Asset
outside the envelope that failed only a provisional ceiling remains `ready + unverified_preset` and
records `probe_verdict.conversion = manual_optional`. Media Detail explains whether manual conversion
is required or optional and lets the Media Operator contact Operations or upload a new Asset made
with the published preset. Upload Queue keeps ADR 0070's immediate accepted/refused result; it is not
a background-job monitor. Neither surface shows an ETA or leaves either manual case at `processing`,
because no automatic work is running. An internal list command finds both populations while
`rendition_storage_key` is null; there is no notification or ticket integration until measured demand
justifies one.

Operations handles the exception with one admin CLI, not with edits in the Supabase Dashboard. The
command takes an Asset id and performs one controlled flow: obtain a signed URL for the original, run
the current recipe with ffmpeg, validate the output against the same ceilings with ffprobe, calculate
the checksum, upload to a new generation key, and atomically install the rendition. The default is a
dry run. A production write requires `--apply` and prints the Asset, source size, recipe version,
output key, probe result, and every active Publication and Media Device that will observe the swap.
The command and its finalize RPC are service-role-only; credentials never enter a browser or a
customer machine. The same CLI has an `install-ready` action for an automatic job in
`ready_to_install`; it does not encode or upload again, and `--apply` installs only the generation
already recorded on that job.

Manual conversion does not create or claim an automatic job. Before it writes, the finalize RPC locks
the Asset and checks the eligibility state the dry run saw — either `failed + too_large_to_convert` or
`ready + unverified_preset + manual_optional` — and verifies the expected `file_id`, `updated_at` and
complete `probe_verdict`, plus the absence of an unfinished automatic job. Those values are the
compare-and-swap token; comparing two null rendition pointers would protect nothing. The RPC then
performs the same observable transaction as the automatic worker: set
`rendition_storage_key`, `rendition_checksum`, the current recipe version,
`metadata.rendition_method = 'manual'`, `metadata.rendition_completed_at`, and `status = 'ready'`.
The source `probe_verdict` remains intact: it describes why the original needed or was offered
conversion, while the rendition fields and recipe version prove what the Player is now served. If
upload or validation succeeds but finalization fails, the pointer does not move and the Asset keeps
its pre-write status; the new object is unreferenced and safe to inspect or remove later.

Applying the transaction makes the rendition visible on the next player poll. Operations chooses the
change window after reading the dry-run blast radius; there is no snapshot rewrite or forced
republish. Rollback is also compare-and-swap: only while the Asset points at the exact manual
generation does the admin command clear its rendition pointer and checksum. The retained source
verdict restores the original policy state — `failed` for a hard refusal, `ready` for a provisional
one. The original was never displaced.

Every applied manual conversion records its method, completion time and recipe version on the Asset.
When a container is introduced, an explicit one-off backfill selects both unresolved populations
defined above and enqueues that exact set. The container uses the same recipe, generation-key and
atomic-finalize contracts. The manual CLI remains an Operations fallback; no Asset changes policy
state merely because a stronger worker was deployed.

For a hard-refused Asset referenced by an already-active Publication, installation is also the moment
the fix reaches the screen. `media_job_poll` resolves the Asset live off `ma.file_id` rather than
denormalizing a storage key into the snapshot, so the rendition is visible to a device without
touching `publication_snapshot_items`. **Two consequences follow that are visible in the shop, and
both are intended rather than incidental for this repair.**

The poll response carries the storage key and the checksum, and both change — so a device already
playing the original re-downloads on its next poll. That is the repair arriving, but it is a
mid-flight download on a screen that was running, and it should be expected rather than discovered.

And the claim that nothing in the snapshot needs rewriting is not quite complete:
`publication_snapshot_items.duration_seconds` was pinned at materialization from
`COALESCE(pi.duration_seconds, ma.duration_seconds)`. The rendition carries its own duration and the
snapshot keeps the old one, so if an encode shifts the duration slightly, an already-airing
Publication continues to schedule the old length. The drift is small and the alternative — rewriting
snapshot rows — reaches into the mechanism that makes an active Publication immune to source edits,
which is a larger change than the problem justifies. It is recorded here rather than fixed.

Those consequences are not imposed silently on a provisional-only Asset that was already playing.
If an Active Publication references it, automatic conversion stops at `ready_to_install`: the source
continues to play and its pinned duration remains in force until Operations sees the blast radius and
applies the swap in an agreed change window. If no Active Publication references it, there is no
on-air consumer to protect and installation is automatic. The change window does not make the
download or possible duration drift disappear; it makes their timing deliberate.

**This ADR also obliges contract and UI work in Thunder_Core and `thunder_one_prj`.** Its migration
replaces `media_asset_get` to return the narrow `rendition` object above. Thunder_Core's existing
`GET /api/core/v1/media/videos/[id]` route passes that result through unchanged. In Thunder One,
`MediaAsset` (`src/types/domain.ts`) gains the `probe_verdict` and `rendition` fields, and
`MediaDetailPage` (`src/features/media-workspace/assets/media-detail-page.tsx`) uses both: a present
rendition is labelled as converted and playable, while an absent rendition keeps the source warning
and distinguishes required from optional manual conversion. It must not display
`unsupported_profile` as an unresolved playback failure once `rendition.present` is true.

Upload Queue does not become a job monitor. ADR 0070 already owns branching on the immediate
`RegisteredVideo.status` in `useUploadQueue`; after registration the durable assessment, conversion
and `ready_to_install` outcome belongs on Media Detail. Adding polling or an ETA would require a job
read contract that does not exist and is not needed to remove the misleading warning.

## One rendition today, room for a second

The player team cannot say how many 1080p streams a device decodes at once, and what came back is
worse than a missing number. `ManagedVideoView` preloads by constructing a **second** `MediaPlayer`
and prepare/start/pausing it, and pausing does not release a decoder — so a zone that is playing and
preloading holds two. The team's stated planning figure is **roughly 2N decoder instances for N video
zones**, explicitly a design budget rather than a certified maximum, with hand-over during a
transition able to exceed it briefly. Their own recommendation is that the backend be able to hold
more than one rendition per file — one for a full screen, one for a small zone — selected by zone
size and tested device capability.

**This ADR does not build that, and does not pretend the numbers exist to build it.** There is no
rendition-selection logic, no per-zone target and no device capability table; every Asset gets
exactly one rendition, from the single preset below.

**And the Q3 answer does not compel the shape either — that claim is worth not making.** What Q3
established is a count of decoder *instances*, and a smaller rendition does not reduce that count; it
reduces the load each instance carries, which is a different problem. "The backend should support
several renditions" is the player team's design proposal, offered with no measurement behind it, and
this ADR spends a paragraph refusing to build on unmeasured recommendations.

So the honest statement is narrower. The repoint was dropped because **overwriting
`files.storage_key` makes "the converted file" a property of the file, and there is exactly one of
those** — it destroys the pre-conversion state, it is the harder thing to walk back if the campaign
says something unexpected, and it buys nothing that two nullable columns do not. What Q3 did settle
is that this ADR may no longer *assert* an Asset has a single converted form. Two columns hold that
line at almost no cost; a second rendition, if the campaign ever justifies one, is a migration run
during a campaign that will be running migrations anyway.

## What is admitted without conversion

ADR 0070 admits Constrained Baseline and Baseline on profile alone, because profile is the only rule
the player team stated as hard. The full predicate is stricter when deciding whether conversion is
useful, but its provisional ceilings do not acquire the authority to quarantine an Asset that ADR
0070 admits. Level, resolution, frame rate, bit depth and audio determine conversion work; until the
hardware campaign certifies them, failing only one of those leaves the original usable but flagged.

The encode is skipped only when every ceiling in the table above is met: container, codec, profile and
constraint-set flags, level, pixel format and bit depth, dimensions, frame rate, average bitrate and
the audio stream. Any single failure makes the Asset a conversion candidate; only a hard profile or
codec failure makes the original unpublishable. Each Asset records the predicate-set version that
assessed it, so when a pending answer changes a limit, the Assets needing reassessment are a query.

**That list is read with ffprobe, not with ADR 0069's byte walk, and the reversal is deliberate.**
ADR 0069 rejected ffprobe as disproportionate on an argument that was correct for its own question:
deciding whether a file is High needs `profile_idc` and the constraint-set flags out of `avcC` — a
ranged read and a few dozen lines, against shipping a media toolchain to answer one question. ADR
0070 keeps that byte walk unchanged, because profile and codec remain the only rule the player team
states as hard.

Here the arithmetic differs in both directions. The question is ten properties rather than one, and
level, frame rate, average bitrate and the audio stream are not all reachable from `avcC`. The worker
must carry ffmpeg to encode, so packaging ffprobe beside it adds no second media-toolchain decision —
but neither binary exists in Thunder_Core today, and the deployed bundle gate above must prove they
fit and execute. The byte-walk parser stays a shared module for its two remaining callers — the 0069
report and the 0070 upload check — and this ADR stops being a third one.

## Failure, and why a hard refusal does not fall back

Two attempts bound automatic conversion. A hard-refused Asset then stays `failed` with the reason
shown. An Asset that failed only provisional ceilings stays `ready + unverified_preset`; the job
records the conversion failure but does not turn an accepted original into a refusal. The dominant
cause of a failed transcode is the file itself, which retrying does not fix; the two attempts exist for
a transfer that stalled. No retry button is offered until there is evidence someone would use it.

**A soft timeout does not spend an attempt; a hard termination does.** The worker sets a watchdog
before Vercel's `maxDuration`. When that soft deadline fires, it terminates ffmpeg itself and, in one
transaction, returns the claimed attempt, increments `timeout_count`, releases the lease and requeues
the job. A second soft timeout ends the job with `conversion_timeout`; it leaves a hard-refused Asset
`failed` and a provisional-only Asset `ready + unverified_preset`.

If Vercel terminates the invocation, no finally block can return the attempt or label the cause. The
lease reaper therefore treats that case as an abandoned crash: it releases the expired lease and the
attempt remains spent. A source outside the automatic envelope is still uploaded and assessed. A hard
failure ends with `failed + too_large_to_convert`; a provisional-only failure remains
`ready + unverified_preset + manual_optional`. The manual path above can handle either. Neither
timeout reason nor envelope outcome says the file is corrupt — the same separation ADR 0070 draws
between `unsupported_profile` and `unverified_preset`, for the same reason: an operator told the wrong
thing deletes the wrong file.

There is no fallback to publishing an original that failed ADR 0070's hard rules. Doing so returns the
system to exactly the state ADR 0070 exists to end. Continuing to publish a provisional-only original
is different: ADR 0070 already admits it, and this ADR does not silently widen quarantine using
uncertified ceilings.

## Unconfirmed assumptions

These were our estimates; the player team reviewed them on 2026-09-09 and accepted most as starting
presets **without certifying any of them against hardware**. They are still the reason the source
file is kept: when real limits arrive we re-encode from the original, because re-encoding an already
Constrained Baseline file compounds the quality loss.

**Two different things share this table and must not be collapsed into one column.** The *encode
target* is what comes out of ffmpeg. The *admission ceiling* is what a source file has to be under to
skip conversion. "1080p, aspect preserved" is a fine target and is not something a file can be tested
against, and an earlier draft of this table lost that distinction — which would have left the skip
predicates, and step 2's check on our own output, with nothing to compare against.

| Property | Encode target | Admission ceiling — skip conversion only if under |
| --- | --- | --- |
| Container | MP4 | MP4 |
| Video codec | H.264 | H.264 |
| Profile | H.264 Constrained Baseline | Constrained Baseline or Baseline |
| Level | 4.0 | 4.0 |
| Frame geometry | aspect preserved, longest side ≤ 1920 and shortest ≤ 1080 so **portrait 1080×1920 is allowed**, no upscaling of smaller sources, dimensions rounded to even | `max(width, height) <= 1920` **and** `min(width, height) <= 1080` |
| Frame rate | cap at 30 fps; a 24 fps source stays 24 | ≤ 30 fps |
| Bitrate | 6 Mbps average @1080p with an explicit maxrate and VBV buffer size | ≤ 8 Mbps average — **peak and VBV are not admission predicates**, see below |
| Pixel format | yuv420p 8-bit | yuv420p 8-bit |
| Audio | AAC-LC 128 kbps stereo 48 kHz; **audio is never stripped**, and a silent source stays silent | AAC-LC at ≤ 192 kbps, ≤ 2 channels and ≤ 48 kHz, or no audio track |
| Encoding speed | ~2× realtime at 1080p30 on 2 vCPU, **not measured on Vercel** | not applicable |

Every ceiling above is provisional and none is certified against hardware. The player team accepted
Level 4.0, 1080p and 30 fps as starting presets while stating plainly that the weakest device is
unknown, that declaring a Level does not make a lower device play the file, and that 60 fps and
above-1080p are uncertified everywhere. The campaign replaces these numbers; until it runs they are
the ceilings, because a predicate set with a blank in it cannot be executed at all.

**Peak bitrate and VBV are encoder settings, not admission tests.** They are cheap to *set* and
expensive to *verify* — neither is in `avcC`, and reading them out of a source means SPS VUI/HRD
parsing or a full scan. So they are set on our own output and not tested on anyone's input.

Storage cost of keeping both files is bounded: the 34 video Asset files total 377 MB against a 100 GB
allowance (verified 2026-09-09 — the 400 MB figure quoted elsewhere includes 20 MB of images, which
are never converted), and a worst case where every video needs conversion reaches roughly 850 MB —
Constrained Baseline output runs 10–25% larger than its source, having neither CABAC nor B-frames.
Deleting the original after playback is confirmed is deliberately not built and is marked in code as
a `ponytail:` note with that upgrade path.

## What this decision is waiting for

**ADR 0069's report.** The automatic queue is chosen over a manual-only v1 because conversion is the
product outcome, not because the current workload has already justified the machinery. The report
must state how many hard-refused and `unverified_preset` Assets exist and how many are in active
Publications. If that observed population does not justify automation, this ADR remains proposed and
Operations uses the explicit manual replacement flow rather than shipping an unused queue.

**A benchmark on a real deployment.** Every duration, envelope and cost figure above rests on an
estimated encoding speed. The deployed artifact must contain working ffmpeg and ffprobe binaries and
remain below the function bundle limit. The run deliberately crosses 30 seconds to prove the
route-specific duration wins over Thunder_Core's current catch-all, and the deployed cron must be
observed at its five-minute cadence on a plan that supports it. Encode cases cover: a 144 MB file
(today's largest), a 4K60 source (the case where CPU exhausts the clock before disk fills), a file at
the proposed envelope, and **a file without `faststart`** — reading the input from a signed URL assumes
`moov` sits at the front, and a file where it does not sends ffmpeg seeking back over HTTP, which is
the difference between streaming the input and being forced to spend `/tmp` on it. Until those checks
run, the architecture is reasoned rather than demonstrated, and the envelope has no number.

**The measurements the player team could not supply.** Q1–Q3 were answered on 2026-09-09 with no
figures at all. There is no hardware inventory — model, SoC, OS, RAM, decoder name, reported
profile and level — for the Android kiosks or the Windows mini PCs, so neither the weakest device nor
its maximum Level can be named; `minSdk 24` is an install floor, not evidence of what the field runs.
1080p30 is a provisional preset rather than a certified ceiling. And concurrent-decoder capacity has
never been measured on any model.

**So this ADR is no longer waiting on an answer; it is waiting on a test campaign we have to run** —
an inventory first, then playback of one, two and many videos at once including cut, fade, preload
and repeated loops, on the weakest device before anything is certified.

Q3 was ranked first because it was the one answer capable of invalidating this ADR rather than
adjusting it. It did exactly that, in the part that mattered: the claim that an Asset has a single
converted form is gone, and "One rendition today, room for a second" is what replaced it.

## Consequences once accepted

**One migration belongs to this ADR and it is not optional.** It owns the conversion-job table, its
one-unfinished-job-per-Asset constraint, the atomic claim and lease-reaper RPCs, the lease, attempt
and `timeout_count` fields, the `ready_to_install` state and validated-generation fields, the
service-role-only automatic- and manual-finalize RPCs,
`rendition_storage_key` and `rendition_checksum` on `media_core.media_assets`, the two `COALESCE`
changes in `media_job_poll`, and ADR 0071's replacements of `media_video_register` and
`media_asset_get`, plus the serialized Asset-row lock in its replacement of
`media_publication_activate`. Registration keeps ADR 0070's status decision and inserts the assessment
job in the same transaction; Asset detail adds only the `rendition` object. The migration also inserts
initial jobs for existing video Assets without changing their status. Replacing each function
preserves its signature and repeats its `REVOKE` and service-role `GRANT`. This is what makes every
accepted upload durably assessable, every converted file reachable and the served state visible to
the operator. ADR 0070 already owns dropping `image/webp`; this ADR does not wait to bundle that
change.

`processing` becomes observable only for an Asset the Player already rejects, from the moment an
automatic worker claims its encode until success or failure. Assessment never downgrades Asset
status; it may only recover an `unreadable` false negative that ffprobe proves safe. An optional
conversion never removes a provisional-only Asset from `ready`. ADR 0070's
guard in `media_publication_activate` therefore blocks the population it already meant to block; the
assessment backfill does not freeze draft → active across the library.

The bucket's `file_size_limit` remains 5 GB. The automatic envelope lives in worker policy and is
versioned with the admission predicate; it is not written into Storage configuration. ADR 0069's
recorded drift between `051_media_storage_bucket.sql` and the live bucket remains a separate
reconciliation, while ADR 0070 owns removing `image/webp` from `allowed_mime_types`. This ADR changes
neither setting.

While answering Q4 the player team reported something this ADR depends on: **the per-zone mute flag
is not applied on either platform.** Android never calls `setVolume` per zone, and Windows sets mpv's
volume to 50 when the player is constructed. That is a defect in the delivery of ADR 0064 rather than
anything introduced here, and it is recorded because it is the reason audio cannot be dropped at
encode time — nothing downstream is reliably silencing it, so a stripped track is silence nobody
asked for. Fixing it is separate work.

Transcoding still does not close the gap on its own, and Q9 confirmed why: both `ProofOfPlayRuntime`
(Android) and `ProofOfPlayService` (Windows) enqueue an upload only for `Completed`, while `Failed`
and `Interrupted` are written locally and logged as skipped — so a codec rejection never leaves the
device. The team proposed a contract for it: separate download readiness from compatibility result
from playback result, carry `event_id`, `occurred_at`, stage, `error_code`, decoder detail and app
version, queue while offline and deduplicate, and record per device and per rendition rather than
condemning a file globally. Agreeing and building that is its own piece of work. The two fix
different layers — one prevents the bad file, the other reports it when prevention misses.
