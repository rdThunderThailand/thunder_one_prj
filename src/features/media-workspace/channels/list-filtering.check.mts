import * as assert from "node:assert";
import { paginate, sortChannels } from "./list-filtering.ts";
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
  player: null,
  health: null,
  output_kind: "screen",
  display_config: null,
  expected_orientation: null,
  expected_resolution: null,
  default_playlist: null,
  revision: 1,
  updated_at: "",
  sync_enabled: false,
  direct_target_conflicts: [],
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

// location sorts alphabetically, null last (ADR 0074 D1's Location column)
const cNoLocation = createChannel("C", { location: null });
const cAlpha = createChannel("D", { location: { id: "l1", name: "Alpha Mall" } });
const cBeta = createChannel("E", { location: { id: "l2", name: "Beta Mall" } });

const withLocation = [cNoLocation, cBeta, cAlpha];
assert.deepStrictEqual(sortChannels(withLocation, { key: "location", dir: "asc" }).map(c => c.id), ["D", "E", "C"]);
assert.deepStrictEqual(sortChannels(withLocation, { key: "location", dir: "desc" }).map(c => c.id), ["E", "D", "C"]);

// status sorts best-health first (online < warning < offline < no_player) — ADR 0074 §4
const cOnline = createChannel("F", { health: "online" });
const cWarning = createChannel("G", { health: "warning" });
const cOffline = createChannel("H", { health: "offline" });
const cNoPlayer = createChannel("I", { health: null });

const withStatus = [cNoPlayer, cOffline, cOnline, cWarning];
assert.deepStrictEqual(
  sortChannels(withStatus, { key: "status", dir: "asc" }).map(c => c.id),
  ["F", "G", "H", "I"],
);
assert.deepStrictEqual(
  sortChannels(withStatus, { key: "status", dir: "desc" }).map(c => c.id),
  ["I", "H", "G", "F"],
);

console.log("src/features/channels/list-filtering.check.mts — all assertions passed");
