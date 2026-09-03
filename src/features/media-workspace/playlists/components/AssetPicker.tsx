"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
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

export function AssetPicker({
  assets,
  loading,
  selectedIds,
  onToggle,
  folders,
  tags,
}: {
  assets: MediaAsset[];
  loading: boolean;
  selectedIds: string[];
  onToggle: (asset: MediaAsset) => void;
  /** When passed, a Folder filter is shown. */
  folders?: ContentFolder[];
  /** When passed, a Tag filter is shown. */
  tags?: Tag[];
}) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [folderId, setFolderId] = useState("");
  const [tagId, setTagId] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return assets.filter((a) => {
      if (kind && a.kind !== kind) return false;
      if (folderId && (a.folder_id ?? "") !== folderId) return false;
      if (tagId && !(a.tags ?? []).some((t) => t.id === tagId)) return false;
      if (!needle) return true;
      return (a.title ?? a.file?.original_filename ?? "").toLowerCase().includes(needle);
    });
  }, [assets, kind, folderId, tagId, query]);

  const visibleIds = useMemo(() => filtered.map((a) => a.id), [filtered]);
  const previews = usePreviewUrls(visibleIds);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหา media จากชื่อ..."
            className={`${inputClasses} pl-9`}
          />
        </div>
        <div className="w-36">
          <Select value={kind} options={KIND_OPTIONS} onChange={(e) => setKind(e.target.value)} />
        </div>
        {folders && (
          <div className="w-40">
            <Select
              value={folderId}
              options={[{ value: "", label: "All Folders" }, ...folders.map((f) => ({ value: f.id, label: f.name }))]}
              onChange={(e) => setFolderId(e.target.value)}
            />
          </div>
        )}
        {tags && (
          <div className="w-36">
            <Select
              value={tagId}
              options={[{ value: "", label: "All Tags" }, ...tags.map((t) => ({ value: t.id, label: t.name }))]}
              onChange={(e) => setTagId(e.target.value)}
            />
          </div>
        )}
        <span className="text-sm text-zinc-500 dark:text-zinc-400">เลือกแล้ว {selectedIds.length} ชิ้น</span>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-zinc-400">กำลังโหลด media...</p>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-400">
          {assets.length === 0 ? "ยังไม่มี media ในคลัง" : "ไม่พบ media ที่ตรงกับที่ค้นหา"}
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {filtered.map((asset) => {
            const selected = selectedIds.includes(asset.id);
            const label = asset.title ?? asset.file?.original_filename ?? asset.id;
            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => onToggle(asset)}
                aria-pressed={selected}
                className={`flex flex-col gap-2 rounded-xl border p-2 text-left transition-colors ${
                  selected
                    ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10"
                    : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                }`}
              >
                <div className="relative">
                  <MediaThumb
                    url={previews.urls[asset.id]}
                    kind={asset.kind}
                    mimeType={asset.file?.mime_type}
                    alt={label}
                    className="h-28 w-full rounded-lg"
                  />
                  {asset.duration_seconds != null && (
                    <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      {formatDuration(asset.duration_seconds)}
                    </span>
                  )}
                </div>
                <span className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">{label}</span>
                <span className="flex items-center gap-2">
                  <Badge color={asset.kind === "video" ? "blue" : "indigo"} variant="pill">
                    {asset.kind ?? "file"}
                  </Badge>
                  {selected && (
                    <Badge color="green" variant="pill">
                      Selected
                    </Badge>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
