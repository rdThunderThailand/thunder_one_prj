# MU-03 — Cancel, retry and recover uploads without orphaned files

**Ticket:** [#27](https://github.com/rdThunderThailand/thunder_one_prj/issues/27) · **Decision:** [ADR-0059](../adr/0059-staged-resumable-media-upload.md) · **Builds on:** [`plan-mu02-upload-queue.md`](plan-mu02-upload-queue.md)

## What MU-02 already satisfies

AC 1 (cancel releases its worker slot), AC 2 (a failed file retries independently) and AC 4 (navigation confirmation) already work — `nextToStart` stops counting a terminal item, and `useUploadQueue` installs a `beforeunload` handler. This slice is AC 3, 5 and 6.

## What the database says (develop `ftfmokgphewzyxzwjitv`, 2026-09-02)

Two facts that decide the sweep's shape:

- All 50 `files` rows with `module_key='media'` are `status='uploading'`. `media_video_register()` never moves the status forward, so age-on-status alone would sweep the 32 registered Assets.
- 14 of those rows are **thumbnails**, referenced only by `media_assets.thumbnail_storage_key` — no `media_assets.file_id` points at them. A sweep keyed on "no Asset references this `file_id`" would delete live thumbnails.

Only 4 rows are genuinely abandoned reservations (oldest 2026-08-13).

## Decisions taken for this slice

| Fork | Chosen | Why |
|---|---|---|
| Abandoned-reservation criterion | `status` **and** a reference guard | Registration starts maintaining `status`; the sweep still refuses to touch any row referenced as `file_id` or `thumbnail_storage_key`, so a status bug cannot delete live data |
| Sweep mechanism | Vercel Cron → a `CRON_SECRET`-protected Core route | Deletes through the Storage API, so the S3 object really goes; `pg_cron` can only remove `storage.objects` rows and would leave the blob |
| Cancel semantics | Delete the object, then `status='canceled'`, `is_deleted=true` | Matches the soft-delete convention already in this schema and keeps an audit trail |
| Retry semantics | Reuse the stored `UploadTarget`; fall back to fresh authorization | Resuming and re-authorizing have to be one decision — see below |

### Why the retry had to become a single decision

tus fingerprints a file as `tus-br-{name}-{type}-{size}-{lastModified}-{endpoint}`. `objectName` is **not** part of it and the endpoint is constant, so a stored upload URL matches the same file on every later attempt regardless of which reservation the attempt holds.

MU-02's retry therefore did something worse than restarting: it re-authorized (new `file_id`, new `storage_key`), then `findPreviousUploads()` matched the *previous* attempt's entry and resumed writing bytes into the **old** object, while registration recorded the **new** key — an Asset pointing at an empty object.

So `uploadToStorage` no longer decides for itself. It resumes only when the caller passes back the same `target`, and starts clean otherwise; a clean start overwrites the stale fingerprint entry on creation. Resume and re-authorize are now mutually exclusive by construction.

## Backend (`Thunder_Core`, branch `feat/upload-media-page`)

1. **Migration — registration closes its reservation.** `CREATE OR REPLACE FUNCTION public.media_video_register(...)` (identical signature, so grants survive) sets `files.status='ready'` for the registered `file_id`, and for the thumbnail row matched by `(tenant_id, storage_key = p_thumbnail_storage_key)`. Backfill the existing linked rows in the same migration.
2. **`POST /media/uploads/cancel`** — `{ file_id }`, `requireMediaTenant`. `media_cancel_upload_reservation` validates tenant ownership, refuses a `file_id` that any Asset already references, and marks the row canceled in one statement; the route then removes the Storage object. Marking first is what keeps the tenant check atomic, and a removal that fails is picked up later because the sweep also collects `canceled` rows.
3. **`GET /media/uploads/sweep`** — `CRON_SECRET` bearer, no tenant. GET because that is how Vercel Cron invokes its target. Selects `module_key='media' AND status IN ('uploading','canceled') AND uploaded_at < now() - 24h` **and** not referenced as `file_id` or `thumbnail_storage_key`, removes the objects, and only then marks the rows `abandoned`, so a failed removal is retried next run rather than recorded as done. Returns the count.
4. **`vercel.json`** gains a daily `crons` entry for the sweep path. `CRON_SECRET` must be set in the Vercel project as well as in `.env`, or the route answers 401 forever.
5. No `schema.ts`/`schema.check.mts` beside these routes, unlike `upload-url`: `cancel` takes one UUID that `requireUuid` already validates and `sweep` takes no body at all, so a zod module would have nothing to hold and its check nothing to assert.

## Frontend (`thunder_one_prj`, branch `feat/media-upload-page`)

6. `upload-api.ts`: `uploadAndRegisterAsset` accepts an optional prior `UploadTarget` and reports the one it used through `onTarget`; a TUS 404/410 on resume surfaces as a distinguishable expired-reservation error. Add `cancelUploadReservation(file_id)`.
7. `upload-queue.ts`: `UploadItem` carries the `target` and a `retryable` distinction; the pure transitions stay in this file and gain cases in `upload-queue.check.mts`.
8. `useUploadQueue.ts`: `retryItem` reuses the stored target; on an expired reservation it cancels the stale one and restarts only that file. `cancelItem` and `Cancel All` call `cancelUploadReservation` for any item that reserved but never registered.

## Verification

- `node upload-queue.check.mts` for the new transitions; the Core `schema.check.mts` for the new payloads.
- SQL: confirm the backfill leaves the 4 real orphans as the only `uploading` rows, and that a dry-run sweep selects exactly those 4 — **shown for approval before any delete runs** (R0).
- HTTP: cancel with a cross-tenant `file_id` (expect refusal), cancel an unregistered reservation (expect the object gone), sweep without the secret (expect refusal).
- Browser: interrupt an upload mid-chunk and retry, then expire the reservation and retry again. Asked for, per the standing rule, before it runs.
