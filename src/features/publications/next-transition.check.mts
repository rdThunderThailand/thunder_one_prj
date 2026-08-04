/**
 * Runnable check for the Next-click transition and the resume guard:
 *
 *     node src/features/publications/next-transition.check.mts
 *
 * ponytail: node:assert plus Node's native TS stripping, same as
 * schedule.check.mts. Everything imported here is React-free on purpose —
 * next-transition.ts pulls in only step-validation.ts and schedule.ts, and the
 * store is a type-only import, so no zustand/React ever loads.
 */
import assert from "node:assert/strict";
import { attemptNext, isResumePending } from "./next-transition.ts";
import { makeDefaultScheduleForm } from "./schedule.ts";
import type { DraftFields } from "./store/usePublicationDraftStore.ts";

const validStep1: DraftFields = {
  publicationId: null,
  step: 1,
  basicInfo: {
    campaignId: "camp-1",
    publicationType: "image",
    name: "Summer promo",
    description: "",
    priorityId: "normal",
    language: "th",
    tags: [],
  },
  assetItems: [],
  channelIds: [],
  scheduleForm: makeDefaultScheduleForm(),
};

const invalidStep1: DraftFields = {
  ...validStep1,
  basicInfo: { ...validStep1.basicInfo, name: "   " },
};

const ok = async () => undefined;
const boom = async () => {
  throw new Error("network down");
};

// A failing step never reaches persist — the wizard must not save a draft the
// user still has to fix, and must not advance.
let persistCalls = 0;
const counted = async () => {
  persistCalls += 1;
};

const invalid = await attemptNext(1, invalidStep1, counted);
assert.equal(invalid.kind, "invalid");
assert.deepEqual(invalid.kind === "invalid" && invalid.errors, ["กรุณากรอกชื่อ Publication"]);
assert.equal(persistCalls, 0);

// The happy path is the only outcome the caller may advance on.
assert.deepEqual(await attemptNext(1, validStep1, ok), { kind: "saved" });

// A save failure stays a failure — this is the regression that matters most:
// if this ever comes back "saved", the wizard advances past unsaved work.
const failed = await attemptNext(1, validStep1, boom);
assert.equal(failed.kind, "failed");
assert.equal(failed.kind === "failed" && failed.message, "network down");

// Non-Error throws still produce a usable message rather than "[object Object]".
const thrownString = await attemptNext(1, validStep1, async () => {
  throw "nope";
});
assert.equal(thrownString.kind === "failed" && thrownString.message, "Failed to save draft.");

// Retry after a failure: same inputs, working backend, resolves clean. The
// Retry button reuses handleNext, so this is literally the retry path.
assert.deepEqual(await attemptNext(1, validStep1, ok), { kind: "saved" });

// Later steps gate on their own fields, not step 1's.
assert.equal((await attemptNext(2, validStep1, ok)).kind, "invalid"); // no assets
assert.equal((await attemptNext(3, validStep1, ok)).kind, "invalid"); // no channels
assert.equal((await attemptNext(4, validStep1, ok)).kind, "saved"); // "now" is valid

// Resume guard: pending only while a ?id= is present and neither the finished
// fetch nor the store has caught up to it. Getting this wrong either flashes
// the previous draft or hangs the wizard on a blank render forever.
assert.equal(isResumePending(null, null, null), false); // fresh create, no ?id=
assert.equal(isResumePending("pub-1", null, null), true); // fetch in flight
assert.equal(isResumePending("pub-1", "pub-1", null), false); // fetch settled
assert.equal(isResumePending("pub-1", null, "pub-1"), false); // already in store
assert.equal(isResumePending("pub-2", "pub-1", "pub-1"), true); // switched drafts

console.log("next-transition.check.mts — all assertions passed");
