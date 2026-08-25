// Public API for the "playlists" feature.
// Only export what other layers (app routes / other features) are allowed to consume.
export { PlaylistsListPage } from "./components/PlaylistsListPage";
export { CreatePlaylistPage } from "./components/CreatePlaylistPage";
export { PlaylistDetailPage } from "./components/PlaylistDetailPage";
export { fetchPlaylist, fetchPlaylists } from "./services/playlists-api";
// Read-side display helpers — publications' Step 5 preview needs a playlist's name,
// cover and duration without re-deriving them from raw metadata.
export { decodeMetadata, resolveCoverAssetId } from "./metadata";
export { statusBadge } from "./status-display";
export { formatDuration, totalDurationSeconds } from "./duration";
export type * from "./types";
