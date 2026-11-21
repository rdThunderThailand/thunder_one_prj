import assert from "node:assert/strict";
import { lifecycleActionsFor } from "./lifecycle-actions.ts";

assert.deepEqual(lifecycleActionsFor({ status: "active", hasPlayer: true }), {
  canDeactivate: true,
  canActivate: false,
  activateBlockedReason: null,
  canDelete: false,
});

assert.deepEqual(lifecycleActionsFor({ status: "inactive", hasPlayer: true }), {
  canDeactivate: false,
  canActivate: true,
  activateBlockedReason: null,
  canDelete: false,
});

const draftNoPlayer = lifecycleActionsFor({ status: "draft", hasPlayer: false });
assert.equal(draftNoPlayer.canActivate, false);
assert.equal(draftNoPlayer.activateBlockedReason, "Select a Player first");
assert.equal(draftNoPlayer.canDelete, true);

const inactiveNoPlayer = lifecycleActionsFor({ status: "inactive", hasPlayer: false });
assert.equal(inactiveNoPlayer.canActivate, false);
assert.equal(inactiveNoPlayer.activateBlockedReason, "Select a Player first");

console.log("lifecycle-actions.check OK");
