/**
 * Runnable check for the Channel scope URL round-trip:
 *
 *     node src/features/media-workspace/channels/channel-scope.check.mts
 */
import assert from "node:assert/strict";
import { ALL_CHANNELS, readChannelScope, sameScope, writeChannelScope } from "./channel-scope.ts";

const p = (qs: string) => new URLSearchParams(qs);

assert.deepEqual(readChannelScope(p("")), ALL_CHANNELS);
assert.deepEqual(readChannelScope(p("group=g1")), { kind: "group", id: "g1" });
assert.deepEqual(readChannelScope(p("channel=c1")), { kind: "channel", id: "c1" });
assert.deepEqual(readChannelScope(p("group=g1&channel=c1")), { kind: "group", id: "g1" });
assert.deepEqual(readChannelScope(p("group=&channel=")), ALL_CHANNELS);

assert.equal(writeChannelScope({ kind: "group", id: "g2" }, p("channel=c1&date=2026-10-06")).toString(), "date=2026-10-06&group=g2");
assert.equal(writeChannelScope({ kind: "channel", id: "c2" }, p("group=g1")).toString(), "channel=c2");
assert.equal(writeChannelScope(ALL_CHANNELS, p("group=g1&date=2026-10-06")).toString(), "date=2026-10-06");

assert.ok(sameScope(ALL_CHANNELS, ALL_CHANNELS));
assert.ok(sameScope({ kind: "group", id: "a" }, { kind: "group", id: "a" }));
assert.ok(!sameScope({ kind: "group", id: "a" }, { kind: "channel", id: "a" }));
assert.ok(!sameScope({ kind: "group", id: "a" }, ALL_CHANNELS));
console.log("channel-scope.check: ok");
