/** Run: node src/features/asset-workspace/services/asset-import-source-upload.check.mts */
import assert from "node:assert/strict";
import { ImportApiError } from "./asset-import-api.ts";
import { uploadImportSource } from "./asset-import-source-upload.ts";
import { putRegistrationUpload } from "./registration-upload-transport.ts";

// The fake Storage request and API responses are confined to this check file.
const uploadId = "44444444-4444-4444-8444-444444444444";
const batchId = "33333333-3333-4333-8333-333333333333";
const signedUploadUrl = "https://storage.example.invalid/source";
const expiresAt = new Date(Date.now() + 60_000).toISOString();
const file = new File(["Asset Name\r\nDisplay"], "assets.csv", { type: "text/csv" });
const reservation = { uploadId, fileId: uploadId, completed: false, expiresAt, stagingPath: "temporary/x", completionPath: "/complete", signedUploadUrl };
const retry = () => new ImportApiError("UPLOAD_RETRY", "Retry", 502);

let storage: { status: number; body?: string; steps?: number[]; offline?: boolean };
class FakeRequest {
  status = 0;
  responseText = "";
  timeout = 0;
  upload: { onprogress?: (event: { lengthComputable: boolean; loaded: number; total: number }) => void } = {};
  onload?: () => void;
  onerror?: () => void;
  headers: Record<string, string> = {};
  open(method: string, url: string) {
    assert.equal(method, "PUT");
    assert.equal(url, signedUploadUrl);
  }
  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }
  send(body: File) {
    assert.equal(body, file);
    assert.deepEqual(this.headers, { "Content-Type": "text/csv", "x-upsert": "false" });
    assert.equal(this.timeout, 120000);
    if (storage.offline) return this.onerror?.();
    for (const loaded of storage.steps ?? []) this.upload.onprogress?.({ lengthComputable: true, loaded, total: 200 });
    this.status = storage.status;
    this.responseText = storage.body ?? "";
    this.onload?.();
  }
}
Object.assign(globalThis, { XMLHttpRequest: FakeRequest });

function run(reserve: () => unknown, complete: () => unknown = () => ({ fileId: uploadId, expiresAt }), checkActive?: () => void) {
  const calls: string[] = [];
  const progress: number[] = [];
  const result = uploadImportSource(
    { batchId, uploadId, file, mimeType: "text/csv", onProgress: (value) => progress.push(value), checkActive },
    async (_method, path) => {
      const step = path.endsWith("/complete") ? "complete" : "reserve";
      calls.push(step);
      return step === "complete" ? complete() : reserve();
    },
  );
  return { result, calls, progress };
}

// Progress comes from the bytes Storage has received, with no invented steps.
storage = { status: 200, steps: [50, 100, 200] };
const normal = run(() => reservation);
assert.deepEqual(await normal.result, { fileId: uploadId });
assert.deepEqual(normal.calls, ["reserve", "complete"]);
assert.deepEqual(normal.progress, [25, 50, 100, 100]);

// Try Again after a failed completion finishes the upload whose bytes are already stored.
const recovered = run(() => { throw retry(); });
assert.deepEqual(await recovered.result, { fileId: uploadId });
assert.deepEqual(recovered.calls, ["reserve", "complete"]);
assert.deepEqual(recovered.progress, [100]);

// With nothing stored, the person keeps the original retry message.
const missing = run(() => { throw retry(); }, () => { throw new ImportApiError("NOT_FOUND", "Missing", 404); });
await assert.rejects(missing.result, (error) => error instanceof ImportApiError && error.code === "UPLOAD_RETRY");
assert.deepEqual(missing.progress, []);

// Other reserve failures never attempt completion.
const denied = run(() => { throw new ImportApiError("PERMISSION_DENIED", "No", 403); });
await assert.rejects(denied.result, (error) => error instanceof ImportApiError && error.code === "PERMISSION_DENIED");
assert.deepEqual(denied.calls, ["reserve"]);

// Leaving the page during recovery stops it instead of reporting a retry error.
let active = true;
const cancelled = run(() => { throw retry(); }, () => { active = false; throw new Error("Offline"); }, () => {
  if (!active) throw new Error("cancelled");
});
await assert.rejects(cancelled.result, /cancelled/);

// Storage outcomes match the fetch path.
for (const [status, body, ok] of [[409, "", true], [400, '{"error":"Duplicate"}', true], [400, "{}", false], [400, "not json", false], [500, "", false]] as const) {
  storage = { status, body };
  assert.equal((await putRegistrationUpload(file, signedUploadUrl, "text/csv", () => {}, () => {})).ok, ok);
}
storage = { status: 500 };
await assert.rejects(run(() => reservation).result, (error) => error instanceof ImportApiError && error.code === "UPLOAD_RETRY");
storage = { status: 0, offline: true };
await assert.rejects(run(() => reservation).result, (error) => error instanceof ImportApiError && error.code === "CONNECTION_FAILED");

// Without a progress callback, as in Single Register, the request stays on fetch.
const realFetch = globalThis.fetch;
let fetched = 0;
globalThis.fetch = async () => { fetched += 1; return new Response(null, { status: 200 }); };
assert.equal((await putRegistrationUpload(file, signedUploadUrl, "text/csv")).ok, true);
globalThis.fetch = realFetch;
assert.equal(fetched, 1);

console.log("asset-import-source-upload.check.mts: real progress, stored-upload recovery, cancellation and Single Register's fetch path passed");
