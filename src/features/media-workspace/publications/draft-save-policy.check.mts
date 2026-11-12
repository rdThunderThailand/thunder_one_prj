// Run: node src/features/media-workspace/publications/draft-save-policy.check.mts
import assert from "node:assert/strict";
import { draftHasContent, draftSavePolicy, requireCompleteDraftSave, type DraftPersistResult } from "./draft-save-policy.ts";
import { defaultScheduleDraft } from "./schedule-preset.ts";
import type { DraftFields } from "./store/usePublicationDraftStore.ts";

const draft: DraftFields = {
  publicationId: "pub-1",
  idempotencyKey: "idem-1",
  step: 1,
  furthestStep: 1,
  basicInfo: {
    publicationType: "image",
    name: "Previous draft",
    description: "",
    priorityId: "normal",
    tags: [],
  },
  assetItems: [],
  playlistId: "pl-1",
  compositionId: null,
  channelIds: ["ch-1"],
  groupIds: [],
  groupNamesById: {},
  // Today: a past start is invalid since ADR 0090, so a fixed date would rot.
  schedule: defaultScheduleDraft(),
};

assert.deepEqual(draftSavePolicy(draft, false), {
  shouldPersist: true, sendTargets: false, sendSchedule: false, isComplete: true,
});

// Program edits must survive step 3 -> Back -> Next/save from either earlier step.
for (const step of [1, 2, 3]) {
  assert.deepEqual(draftSavePolicy({ ...draft, step, furthestStep: 3 }, false), {
    shouldPersist: true, sendTargets: true, sendSchedule: true, isComplete: true,
  }, `Program reached, current step ${step}`);
}
assert.equal(draftSavePolicy({ ...draft, step: 3, furthestStep: 1 }, false).sendTargets, true);

const invalidSchedule = { ...draft.schedule, days: [] };
const incomplete = { ...draft, step: 2, furthestStep: 3, schedule: invalidSchedule };
assert.deepEqual(draftSavePolicy(incomplete, false), {
  shouldPersist: true, sendTargets: true, sendSchedule: false, isComplete: false,
});

// An untouched Program before step 3 is not part of this save.
assert.equal(draftSavePolicy({ ...draft, schedule: invalidSchedule }, false).isComplete, true);

const noName = { ...draft, basicInfo: { ...draft.basicInfo, name: "   " } };
assert.equal(draftSavePolicy(noName, false).shouldPersist, false);
assert.equal(draftSavePolicy(noName, false).isComplete, false);
assert.deepEqual(draftSavePolicy(noName, true), {
  shouldPersist: true, sendTargets: true, sendSchedule: true, isComplete: true,
});

const completeResult: DraftPersistResult = {
  kind: "saved", publicationId: "pub-1", draft, isComplete: true,
};
assert.equal(requireCompleteDraftSave(completeResult), completeResult, "returns the captured successful save");
assert.throws(() => requireCompleteDraftSave({ kind: "skipped", reason: "name" }));
assert.throws(() => requireCompleteDraftSave({ ...completeResult, draft: incomplete, isComplete: false }));

// This models only the sequencing contract with the real completion guard.
// It does not execute React handlers, network requests or store mutation.
async function transition(persist: () => Promise<DraftPersistResult>) {
  const calls: string[] = [];
  try {
    const result = requireCompleteDraftSave(await persist());
    calls.push(`mark:${result.publicationId}`);
    calls.push("clear", "apply");
  } catch {
    calls.push("error");
  }
  return calls;
}

assert.deepEqual(await transition(async () => completeResult), ["mark:pub-1", "clear", "apply"]);
assert.deepEqual(await transition(async () => ({ kind: "skipped", reason: "name" })), ["error"]);
assert.deepEqual(
  await transition(async () => ({ ...completeResult, draft: incomplete, isComplete: false })),
  ["error"],
  "invalid schedule remains unmarked and is not cleared",
);
assert.deepEqual(await transition(async () => { throw new Error("network failure"); }), ["error"]);

console.log("draft-save-policy.check.mts — all assertions passed");

// #331: nothing is saved until a content choice exists, whether the Draft is new or already saved.
const empty = { ...draft, playlistId: null };
assert.equal(draftHasContent(empty), false);
assert.equal(draftSavePolicy(empty, false).shouldPersist, false, "named, no content");
assert.equal(draftSavePolicy({ ...empty, compositionId: "co-1" }, false).shouldPersist, true);
assert.equal(
  draftSavePolicy({ ...empty, assetItems: [{ assetId: "a-1" } as unknown as DraftFields["assetItems"][number]] }, false).shouldPersist,
  true,
);
assert.throws(() => requireCompleteDraftSave({ kind: "skipped", reason: "content" }), /Content/);
