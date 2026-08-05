/**
 * Runnable check for API error classification:
 *
 *     node src/features/publications/api-error.check.mts
 *
 * ponytail: node:assert plus Node's native TS stripping, same as the other
 * *.check.mts files here. api-error.ts imports nothing, so this loads clean.
 */
import assert from "node:assert/strict";
import { ApiError, classifyApiError, isConflict } from "./api-error.ts";

const FALLBACK = "Failed to save draft.";

// "Already active" wins over the status code: whatever the backend dressed it up
// as, it means the publish already succeeded and must not surface as a failure.
for (const status of [400, 409, 500]) {
  const c = classifyApiError(new ApiError("Already active: publication is not a draft", status), FALLBACK);
  assert.equal(c.kind, "already-active", `status ${status} should still classify as already-active`);
}
assert.equal(
  classifyApiError(new Error("ALREADY ACTIVE"), FALLBACK).kind,
  "already-active" // case-insensitive, and works on a plain Error too
);

// docs/adr/0003-draft-optimistic-locking.md: conflict is matched on the exact
// "Already modified:" prefix media_publication_upsert raises, not on bare 409 —
// 409 is a shared bucket (api-utils.ts maps any "already" message to it) and
// other RPCs raise unrelated "Already " messages through the same status.
const conflict = classifyApiError(new ApiError("Already modified: draft was changed elsewhere", 409), FALLBACK);
assert.equal(conflict.kind, "conflict");
assert.notEqual(conflict.message, "Already modified: draft was changed elsewhere"); // replaced with actionable guidance
assert.ok(conflict.message.includes("โหลดหน้านี้ใหม่"));
assert.ok(isConflict("Already modified: draft was changed elsewhere"));

// A 409 that isn't our specific revision-conflict message must NOT be treated as
// one — e.g. media_video_delete's "Already in use: ..." would otherwise tell a
// user deleting a referenced video to go reload the publication wizard.
assert.equal(classifyApiError(new ApiError("Already in use: video is still referenced by a playlist", 409), FALLBACK).kind, "rejected");
assert.equal(classifyApiError(new ApiError("row version mismatch", 409), FALLBACK).kind, "rejected");
assert.equal(isConflict("Already in use: video is still referenced by a playlist"), false);

// 4xx means the request itself was refused — retrying it unchanged is pointless.
assert.equal(classifyApiError(new ApiError("Invalid input: name required", 400), FALLBACK).kind, "rejected");
assert.equal(classifyApiError(new ApiError("not found", 404), FALLBACK).kind, "rejected");
assert.equal(classifyApiError(new ApiError("nope", 499), FALLBACK).kind, "rejected");

// 5xx is worth retrying, and so is anything we can't attribute.
assert.equal(classifyApiError(new ApiError("boom", 500), FALLBACK).kind, "retryable");
assert.equal(classifyApiError(new ApiError("gateway", 502), FALLBACK).kind, "retryable");

// No status available (network drop, thrown string) — must NOT be reported as
// "rejected", or the UI would hide the Retry the user actually needs.
assert.equal(classifyApiError(new Error("Network Error"), FALLBACK).kind, "retryable");
assert.equal(classifyApiError("something", FALLBACK).kind, "retryable");
assert.equal(classifyApiError(undefined, FALLBACK).kind, "retryable");

// The fallback fills in only when there is no message to show.
assert.equal(classifyApiError(undefined, FALLBACK).message, FALLBACK);
assert.equal(classifyApiError(new Error(""), FALLBACK).message, FALLBACK);
assert.equal(classifyApiError(new ApiError("HTTP Error 500", 500), FALLBACK).message, "HTTP Error 500");

// ApiError must survive `instanceof Error` so existing message-matching keeps working
// (usePublishDraft's isStaleDraftError relies on it).
const stale = new ApiError("only draft publications can be edited", 400);
assert.ok(stale instanceof Error);
assert.equal(stale.status, 400);
assert.equal(stale.name, "ApiError");

console.log("api-error.check.mts — all assertions passed");
