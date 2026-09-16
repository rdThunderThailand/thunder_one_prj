"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { ChevronDownIcon, ClipboardIcon, EyeIcon, MoreIcon, PlusIcon, SearchIcon, TrashIcon } from "@/components/ui/icons";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import type { MediaAsset } from "@/types/domain";
import { formatDuration } from "../duration";
import { itemStartSeconds, totalItemsDurationSeconds } from "../playlist-editor-state";
import { inputClasses } from "./form";
import type { DraftItem, PlaylistPlayback } from "../types";

/** #33 left pane: the items that are in this Playlist, nothing else. Adding is the drawer. */
export function PlaylistItemsPane({
  items,
  playback,
  assets,
  selectedId,
  nowPlayingId,
  onSelect,
  onMove,
  onRemove,
  onSeek,
  onAddItem,
}: {
  items: DraftItem[];
  playback: PlaylistPlayback;
  assets: MediaAsset[];
  selectedId: string | null;
  nowPlayingId: string | null;
  onSelect: (mediaAssetId: string) => void;
  onMove: (from: number, to: number) => void;
  onRemove: (mediaAssetId: string) => void;
  onSeek: (seconds: number) => void;
  onAddItem: () => void;
}) {
  const [query, setQuery] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropId, setDropId] = useState<string | null>(null);
  const previews = usePreviewUrls(useMemo(() => items.map((i) => i.mediaAssetId), [items]));
  const assetById = useMemo(() => Object.fromEntries(assets.map((a) => [a.id, a])), [assets]);
  const startSeconds = useMemo(() => itemStartSeconds(items, assets, playback), [assets, items, playback]);
  const total = formatDuration(totalItemsDurationSeconds(items, assets, playback));

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? items.filter((i) => (i.title ?? assetById[i.mediaAssetId]?.title ?? "").toLowerCase().includes(needle))
    : items;
  const moveDraggedTo = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const from = items.findIndex((item) => item.mediaAssetId === draggedId);
    const to = items.findIndex((item) => item.mediaAssetId === targetId);
    if (from >= 0 && to >= 0) onMove(from, to);
  };

  return (
    <Card className="flex h-full min-h-0 flex-col p-5">
      <div className="mb-1 flex shrink-0 items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Playlist Items</h2>
      </div>
      <p className="mb-3 shrink-0 text-xs text-zinc-400">{items.length} items · Total {total}</p>

      {items.length > 3 && (
        <div className="relative mb-3 shrink-0">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาใน playlist..."
            className={`${inputClasses} pl-9`}
          />
        </div>
      )}

      {items.length === 0 ? (
        <p className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-dashed border-zinc-200 px-4 text-center text-sm text-zinc-400 dark:border-zinc-800">
          ยังไม่มี item — กด Add Item เพื่อเริ่ม
        </p>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto pr-1">
          {visible.map((item) => {
            const index = items.findIndex((source) => source.mediaAssetId === item.mediaAssetId);
            const asset = assetById[item.mediaAssetId];
            const label = item.title ?? asset?.title ?? item.mediaAssetId;
            const isVideo = (item.kind ?? asset?.kind) === "video";
            const seconds = item.durationSeconds ?? asset?.duration_seconds ?? null;
            const isSelected = selectedId === item.mediaAssetId;
            return (
              <li
                key={item.mediaAssetId}
                draggable
                onClick={() => onSelect(item.mediaAssetId)}
                onDragStart={() => setDraggedId(item.mediaAssetId)}
                onDragEnter={() => setDropId(item.mediaAssetId)}
                onDragOver={(event) => event.preventDefault()}
                onDragEnd={() => { setDraggedId(null); setDropId(null); }}
                onDrop={(event) => {
                  event.preventDefault();
                  moveDraggedTo(item.mediaAssetId);
                  setDraggedId(null);
                  setDropId(null);
                }}
                className={`mb-1 flex cursor-grab items-center gap-2 rounded-lg p-2 transition-colors active:cursor-grabbing ${
                  isSelected ? "bg-indigo-50 dark:bg-indigo-500/10" : "hover:bg-zinc-50 hover:shadow-sm dark:hover:bg-zinc-800/50"
                } ${
                  dropId === item.mediaAssetId && draggedId !== item.mediaAssetId
                    ? "ring-2 ring-indigo-300"
                    : ""
                }`}
              >
                <span className="w-4 text-xs text-zinc-400" aria-hidden="true">::</span>
                <span className="w-4 text-xs text-zinc-400">{index + 1}</span>
                <MediaThumb url={previews.urls[item.mediaAssetId]} kind={item.kind ?? asset?.kind} alt={label} className="h-9 w-12" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    {nowPlayingId === item.mediaAssetId && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />}
                    <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</span>
                  </span>
                  <span className="text-xs text-zinc-400">
                    {isVideo ? "Video" : "Image"} · {seconds != null ? formatDuration(seconds) : "—"}
                  </span>
                </span>
                <ItemActions
                  label={label}
                  canMoveUp={index > 0}
                  canMoveDown={index < items.length - 1}
                  onPreview={() => {
                    onSelect(item.mediaAssetId);
                    onSeek(startSeconds[index] ?? 0);
                  }}
                  onMoveUp={() => onMove(index, index - 1)}
                  onMoveDown={() => onMove(index, index + 1)}
                  onRemove={() => onRemove(item.mediaAssetId)}
                />
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={onAddItem}
        className="mt-3 flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-indigo-200 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
      >
        <PlusIcon className="h-4 w-4" /> Add Item
      </button>
      {items.length > 1 && (
        <p className="mt-2 shrink-0 text-center text-xs text-zinc-400">
          Drag items to reorder
        </p>
      )}
    </Card>
  );
}

function ItemActions({
  label,
  canMoveUp,
  canMoveDown,
  onPreview,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  label: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onPreview: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const item =
    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:text-zinc-300 dark:disabled:text-zinc-600";
  const normalItem = `${item} text-zinc-700 hover:bg-indigo-50 hover:text-indigo-700 dark:text-zinc-200 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300`;
  return (
    <details
      className="relative inline-block text-left"
      onClick={(event) => event.stopPropagation()}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          event.currentTarget.removeAttribute("open");
        }
      }}
    >
      <summary
        aria-label={`Actions for ${label}`}
        className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      >
        <MoreIcon className="h-4 w-4" />
      </summary>
      <div className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
        <button type="button" className={normalItem} onClick={onPreview}>
          <EyeIcon className="h-4 w-4" /> Preview
        </button>
        <button type="button" className={normalItem} disabled>
          <SearchIcon className="h-4 w-4" /> Replace
        </button>
        <button type="button" className={normalItem} disabled>
          <ClipboardIcon className="h-4 w-4" /> Duplicate
        </button>
        <button type="button" className={normalItem} disabled={!canMoveUp} onClick={onMoveUp}>
          <ChevronDownIcon className="h-4 w-4 rotate-180" /> Move Up
        </button>
        <button type="button" className={normalItem} disabled={!canMoveDown} onClick={onMoveDown}>
          <ChevronDownIcon className="h-4 w-4" /> Move Down
        </button>
        <button
          type="button"
          className={`${item} text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300`}
          onClick={onRemove}
        >
          <TrashIcon className="h-4 w-4" /> Remove from Playlist
        </button>
      </div>
    </details>
  );
}
