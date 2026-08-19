/** Run: node src/features/playlists/list-filtering.check.mts */
import assert from "node:assert/strict";
import { copyName, filterPlaylists, paginate, playlistType, summarize } from "./list-filtering.ts";
import type { PlaylistListItem } from "../../types/domain.ts";

const meta = (info: Record<string, unknown>) => ({ v: 1, info });

const row = (over: Partial<PlaylistListItem> & { id: string }): PlaylistListItem => ({
  name: over.id,
  status: "active",
  item_count: 0,
  ...over,
});

const playlists: PlaylistListItem[] = [
  row({
    id: "kfc",
    name: "KFC Wednesday",
    publication_count: 2,
    created_by: { id: "u-1", display_name: "Kantida" },
    metadata: meta({ playlist_type: "standard", campaign_id: "c-1" }),
  }),
  row({
    id: "coffee",
    name: "Coffee Corner Loop",
    status: "draft",
    publication_count: 1,
    created_by: { id: "u-2", display_name: "Nattapong" },
    metadata: meta({ playlist_type: "loop", campaign_id: "c-2" }),
  }),
  row({
    id: "legacy",
    name: "Legacy no metadata",
    status: "active",
    publication_count: 0,
    created_by: { id: "u-1", display_name: "Kantida" },
  }),
];

const all = { tab: "all", currentUserId: "u-1", query: "", status: "all", type: "all", campaignId: "all" } as const;

assert.equal(filterPlaylists(playlists, all).length, 3);

// A row with no metadata counts as standard, so the Type filter can never hide a row
// whose Type column reads "standard".
assert.equal(playlistType(playlists[2]!), "standard");
assert.deepEqual(
  filterPlaylists(playlists, { ...all, type: "standard" }).map((p) => p.id),
  ["kfc", "legacy"]
);

// Ownership tab.
assert.deepEqual(filterPlaylists(playlists, { ...all, tab: "mine" }).map((p) => p.id), ["kfc", "legacy"]);
// Session not resolved yet: "mine" matches nothing rather than everything.
assert.equal(filterPlaylists(playlists, { ...all, tab: "mine", currentUserId: null }).length, 0);

// Filters stack, and search is case-insensitive on a substring.
assert.deepEqual(
  filterPlaylists(playlists, { ...all, tab: "mine", status: "active", query: "wednes" }).map((p) => p.id),
  ["kfc"]
);
assert.equal(filterPlaylists(playlists, { ...all, tab: "mine", campaignId: "c-2" }).length, 0);
assert.deepEqual(filterPlaylists(playlists, { ...all, campaignId: "c-2" }).map((p) => p.id), ["coffee"]);

// Pagination clamps instead of stranding the view on an empty page.
assert.deepEqual(paginate([1, 2, 3, 4, 5], 2, 2), { rows: [3, 4], page: 2, totalPages: 3 });
assert.deepEqual(paginate([1, 2, 3, 4, 5], 9, 2), { rows: [5], page: 3, totalPages: 3 });
assert.deepEqual(paginate([1, 2, 3], 0, 10), { rows: [1, 2, 3], page: 1, totalPages: 1 });
assert.deepEqual(paginate([], 4, 10), { rows: [], page: 1, totalPages: 1 });

// "legacy" is stored as active but nothing references it, so both the cards and the
// Inactive filter must read it as inactive — that derivation is the whole point of 0028.
assert.deepEqual(summarize(playlists), { total: 3, active: 1, inactive: 1, draft: 1 });
assert.deepEqual(summarize([]), { total: 0, active: 0, inactive: 0, draft: 0 });
assert.deepEqual(filterPlaylists(playlists, { ...all, status: "inactive" }).map((p) => p.id), ["legacy"]);
assert.deepEqual(filterPlaylists(playlists, { ...all, status: "active" }).map((p) => p.id), ["kfc"]);
// A row the backend has not caught up with yet keeps its stored status instead of
// collapsing into Inactive.
assert.deepEqual(
  summarize([row({ id: "pending", status: "active" })]),
  { total: 1, active: 1, inactive: 0, draft: 0 }
);

// A copy never collides with a name already on the page.
assert.equal(copyName("KFC Wednesday", []), "KFC Wednesday (Copy)");
assert.equal(copyName("KFC Wednesday", ["KFC Wednesday (Copy)"]), "KFC Wednesday (Copy 2)");
assert.equal(
  copyName("KFC Wednesday", ["KFC Wednesday (Copy)", "KFC Wednesday (Copy 2)"]),
  "KFC Wednesday (Copy 3)"
);
// Stays inside the column's 200-char limit however long the source name is.
assert.ok(copyName("x".repeat(400), []).length <= 200);

// Sorting
import { sortPlaylists } from "./list-filtering.ts";

const campaignNames = { "c-1": "Beta Campaign", "c-2": "Alpha Campaign" };
// Update playlists list to be more comprehensive for sorting tests
const p1 = row({
  id: "p1",
  name: "B Playlist",
  status: "active",
  publication_count: 1, // referenced -> active (0)
  total_duration_seconds: 100,
  updated_at: "2024-01-02",
  metadata: meta({ campaign_id: "c-1" }) // "Beta Campaign"
});
const p2 = row({
  id: "p2",
  name: "A Playlist",
  status: "draft", // draft wins over the count (2)
  publication_count: 1,
  total_duration_seconds: 50,
  updated_at: "2024-01-01",
  metadata: meta({ campaign_id: "c-2" }) // "Alpha Campaign"
});
const p3 = row({
  id: "p3",
  name: "C Playlist",
  status: "active",
  publication_count: 0, // referenced by nobody -> derives to inactive (1)
  total_duration_seconds: undefined, // empty
  updated_at: "invalid-date", // empty
});
const p4 = row({
  id: "p4",
  name: "C Playlist", // tie on name
  status: "active",
  publication_count: 2, // referenced -> active (0)
  total_duration_seconds: undefined, // empty
  created_at: "invalid-date", // empty
});
const sortInput = [p1, p2, p3, p4];
// name asc -> A (p2), B (p1), C (p3), C (p4)
assert.deepEqual(
  sortPlaylists(sortInput, { key: "name", dir: "asc" }, campaignNames).map(p => p.id),
  ["p2", "p1", "p3", "p4"]
);
// name desc -> C (p3), C (p4), B (p1), A (p2)
assert.deepEqual(
  sortPlaylists(sortInput, { key: "name", dir: "desc" }, campaignNames).map(p => p.id),
  ["p3", "p4", "p1", "p2"]
);

// duration asc -> 50 (p2), 100 (p1), empty (p3, p4)
assert.deepEqual(
  sortPlaylists(sortInput, { key: "duration", dir: "asc" }, campaignNames).map(p => p.id),
  ["p2", "p1", "p3", "p4"] // tiebreak: p3 < p4 in id
);
// duration desc -> 100 (p1), 50 (p2), empty (p3, p4)
assert.deepEqual(
  sortPlaylists(sortInput, { key: "duration", dir: "desc" }, campaignNames).map(p => p.id),
  ["p1", "p2", "p3", "p4"]
);

// status asc -> active (p1, p4), inactive (p3), draft (p2) — p3 is stored "active",
// so this only holds if the sort derives the status the badge shows.
assert.deepEqual(
  sortPlaylists(sortInput, { key: "status", dir: "asc" }, campaignNames).map(p => p.id),
  ["p1", "p4", "p3", "p2"] // p1 and p4 tiebreak on name B vs C
);

// campaign asc -> Alpha (p2), Beta (p1), empty (p3, p4)
assert.deepEqual(
  sortPlaylists(sortInput, { key: "campaign", dir: "asc" }, campaignNames).map(p => p.id),
  ["p2", "p1", "p3", "p4"]
);

// updated desc -> 2024-01-02 (p1), 2024-01-01 (p2), empty (p3, p4)
assert.deepEqual(
  sortPlaylists(sortInput, { key: "updated", dir: "desc" }, campaignNames).map(p => p.id),
  ["p1", "p2", "p3", "p4"]
);

// stable sort and non-mutating
const orig = [...sortInput];
sortPlaylists(sortInput, { key: "name", dir: "asc" }, campaignNames);
assert.deepEqual(sortInput, orig, "sortPlaylists mutated its input");

console.log("list-filtering.check.mts — all assertions passed");
