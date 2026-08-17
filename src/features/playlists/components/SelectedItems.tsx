"use client";

import { useMemo } from "react";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { Badge } from "@/components/ui/Badge";
import { ChevronDownIcon, StarIcon, XIcon } from "@/components/ui/icons";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import type { MediaAsset } from "@/types/domain";
import { usePlaylistDraftStore } from "../store/usePlaylistDraftStore";
import { checkContentCompatibility, incompatibilityLabel } from "../content-compatibility";
import { resolveCoverAssetId } from "../metadata";
import { TRANSITIONS, type Transition } from "../types";

/** Vertical nudge buttons instead of drag-and-drop: same reordering, no dependency
 *  and no pointer-event edge cases. ponytail: add dnd only if operators ask for it. */
function MoveButtons({
  index,
  total,
  onMove,
}: {
  index: number;
  total: number;
  onMove: (from: number, to: number) => void;
}) {
  return (
    <span className="flex flex-col">
      <button
        type="button"
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
        aria-label="เลื่อนขึ้น"
        className="text-zinc-400 disabled:opacity-30 hover:text-zinc-700 dark:hover:text-zinc-200"
      >
        <ChevronDownIcon className="h-4 w-4 rotate-180" />
      </button>
      <button
        type="button"
        disabled={index === total - 1}
        onClick={() => onMove(index, index + 1)}
        aria-label="เลื่อนลง"
        className="text-zinc-400 disabled:opacity-30 hover:text-zinc-700 dark:hover:text-zinc-200"
      >
        <ChevronDownIcon className="h-4 w-4" />
      </button>
    </span>
  );
}

export function SelectedItems({ assets }: { assets: MediaAsset[] }) {
  const { items, info, moveItem, removeItem, patchItem, setCover } = usePlaylistDraftStore();

  const ids = useMemo(() => items.map((i) => i.mediaAssetId), [items]);
  const previews = usePreviewUrls(ids);
  const assetById = useMemo(
    () => Object.fromEntries(assets.map((a) => [a.id, a])),
    [assets]
  );

  const coverId = resolveCoverAssetId(
    info.coverAssetId,
    items.map((item, index) => ({ media_asset_id: item.mediaAssetId, position: index }))
  );

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-200 py-10 text-center text-sm text-zinc-400 dark:border-zinc-800">
        ยังไม่ได้เลือก media — เลือกจากคลังด้านบนเพื่อเริ่มสร้าง playlist
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[46rem] text-sm">
        <thead>
          <tr className="border-b border-zinc-100 text-left text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th className="w-16 py-2">#</th>
            <th className="py-2">Media</th>
            <th className="w-28 py-2">Type</th>
            <th className="w-32 py-2">Duration</th>
            <th className="w-32 py-2">Transition</th>
            <th className="w-24 py-2">Cover</th>
            <th className="w-10 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {items.map((item, index) => {
            const asset = assetById[item.mediaAssetId];
            const label = item.title ?? asset?.title ?? item.mediaAssetId;
            const isVideo = (item.kind ?? asset?.kind) === "video";
            const isCover = coverId === item.mediaAssetId;
            const mismatch = asset ? checkContentCompatibility(info.resolution, asset) : null;
            return (
              <tr key={item.mediaAssetId}>
                <td className="py-2.5">
                  <span className="flex items-center gap-2">
                    <MoveButtons index={index} total={items.length} onMove={moveItem} />
                    <span className="text-zinc-400">{index + 1}</span>
                  </span>
                </td>
                <td className="py-2.5">
                  <span className="flex items-center gap-3">
                    <MediaThumb
                      url={previews.urls[item.mediaAssetId]}
                      kind={item.kind ?? asset?.kind}
                      alt={label}
                      className="h-10 w-14"
                    />
                    <span className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                      {label}
                    </span>
                    {mismatch && (
                      <span
                        className="shrink-0"
                        title={`${asset?.width}×${asset?.height} · Profile ${info.resolution}`}
                      >
                        <Badge color="yellow" variant="pill">
                          {incompatibilityLabel(mismatch)}
                        </Badge>
                      </span>
                    )}
                  </span>
                </td>
                <td className="py-2.5">
                  <Badge color={isVideo ? "blue" : "indigo"} variant="pill">
                    {isVideo ? "video" : "image"}
                  </Badge>
                </td>
                <td className="py-2.5">
                  {isVideo ? (
                    // Videos play their full length — the backend resolves it from the asset.
                    <span className="text-zinc-400">ตามความยาวคลิป</span>
                  ) : (
                    <input
                      type="number"
                      min={1}
                      value={item.durationSeconds ?? ""}
                      onChange={(e) =>
                        patchItem(item.mediaAssetId, {
                          durationSeconds: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      className="w-20 rounded-lg border border-zinc-200 px-2 py-1.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
                    />
                  )}
                </td>
                <td className="py-2.5">
                  <select
                    value={item.transition}
                    onChange={(e) =>
                      patchItem(item.mediaAssetId, { transition: e.target.value as Transition })
                    }
                    className="rounded-lg border border-zinc-200 px-2 py-1.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    {TRANSITIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      setCover(info.coverAssetId === item.mediaAssetId ? undefined : item.mediaAssetId)
                    }
                    className={`inline-flex items-center gap-1 text-xs font-medium ${
                      isCover ? "text-amber-500" : "text-zinc-400 hover:text-zinc-600"
                    }`}
                  >
                    <StarIcon className="h-4 w-4" filled={isCover} />
                    {isCover ? (info.coverAssetId ? "หน้าปก" : "ค่าเริ่มต้น") : "ตั้งเป็นปก"}
                  </button>
                </td>
                <td className="py-2.5">
                  <button
                    type="button"
                    onClick={() => removeItem(item.mediaAssetId)}
                    aria-label={`นำ ${label} ออก`}
                    className="text-zinc-400 hover:text-red-500"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
