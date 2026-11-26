import assert from "node:assert/strict";
import { RESULT_STALE, TASK_CLOSED, myTaskHref, taskOpen, writeFailure } from "./my-tasks.ts";

assert.equal(myTaskHref("a b"), "/asset-workspace/my-tasks/a%20b");
assert.equal(taskOpen("In Progress"), true);
for (const s of ["Draft", "Completed", "Closed", "Cancelled"] as const) assert.equal(taskOpen(s), false);

assert.deepEqual(writeFailure("INVALID_STATE", "x"), { message: TASK_CLOSED, reload: true });
assert.deepEqual(writeFailure("STALE", "x"), { message: RESULT_STALE, reload: true });
assert.equal(writeFailure("NOT_FOUND", "x").reload, true);
assert.deepEqual(writeFailure("VALIDATION", "Bad note"), { message: "Bad note", reload: false });

console.log("my-tasks: ok");
