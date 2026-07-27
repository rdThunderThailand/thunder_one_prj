"use client";

import { useMemo, useState } from "react";
import type { ContentItem, MediaAsset, PublicationType } from "../types";

type ContentStepProps = {
  publicationType?: PublicationType;
  items: ContentItem[];
  onChange: (items: ContentItem[]) => void;
  mediaAssets: MediaAsset[];
  loadingAssets: boolean;
  assetsError: string | null;
};

export function ContentStep({
  publicationType = "playlist",
  items,
  onChange,
  mediaAssets,
  loadingAssets,
  assetsError,
}: ContentStepProps) {
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | "image" | "video">("all");

  const isNoAssetType = publicationType === "html" || publicationType === "dynamic";
  const isSingleSelect = publicationType === "image" || publicationType === "video";

  const selectedMap = useMemo(() => {
    const map = new Map<string, ContentItem>();
    items.forEach((it) => map.set(it.media_asset_id, it));
    return map;
  }, [items]);

  const assetMap = useMemo(() => {
    const map = new Map<string, MediaAsset>();
    mediaAssets.forEach((a) => map.set(a.id, a));
    return map;
  }, [mediaAssets]);

  const filteredAssets = useMemo(() => {
    return mediaAssets.filter((asset) => {
      const matchKind = kindFilter === "all" || asset.kind === kindFilter;
      const titleText = asset.title ?? asset.file?.original_filename ?? asset.id;
      return matchKind && (!search.trim() || titleText.toLowerCase().includes(search.trim().toLowerCase()));
    });
  }, [mediaAssets, search, kindFilter]);

  const getDefaultDuration = (asset: MediaAsset): number | null => {
    return asset.kind === "image" ? 10 : (asset.duration_seconds ?? null);
  };

  const handleToggleAsset = (asset: MediaAsset) => {
    if (asset.approval_status !== "approved") return;
    const exists = selectedMap.has(asset.id);

    if (isSingleSelect) {
      onChange(exists ? [] : [{ media_asset_id: asset.id, position: 1, duration_seconds: getDefaultDuration(asset) }]);
    } else {
      if (exists) {
        onChange(items.filter((it) => it.media_asset_id !== asset.id).map((it, idx) => ({ ...it, position: idx + 1 })));
      } else {
        onChange([...items, { media_asset_id: asset.id, position: items.length + 1, duration_seconds: getDefaultDuration(asset) }]);
      }
    }
  };

  const handleDurationChange = (assetId: string, val: string) => {
    const num = val === "" ? null : Number(val);
    onChange(items.map((it) => (it.media_asset_id === assetId ? { ...it, duration_seconds: num !== null && !isNaN(num) && num > 0 ? num : null } : it)));
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const copy = [...items];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    onChange(copy.map((it, idx) => ({ ...it, position: idx + 1 })));
  };

  const handleRemove = (assetId: string) => {
    onChange(items.filter((it) => it.media_asset_id !== assetId).map((it, idx) => ({ ...it, position: idx + 1 })));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
  };

  if (isNoAssetType) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Publication type &quot;{publicationType}&quot; does not require media assets.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {assetsError && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200 dark:bg-red-950/30 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">{assetsError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Media Asset Library</h3>
            <span className="text-xs text-zinc-500">{filteredAssets.length} assets</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input type="text" placeholder="Search assets..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 rounded border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
            <div className="flex rounded border border-zinc-300 dark:border-zinc-700 overflow-hidden text-xs">
              {(["all", "image", "video"] as const).map((k) => (
                <button key={k} type="button" onClick={() => setKindFilter(k)} className={`px-3 py-1.5 capitalize font-medium ${kindFilter === k ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300"}`}>
                  {k}
                </button>
              ))}
            </div>
          </div>

          {loadingAssets ? (
            <p className="text-xs text-zinc-500 py-4 text-center">Loading assets…</p>
          ) : filteredAssets.length === 0 ? (
            <p className="text-xs text-zinc-500 py-4 text-center">No assets found.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {filteredAssets.map((asset) => {
                const isApproved = asset.approval_status === "approved";
                const isSelected = selectedMap.has(asset.id);
                const titleText = asset.title || asset.file?.original_filename || asset.id;
                const sizeText = formatFileSize(asset.file?.file_size_bytes);

                return (
                  <div key={asset.id} onClick={() => handleToggleAsset(asset)} className={`rounded border p-3 text-xs transition-colors ${!isApproved ? "opacity-50 cursor-not-allowed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50" : isSelected ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800 cursor-pointer" : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600 cursor-pointer bg-white dark:bg-zinc-900"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{titleText}</div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 uppercase">{asset.kind ?? "file"}</span>
                        {!isApproved && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">not approved</span>}
                        {isSelected && <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-medium text-white">Selected</span>}
                      </div>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                      {asset.width && asset.height && <span>{asset.width}×{asset.height}</span>}
                      {asset.duration_seconds !== undefined && asset.duration_seconds !== null && <span>{asset.duration_seconds}s</span>}
                      {sizeText && <span>{sizeText}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Selected Content ({items.length})</h3>
            {isSingleSelect && <span className="text-[11px] text-zinc-500">Single asset required</span>}
          </div>

          {items.length === 0 ? (
            <p className="text-xs text-zinc-500 py-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded">
              Select asset(s) from the library on the left.
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {items.map((item, index) => {
                const asset = assetMap.get(item.media_asset_id);
                const titleText = asset?.title || asset?.file?.original_filename || item.media_asset_id;

                return (
                  <div key={item.media_asset_id} className="flex items-center justify-between gap-3 rounded border border-zinc-200 p-2 text-xs dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="font-mono text-zinc-400 font-bold text-xs shrink-0">#{item.position}</span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">{titleText}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-zinc-500">Sec:</span>
                        <input type="number" min="1" placeholder="null" value={item.duration_seconds ?? ""} onChange={(e) => handleDurationChange(item.media_asset_id, e.target.value)} className="w-16 rounded border border-zinc-300 px-1.5 py-0.5 text-xs text-center dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                      </div>

                      {!isSingleSelect && (
                        <div className="flex items-center gap-0.5">
                          <button type="button" onClick={() => handleMove(index, "up")} disabled={index === 0} className="rounded px-1.5 py-0.5 border border-zinc-300 text-[10px] hover:bg-zinc-100 disabled:opacity-30 dark:border-zinc-700 dark:hover:bg-zinc-700">↑</button>
                          <button type="button" onClick={() => handleMove(index, "down")} disabled={index === items.length - 1} className="rounded px-1.5 py-0.5 border border-zinc-300 text-[10px] hover:bg-zinc-100 disabled:opacity-30 dark:border-zinc-700 dark:hover:bg-zinc-700">↓</button>
                        </div>
                      )}

                      <button type="button" onClick={() => handleRemove(item.media_asset_id)} className="rounded px-1.5 py-0.5 text-[11px] font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">Remove</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
