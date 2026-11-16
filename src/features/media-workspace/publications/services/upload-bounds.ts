// ADR 0059 amendment 2026-11-04: nothing in the upload pipeline waits on the network without a
// bound (file reads are bounded in media-file-read.ts), so a stuck file cannot hold a slot for good.

/** Above Core's 30 s route limit, so a slow answer still arrives and only a lost one times out. */
export const REQUEST_TIMEOUT_MS = 45_000;

export const UPLOAD_TIMEOUT_ERROR = "UploadTimeoutError";

export function namedError(name: string, message: string): Error {
  const error = new Error(message);
  error.name = name;
  return error;
}

/** Distinguishable from a real failure so the queue marks the row `canceled`, not `failed`. */
export const abortError = () => namedError("AbortError", "Upload canceled");

export function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw abortError();
}

/** A Core call that gives up after `REQUEST_TIMEOUT_MS`. axios reports that as `ECONNABORTED`. */
export async function boundedRequest<T>(run: (options: { timeoutMs: number }) => Promise<T>): Promise<T> {
  try {
    return await run({ timeoutMs: REQUEST_TIMEOUT_MS });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === "ECONNABORTED" || code === "ETIMEDOUT") {
      throw namedError(UPLOAD_TIMEOUT_ERROR, "เซิร์ฟเวอร์ไม่ตอบกลับภายใน 45 วินาที");
    }
    throw error;
  }
}
