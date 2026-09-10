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

// Step map (ADR 0072 §2): 1 Choose Content · 2 Prepare Content · 3 Program · 4 Review · 5 Publish.
const validDraft: DraftFields = {
  publicationId: null,
  idempotencyKey: "idem-key-1",
  step: 1,
  furthestStep: 1,
  basicInfo: {
    publicationType: "image",
    name: "Summer promo",
    description: "",
    priorityId: "normal",
    tags: [],
  },
  assetItems: [{ media_asset_id: "asset-1", duration_seconds: 10, transition: "cut" }],
  playlistId: null,
  compositionId: null,
  channelIds: ["ch-1"],
  scheduleForm: makeDefaultScheduleForm(),
};

// Step 1 (Choose Content) is invalid with nothing selected.
const noContent: DraftFields = { ...validDraft, assetItems: [] };
// Step 2 (Prepare Content) is invalid with a blank name.
const noName: DraftFields = {
  ...validDraft,
  basicInfo: { ...validDraft.basicInfo, name: "   " },
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

const invalid = await attemptNext(1, noContent, counted);
assert.equal(invalid.kind, "invalid");
assert.equal(persistCalls, 0);

// The happy path is the only outcome the caller may advance on.
assert.deepEqual(await attemptNext(1, validDraft, ok), { kind: "saved" });

// A save failure stays a failure — this is the regression that matters most:
// if this ever comes back "saved", the wizard advances past unsaved work.
const failed = await attemptNext(1, validDraft, boom);
assert.equal(failed.kind, "failed");
assert.equal(failed.kind === "failed" && failed.message, "network down");

// Non-Error throws still produce a usable message rather than "[object Object]".
const thrownString = await attemptNext(1, validDraft, async () => {
  throw "nope";
});
assert.equal(thrownString.kind === "failed" && thrownString.message, "Failed to save draft.");

// Retry after a failure: same inputs, working backend, resolves clean.
assert.deepEqual(await attemptNext(1, validDraft, ok), { kind: "saved" });

// Each step gates on its own fields.
const blankName = await attemptNext(2, noName, ok);
assert.equal(blankName.kind, "invalid");
assert.deepEqual(blankName.kind === "invalid" && blankName.errors, ["กรุณากรอกชื่อ Program"]);
assert.equal((await attemptNext(3, { ...validDraft, channelIds: [] }, ok)).kind, "invalid"); // no channels
assert.equal((await attemptNext(3, validDraft, ok)).kind, "saved"); // channel + "now" schedule
assert.equal((await attemptNext(4, noContent, ok)).kind, "saved"); // Review has no gate

// A composition draft with no Layout picked yet is invalid at step 1 (ADR 0049 §5).
const compositionNoPick = {
  ...validDraft,
  basicInfo: { ...validDraft.basicInfo, publicationType: "composition" as const },
  assetItems: [],
};
assert.equal((await attemptNext(1, compositionNoPick, ok)).kind, "invalid");
assert.equal((await attemptNext(1, { ...compositionNoPick, compositionId: "composition-1" }, ok)).kind, "saved");

// Resume guard: pending only while a ?id= is present and neither the finished
// fetch nor the store has caught up to it. Getting this wrong either flashes
// the previous draft or hangs the wizard on a blank render forever.
assert.equal(isResumePending(null, null, null), false); // fresh create, no ?id=
assert.equal(isResumePending("pub-1", null, null), true); // fetch in flight
assert.equal(isResumePending("pub-1", "pub-1", null), false); // fetch settled
assert.equal(isResumePending("pub-1", null, "pub-1"), false); // already in store
assert.equal(isResumePending("pub-2", "pub-1", "pub-1"), true); // switched drafts

console.log("next-transition.check.mts — all assertions passed");
