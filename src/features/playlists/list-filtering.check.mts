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
    created_by: { id: "u-1", display_name: "Kantida" },
    metadata: meta({ playlist_type: "standard", campaign_id: "c-1" }),
  }),
  row({
    id: "coffee",
    name: "Coffee Corner Loop",
    status: "draft",
    created_by: { id: "u-2", display_name: "Nattapong" },
    metadata: meta({ playlist_type: "loop", campaign_id: "c-2" }),
  }),
  row({
    id: "legacy",
    name: "Legacy no metadata",
    status: "inactive",
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

assert.deepEqual(summarize(playlists), { total: 3, active: 1, inactive: 1, draft: 1 });
assert.deepEqual(summarize([]), { total: 0, active: 0, inactive: 0, draft: 0 });

// A copy never collides with a name already on the page.
assert.equal(copyName("KFC Wednesday", []), "KFC Wednesday (Copy)");
assert.equal(copyName("KFC Wednesday", ["KFC Wednesday (Copy)"]), "KFC Wednesday (Copy 2)");
assert.equal(
  copyName("KFC Wednesday", ["KFC Wednesday (Copy)", "KFC Wednesday (Copy 2)"]),
  "KFC Wednesday (Copy 3)"
);
// Stays inside the column's 200-char limit however long the source name is.
assert.ok(copyName("x".repeat(400), []).length <= 200);

console.log("list-filtering.check.mts — all assertions passed");
