import type { MediaAsset, PublicationType, DraftAssetItem } from "./types";
import { isImageAsset } from "./draft-mapping.ts";

/** The asset kinds a publication type accepts. `playlist`, `html` and `dynamic`
 *  take no assets through this path at all. */
export function acceptedAssetKind(type: PublicationType): "image" | "video" | null {
  if (type === "image") return "image";
  if (type === "video") return "video";
  return null;
}

/** True when the asset may join the current selection for this publication type. */
export function canSelectAsset(type: PublicationType, asset: MediaAsset): boolean {
  const expectedKind = acceptedAssetKind(type);
  if (!expectedKind) return false;
  const isImage = isImageAsset(asset);
  return (expectedKind === "image" && isImage) || (expectedKind === "video" && !isImage);
}

/** Drops items whose asset no longer matches the publication type. Items whose asset
 *  is absent from `assets` are KEPT — mirrors dropUnapprovedItems, so a short or
 *  failed library load never silently wipes a valid selection. */
export function dropMismatchedItems(
  type: PublicationType,
  items: DraftAssetItem[],
  assets: MediaAsset[]
): DraftAssetItem[] {
  return items.filter((item) => {
    const asset = assets.find((a) => a.id === item.media_asset_id);
    if (!asset) return true;
    return canSelectAsset(type, asset);
  });
}
