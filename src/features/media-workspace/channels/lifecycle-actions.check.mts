import assert from "node:assert/strict";
import { canBeProgramTarget, lifecycleActionsFor } from "./lifecycle-actions.ts";

assert.deepEqual(lifecycleActionsFor({ lifecycle: "active", hasPlayer: true, blockingPrograms: [] }), {
  canDeactivate: true,
  canActivate: false,
  activateBlockedReason: null,
  canDelete: true,
  blockedReason: null,
});

assert.deepEqual(lifecycleActionsFor({ lifecycle: "inactive", hasPlayer: true, blockingPrograms: [] }), {
  canDeactivate: false,
  canActivate: true,
  activateBlockedReason: null,
  canDelete: true,
  blockedReason: null,
});

const draftNoPlayer = lifecycleActionsFor({ lifecycle: "draft", hasPlayer: false, blockingPrograms: [] });
assert.equal(draftNoPlayer.canActivate, false);
assert.equal(draftNoPlayer.activateBlockedReason, "Select a Player first");
assert.equal(draftNoPlayer.canDelete, true);

const inactiveNoPlayer = lifecycleActionsFor({ lifecycle: "inactive", hasPlayer: false, blockingPrograms: [] });
assert.equal(inactiveNoPlayer.canActivate, false);
assert.equal(inactiveNoPlayer.activateBlockedReason, "Select a Player first");

// A live or scheduled Program locks Deactivate and Delete and names itself in the reason.
const locked = lifecycleActionsFor({
  lifecycle: "active",
  hasPlayer: true,
  blockingPrograms: [
    { id: "p1", name: "Summer Sale" },
    { id: "p2", name: "Lunch Menu" },
  ],
});
assert.equal(locked.canDeactivate, false);
assert.equal(locked.canDelete, false);
assert.equal(locked.blockedReason, "Locked while these Programs are live or scheduled: Summer Sale, Lunch Menu");

// ADR 0099 / 0129: only an Active Channel can be a Program target.
assert.equal(canBeProgramTarget({ lifecycle: "active" }), true);
assert.equal(canBeProgramTarget({ lifecycle: "inactive" }), false);
assert.equal(canBeProgramTarget({ lifecycle: "draft" }), false);

console.log("lifecycle-actions.check OK");
