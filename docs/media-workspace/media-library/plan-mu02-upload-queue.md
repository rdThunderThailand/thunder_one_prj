# MU-02 — Staged 10-file, two-worker Upload Queue

**Ticket:** [#26](https://github.com/rdThunderThailand/thunder_one_prj/issues/26) · **Decision:** `docs/adr/0059-staged-resumable-media-upload.md` · **Parent plan:** `plan-media-upload.md` Phase 2 steps 1–10

Builds on MU-01, which already ships tenant-scoped TUS upload, Storage-side MIME/size enforcement and idempotent registration. MU-02 adds the queue around it. Nothing about the transport changes.

## Files

| File | Kind | Why |
|---|---|---|
| `src/features/media-workspace/assets/upload/upload-queue.ts` | new, pure | State machine, staging rules, scheduler slot math, summary. No React, no DOM — so the check can run it under `node`. |
| `src/features/media-workspace/assets/upload/upload-queue.check.mts` | new | The one `node:assert` check (§Verification). |
| `src/features/media-workspace/assets/upload/useUploadQueue.ts` | new, `"use client"` | Wires the pure module to the transport: owns `File` objects, drives workers, holds abort handles. |
| `src/features/media-workspace/assets/upload/UploadQueuePage.tsx` | new, `"use client"` | Plain functional page. **Figma styling is MU-04** — do not chase the mockup here. |
| `src/app/(dashboard)/(application)/media-workspace/assets/upload/page.tsx` | new | Route shell, same shape as `playlists/create/page.tsx`. |
| `.../publications/services/upload-api.ts` | edit | Extract the per-file pipeline; add abort support (§Transport changes). |
| `.../assets/useAssetUpload.ts` | edit | Call the extracted pipeline. **Public shape unchanged** — its 3 callers stay untouched. |
| `.../assets/media-library-page.tsx` | edit | `Upload` button navigates to the new page instead of opening a file picker; drop the now-unused hook wiring. |

## Transport changes (`upload-api.ts`)

Two edits, both additive:

1. **Extract `uploadAndRegisterAsset(file, { folderId, signal, onProgress })`** — the pipeline currently inlined in `useAssetUpload`: read duration/dimensions → capture thumbnail → `fetchUploadUrl` → `uploadToStorage` → thumbnail upload → `registerVideo`. Returns `RegisteredVideo`. `useAssetUpload` and the queue hook both call it, so there is exactly one copy of the pipeline.

2. **`uploadToStorage` takes an optional `signal?: AbortSignal`.** On abort, call `upload.abort()` and reject with a distinguishable sentinel (an `Error` whose `name` is `"AbortError"`) so the hook can mark `canceled` rather than `failed`. `useAssetUpload` passes nothing and behaves exactly as today.

## The pure module (`upload-queue.ts`)

Type the queue's file as a structural subset, not `File`:

```ts
type QueuedFile = { name: string; type: string; size: number };
export type UploadItemState = "staged" | "waiting" | "uploading" | "completed" | "failed" | "canceled";
export type UploadItem = { id: string; file: QueuedFile; state: UploadItemState; pct: number; error?: string };
```

A real `File` satisfies `QueuedFile`, so the hook stores real Files while the check constructs plain objects — no `File` polyfill in node.

Exports:

- `MAX_QUEUE_FILES = 10`, `MAX_WORKERS = 2`
- `stageFiles(items, incoming): { items, rejections: string[] }` — rejects, in this order, per file: `rejectUploadReason` (reuse `publications/upload-limits.ts`, already covers type/size/empty), duplicate against the existing queue by `name + size`, and overflow past `MAX_QUEUE_FILES`. Rejections are user-facing Thai strings like the existing ones. Accepted files enter as `staged`.
- `aggregateAction(items): "clear-queue" | "cancel-all" | "clear-all" | null` — `cancel-all` when any row is `waiting`/`uploading`; else `clear-queue` when any row is `staged`; else `clear-all` when every row is terminal and the queue is non-empty; else `null`. Active work wins over staged rows, so a half-started queue never offers a destructive-looking `Clear`.
- `nextToStart(items, maxWorkers): string[]` — ids of the first `maxWorkers − activeCount` `waiting` items in queue order. This is the whole scheduler; a failed or canceled item releases its slot simply by no longer counting as active.
- `summarize(items)` — every count derived from `items` here, never stored separately (AC: rows and summary can never disagree).

## The hook (`useUploadQueue.ts`)

- `Start Upload` flips every `staged` row to `waiting`; nothing before that touches the network.
- Slots are filled by an effect that reconciles against `nextToStart(items, MAX_WORKERS)` after every state change — one rule instead of duplicated "start the next one" logic at each completion path.
- **ESLint trap:** no synchronous `setState` in an effect body. Mark the id in a `useRef<Set<string>>` guard synchronously (a ref mutation is not `setState`), then run `uploadAndRegisterAsset(...).then(...)` and set state inside the promise callbacks. Without the ref guard the effect re-fires before `uploading` lands and starts the same file twice.
- One `AbortController` per active item, kept in a ref map. `Cancel` / `Cancel All` abort them; `AbortError` → `canceled`, anything else → `failed` with the error message.
- `Retry` restarts a `failed`/`canceled` row from `waiting` with fresh authorization. **TUS resume is MU-03** — do not attempt `findPreviousUploads` bookkeeping here.
- One `folder_id` for the whole batch, passed to every registration. Folders come from `fetchContentFolders("asset")`, same as `media-library-page.tsx`.
- `beforeunload` confirmation while any row is `waiting` or `uploading`. No queue restore after refresh (ADR-0059).
- Failure is per-file: one rejected promise must not stop the other worker.

## Page (`UploadQueuePage.tsx`)

Drop zone + file picker (`UPLOAD_ACCEPT_ATTR`), Folder select, `Start Upload`, the single aggregate button whose label comes from `aggregateAction`, the row list with per-row action from the state table in `plan-media-upload.md`, and a summary from `summarize`. Reuse `Button`, `Card`, `MediaThumb`.

Per the control matrix: `Add from Source` and Tags render **disabled** with `Coming in Phase 2`; `Pause All` and Storage Usage are **not rendered at all**. Recent Uploads is MU-04.

## Out of scope

Server-side orphan cleanup and the abandoned-upload sweep (MU-03/#27) · TUS resume after interruption (MU-03) · Figma-faithful styling and Recent Uploads (MU-04/#28) · Tags (MU-05/#29) · any change to `useAssetUpload`'s signature.

## Verification

- One `upload-queue.check.mts`, run as `node src/features/media-workspace/assets/upload/upload-queue.check.mts` — no test runner, `node:assert` only. Cover: staging rejects unsupported/oversized/duplicate/11th file; `aggregateAction` for each state mix incl. the active-beats-staged case; `nextToStart` returns 2 with an empty queue, 1 when one is uploading, 0 when two are, and refills after a failure; `summarize` totals equal row counts.
- `npx tsc --noEmit` and lint on the changed files. If a route was moved, `rm -rf .next/dev/types` first or `tsc` reports a false clean.
- Browser verification is the layer the operator actually uses, and per the standing rule **ask first, every time** — offer: drive it myself / hand over a checklist / skip and mark unverified. Points to cover: staging 3 files without network traffic, Folder applied to all, exactly two rows active at once, one failure not stopping the rest, Retry, navigation warning, `Clear All` leaving Assets intact.
- No `git push`, no PR — the PR opens once #26–#29 are all done, and as Draft if verification is incomplete.
