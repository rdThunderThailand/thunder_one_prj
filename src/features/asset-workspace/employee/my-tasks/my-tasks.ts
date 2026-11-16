// My Tasks (EMP-03): pure helpers, so the .check.mts runs with node.
import type { SessionStatus } from "../../domain/report.ts";

export const myTaskHref = (id: string) => `/asset-workspace/my-tasks/${encodeURIComponent(id)}`;

/** Status filter on the list; Draft and Cancelled never carry a task to verify. */
export const MY_TASK_STATUSES = ["In Progress", "Completed", "Closed"] as const;

export const TASK_CLOSED = "This task is closed; results can no longer change.";
export const RESULT_STALE = "This result changed since the page loaded. The list is reloaded; check it and try again.";

/** Only an In Progress session takes results (frozen inventory rules). */
export const taskOpen = (status: SessionStatus) => status === "In Progress";

/** A failed write → what the employee reads, and whether the page must reload. */
export function writeFailure(code: string, message: string): { message: string; reload: boolean } {
  if (code === "INVALID_STATE") return { message: TASK_CLOSED, reload: true };
  if (code === "STALE") return { message: RESULT_STALE, reload: true };
  if (code === "NOT_FOUND") return { message: "This task is no longer assigned to you.", reload: true };
  return { message, reload: false };
}
