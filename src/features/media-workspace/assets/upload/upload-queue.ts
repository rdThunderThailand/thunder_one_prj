import { rejectUploadReason } from "../../publications/upload-limits.ts";
import type { RegistrationDraft, UploadTarget } from "../../publications/services/upload-api.ts";
import type { ProbeVerdict } from "@/types/domain";
import { playbackReadiness, type PlaybackReadiness } from "./playback-readiness.ts";

/** Structural subset of `File` — lets the pure queue logic run under `node` in the
 *  `.check.mts` without a File polyfill; a real File satisfies this. */
export type QueuedFile = { name: string; type: string; size: number };

export type UploadItemState = "staged" | "waiting" | "uploading" | "completed" | "failed" | "canceled";

export type UploadItem = {
  id: string;
  file: QueuedFile;
  title: string;
  state: UploadItemState;
  pct: number;
  error?: string;
  /** What Core said about playback when it registered the file (ADR 0059 amendment 2026-11-04).
   *  A code, rendered in the app's language. On a `failed` item it is a refusal, which `Retry`
   *  cannot change. */
  readiness?: PlaybackReadiness;
  /** The Asset this row became, once registration returned. */
  assetId?: string;
  /** Set once the bytes are in Storage: a `Retry` then only registers again (idempotent in Core)
   *  instead of uploading the file a second time. */
  registration?: RegistrationDraft;
  /** Authorization from this file's first attempt. A retry reuses it to resume from the prior
   *  offset; dropping it means re-authorizing and restarting from zero (ADR-0059). */
  target?: UploadTarget;
  /** Set once this file's reservation can no longer be resumed — Storage reported it gone, or
   *  the operator cancelled and Core released it. The stored `target` is then dead weight: the
   *  file has to be re-authorized rather than resumed. */
  isReservationDead?: boolean;
  /** Immutable selection captured when this row starts. Retries reuse the same IDs. */
  tagIds?: string[];
};

/** ADR 0059 amendment 2026-11-04: four, up from two. Ten stays rejected — see the ADR. */
export const MAX_WORKERS = 4;

const ACTIVE_STATES: UploadItemState[] = ["waiting", "uploading"];

/** Starts every staged row with one deduplicated Tag selection snapshot. */
export function startItems(items: UploadItem[], tagIds: string[]): UploadItem[] {
  const snapshot = [...new Set(tagIds)];
  return items.map((item) =>
    item.state === "staged" ? { ...item, state: "waiting", tagIds: snapshot } : item
  );
}

/** Stages `incoming` onto `items`, rejecting per-file for size/type (ADR-0059 limits,
 *  shared with the single-file picker) and duplicates already in the queue.
 *  Order of `items` is preserved; accepted files append as `staged`. */
export function stageFiles(
  items: UploadItem[],
  incoming: { id: string; file: QueuedFile }[]
): { items: UploadItem[]; rejections: string[] } {
  const next = [...items];
  const rejections: string[] = [];

  for (const { id, file } of incoming) {
    const limitReason = rejectUploadReason(file);
    if (limitReason) {
      rejections.push(`${file.name}: ${limitReason}`);
      continue;
    }
    const isDuplicate = next.some((item) => item.file.name === file.name && item.file.size === file.size);
    if (isDuplicate) {
      rejections.push(`${file.name}: ไฟล์นี้อยู่ในคิวแล้ว`);
      continue;
    }
    next.push({ id, file, title: file.name, state: "staged", pct: 0 });
  }

  return { items: next, rejections };
}

/** Which aggregate control the toolbar shows, or null when the queue is empty.
 *  Active work always wins over staged rows — a half-started queue never offers
 *  a `Clear Queue` that reads as if nothing is happening. */
export function aggregateAction(items: UploadItem[]): "clear-queue" | "cancel-all" | "clear-all" | null {
  if (items.length === 0) return null;
  if (items.some((item) => ACTIVE_STATES.includes(item.state))) return "cancel-all";
  if (items.some((item) => item.state === "staged")) return "clear-queue";
  return "clear-all";
}

/** Ids of `waiting` items that should start now, given how many are already active.
 *  The entire scheduler (`MAX_WORKERS` at a time): a failed/canceled item stops counting as active
 *  and its slot opens up on the next call, no separate release step needed. */
export function nextToStart(items: UploadItem[], maxWorkers: number = MAX_WORKERS): string[] {
  const activeCount = items.filter((item) => item.state === "uploading").length;
  const freeSlots = Math.max(0, maxWorkers - activeCount);
  return items
    .filter((item) => item.state === "waiting")
    .slice(0, freeSlots)
    .map((item) => item.id);
}

/** What a retry of `item` should do with the failed attempt's authorization: resume against it,
 *  or drop it and re-authorize. A reservation that is being dropped comes back as `release` so
 *  the caller can cancel it server-side instead of leaving it for the sweep. A finished transfer
 *  (`registration`) is only worth keeping while its reservation is — a restart uploads again. */
export function retryPlan(item: UploadItem): {
  shouldResume: boolean;
  release?: UploadTarget;
  registration?: RegistrationDraft;
} {
  if (item.target && !item.isReservationDead) return { shouldResume: true, registration: item.registration };
  return { shouldResume: false, release: item.target };
}

/** The reservation a cancel or dismissal should release. One rule holds everywhere: a `target`
 *  is the reservation this row still owns, so releasing it also means dropping it. Nothing to
 *  release once the file has registered — that row belongs to an Asset now, and Core refuses to
 *  cancel it anyway. A file whose Storage session expired still owns its `files` row, so it is
 *  released like any other. */
export function reservationToRelease(item: UploadItem): UploadTarget | undefined {
  if (item.state === "completed") return undefined;
  return item.target;
}

export type UploadOutcome =
  | { state: "failed"; readiness: PlaybackReadiness }
  | { state: "completed"; readiness: PlaybackReadiness | null };

/** ADR 0071: what a resolved register call means for a queue row. A resolved call is not
 *  automatically success — the backend already judged the file on intake:
 *  - `failed` is a refusal, with the reason the verdict gives.
 *  - `processing` means a High/HEVC upload was accepted and is converting; it completed the
 *    upload but cannot be published yet.
 *  - anything else (`ready`) completed. `Completed` is only the upload; readiness is separate.
 *  Upload Queue does not poll; later changes show on Media Detail. */
export function uploadOutcome(status: string, verdict: ProbeVerdict | null | undefined): UploadOutcome {
  const readiness = playbackReadiness({ status, probe_verdict: verdict });
  if (status === "failed") return { state: "failed", readiness: readiness ?? "refused" };
  return { state: "completed", readiness };
}

export function summarize(items: UploadItem[]) {
  const byState = (state: UploadItemState) => items.filter((item) => item.state === state).length;
  return {
    total: items.length,
    totalBytes: items.reduce((sum, item) => sum + item.file.size, 0),
    staged: byState("staged"),
    waiting: byState("waiting"),
    uploading: byState("uploading"),
    completed: byState("completed"),
    failed: byState("failed"),
    canceled: byState("canceled"),
  };
}
