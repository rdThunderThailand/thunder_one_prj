// Client-side tag filtering for the playlists list — the Tags-tab counterpart to
// folder-filtering.ts. `media_playlists_list` returns each row's `tags` (Thunder_Core #41),
// so the Tags tab's list and its counts are derived from those rows rather than the
// tenant's full vocabulary: a tag no Playlist uses does not appear (ADR 0060 §8a).
// Kept pure — checkable with node:assert, see tag-filtering.check.mts.

export { filterByTag, tagCounts } from "../content-library/tag-filtering.ts";
export type { TagCount } from "../content-library/TagsRail";
