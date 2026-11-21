import assert from "node:assert/strict";
import { lifecycleActionsFor } from "./lifecycle-actions.ts";

assert.deepEqual(lifecycleActionsFor({ status: "active", hasPlayer: true, blockingPrograms: [] }), {
  canDeactivate: true,
  canActivate: false,
  activateBlockedReason: null,
  canDelete: true,
  blockedReason: null,
});

assert.deepEqual(lifecycleActionsFor({ status: "inactive", hasPlayer: true, blockingPrograms: [] }), {
  canDeactivate: false,
  canActivate: true,
  activateBlockedReason: null,
  canDelete: true,
  blockedReason: null,
});

const draftNoPlayer = lifecycleActionsFor({ status: "draft", hasPlayer: false, blockingPrograms: [] });
assert.equal(draftNoPlayer.canActivate, false);
assert.equal(draftNoPlayer.activateBlockedReason, "Select a Player first");
assert.equal(draftNoPlayer.canDelete, true);

const inactiveNoPlayer = lifecycleActionsFor({ status: "inactive", hasPlayer: false, blockingPrograms: [] });
assert.equal(inactiveNoPlayer.canActivate, false);
assert.equal(inactiveNoPlayer.activateBlockedReason, "Select a Player first");

// A live or scheduled Program locks Deactivate and Delete and names itself in the reason.
const locked = lifecycleActionsFor({
  status: "active",
  hasPlayer: true,
  blockingPrograms: [
    { id: "p1", name: "Summer Sale" },
    { id: "p2", name: "Lunch Menu" },
  ],
});
assert.equal(locked.canDeactivate, false);
assert.equal(locked.canDelete, false);
assert.equal(locked.blockedReason, "Locked while these Programs are live or scheduled: Summer Sale, Lunch Menu");

console.log("lifecycle-actions.check OK");
