/**
 * Runnable check for the problem-target detection (ADR 0122 rule 17):
 *
 *     node src/features/media-workspace/publications/problem-targets.check.mts
 */
import assert from "node:assert/strict";
import { problemTargets, problemTargetText } from "./problem-targets.ts";

// Fields missing (Core without S1+S2): nothing is flagged.
assert.deepEqual(problemTargets([{ target_type: "channel", channel_id: "a", name: "Lobby" }]), []);
assert.deepEqual(problemTargets([{ target_type: "channel", channel_id: "a", name: "Lobby", status: null }]), []);

// Active and not deleted: fine.
assert.deepEqual(problemTargets([{ target_type: "channel", channel_id: "a", name: "Lobby", status: "active", deleted: false }]), []);

// Deleted wins, with the saved name; inactive and draft are flagged too.
const flagged = problemTargets([
  { target_type: "channel", channel_id: "a", name: "Lobby", status: "inactive", deleted: true },
  { target_type: "channel", channel_id: "b", name: "Floor 2", status: "inactive" },
  { target_type: "channel", channel_id: "c", name: "Draft one", status: "draft" },
  { target_type: "channel", channel_id: "d", name: null, deleted: true },
]);
assert.deepEqual(flagged, [
  { id: "a", name: "Lobby", deleted: true },
  { id: "b", name: "Floor 2", deleted: false },
  { id: "c", name: "Draft one", deleted: false },
  { id: "d", name: "(ไม่ทราบชื่อ)", deleted: true },
]);

// Groups and devices are never flagged, whatever they carry.
assert.deepEqual(
  problemTargets([
    { target_type: "group", group_id: "g", name: "Floor", status: "inactive", deleted: true },
    { target_type: "device", device_id: "x", name: "Box", deleted: true },
  ]),
  [],
);

assert.equal(problemTargetText(flagged[0]), "ช่องทาง Lobby ถูกลบแล้ว — นำออกก่อนเผยแพร่");
assert.equal(problemTargetText(flagged[1]), "ช่องทาง Floor 2 ยังไม่เปิดใช้งาน — เลือกช่องทางอื่นก่อนเผยแพร่");
console.log("problem-targets.check.mts — all assertions passed");
