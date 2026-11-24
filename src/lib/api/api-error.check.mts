/**
 * Runnable check for API error classification:
 *
 *     node src/lib/api/api-error.check.mts
 *
 * ponytail: node:assert plus Node's native TS stripping, same as the other
 * *.check.mts files here. api-error.ts imports nothing, so this loads clean.
 */
import assert from "node:assert/strict";
import {
  ApiError,
  classifyApiError,
  inactiveChannelMessage,
  isConflict,
  isDuplicateName,
  layoutNotReadyMessage,
  trashedAssetNames,
  deletedFileNames,
  scheduleEndedMessage,
  type PublishCause,
} from "./api-error.ts";

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

// media_channel_create/update raise "Already exists: a channel named X already exists" — this
// must never reach the screen verbatim (raw backend text is not allowed to reach the user), and
// must not be confused with the revision-conflict case above despite sharing the "Already " prefix
// and the same 409 bucket in api-utils.ts.
const duplicate = classifyApiError(new ApiError("Already exists: a channel named Foo already exists", 409), FALLBACK);
assert.equal(duplicate.kind, "rejected");
assert.notEqual(duplicate.message, "Already exists: a channel named Foo already exists");
assert.ok(!duplicate.message.includes("Foo")); // no leaked backend text of any kind
assert.ok(isDuplicateName("Already exists: a channel named Foo already exists"));
assert.equal(isDuplicateName("Already modified: draft was changed elsewhere"), false);

// A 409 that isn't our specific revision-conflict message must NOT be treated as
// one — e.g. media_video_delete's "Already in use: ..." would otherwise tell a
// user deleting a referenced video to go reload the publication wizard.
assert.equal(classifyApiError(new ApiError("Already in use: video is still referenced by a playlist", 409), FALLBACK).kind, "rejected");
assert.equal(classifyApiError(new ApiError("row version mismatch", 409), FALLBACK).kind, "rejected");
assert.equal(isConflict("Already in use: video is still referenced by a playlist"), false);

// ADR 0074 §5 activation guard: unlike the generic "Invalid input:" catch-all below, these two
// name the Group and the missing/conflicting Channels — the names are kept (ADR 0114 translates the
// English around them), not swallowed into the generic Thai "ข้อมูลที่กรอกยังไม่ครบ" message.
const incompleteGroup = classifyApiError(
  new ApiError("Invalid input: synchronized group target is incomplete — S (missing: C2)", 400),
  FALLBACK,
);
assert.equal(incompleteGroup.kind, "rejected");
assert.equal(incompleteGroup.cause, "targets");
assert.ok(incompleteGroup.message.includes("S (ขาด: C2)"));
assert.ok(!/synchronized|missing/.test(incompleteGroup.message));

const directInGroup = classifyApiError(
  new ApiError(
    "Invalid input: cannot activate a direct device target inside a synchronized group — Screen 01 (channel: CH-01; group: S)",
    400,
  ),
  FALLBACK,
);
assert.equal(directInGroup.kind, "rejected");
assert.equal(directInGroup.cause, "targets");
assert.ok(directInGroup.message.includes("Screen 01") && directInGroup.message.includes("กลุ่ม: S"));
assert.ok(!/synchronized|channel:/.test(directInGroup.message));

// 4xx means the request itself was refused — retrying it unchanged is pointless.
assert.equal(classifyApiError(new ApiError("Invalid input: name required", 400), FALLBACK).kind, "rejected");
assert.equal(classifyApiError(new ApiError("nope", 499), FALLBACK).kind, "rejected");

// 403 still classifies as "forbidden", and 400 still as "rejected" (the new branch must not widen).
assert.equal(classifyApiError(new ApiError("HTTP Error 403", 403), FALLBACK).kind, "forbidden");
assert.equal(classifyApiError(new ApiError("HTTP Error 400", 400), FALLBACK).kind, "rejected");
assert.equal(classifyApiError(new ApiError("HTTP Error 404", 404), FALLBACK).kind, "not-found");

// A conflict message carried on a 404 still classifies as "conflict" — message-based branches keep priority over status.
assert.equal(classifyApiError(new ApiError("Already modified: draft was changed elsewhere", 404), FALLBACK).kind, "conflict");

// 5xx is worth retrying, and so is anything we can't attribute.
assert.equal(classifyApiError(new ApiError("boom", 500), FALLBACK).kind, "retryable");
assert.equal(classifyApiError(new ApiError("gateway", 502), FALLBACK).kind, "retryable");

// No status available (network drop, thrown string) — must NOT be reported as
// "rejected", or the UI would hide the Retry the user actually needs.
assert.equal(classifyApiError(new Error("Network Error"), FALLBACK).kind, "retryable");
assert.equal(classifyApiError("something", FALLBACK).kind, "retryable");
assert.equal(classifyApiError(undefined, FALLBACK).kind, "retryable");

// A request that never got a response (axios "Network Error" / ERR_NETWORK /
// timeout) must not reach the operator in English — the Thai retryable line
// replaces it. A plain thrown Error with any other message still passes through.
const offline = classifyApiError(Object.assign(new Error("Network Error"), { code: "ERR_NETWORK" }), FALLBACK);
assert.equal(offline.kind, "retryable");
assert.ok(offline.message.includes("เชื่อมต่อ"), "network failure should surface in Thai");
assert.ok(!offline.message.includes("Network Error"));
assert.equal(classifyApiError(Object.assign(new Error("timeout of 0ms exceeded"), { code: "ECONNABORTED" }), FALLBACK).message, offline.message);
assert.equal(classifyApiError(new Error("อะไรบางอย่างพัง"), FALLBACK).message, "อะไรบางอย่างพัง");

// media_publication_activate refuses Targets that resolve to no device (Thunder_Core#134). The
// backend wording must not reach the screen, and it must not fall into the generic "Invalid input:"
// line either, which does not tell the operator what to fix.
const noScreens = classifyApiError(
  new ApiError(
    "Invalid input: the targets have no screens — add a screen to the channel or group before publishing",
    400
  ),
  FALLBACK
);
assert.equal(noScreens.kind, "rejected");
assert.ok(noScreens.message.includes("ยังไม่มีจอ"));
assert.ok(!noScreens.message.includes("targets have no screens"));
assert.notEqual(noScreens.message, classifyApiError(new ApiError("Invalid input: x", 400), FALLBACK).message);

// ADR 0091: a trashed Asset in the snapshot is refused by name, in Thai, never as the raw RPC text.
assert.equal(deletedFileNames("Invalid input: cannot activate — remove or restore from Trash: B.mp4; file was deleted, replace it: A.mp4"), "A.mp4");
const trashedRaw = "Invalid input: cannot activate — remove or restore from Trash: Predator.mp4, sample.mp4";
assert.equal(trashedAssetNames(trashedRaw), "Predator.mp4, sample.mp4");
// reasons are joined with "; " — only the Trash part is taken
assert.equal(
  trashedAssetNames("Invalid input: cannot activate — replace this file: A.mp4; remove or restore from Trash: B.mp4; wait — conversion in flight: C.mp4"),
  "B.mp4"
);
assert.equal(trashedAssetNames("Invalid input: the targets have no screens"), null);
const trashed = classifyApiError(new ApiError(trashedRaw, 400), FALLBACK);
assert.equal(trashed.kind, "rejected");
assert.ok(trashed.message.includes("Predator.mp4, sample.mp4"));
assert.ok(trashed.message.includes("ถังขยะ"));
assert.ok(!trashed.message.includes("cannot activate"));
assert.ok(!trashed.message.includes("Invalid input"));

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

// ADR 0099: each guard keeps the operator's names and drops the English, including the [publish]
// tag Publish Changes puts in front.
const inactiveCases: [string, string][] = [
  [
    "Invalid input: [publish] these channels are not active — activate them before publishing: boe_55, testandroid 1",
    "boe_55, testandroid 1",
  ],
  ["Invalid input: only active channels can join a group — not active: Lobby", "Lobby"],
  ["Invalid input: only active channels can join a group — activate this channel first", "ช่องทางนี้"],
  ["Invalid input: remove this channel from its groups before deactivating: Floor 1, Floor 2", "Floor 1, Floor 2"],
];
for (const [raw, kept] of inactiveCases) {
  const c = classifyApiError(new ApiError(raw, 400), FALLBACK);
  assert.equal(c.kind, "rejected");
  assert.ok(c.message.includes(kept), `${raw} should keep "${kept}"`);
  assert.ok(!/active|Invalid input/.test(c.message), `${raw} leaked English: ${c.message}`);
}
assert.equal(inactiveChannelMessage("Invalid input: the targets have no screens"), null);

// Layout refusals from media_publication_activate: named in Thai, zone names kept, never the generic bucket.
assert.ok(layoutNotReadyMessage("Invalid input: composition is not active — activate it before publishing")?.includes("Activate Layout"));
assert.ok(layoutNotReadyMessage("Invalid input: cannot activate an incomplete composition — zone(s) Main, Side are unbound")?.includes("Main, Side"));
assert.equal(layoutNotReadyMessage("Invalid input: the targets have no screens"), null);
const notActive = classifyApiError(new ApiError("Invalid input: composition is not active — activate it before publishing", 400), FALLBACK);
assert.equal(notActive.kind, "rejected");
assert.ok(!notActive.message.includes("ข้อมูลที่กรอกยังไม่ครบ"));

// ADR 0114: every publish refusal names its cause, ahead of the generic and 404 buckets.
const causeCases: [string, number, PublishCause][] = [
  ["Invalid input: [schedule] end time is in the past", 400, "schedule-ended"],
  ["Invalid input: starts_at is required", 400, "schedule-invalid"],
  ["Invalid input: ends_at must be after starts_at", 400, "schedule-invalid"],
  ["Invalid input: daily_start must be before daily_end", 400, "schedule-invalid"],
  ["Invalid input: recurrence requires daily_start and daily_end", 400, "schedule-invalid"],
  ["Invalid input: unknown timezone Mars/Base", 400, "schedule-invalid"],
  ["Invalid input: recurrence.days must be integers 0-6 (0=Sun)", 400, "schedule-invalid"],
  ["Invalid input: publication has no layout — add one before activating", 400, "no-content"],
  ["Invalid input: publication has no playlist — add content before activating", 400, "no-content"],
  ["not found: composition not found for this tenant", 404, "no-content"],
  ["Invalid input: composition is not active — activate it before publishing", 400, "layout-not-active"],
  ["Invalid input: cannot activate an incomplete composition — zone(s) Main, Side are unbound", 400, "zones-unbound"],
  ["Invalid input: playlist 3f2a has no items — add content before activating", 400, "nothing-playable"],
  ["Invalid input: composition 3f2a produced zero resolvable snapshot items", 400, "nothing-playable"],
  ["Invalid input: at least one target is required", 400, "targets"],
  ["not found: channel 3f2a not found for this tenant", 404, "targets"],
  ["not found: channel group not found", 404, "targets"],
  ["Invalid input: cannot activate a direct-target publication on Lobby — synchronized playback is enabled for that channel; disable synchronization or target the channel instead", 400, "targets"],
  ["Invalid input: these channels are not active — activate them before publishing: Lobby", 400, "channels-inactive"],
  ["Invalid input: the targets have no screens — add a screen", 400, "no-screens"],
  ["Invalid input: cannot activate — replace this file: A.mp4", 400, "files"],
];
for (const [raw, status, cause] of causeCases) {
  const c = classifyApiError(new ApiError(raw, status), FALLBACK);
  assert.equal(c.cause, cause, raw);
  assert.equal(c.kind, "rejected", raw);
  assert.ok(/[฀-๿]/.test(c.message), `${raw} should be Thai: ${c.message}`);
  assert.ok(!/Invalid input|not found:|cannot activate/.test(c.message), `${raw} leaked English: ${c.message}`);
}
// a channel *type* 404 and an overlap refusal are not publish causes
assert.equal(classifyApiError(new ApiError("not found: channel type not found", 404), FALLBACK).cause, undefined);
assert.equal(classifyApiError(new ApiError("Invalid input: cannot activate — equal-priority overlap with X; change priority", 400), FALLBACK).cause, undefined);
assert.equal(classifyApiError(new ApiError("Invalid input: [schedule] end time is in the past — use End program instead", 400), FALLBACK).cause, undefined);
assert.equal(classifyApiError(new ApiError("Invalid input: x", 400), FALLBACK).cause, undefined);

// A mixed file refusal keeps every part and every name — none falls through to raw English.
const mixed = classifyApiError(
  new ApiError("Invalid input: cannot activate — replace this file: A.mp4; wait — conversion in flight: B.mp4; remove or restore from Trash: C.mp4; file was deleted, replace it: D.mp4", 400),
  FALLBACK,
);
assert.equal(mixed.cause, "files");
for (const name of ["A.mp4", "B.mp4", "C.mp4", "D.mp4"]) assert.ok(mixed.message.includes(name), name);
assert.ok(!/replace this file|conversion in flight|Trash:/.test(mixed.message));

assert.ok(scheduleEndedMessage("01/12/2026 09:00").includes("01/12/2026 09:00"));
assert.ok(!scheduleEndedMessage().includes("undefined"));

console.log("api-error.check.mts — all assertions passed");
