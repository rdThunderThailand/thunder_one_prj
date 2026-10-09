import assert from "node:assert/strict";
import { blockerSummary, isDeleteBlocked, isInUse, usageSummary } from "./asset-usage.ts";

const empty = { playlists: [], layouts: [], programs: [], coverOf: [], history: false };
const used = {
  ...empty,
  playlists: [{ id: "p1", name: "Lobby" }, { id: "p2", name: "Menu" }],
  programs: [{ id: "g1", name: "Morning", status: "active" as const, startsAt: null, endsAt: null, onAir: true }],
};

assert.equal(isInUse(undefined), false);
assert.equal(isInUse(empty), false);
// a cover or past broadcast alone is not Usage — trashing it must not warn
assert.equal(isInUse({ ...empty, coverOf: [{ id: "p1", name: "Lobby" }], history: true }), false);
assert.equal(isInUse(used), true);

assert.equal(usageSummary(empty), "");
assert.equal(usageSummary(used), "2 Playlists · 1 Program");

assert.equal(blockerSummary({ playlists: [], layouts: [], programs: [], history: true }), "Has broadcast history");
assert.equal(
  blockerSummary({ playlists: [{ id: "p1", name: "Lobby", trashed: true }], layouts: [{ id: "c1", name: "L", trashed: false }], programs: [], history: true }),
  "Has broadcast history · 1 Playlist · 1 Layout",
);

assert.equal(isDeleteBlocked({ deleted: false }), true);
assert.equal(isDeleteBlocked({ deleted: true }), false);
// an older Core route drops the result: treat as done, the refresh shows the truth
assert.equal(isDeleteBlocked({}), false);

console.log("asset-usage.check ok");
