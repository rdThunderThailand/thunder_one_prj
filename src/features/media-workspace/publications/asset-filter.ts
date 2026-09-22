import type { MediaAsset } from "./types";

export type AssetPickerFilters = {
  query: string;
  kind: "all" | "image" | "video";
  folderId: string | null;
  tagId: string | null;
  status: string;
  resolution: string;
  minDuration: string;
  maxDuration: string;
};

export const defaultAssetPickerFilters: AssetPickerFilters = {
  query: "",
  kind: "all",
  folderId: "all",
  tagId: null,
  status: "all",
  resolution: "all",
  minDuration: "",
  maxDuration: "",
};

export function assetKind(asset: MediaAsset): "image" | "video" {
  return asset.kind === "video" || asset.file?.mime_type?.startsWith("video/") ? "video" : "image";
}

export function filterAssets(assets: MediaAsset[], filters: AssetPickerFilters): MediaAsset[] {
  const query = filters.query.trim().toLowerCase();
  const minDuration = Number(filters.minDuration);
  const maxDuration = Number(filters.maxDuration);

  return assets.filter((asset) => {
    const title = `${asset.title ?? ""} ${asset.file?.original_filename ?? ""} ${(asset.tags ?? []).map((tag) => tag.name).join(" ")} ${asset.width ?? ""}x${asset.height ?? ""}`.toLowerCase();
    const resolution = asset.width && asset.height ? `${asset.width}x${asset.height}` : "";
    const duration = asset.duration_seconds ?? 0;

    return (
      (!query || title.includes(query)) &&
      (filters.kind === "all" || assetKind(asset) === filters.kind) &&
      (!filters.folderId || filters.folderId === "all" || (filters.folderId === "uncategorized" ? !asset.folder_id : asset.folder_id === filters.folderId)) &&
      (!filters.tagId || asset.tags?.some((tag) => tag.id === filters.tagId)) &&
      (filters.status === "all" || asset.status === filters.status) &&
      (filters.resolution === "all" || resolution === filters.resolution) &&
      (!filters.minDuration || (Number.isFinite(minDuration) && duration >= minDuration)) &&
      (!filters.maxDuration || (Number.isFinite(maxDuration) && duration <= maxDuration))
    );
  });
}
