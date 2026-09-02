import { rejectUploadReason } from "../../publications/upload-limits.ts";

/** Structural subset of `File` — lets the pure queue logic run under `node` in the
 *  `.check.mts` without a File polyfill; a real File satisfies this. */
export type QueuedFile = { name: string; type: string; size: number };

export type UploadItemState = "staged" | "waiting" | "uploading" | "completed" | "failed" | "canceled";

export type UploadItem = {
  id: string;
  file: QueuedFile;
  state: UploadItemState;
  pct: number;
  error?: string;
};

export const MAX_QUEUE_FILES = 10;
export const MAX_WORKERS = 2;

const ACTIVE_STATES: UploadItemState[] = ["waiting", "uploading"];

/** Stages `incoming` onto `items`, rejecting per-file for size/type (ADR-0059 limits,
 *  shared with the single-file picker), duplicates already in the queue, and overflow
 *  past `MAX_QUEUE_FILES`. Order of `items` is preserved; accepted files append as `staged`. */
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
    if (next.length >= MAX_QUEUE_FILES) {
      rejections.push(`${file.name}: คิวเต็มแล้ว (สูงสุด ${MAX_QUEUE_FILES} ไฟล์)`);
      continue;
    }
    next.push({ id, file, state: "staged", pct: 0 });
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
 *  The entire two-worker scheduler: a failed/canceled item stops counting as active
 *  and its slot opens up on the next call, no separate release step needed. */
export function nextToStart(items: UploadItem[], maxWorkers: number = MAX_WORKERS): string[] {
  const activeCount = items.filter((item) => item.state === "uploading").length;
  const freeSlots = Math.max(0, maxWorkers - activeCount);
  return items
    .filter((item) => item.state === "waiting")
    .slice(0, freeSlots)
    .map((item) => item.id);
}

export function summarize(items: UploadItem[]) {
  const byState = (state: UploadItemState) => items.filter((item) => item.state === state).length;
  return {
    total: items.length,
    staged: byState("staged"),
    waiting: byState("waiting"),
    uploading: byState("uploading"),
    completed: byState("completed"),
    failed: byState("failed"),
    canceled: byState("canceled"),
  };
}
