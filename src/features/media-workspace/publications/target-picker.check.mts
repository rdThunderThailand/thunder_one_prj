import assert from "node:assert/strict";
import type { ChannelListItem } from "../channels/types/index.ts";
import {
  facetCounts,
  reachedChannels,
  selectionFromTargets,
  targetableChannels,
  targetsFromSelection,
  targetSummary,
  toggleId,
} from "./target-picker.ts";

const channel = (id: string, location: string | null, groups: string[] = []) =>
  ({
    id,
    name: `Ch ${id}`,
    lifecycle: "active",
    location: location ? { id: location, name: location } : null,
    groups: groups.map((g) => ({ id: g, name: g, playback_mode: "independent" })),
  }) as never;
const channels = [channel("a", "hq"), channel("b", "hq", ["g1"]), channel("c", "east", ["g1"]), channel("d", null)];

const current = [
  { target_type: "channel" as const, channel_id: "a", name: "Ch a" },
  { target_type: "group" as const, group_id: "g9", name: "Old group" },
  { target_type: "device" as const, device_id: "dev1", name: "Legacy" },
];
const selection = selectionFromTargets(current);
assert.deepEqual(selection, { channelIds: ["a"], groupIds: ["g9"] });

// A Group reaches its members; a Channel picked twice (directly and through a Group) counts once.
assert.deepEqual(reachedChannels(channels, { channelIds: ["b"], groupIds: ["g1"] }).map((c) => c.id), ["b", "c"]);
assert.deepEqual(targetSummary(channels, { channelIds: ["a", "d"], groupIds: ["g1"] }), { channels: 4, locations: 2 });

const next = targetsFromSelection(current, { channelIds: ["b"], groupIds: ["g9"] }, channels, [{ id: "g1", name: "G1" }]);
assert.deepEqual(next.map((t) => `${t.target_type}:${t.name}`), ["device:Legacy", "channel:Ch b", "group:Old group"]);

assert.deepEqual(toggleId(["a"], "b"), ["a", "b"]);
assert.deepEqual(toggleId(["a", "b"], "a"), ["b"]);
assert.equal(facetCounts(["x", "y", "x"]).get("x"), 2);
// A Tombstone is not in the list: what Core saved about it (ADR 0122 rule 17) survives Apply.
const kept = targetsFromSelection(
  [{ target_type: "channel", channel_id: "gone", name: "Lobby", status: "inactive", deleted: true }],
  { channelIds: ["gone"], groupIds: [] },
  channels,
  [],
);
assert.deepEqual(kept, [{ target_type: "channel", channel_id: "gone", name: "Lobby", status: "inactive", deleted: true }]);
assert.deepEqual(next.filter((t) => t.channel_id === "b").map((t) => "deleted" in t), [false]);

// ADR 0099 / 0129: only an Active Channel is offered as a Program target.
const lifecycles: Pick<ChannelListItem, "id" | "lifecycle">[] = [
  { id: "on", lifecycle: "active" },
  { id: "off", lifecycle: "inactive" },
  { id: "new", lifecycle: "draft" },
];
assert.deepEqual(targetableChannels(lifecycles as ChannelListItem[]).map((c) => c.id), ["on"]);
console.log("target-picker ok");
