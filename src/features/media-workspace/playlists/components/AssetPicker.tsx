"use client";

import { useMemo } from "react";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { SearchIcon } from "@/components/ui/icons";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import type { ContentFolder, MediaAsset, Tag } from "@/types/domain";
import { formatDuration } from "../duration";
import { Select, inputClasses } from "./form";

const KIND_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
];

export type AssetPickerFilters = {
  query: string;
  kind: string;
  folderId: string;
  tagId: string;
};

export function AssetPicker({
  assets,
  loading,
  selectedIds,
  onToggle,
  folders,
  tags,
  filters,
  onFiltersChange,
}: {
  assets: MediaAsset[];
  loading: boolean;
  selectedIds: string[];
  onToggle: (asset: MediaAsset) => void;
  /** When passed, a Folder filter is shown. */
  folders?: ContentFolder[];
  /** When passed, a Tag filter is shown. */
  tags?: Tag[];
  filters: AssetPickerFilters;
  onFiltersChange: (patch: Partial<AssetPickerFilters>) => void;
}) {
  const filtered = useMemo(() => {
    const needle = filters.query.trim().toLowerCase();
    return assets.filter((a) => {
      if (filters.kind && a.kind !== filters.kind) return false;
      if (filters.folderId && (a.folder_id ?? "") !== filters.folderId) return false;
      if (filters.tagId && !(a.tags ?? []).some((t) => t.id === filters.tagId)) return false;
      if (!needle) return true;
      return (a.title ?? a.file?.original_filename ?? "").toLowerCase().includes(needle);
    });
  }, [assets, filters]);

  const visibleIds = useMemo(() => filtered.map((a) => a.id), [filtered]);
  const previews = usePreviewUrls(visibleIds);

  return (
    <div>
      <div className="flex flex-col gap-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={filters.query}
            onChange={(e) => onFiltersChange({ query: e.target.value })}
            placeholder="ค้นหา media จากชื่อ..."
            className={`${inputClasses} pl-9`}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select value={filters.kind} options={KIND_OPTIONS} onChange={(e) => onFiltersChange({ kind: e.target.value })} />
          {folders && (
            <Select
              value={filters.folderId}
              options={[{ value: "", label: "All Folders" }, ...folders.map((f) => ({ value: f.id, label: f.name }))]}
              onChange={(e) => onFiltersChange({ folderId: e.target.value })}
            />
          )}
          {tags && (
            <Select
              value={filters.tagId}
              options={[{ value: "", label: "All Tags" }, ...tags.map((t) => ({ value: t.id, label: t.name }))]}
              onChange={(e) => onFiltersChange({ tagId: e.target.value })}
            />
          )}
        </div>
        <span className="text-sm text-muted-foreground">เลือกแล้ว {selectedIds.length} ชิ้น</span>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">กำลังโหลด media...</p>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {assets.length === 0 ? "ยังไม่มี media ในคลัง" : "ไม่พบ media ที่ตรงกับที่ค้นหา"}
        </p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          {filtered.map((asset) => {
            const selected = selectedIds.includes(asset.id);
            const label = asset.title ?? asset.file?.original_filename ?? asset.id;
            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => onToggle(asset)}
                aria-pressed={selected}
                className={`flex w-full items-center gap-3 border-b border-border p-3 text-left transition-colors last:border-b-0 ${
                  selected
                    ? "border-primary bg-primary-soft"
                    : "border-border hover:bg-muted"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  readOnly
                  aria-label={`Select ${label}`}
                  className="h-4 w-4 shrink-0 accent-primary"
                />
                <MediaThumb
                  url={previews.urls[asset.id]}
                  kind={asset.kind}
                  mimeType={asset.file?.mime_type}
                  alt={label}
                  className="h-12 w-16 shrink-0 rounded-lg"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{label}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {asset.kind ?? "file"}{asset.duration_seconds != null ? ` · ${formatDuration(asset.duration_seconds)}` : ""}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
