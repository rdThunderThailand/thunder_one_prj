import type { PlaylistItem } from "@/types/domain";

export function firstPlaylistAssetId(
  items: Pick<PlaylistItem, "media_asset_id" | "position">[],
): string | undefined {
  return items.reduce<Pick<PlaylistItem, "media_asset_id" | "position"> | undefined>(
    (first, item) => (!first || item.position < first.position ? item : first),
    undefined,
  )?.media_asset_id;
}
