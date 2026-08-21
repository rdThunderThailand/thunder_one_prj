import * as assert from "node:assert";
import { paginate, sortChannels, groupByCategory } from "./list-filtering.ts";
import type { ChannelListItem } from "./types/index.ts";

const createChannel = (id: string, overrides: Partial<ChannelListItem>): ChannelListItem => ({
  id,
  name: id,
  description: null,
  lifecycle: "active",
  category: "dooh",
  channel_type: null,
  location: null,
  devices: [],
  expected_orientation: null,
  expected_resolution: null,
  default_playlist: null,
  revision: 1,
  updated_at: "",
  ...overrides,
});

// paginate clamps past end
assert.deepStrictEqual(paginate([1, 2, 3], 5, 2), { rows: [3], page: 2, totalPages: 2 });
assert.deepStrictEqual(paginate([], 1, 2), { rows: [], page: 1, totalPages: 1 });

// sortChannels flips with dir
const c1 = createChannel("A", { name: "A" });
const c2 = createChannel("B", { name: "B" });
const channels = [c2, c1];
assert.deepStrictEqual(sortChannels(channels, { key: "name", dir: "asc" }).map(c => c.id), ["A", "B"]);
assert.deepStrictEqual(sortChannels(channels, { key: "name", dir: "desc" }).map(c => c.id), ["B", "A"]);

// lastSeen puts null last in both directions
const cNull = createChannel("C", { devices: [] }); // null lastSeen
const cOld = createChannel("D", { devices: [{ id: "d1", name: "", code: "", health: "online", last_heartbeat_at: "2020-01-01T00:00:00Z", orientation: null, resolution: null }] });
const cNew = createChannel("E", { devices: [{ id: "e1", name: "", code: "", health: "online", last_heartbeat_at: "2024-01-01T00:00:00Z", orientation: null, resolution: null }] });

const withSeen = [cNull, cNew, cOld];
assert.deepStrictEqual(sortChannels(withSeen, { key: "lastSeen", dir: "asc" }).map(c => c.id), ["D", "E", "C"]);
assert.deepStrictEqual(sortChannels(withSeen, { key: "lastSeen", dir: "desc" }).map(c => c.id), ["E", "D", "C"]);

// groupByCategory keeps fixed order and drops empty
const toGroup = [
  createChannel("s1", { category: "social" }),
  createChannel("d1", { category: "dooh" }),
  createChannel("d2", { category: "dooh" }),
];
const grouped = groupByCategory(toGroup);
assert.strictEqual(grouped.length, 2);
assert.strictEqual(grouped[0].category, "dooh");
assert.deepStrictEqual(grouped[0].rows.map(c => c.id), ["d1", "d2"]); // preserves incoming order
assert.strictEqual(grouped[1].category, "social");
assert.deepStrictEqual(grouped[1].rows.map(c => c.id), ["s1"]);

console.log("src/features/channels/list-filtering.check.mts — all assertions passed");
