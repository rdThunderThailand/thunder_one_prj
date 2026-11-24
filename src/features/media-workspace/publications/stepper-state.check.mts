// Run: node src/features/media-workspace/publications/stepper-state.check.mts
import assert from "node:assert/strict";
import { getStepState, isStepSelectable } from "./stepper-state.ts";

// On step 2, furthest reached is 4: 1 done, 2 active, 3 still reachable, 4 reachable, 5 inert.
assert.equal(getStepState({ step: 1, currentStep: 2, furthestStep: 4 }), "complete");
assert.equal(getStepState({ step: 2, currentStep: 2, furthestStep: 4 }), "active");
assert.equal(getStepState({ step: 3, currentStep: 2, furthestStep: 4 }), "complete");
assert.equal(getStepState({ step: 4, currentStep: 2, furthestStep: 4 }), "reachable");
assert.equal(getStepState({ step: 5, currentStep: 2, furthestStep: 4 }), "upcoming");

// Fresh wizard: only step 1 reachable.
assert.equal(getStepState({ step: 1, currentStep: 1, furthestStep: 1 }), "active");
assert.equal(getStepState({ step: 2, currentStep: 1, furthestStep: 1 }), "upcoming");

assert.equal(isStepSelectable("active"), false);
assert.equal(isStepSelectable("upcoming"), false);
assert.equal(isStepSelectable("complete"), true);
assert.equal(isStepSelectable("reachable"), true);

console.log("ok");
