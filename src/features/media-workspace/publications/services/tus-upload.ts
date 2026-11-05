import { Upload } from "tus-js-client";
import { resolveUploadMimeType } from "../upload-limits";
import { REQUEST_TIMEOUT_MS, UPLOAD_TIMEOUT_ERROR, abortError, namedError, throwIfAborted } from "./upload-bounds";
import type { UploadTarget } from "./upload-api";

const STALL_TIMEOUT_MS = 60_000;
const STALL_CHECK_INTERVAL_MS = 5_000;
const UPLOAD_STALLED_ERROR = "UploadStalledError";

/** The resumable endpoint talks to Storage directly, past /api/proxy, so it needs the user's
 *  own access token rather than the httpOnly cookie the proxy forwards. */
async function fetchStorageAccessToken(): Promise<string> {
  let response: Response;
  try {
    response = await fetch("/api/auth/storage-token", { cache: "no-store", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (error) {
    if ((error as Error)?.name === "TimeoutError") {
      throw namedError(UPLOAD_TIMEOUT_ERROR, "เซิร์ฟเวอร์ไม่ตอบกลับภายใน 45 วินาที");
    }
    throw error;
  }
  if (!response.ok) throw new Error("เซสชันหมดอายุ — กรุณาเข้าสู่ระบบใหม่ก่อนอัปโหลด");
  const { access_token } = (await response.json()) as { access_token: string };
  return access_token;
}

/** Supabase's TUS chunk size is fixed at 6 MB — the server rejects anything else. */
const TUS_CHUNK_SIZE = 6 * 1024 * 1024;

/** A resumed upload whose reservation no longer exists — swept, canceled, or past the TUS
 *  URL's lifetime. Named so the queue can tell "resume this" from "re-authorize this". */
export const EXPIRED_UPLOAD_ERROR = "ExpiredUploadError";

function isReservationGone(error: unknown): boolean {
  const status = (error as { originalResponse?: { getStatus?: () => number } })?.originalResponse?.getStatus?.();
  return status === 401 || status === 403 || status === 404 || status === 410;
}

/** Resumable upload straight to the Storage hostname, bypassing /api/proxy: a 5 GB file
 *  cannot survive a single non-resumable PUT through a serverless proxy. `objectName` comes
 *  from Core and Storage's own RLS policy refuses any key outside the caller's tenant prefix,
 *  so a tampered value is rejected at the server, not merely unused.
 *
 *  A transfer that moves no bytes for `STALL_TIMEOUT_MS` is aborted without terminating the
 *  upload, so its reservation and stored URL survive and `Retry` resumes where it stopped. */
export async function uploadToStorage(
  target: UploadTarget,
  file: File,
  onProgress: (pct: number) => void,
  signal?: AbortSignal,
  shouldResume = false
): Promise<void> {
  throwIfAborted(signal);
  const accessToken = await fetchStorageAccessToken();
  // A listener added after the signal fired never runs, so check once more before wiring one.
  throwIfAborted(signal);

  return new Promise((resolve, reject) => {
    let lastProgressAt = Date.now();
    let bytesSeen = 0;

    function settle() {
      clearInterval(watchdog);
      signal?.removeEventListener("abort", onAbort);
    }
    function onAbort() {
      settle();
      void upload.abort();
      reject(abortError());
    }

    const upload = new Upload(file, {
      endpoint: target.upload_endpoint,
      headers: {
        authorization: `Bearer ${accessToken}`,
        apikey: target.storage_api_key,
      },
      retryDelays: [0, 3000, 5000, 10000, 20000],
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: TUS_CHUNK_SIZE,
      metadata: {
        bucketName: target.bucket,
        objectName: target.storage_key,
        // The bucket's allowed_mime_types is checked against this, so it has to be the same
        // value Core validated rather than a possibly-empty File.type.
        contentType: resolveUploadMimeType(file),
      },
      onProgress: (uploaded, total) => {
        // Bytes, not the rounded percentage: 1% of a 5 GB file is 50 MB.
        if (uploaded > bytesSeen) {
          bytesSeen = uploaded;
          lastProgressAt = Date.now();
        }
        if (total) onProgress(Math.round((uploaded * 100) / total));
      },
      onChunkComplete: () => {
        lastProgressAt = Date.now();
      },
      onError: (error) => {
        settle();
        if (!isReservationGone(error)) return reject(error);
        const expired = new Error("การอนุญาตอัปโหลดหมดอายุ — ระบบจะเริ่มไฟล์นี้ใหม่");
        expired.name = EXPIRED_UPLOAD_ERROR;
        reject(expired);
      },
      onSuccess: () => {
        settle();
        resolve();
      },
    });

    signal?.addEventListener("abort", onAbort);

    // Counts from before the first request: a POST that never answers is a stall too. A stall
    // during that first POST has no stored URL yet, so `Retry` restarts the file, which is correct.
    const watchdog = setInterval(() => {
      if (Date.now() - lastProgressAt < STALL_TIMEOUT_MS) return;
      settle();
      void upload.abort();
      reject(namedError(UPLOAD_STALLED_ERROR, "ไม่มีความคืบหน้านาน 60 วินาที"));
    }, STALL_CHECK_INTERVAL_MS);

    // The stored upload URL is only safe to resume against the reservation it was created for.
    // tus fingerprints a file as `tus-br-{name}-{type}-{size}-{lastModified}-{endpoint}` —
    // `objectName` is not part of it — so a previous attempt's entry matches even when this
    // call holds a brand-new reservation. Resuming then would append bytes to the old object
    // while registration recorded the new key. Only the caller knows which it holds, so it
    // decides: `shouldResume` is set exactly when it passed the same `target` back in.
    if (!shouldResume) {
      upload.start();
      return;
    }
    upload.findPreviousUploads().then((previous) => {
      if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
      upload.start();
    }, (error) => {
      settle();
      reject(error);
    });
  });
}
