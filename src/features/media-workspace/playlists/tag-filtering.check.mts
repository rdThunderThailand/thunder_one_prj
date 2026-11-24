/** Run: node src/features/media-workspace/playlists/tag-filtering.check.mts */
import assert from "node:assert/strict";
import { filterByTag, tagCounts } from "./tag-filtering.ts";
import type { PlaylistListItem } from "./types";

const NEWS = { id: "tag-news", name: "News" };
const PROMO = { id: "tag-promo", name: "Promo" };

const row = (id: string, tags: { id: string; name: string }[]): PlaylistListItem =>
  ({ id, name: id, status: "active", item_count: 0, tags });

const playlists = [
  row("p-news-only", [NEWS]),
  row("p-both", [NEWS, PROMO]),
  row("p-promo-only", [PROMO]),
  row("p-none", []),
];

// Counts are derived from the rows themselves, sorted by name — an unused tag never
// appears (ADR 0060 §8a), so there is no "zero-count" entry to assert against.
assert.deepEqual(tagCounts(playlists), [
  { id: "tag-news", name: "News", count: 2 },
  { id: "tag-promo", name: "Promo", count: 2 },
]);

// A playlist with no `tags` array at all (deploy-ordering: older backend) counts as untagged.
assert.deepEqual(tagCounts([{ id: "p-legacy", name: "p-legacy", status: "active", item_count: 0 }]), []);

assert.deepEqual(filterByTag(playlists, "tag-news").map((p) => p.id), ["p-news-only", "p-both"]);
assert.deepEqual(filterByTag(playlists, "tag-promo").map((p) => p.id), ["p-both", "p-promo-only"]);
assert.deepEqual(filterByTag(playlists, "tag-nonexistent"), []);

console.log("tag-filtering.check.mts — all assertions passed");
