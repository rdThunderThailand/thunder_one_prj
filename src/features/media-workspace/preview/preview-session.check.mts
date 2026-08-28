import assert from "node:assert/strict";
import { initialPreviewSession, reducePreviewSession } from "./preview-session.ts";

let session = reducePreviewSession(initialPreviewSession, "connect");
assert.deepEqual(session, { status: "connected", missedHeartbeats: 0 });
session = reducePreviewSession(session, "heartbeatMissed");
session = reducePreviewSession(session, "connect");
assert.deepEqual(session, { status: "connected", missedHeartbeats: 0 });
session = reducePreviewSession(session, "heartbeatReply");
assert.deepEqual(session, { status: "connected", missedHeartbeats: 0 });
session = reducePreviewSession(session, "heartbeatMissed");
session = reducePreviewSession(session, "heartbeatMissed");
assert.deepEqual(session, { status: "expired", missedHeartbeats: 2 });
assert.deepEqual(reducePreviewSession(initialPreviewSession, "close"), { status: "closed", missedHeartbeats: 0 });

console.log("preview-session.check.mts OK");
