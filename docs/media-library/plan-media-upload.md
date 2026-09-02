# Media Upload implementation plan

**Status:** Ready for implementation after backend contract review  
**Decision:** `docs/adr/0059-staged-resumable-media-upload.md`

## Goal

Build `/media-workspace/assets/upload` as a staged, tenant-scoped queue for up to 10 MP4/image files, with two concurrent TUS uploads, one destination Folder, per-file recovery and an honest 5 GB per-file limit.

## Design reference

![Media Upload visual direction](../layouts/Figjam%20-%20Media%20Workspace%20(8).png)

The image above is the visual direction for hierarchy, density, queue-row composition and the right-hand support column. It is not an exact functional specification. ADR-0059 and this plan override labels, counts, formats, states and controls that the current product cannot truthfully support.

| Area in the reference | Implementation guidance |
|---|---|
| Header actions | Keep `Cancel` and one `Start Upload`; show `Add from Source` disabled for Phase 2 and remove the unused dropdown arrow. |
| Drop zone | Preserve the visual emphasis; advertise only MP4, PNG, JPG/JPEG and WebP, 5 GB per file and 10 files per queue. |
| Upload destination | Keep one Folder selector for the whole queue; show Tags disabled for Phase 2. |
| Queue rows | Preserve thumbnail, facts, progress and status hierarchy; actions follow the explicit state table below. |
| Queue toolbar | Use `Clear Queue`, `Cancel All` or `Clear All` according to state. Do not show `Pause All`. |
| Upload Summary | Derive every count and total from queue items so the summary cannot disagree with the rows. |
| Upload Tips | Keep the card, but state only enforced formats, limit, count and recovery behavior. |
| Storage Usage | Hide until Core supplies and enforces tenant quota/usage contracts. |
| Recent Uploads | Keep the card with the tenant's three newest real Assets and a Media Library link. |
| Global shell | Reuse the current application shell, navigation and header; do not rebuild the mockup's surrounding shell. |

Intentional corrections to the reference are: staged files cannot already be uploading before `Start Upload`; the queue limit is 10 rather than 50; unsupported audio/document/video formats are omitted; and completed/waiting counts always match visible rows.

## Current baseline and gaps

- The existing flow is single-file: `POST /media/videos/upload-url` → signed PUT → `POST /media/videos`.
- `useAssetUpload` owns one percentage and one error; it has no queue, abort controller or resumable state.
- Core currently creates `videos/{uuid}.{ext}` before upload and records a `files.status = 'uploading'` row.
- Frontend `registerVideo()` is typed as `MediaAsset`, while Core returns `{ media_asset_id, status }`.
- Folder placement already reaches registration through `folder_id`.
- Tags can be listed but Asset Tag assignment is not a supported upload contract.
- Storage Usage/quota and Add from Source do not have complete contracts.
- The checked-in local Supabase global limit is 50 MiB; production global and `media` bucket limits must be confirmed and raised before claiming 5 GB.

## Phase 1 — Core and Storage prerequisites

1. Extend upload authorization to return the values required by a TUS client: `file_id`, `storage_key`, direct Storage endpoint, signed upload token, expiry and enforced `max_file_size_bytes`.
2. Resolve the authenticated tenant's immutable `tenant_code` server-side and generate new keys as `videos/{tenant_code}/{uuid}.{ext}`. Never accept a tenant prefix from the client.
3. Validate filename, supported MIME, extension agreement and `1..5 GB` size before reserving a file. Configure the production global limit and `media` bucket limit to the same or stricter policy.
4. Preserve tenant checks on every reservation, cancel and registration path. Treat the path as organization only, never authorization.
5. Add cancellation for an unregistered `file_id`: abort/remove the Storage object when present and remove or terminally mark the reservation.
6. Add an abandoned-upload sweep keyed by reservation status/age. It must not delete registered files.
7. Make `POST /media/videos` registration idempotent for one `file_id` and return `{ media_asset_id, status }` consistently.
8. Keep existing `videos/{uuid}.{ext}` objects and their `files.storage_key` values unchanged.

## Phase 2 — Upload page

Steps 1-10 below are delivered by MU-02 and MU-04. The implementation slice for MU-02 is planned in [`plan-mu02-upload-queue.md`](plan-mu02-upload-queue.md).

1. Add `/media-workspace/assets/upload` and route the Media Library upload action to it.
2. Reuse existing Button, Card, MediaThumb, Folder and API transport patterns. Do not add a queue framework.
3. Model each queue item with one explicit state:

| State | Primary action | Aggregate behavior |
|---|---|---|
| `staged` | Remove | `Clear Queue` |
| `waiting` | Cancel | `Cancel All` |
| `uploading` | Cancel | `Cancel All` |
| `completed` | Dismiss | `Clear All` when all rows are terminal |
| `failed` | Retry or dismiss | `Clear All` when all rows are terminal |
| `canceled` | Retry or dismiss | `Clear All` when all rows are terminal |

4. Reject duplicate selections within the queue, unsupported types, files over 5 GB and additions beyond 10 before authorization.
5. Use a two-worker scheduler. A failed/canceled item releases its slot and does not stop the other worker.
6. Read image/video dimensions, video duration and thumbnail using the existing helpers; register only after the original upload and required thumbnail work complete.
7. Apply one selected `folder_id` to every registration in the batch.
8. Confirm navigation while any row is `waiting` or `uploading`. Do not promise queue restoration after refresh.
9. Refetch the tenant's newest three Assets after a completion and render them in Recent Uploads. Link each item to Media Detail.
10. Show an upload summary derived from queue state; never maintain separate counters that can disagree with rows.

## Control matrix

| Control/section | Phase 1 behavior |
|---|---|
| Drag & Drop / Choose Files | Enabled |
| Folder | Enabled; one value per queue |
| Start Upload | Enabled when queue and Folder are valid; no dropdown |
| Clear Queue / Cancel All / Clear All | Label and behavior follow queue state |
| Recent Uploads | Enabled; latest three tenant Assets |
| Upload Tips | Visible; only enforced formats, count and size |
| Add from Source | Disabled with `Coming in Phase 2` |
| Tags | Disabled with `Coming in Phase 2` |
| Pause All | Hidden |
| Storage Usage | Hidden |

## Phase 3 — deferred capabilities

- Define tenant-scoped Asset Tag assignment, then enable Tags.
- Define external-source providers, credentials, copy/reference semantics and failure cleanup, then enable Add from Source.
- Consider explicit Pause/Resume controls only after automatic TUS recovery is proven understandable.
- Add Storage Usage only after quota totals and per-kind usage are server-computed and quota is enforced.
- Add audio/documents only with registration, preview, player and publication compatibility contracts.

## Delivery tickets and status

GitHub Issues are the status source of truth. `Open — ready` means the ticket has no open blocker; `Open — blocked` means implementation has not started and GitHub's native dependency is still open. Reusable baseline code does not make a delivery slice complete.

| Local ID | Delivery slice | Phase | Status | Blocked by | GitHub issue |
|---|---|---|---|---|---|
| MU-01 | Upload one tenant-scoped 5 GB Asset through TUS | 1 | Closed | None | [#25](https://github.com/rdThunderThailand/thunder_one_prj/issues/25) |
| MU-02 | Stage and process a 10-file, two-worker Upload Queue | 1 | Closed | None | [#26](https://github.com/rdThunderThailand/thunder_one_prj/issues/26) |
| MU-03 | Cancel, retry and recover uploads without orphaned files | 1 | Open — ready | None (MU-02 done) | [#27](https://github.com/rdThunderThailand/thunder_one_prj/issues/27) |
| MU-04 | Complete the Figma-guided page and Recent Uploads | 1 | Open — ready | None (MU-02 done) | [#28](https://github.com/rdThunderThailand/thunder_one_prj/issues/28) |
| MU-05 | Assign Tags while uploading Assets | 2 | Open — blocked | MU-04 / #28 | [#29](https://github.com/rdThunderThailand/thunder_one_prj/issues/29) |

`Add from Source`, Storage Usage, explicit Pause/Resume controls and new media kinds remain **Deferred — not ticketed** because their provider/quota/player contracts are not yet specific enough for an agent-ready ticket.

## Acceptance criteria

- Selecting 1–10 valid files stages them without network upload; `Start Upload` begins at most two at once.
- The selected Folder is applied to every successfully registered Asset.
- Every new Storage key begins `videos/{authenticated tenant_code}/`; a caller cannot choose another prefix.
- A file larger than 5 GB or of an unsupported type is rejected by both client and Core.
- Interrupting a TUS upload can resume without re-sending completed chunks while authorization remains valid.
- One failed file does not stop other waiting files.
- `Clear All` after terminal completion removes queue rows without deleting registered Assets.
- Canceling before registration leaves no permanent Asset and is eventually cleaned even if the browser closes.
- Registration retry for the same `file_id` does not create a duplicate Asset.
- Recent Uploads contains real tenant data and updates after successful registration.
- Disabled/hidden controls match the control matrix; the page advertises no unsupported format or quota.
- Existing Storage objects and playback/preview URLs continue to resolve through their stored keys.

## Verification

- Add one focused `node:assert` check for queue transitions, aggregate labels and two-worker scheduling.
- Add Core contract checks for tenant-derived key generation, cross-tenant rejection, MIME/size boundaries, cancel cleanup and idempotent registration.
- Test TUS interruption/resume with a non-production tenant and a file large enough to span multiple chunks.
- Run Next type generation, TypeScript, targeted lint, Core tests and `git diff --check`.
- Browser verification must cover staging, Folder assignment, two active rows, failure continuation, retry, navigation warning, Clear All and Recent Uploads.
- Production Storage-limit changes, object cleanup and upload tests are R0 actions requiring exact tenant/project preflight and explicit approval immediately before execution.
