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
  | "forbidden"
  /** The draft is gone or the id is wrong — retrying cannot help. */
  | "not-found"
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

/**
 * `media_publication_upsert` raises this exact prefix on a stale revision
 * (docs/adr/0003-draft-optimistic-locking.md). Matched on message, not on
 * HTTP 409 alone — 409 is a shared bucket (`api-utils.ts` maps any "already"
 * message to it) and other RPCs raise unrelated "Already " messages that are
 * not a revision conflict, so branching on status alone would misclassify
 * `media_video_delete`'s "Already in use: ..." as a draft conflict.
 */
export function isConflict(message: string): boolean {
  return message.startsWith("Already modified:");
}

/**
 * `media_publication_set_content` raises this when any item points at an asset that
 * is not `approved`. The UI blocks picking one, so reaching here means the asset lost
 * its approval after it was chosen — the raw wording names neither the asset nor the
 * way out, so it must not reach the user.
 */
function isUnapprovedAsset(message: string): boolean {
  return message.includes("media asset(s) are not approved");
}

export function classifyApiError(err: unknown, fallback: string): ClassifiedError {
  const message = err instanceof Error && err.message ? err.message : fallback;

  if (isAlreadyActive(message)) {
    return { kind: "already-active", message };
  }

  if (isUnapprovedAsset(message)) {
    return {
      kind: "rejected",
      message: "สื่อที่เลือกไว้ยังไม่ผ่านการอนุมัติ กรุณากลับไปขั้นตอน Content แล้วเลือกสื่อที่อนุมัติแล้วแทน",
    };
  }

  if (isConflict(message)) {
    return {
      kind: "conflict",
      message: "ข้อมูลถูกแก้ไขจากที่อื่นระหว่างที่คุณทำงานอยู่ กรุณาโหลดหน้านี้ใหม่ก่อนบันทึกอีกครั้ง",
    };
  }

  // Everything the API rejects on shape — zod schema failures and the remaining
  // `Invalid input:` RPC guards — arrives worded for whoever wrote the schema
  // ("Too small: expected string to have >=1 characters"). The specific cases worth
  // naming are handled above; this keeps the rest off the screen. The raw text is
  // still in the network response for anyone debugging.
  if (message.startsWith("Invalid input:")) {
    return {
      kind: "rejected",
      message: "ข้อมูลที่กรอกยังไม่ครบหรือไม่ถูกต้อง กรุณาตรวจสอบแต่ละขั้นตอนแล้วลองใหม่",
    };
  }

  if (err instanceof ApiError && err.status === 403) {
    return {
      kind: "forbidden",
      message: "บัญชีนี้ไม่มีสิทธิ์เข้าถึงข้อมูลนี้ ติดต่อผู้ดูแลระบบหากคิดว่าไม่ถูกต้อง",
    };
  }

  if (err instanceof ApiError && err.status === 404) {
    return { kind: "not-found", message: "ไม่พบเนื้อหานี้ อาจถูกลบไปแล้วหรือลิงก์ไม่ถูกต้อง" };
  }

  // Without a status we can't tell a rejection from an outage, and guessing
  // "retryable" on a rejected command invites the user to hammer a dead request.
  if (!(err instanceof ApiError)) {
    return { kind: "retryable", message };
  }

  if (err.status >= 400 && err.status < 500) {
    return { kind: "rejected", message };
  }

  return { kind: "retryable", message };
}
