# Plan — Upload and conversion throughput, plus #335

Decisions: ADR 0059 amendment "queue concurrency and stalled files", ADR 0071 amendment "conversion
throughput". Glossary: Playback Readiness. Issue: thunder_one_prj#335. Reviewed by `/scrutinize` on
2026-11-04: fix-then-ship; its blockers are absorbed below.

Three PRs that can ship apart. Core Phase 1 lands first: more upload slots alone only fill the conversion
queue faster. #335 does not depend on Core.

## Core PR 1 (Thunder_Core, from `develop`) — order and speed

1. Migration, using `supabase db push` and `CREATE OR REPLACE` because signatures do not change:
   - `media_transcode_jobs`: nullable `recipe`, set to `cb-1080p30-v1` on jobs that are `running` or
     `ready_to_install`, since the old route encoded them. Queued jobs are not encoded yet and get v2.
   - `media_transcode_claim`: join `media_core.media_assets`, order non-trashed `processing` first then
     `created_at`, and lock with `FOR UPDATE OF t SKIP LOCKED`.
   - `media_core.media_transcode_install`: record `COALESCE(job.recipe, 'cb-1080p30-v2')`.
2. `src/lib/media-transcode/ffmpeg.ts`: add `-preset veryfast`; extend `ffmpeg.check.mts`.
3. Deploy the route before the migration. A v2 file labelled v1 costs one extra re-encode; the reverse hides
   an old encode from a later campaign.

Acceptance:

- Preview, manual GET: real high-motion files, 360 s + 200 MB, and 4K60. Output passes validation, and
  full wall time and quality are recorded against recipe v1.
- develop, with cron: a `processing` Asset overtakes queued Main, and a trashed Asset does not.
- Dump `prosrc` after apply and compare with the migration file.
- Real-player playback of one v2 Rendition on Android and Windows before prod.

Prod apply is R0: stop with the exact statements first.

## Core PR 2 (Thunder_Core, from `develop`) — claim window

Starts after Phase 1 numbers exist, and uses them to set the window.

1. `sweep/route.ts`: move one job into a function that owns its `workDir` and `try/finally`, measure the
   window from the start of the handler, and report counts in the response.
2. Stop claiming after any failed job. If `media_transcode_fail` errors, return an error with partial counts.

Acceptance on develop, with cron:

- 20 clips of 30 s finish within 5 minutes.
- A forced first failure leaves the job `queued` with its second attempt for a later tick.
- Overlap with 80 s / 143 MB files: log instance id, `/tmp` use and RSS, with no ENOSPC, OOM or spent
  attempts.

If the target misses or overlap adds no throughput, follow the order in ADR 0071. Performance CPU is a cost
decision: ask first.

## FE PR (thunder_one_prj, from `dev`)

1. `upload-queue.ts`: `MAX_WORKERS = 4`; update the "two-worker" comments.
2. `upload-api.ts`, one timeout helper:
   - Bound the three browser reads to 15 s, resolving `undefined`, and clean up handlers, `src` and the URL.
   - Bound `fetchStorageAccessToken` and both `fetchUploadUrl` calls.
   - Abort a TUS transfer after 60 s without byte progress, counting from before the first request and
     resetting on `onProgress` and `onChunkComplete`, inside `uploadToStorage`. Keep the reservation.
   - Bound registration to 45 s.
   - Check `signal` between stages. A listener added after abort never fires. After `fetchUploadUrl`, a
     canceled row releases the new reservation at once.
3. `useUploadQueue.ts` and `UploadItem`:
   - A row canceled during preparation becomes `canceled` and frees its slot.
   - Record that the transfer finished and keep `thumbnail_storage_key`, so `Retry` registers only.
   - Hide `Retry` on a file Core refused.
   - Keep `media_asset_id` for the Media Detail link.
   - Store a message code, not a string, so a language switch updates old rows.
4. Playback Readiness: one mapping used by Upload Queue and Media Detail, TH and EN, by app locale. `status`
   decides first, so a re-register returning `ready` with `unsupported_profile` reads as ready.

| Case | TH | EN |
|---|---|---|
| `ready`, Baseline or Main | เผยแพร่ได้แล้ว ไม่ต้องทำอะไรเพิ่ม | Ready to publish. No action needed. |
| `processing` | กำลังแปลงไฟล์ เผยแพร่ได้เมื่อแปลงเสร็จ | Converting. You can publish when it finishes. |
| `failed`, `unsupported_profile` | ใช้ไฟล์นี้กับจอไม่ได้ กรุณา export เป็น MP4 (H.264 Baseline) แล้วอัปโหลดใหม่ | This file can't be used on screens. Export it as MP4 (H.264 Baseline) and upload again. |
| `failed`, `unreadable` | อ่านไฟล์นี้ไม่ได้ กรุณา export ใหม่แล้วอัปโหลดอีกครั้ง | We couldn't read this file. Export it again and re-upload. |
| Image, or video with no verdict | no line | no line |

5. `useAssetUpload.ts`: a stall message that does not offer `Retry`. Readiness in the wizard stays out of
   scope.
6. Fix the stale "no transcoding step" comment in `upload-limits.ts`.
7. `*.check.mts`: four slots, a stalled row frees its slot, every row of the table in both languages, and
   the existing checks that pin old wording.

Acceptance (browser, ask before running):

- 10 files: four run at once; a forced stall ends `Failed`, the rest continue, `Retry` resumes.
- A registration timeout followed by `Retry` ends `Completed`, with one Asset.
- Cancel during preparation stops the row, and no Asset appears.
- #335: Main, High and Failed rows read correctly in TH and EN; `Completed` is separate from readiness.

## Backfill (after Core PR 1)

Prod data change in stages. Each stage is R0: stop with the real list first, and start the next only after
the previous one is checked. A `processing` Asset installs its Rendition at once even while on air, so a
device re-downloads a re-encoded file; stages keep that to files already proven.

Preparation: re-probe the videos with no verdict on the day, because the set may have grown. As of
2026-11-04 it is 20 Baseline, 68 Main (4 over 200 MB), 18 High and 1 HEVC, and 12 High are in active Programs.

1. Write the verdict for every listed video. Nothing a device plays changes.
2. Enqueue the 7 High/HEVC files not on air and set them `processing`. All must end with a valid Rendition.
3. Play one of those Renditions on a real device.
4. Convert the 12 on-air High files, starting with `44e04e67`, which already stalls, and ending with
   `1c23959a`, which plays cleanly. Watch `playback_logs` before continuing past the first.
5. Enqueue the 64 Main files under 200 MB. They stay `ready` and install off air only.

Before stage 1, confirm in Aurora-migrate's code that it omits `p_probe_verdict`, and make it pass one before
the next customer moves.

Rollback: clearing `rendition_storage_key` and `rendition_checksum` returns an Asset to its original, and
verdict and status can be restored. Originals are never touched.

Acceptance: re-run the verdict query, no live video lacks one, and each enqueued job ends with a Rendition.

## Progress PR (Core + FE, after Core PR 2)

1. Core: `media_transcode_jobs.progress_pct`; `run()` parses `-progress pipe:1`, throttled to one write per
   5 s through a service-role RPC. A write error is logged and ignored.
2. Core: one tenant-scoped read for many Asset ids returning state, queue position and percentage.
3. FE: poll every 5 s only while a row is `processing`, in Upload Queue and Media Detail. Replace "refresh to
   see status". Stop on `ready`, `failed` or when no rows remain.

Acceptance: a batch shows positions falling, then a rising bar, and polling stops. Count requests per
minute against `plan-request-count.md`.

## Out of scope

Translating the rest of the Upload page, a duration check before upload, the WebP mismatch between Core and
the bucket, and re-encoding existing Renditions.
