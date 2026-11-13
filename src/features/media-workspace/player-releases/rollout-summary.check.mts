// node rollout-summary.check.mts
import assert from "node:assert/strict";
import { failureBudget, freeSlots, pauseReasonText } from "./rollout-summary.ts";

assert.equal(freeSlots(3, 5), 2);
assert.equal(freeSlots(3, 3), 0);
assert.equal(freeSlots(3, 2), 0, "a lowered cap never shows negative slots");
assert.deepEqual(failureBudget(1, 1, 3), { used: 2, limit: 3, isAtLimit: false });
assert.equal(failureBudget(1, 1, 2).isAtLimit, true, "failed + timed out count together");
assert.match(pauseReasonText("failure_limit") ?? "", /automatically/);
assert.equal(pauseReasonText(null), null);
console.log("rollout-summary ok");
