// Turns a fetched `PlaylistDetail` into the fields the draft store needs, so every place
// that restores a playlist into the wizard (edit-mode hydration, the revision-conflict
// "โหลดใหม่" reload) goes through the same mapping. `metadata` was the field that kept
// getting forgotten when this was written out by hand at each call site — see
// docs/adr/0013-playlist-save-draft-button.md.

import { decodeMetadata } from "./metadata.ts";
import type { DraftItem, PlaylistDetail, PlaylistInfo, PlaylistItem, PlaylistPlayback } from "./types";

export type DraftFromDetail = {
  name: string;
  items: DraftItem[];
  playlistId: string;
  revision: number;
  info: PlaylistInfo;
  playback: PlaylistPlayback;
};

function detailToDraftItems(items: PlaylistItem[]): DraftItem[] {
  return [...items]
    .sort((a, b) => a.position - b.position)
    .map((item) => ({
      mediaAssetId: item.media_asset_id,
      title: item.title,
      durationSeconds: item.duration_seconds ?? null,
      transition: item.transition === "cut" ? ("cut" as const) : ("fade" as const),
    }));
}

export function playlistDetailToDraftFields(detail: PlaylistDetail): DraftFromDetail {
  const { info, playback } = decodeMetadata(detail.metadata);
  return {
    name: detail.name,
    items: detailToDraftItems(detail.items),
    playlistId: detail.id,
    revision: detail.revision,
    info,
    playback,
  };
}
