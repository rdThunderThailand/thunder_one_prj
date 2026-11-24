/**
 * Runnable check for the problem-target detection (ADR 0122 rule 17):
 *
 *     node src/features/media-workspace/publications/problem-targets.check.mts
 */
import assert from "node:assert/strict";
import { problemTargets, problemTargetText, selectedProblemTargets, unlistedPicksText } from "./problem-targets.ts";

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

// The wizard's selected problem targets (ADR 0122 rule 17, 2026-11-24).
const saved = [{ id: "tomb", name: "Old lobby", deleted: true }, { id: "gone", name: "Unselected", deleted: true }];
const list = [
  { id: "ok", name: "Lobby", status: "active" as const },
  { id: "off", name: "Floor 2", status: "inactive" as const },
  { id: "draft", name: "New one", status: "draft" as const },
];

// Before the list loads (or when it failed), only saved problem targets that are still selected count.
assert.deepEqual(selectedProblemTargets(["tomb", "missing", "off"], saved, null), {
  targets: [{ id: "tomb", name: "Old lobby", deleted: true }],
  unlistedIds: [],
});

// Loaded: a Tombstone keeps its saved name and is not unlisted, though the list lacks it; an inactive or
// draft pick gets its listed name; an id missing from the list is unlisted; an Active pick is fine.
assert.deepEqual(selectedProblemTargets(["ok", "tomb", "off", "missing", "draft", "other"], saved, list), {
  targets: [
    { id: "tomb", name: "Old lobby", deleted: true },
    { id: "off", name: "Floor 2", deleted: false },
    { id: "draft", name: "New one", deleted: false },
  ],
  unlistedIds: ["missing", "other"],
});

// A saved problem target that is also in the list is listed once, under its saved flag.
assert.deepEqual(
  selectedProblemTargets(["off"], [{ id: "off", name: "Floor 2 (saved)", deleted: false }], list).targets,
  [{ id: "off", name: "Floor 2 (saved)", deleted: false }],
);

// Nothing selected: nothing to say, even against an empty list.
assert.deepEqual(selectedProblemTargets([], saved, []), { targets: [], unlistedIds: [] });

assert.equal(unlistedPicksText(2), "ช่องทางที่เลือกไว้ 2 รายการไม่มีในระบบแล้ว — นำออกก่อนบันทึกหรือเผยแพร่");
console.log("problem-targets.check.mts — all assertions passed");
