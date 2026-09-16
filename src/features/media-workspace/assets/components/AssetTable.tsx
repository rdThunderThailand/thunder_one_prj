import Link from "next/link";
import { MediaThumb } from "@/components/ui/MediaThumb";
import type { ContentFolder, MediaAsset } from "@/types/domain";
import { AssetActions, formatBytes, formatResolution } from "./AssetCard";

function formatUpdatedAt(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function AssetTable({ assets, trash, folders, onRefresh, previewUrls, thumbnailUrls, selectedIds, onSelectionChange }: {
  assets: MediaAsset[];
  trash: boolean;
  folders: ContentFolder[];
  onRefresh: () => void;
  previewUrls: Record<string, string>;
  thumbnailUrls: Record<string, string>;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
}) {
  const isAllSelected = assets.length > 0 && assets.every((asset) => selectedIds.has(asset.id));
  return <div className="overflow-x-auto">
    <table className="w-full min-w-[900px] table-fixed text-left text-sm">
      <thead><tr className="border-b border-zinc-100 text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <th className="w-10 py-2 pl-1"><input type="checkbox" aria-label="Select all media on this page" checked={isAllSelected} onChange={(event) => onSelectionChange(event.target.checked ? new Set(assets.map((asset) => asset.id)) : new Set())} /></th>
        <th className="w-[72px] py-2">Preview</th>
        <th className="py-2">Media</th>
        <th className="w-[90px] py-2">Type</th>
        <th className="w-[120px] py-2">Resolution</th>
        <th className="w-[100px] py-2">Size</th>
        <th className="w-[185px] py-2">Last updated</th>
        <th className="w-[230px] py-2 pr-1 text-right">Actions</th>
      </tr></thead>
      <tbody>{assets.map((asset) => {
        const label = asset.title ?? asset.file?.original_filename ?? "Untitled asset";
        return <tr key={asset.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
          <td className="py-3 pl-1"><input type="checkbox" aria-label={`Select ${label}`} checked={selectedIds.has(asset.id)} onChange={(event) => { const next = new Set(selectedIds); if (event.target.checked) next.add(asset.id); else next.delete(asset.id); onSelectionChange(next); }} /></td>
          <td className="py-3"><Link href={`/media-workspace/assets/${asset.id}`} aria-label={`View ${label}`}><MediaThumb url={previewUrls[asset.id]} thumbnailUrl={thumbnailUrls[asset.id]} kind={asset.kind} mimeType={asset.file?.mime_type} alt={label} className="h-10 w-16 rounded-md" /></Link></td>
          <td className="truncate py-3 pr-3"><Link href={`/media-workspace/assets/${asset.id}`} className="block truncate font-medium text-zinc-900 hover:text-indigo-600 dark:text-zinc-100">{label}</Link><p className="truncate text-xs text-zinc-500">{asset.tags?.map((tag) => tag.name).join(", ") || "No tags"}</p></td>
          <td className="py-3 text-zinc-600 dark:text-zinc-300">{asset.kind?.toUpperCase() ?? "FILE"}</td>
          <td className="py-3 text-zinc-600 dark:text-zinc-300">{formatResolution(asset)}</td>
          <td className="py-3 text-zinc-600 dark:text-zinc-300">{formatBytes(asset.file?.file_size_bytes)}</td>
          <td className="py-3 pr-3 text-zinc-500">{formatUpdatedAt(asset.updated_at ?? asset.created_at)}</td>
          <td className="py-3 pr-1"><AssetActions asset={asset} trash={trash} folders={folders} onRefresh={onRefresh} compact /></td>
        </tr>;
      })}</tbody>
    </table>
  </div>;
}
