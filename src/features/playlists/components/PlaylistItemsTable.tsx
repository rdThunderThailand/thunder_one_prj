import { Card } from "@/components/ui/Card";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { formatBytes, type PlaylistTotals } from "../totals";
import type { PreviewUrls } from "@/lib/api/media-api";
import type { MediaAsset } from "@/types/domain";
import type { PlaylistItem } from "../types";

export function PlaylistItemsTable({
  items,
  assetsById,
  previews,
  selectedItem,
  onSelect,
  totals,
}: {
  items: PlaylistItem[];
  assetsById: Record<string, MediaAsset>;
  previews: PreviewUrls;
  selectedItem: PlaylistItem | null;
  onSelect: (item: PlaylistItem) => void;
  totals: PlaylistTotals;
}) {
  return (
    <Card className="p-5">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Media Content</h2>
      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-400">Playlist นี้ยังไม่มีสื่อ</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <th className="py-2 pr-2 pl-1">#</th>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Resolution</th>
                <th className="py-2 pr-3">Size</th>
                <th className="py-2 pr-3">Length</th>
                <th className="py-2">Transition</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const asset = assetsById[item.media_asset_id];
                const name = item.title || asset?.file?.original_filename || item.media_asset_id;
                const resolution = asset?.width && asset?.height ? `${asset.width}x${asset.height}` : "—";
                const size = asset?.file?.file_size_bytes != null ? formatBytes(asset.file.file_size_bytes) : "—";
                const seconds = item.duration_seconds ?? asset?.duration_seconds;
                const isSelected = selectedItem?.media_asset_id === item.media_asset_id;
                return (
                  <tr
                    key={item.media_asset_id + idx}
                    onClick={() => onSelect(item)}
                    className={`cursor-pointer border-t border-zinc-100 dark:border-zinc-800 ${
                      isSelected
                        ? "bg-indigo-50/60 dark:bg-indigo-500/10"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    <td className="py-2.5 pr-2 pl-1 text-zinc-500 dark:text-zinc-400">{idx + 1}</td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2.5">
                        <MediaThumb
                          url={previews.urls[item.media_asset_id]}
                          thumbnailUrl={previews.thumbnailUrls[item.media_asset_id]}
                          kind={asset?.kind}
                          mimeType={asset?.file?.mime_type}
                          alt={name}
                          className="h-10 w-14"
                        />
                        <span className="truncate font-medium text-zinc-900 dark:text-zinc-100">{name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-zinc-600 dark:text-zinc-300">{resolution}</td>
                    <td className="py-2.5 pr-3 text-zinc-600 dark:text-zinc-300">{size}</td>
                    <td className="py-2.5 pr-3 text-zinc-600 dark:text-zinc-300">
                      {seconds != null ? `${Math.round(seconds)}s` : "—"}
                    </td>
                    <td className="py-2.5 text-zinc-600 dark:text-zinc-300">{item.transition ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-zinc-200 text-xs font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                <td className="py-2.5 pl-1" colSpan={2}>
                  Total
                </td>
                <td
                  className="py-2.5"
                  colSpan={2}
                  title={totals.isPartial ? "ไม่พบไฟล์บางรายการในระบบ ขนาดรวมอาจน้อยกว่าความจริง" : undefined}
                >
                  {totals.fileCount} Files · {totals.sizeLabel}
                </td>
                <td className="py-2.5" colSpan={2}>
                  {totals.durationLabel}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Card>
  );
}
