import assert from "node:assert/strict";
import { uploadProfileFile, type ProfileFileUploadClient } from "../services/asset-profile-file-upload.ts";
import type { ProfileUploadReceipt } from "./asset-files-edit.ts";

const file = new File(["fixture"], "front.jpg", { type: "image/jpeg" });
const receipts = new Map<string, ProfileUploadReceipt>();
const requests: { submission: string; upload: string }[] = [];
let puts = 0;
let completions = 0;
const ids = new Map<string, string>();
const expiry = new Date(Date.now() + 3600000).toISOString();
const client: ProfileFileUploadClient = {
  reserve: async (_context, input) => {
    requests.push({ submission: input.submission_id, upload: input.upload_id });
    const fileId = ids.get(input.upload_id) ?? crypto.randomUUID();
    ids.set(input.upload_id, fileId);
    return { uploadId: input.upload_id, fileId, completed: false, expiresAt: null, signedUploadUrl: "https://storage.example.test/staging" };
  },
  put: async (_file, _url, _mime, check, progress) => { check(); puts++; progress(42); return { ok: true }; },
  complete: async (_context, uploadId) => { completions++; return { fileId: ids.get(uploadId)!, expiresAt: expiry }; },
};
const progress: string[] = [];
const first = await uploadProfileFile("context", "local-a", file, "photo", receipts, (state) => progress.push(state.stage), () => {}, client);
assert.equal(puts, 1);
assert.equal(completions, 1);
assert.ok(progress.includes("Uploading"));
assert.equal(receipts.get("local-a")?.fileId, first);
// An explicitly retried files save keeps this receipt and does not reserve/PUT/complete again.
assert.equal(await uploadProfileFile("context", "local-a", file, "photo", receipts, () => {}, () => {}, client), first);
assert.equal(requests.length, 1);
assert.equal(puts, 1);
await uploadProfileFile("context", "local-b", file, "photo", receipts, () => {}, () => {}, client);
assert.notEqual(requests[0].submission, requests[1].submission);
assert.notEqual(requests[0].upload, requests[1].upload);
let failPut = true;
const retryClient: ProfileFileUploadClient = { ...client, put: async () => {
  if (failPut) { failPut = false; return { ok: false }; }
  return { ok: true };
} };
await assert.rejects(uploadProfileFile("context", "local-c", file, "photo", receipts, () => {}, () => {}, retryClient));
const rejected = requests.at(-1)!;
await uploadProfileFile("context", "local-c", file, "photo", receipts, () => {}, () => {}, retryClient);
assert.deepEqual(requests.at(-1), rejected); // Same reservation identity after a failed upload.
const previous = receipts.get("local-a")!;
receipts.set("local-a", { ...previous, expiresAt: "2000-01-01T00:00:00Z" });
await uploadProfileFile("context", "local-a", file, "photo", receipts, () => {}, () => {}, client);
assert.notEqual(receipts.get("local-a")?.submissionId, previous.submissionId);
let replayPuts = 0;
const replayClient: ProfileFileUploadClient = { ...client,
  reserve: async (_context, input) => ({ uploadId: input.upload_id, fileId: crypto.randomUUID(), completed: true, expiresAt: expiry, signedUploadUrl: null }),
  put: async () => { replayPuts++; return { ok: true }; },
};
await uploadProfileFile("context", "server-completed", file, "photo", receipts, () => {}, () => {}, replayClient);
assert.equal(replayPuts, 0);
const count = requests.length;
await assert.rejects(uploadProfileFile("context", "cancelled", file, "photo", receipts, () => {}, () => { throw new Error("Inactive"); }, client));
assert.equal(requests.length, count);
console.log("asset-profile-file-upload checks passed");
