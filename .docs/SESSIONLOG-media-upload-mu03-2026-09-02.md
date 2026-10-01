# SESSIONLOG — MU-03 cancel, retry and recover (#27) · 2026-09-02

**Repos:** `thunder_one_prj` `feat/media-upload-page`, `Thunder_Core` `feat/upload-media-page`
**Decision:** ADR-0059 · **Plan:** `docs/media-library/plan-mu03-cancel-retry-recover.md`

## Design forks decided this session

All four were put to the user with a recommendation; all four recommendations were taken.

1. **Abandoned-reservation criterion** — status *and* a reference guard, not either alone.
2. **Sweep mechanism** — Vercel Cron hitting a `CRON_SECRET`-protected Core route, not `pg_cron`.
3. **Cancel semantics** — release the object, soft-mark the row `canceled`.
4. **Retry semantics** — resume against the stored authorization, restart only when it is gone.

No ADR amendment was needed: ADR-0059 already says reservations must be cleaned and a scheduled sweep must exist.

## Discoveries that changed the design

### `files.status` was inert, and thumbnails hide from the obvious guard

All 50 media `files` rows were `status='uploading'`, including the 32 registered Assets — `media_video_register()` never moved the status forward. Age-on-status alone would have swept every registered file.

The other trap is the reverse: 14 of those rows are **thumbnails**, and `media_assets` references a thumbnail only through `thumbnail_storage_key`, never `file_id`. A sweep keyed on "no Asset points at this `file_id`" would have deleted live thumbnails.

Hence the doubled guard: registration now closes its own reservations (and the thumbnail's, matched by `storage_key`), and every delete path still re-checks both reference shapes.

### The TUS fingerprint does not include `objectName` — MU-02's retry was writing to the wrong object

Found during code review, verified in `node_modules/tus-js-client/lib.esm/browser/fileSignature.js`:

```
['tus-br', file.name, file.type, file.size, file.lastModified, options.endpoint].join('-')
```

Neither `objectName` nor the reservation appears; the endpoint is constant. So MU-02's retry — which re-authorized and then unconditionally called `findPreviousUploads()` — matched the *previous* attempt's stored URL and resumed writing bytes into the **old** object, while registration recorded the **new** key. The visible symptom would have been an Asset pointing at an empty or partial object, not a failure.

`uploadToStorage` no longer decides on its own: it resumes only when the caller hands back the same `target`, and starts clean otherwise (a clean start overwrites the stale fingerprint entry when it creates its own).

### One rule for reservation ownership

Earlier drafts had `retryPlan` and `reservationToRelease` disagreeing about whether a dead reservation should be released. Settled on: **a `target` on the row is the reservation the row still owns.** Cancelling releases it *and drops it*, so nothing is cancelled twice; an expired Storage session keeps its `target` because the `files` row still exists and still needs releasing.

## What landed

**Thunder_Core**
- `20260902120000_media_register_closes_reservation.sql` — `media_close_upload_reservation()`, `media_video_register` calls it on both the insert and the idempotent-replay path, plus a backfill.
- `20260902130000_media_upload_cancel_and_sweep.sql` — `media_cancel_upload_reservation()`, `media_list_abandoned_uploads()`, `media_mark_uploads_abandoned()`. All four new functions `REVOKE ALL … FROM PUBLIC` + `GRANT … TO service_role`.
- `POST /api/core/v1/media/uploads/cancel`, `GET /api/core/v1/media/uploads/sweep`, `vercel.json` cron entry.

**thunder_one_prj**
- `upload-api.ts` — `cancelUploadReservation()`, `EXPIRED_UPLOAD_ERROR`, `uploadToStorage(..., shouldResume)`, `uploadAndRegisterAsset({ target, onTarget })`.
- `upload-queue.ts` — `UploadItem.target` / `.isReservationDead`, `retryPlan()`, `reservationToRelease()`.
- `useUploadQueue.ts` — retry resumes or re-authorizes; cancel, dismiss and `Cancel All` / `Clear All` release reservations. `Cancel All` now delegates per row to `cancelItem` instead of duplicating its logic.

`UploadQueuePage.tsx` needed no change — it already renders the error and all three per-row actions.

## Verification

| Layer | Result |
|---|---|
| `upload-queue.check.mts` | passes, incl. the new `retryPlan` / `reservationToRelease` cases |
| frontend `tsc` | 0 errors (after `rm -rf .next/dev/types`) |
| frontend `eslint` | clean on changed files; the 2 remaining errors are pre-existing, in `compositions/` |
| Core `tsc` | no errors in the new files (repo-wide is never clean) |
| SQL, cancel guards | registered file, thumbnail and cross-tenant all refused; own open reservation cancels; `mark_uploads_abandoned` on registered files touches 0 rows — whole block rolled back |
| SQL, sweep criterion | 24 h → 3 rows, 1 h → 4, limit honoured, none of the 46 registered rows selected |
| HTTP | sweep: no secret → 401, wrong secret → 401, right secret → `swept:3`, rerun → `swept:0`; cancel without an app key → 401 |
| Storage/DB after the live sweep | 3 blobs gone, 3 rows `abandoned`, 46 `ready` and 32 live Assets untouched, the under-24 h row correctly spared |
| **Browser (AC 3, AC 5)** | **not verified** — checklist handed to the user at `.docs/CHECKLIST-media-upload-mu03-2026-09-02.md` |

The backfill and the live sweep were R0: both were dry-run and shown for approval before execution.

## Open items

- **`CRON_SECRET` is set in `Thunder_Core/.env` only.** It must also be set in the Vercel project or the cron gets 401 forever. The cron entry itself only becomes live when `develop` deploys.
- **Browser verification outstanding.** Until the checklist comes back, AC 3 and AC 5 are unverified and the PR opens as Draft.
- **Not built, deliberately:** a confirmation step on cancel/dismiss. Cancelling an in-flight upload is the ADR's ordinary flow and destroys only an object that never became an Asset; a dialog would contradict the ADR-0059 control matrix and is outside #27's ACs. Raised with the user rather than added.
- **Known leak, sized and accepted:** the queue tracks only the original file's reservation, so a retry or a cancel between thumbnail upload and registration leaves one thumbnail object for the sweep. Marked with a `ponytail:` comment in `upload-api.ts`.
