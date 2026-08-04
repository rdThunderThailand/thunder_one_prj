/**
 * The API layer used to collapse every failure into `new Error(string)`, which
 * left the UI unable to tell "retry this" from "fix your input" from "this
 * already succeeded". `ApiError` keeps the status code so it can.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type ApiErrorKind =
  /** The draft changed underneath us — reloading is the only way forward. */
  | "conflict"
  /** The publication is already live; a retried publish is a success, not a failure. */
  | "already-active"
  /** Bad input or a rejected command — retrying the same request won't help. */
  | "rejected"
  /** Server-side or transport failure — the same request may well succeed. */
  | "retryable";

export interface ClassifiedError {
  kind: ApiErrorKind;
  /** Ready to show to the user, with the next action spelled out. */
  message: string;
}

/**
 * `media_publication_activate` raises this when the publication has left `draft`.
 * A retry after a timed-out publish hits it, which means the first attempt won.
 */
function isAlreadyActive(message: string): boolean {
  return message.toLowerCase().includes("already active");
}

export function classifyApiError(err: unknown, fallback: string): ClassifiedError {
  const message = err instanceof Error && err.message ? err.message : fallback;

  if (isAlreadyActive(message)) {
    return { kind: "already-active", message };
  }

  // Without a status we can't tell a rejection from an outage, and guessing
  // "retryable" on a rejected command invites the user to hammer a dead request.
  if (!(err instanceof ApiError)) {
    return { kind: "retryable", message };
  }

  if (err.status === 409) {
    return {
      kind: "conflict",
      message: "ข้อมูลถูกแก้ไขจากที่อื่นระหว่างที่คุณทำงานอยู่ กรุณาโหลดหน้านี้ใหม่ก่อนบันทึกอีกครั้ง",
    };
  }

  if (err.status >= 400 && err.status < 500) {
    return { kind: "rejected", message };
  }

  return { kind: "retryable", message };
}
