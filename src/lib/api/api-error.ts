/**
 * The API layer used to collapse every failure into `new Error(string)`, which
 * left the UI unable to tell "retry this" from "fix your input" from "this
 * already succeeded". `ApiError` keeps the status code so it can.
 */
import { classifyCoreRefusal, programPart, type ProgramPart, type RefusalReason } from "./core-refusal-rules.ts";
import type { PublishCause } from "./publish-cause.ts";

export {
  deletedChannelMessage,
  deletedFileMessage,
  deletedFileNames,
  inactiveChannelMessage,
  layoutNotReadyMessage,
  scheduleEndedMessage,
  trashedAssetMessage,
  trashedAssetNames,
  type PublishCause,
} from "./publish-cause.ts";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Text written by the frontend for the user; `classifyApiError` shows it as-is. */
export class UserFacingError extends Error {}

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
  /** Thai, ready to show with the next action spelled out; never Core's own text. */
  message: string;
  /** Set only where a caller acts differently from showing `message` (ADR 0126 §4). */
  reason?: RefusalReason;
  /** Names a caller needs apart from `message` (today: the Program a Publish changes refusal names). */
  names?: string[];
  /** The `[details]`/`[content]`/... tag Core puts on a Program edit refusal. */
  part?: ProgramPart;
  /** Set for a publish-time refusal the page can turn into a button (ADR 0114). */
  cause?: PublishCause;
}

/**
 * Raised by any RPC guarding a per-tenant unique name. The raw text names the
 * colliding value in English ("Already exists: a channel named X already exists"),
 * and `api-utils.ts` buckets it into the same 409 as every other "already" message,
 * so without this case it reaches the screen untranslated.
 *
 * ponytail: Channels and Channel Groups still branch on this until their refusals move into the table (#460 PR 2).
 */
export function isDuplicateName(message: string): boolean {
  return message.startsWith("Already exists:");
}

/**
 * A request that never got a response — the browser is offline, the host is
 * unreachable, or it timed out. Axios reports it as `code: "ERR_NETWORK"` (or
 * `"ECONNABORTED"` on timeout) with the bare English `message` "Network Error",
 * none of which an operator should see: the retryable Thai line says the same
 * thing and names the next action.
 */
function isTransportFailure(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const code = (err as { code?: string }).code;
  return code === "ERR_NETWORK" || code === "ECONNABORTED" || err.message === "Network Error";
}

export function classifyApiError(err: unknown, fallback: string): ClassifiedError {
  if (err instanceof UserFacingError) return { kind: "rejected", message: err.message };

  const message = err instanceof Error && err.message ? err.message : fallback;
  const classified = classifyMessage(err, message, fallback);
  const part = programPart(message);
  return part ? { ...classified, part } : classified;
}

function classifyMessage(err: unknown, message: string, fallback: string): ClassifiedError {
  // ADR 0126: one table for what Core refuses, ahead of the generic `Invalid input:` and status branches.
  const refusal = classifyCoreRefusal(message);
  if (refusal) return refusal;

  // Everything the API rejects on shape — zod schema failures and the remaining
  // `Invalid input:` RPC guards — arrives worded for whoever wrote the schema
  // ("Too small: expected string to have >=1 characters"). The specific cases worth
  // naming are in the table; this keeps the rest off the screen. The raw text is
  // still in the network response for anyone debugging.
  if (message.startsWith("Invalid input:")) {
    return {
      kind: "rejected",
      message: "ข้อมูลที่กรอกยังไม่ครบหรือไม่ถูกต้อง กรุณาตรวจสอบแล้วลองใหม่",
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

  if (!(err instanceof ApiError)) {
    // Without a status a transport failure is the only thing a retry can fix. Anything else
    // (a thrown string, a TypeError from a malformed payload) is a frontend bug.
    if (isTransportFailure(err)) {
      return {
        kind: "retryable",
        message: "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง",
      };
    }
    console.error(err);
    return { kind: "rejected", message: fallback };
  }

  console.error(err);
  if (err.status >= 400 && err.status < 500) {
    return { kind: "rejected", message: fallback };
  }

  return { kind: "retryable", message: fallback };
}
