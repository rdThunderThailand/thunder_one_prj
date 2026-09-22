"use client";

import { useMemo, useState } from "react";
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
    <div className="flex h-[32rem] min-h-0 flex-col rounded-xl border border-border bg-card p-5 shadow-panel xl:h-full">
      <div className="mb-1 flex shrink-0 items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Playlist Items</h2>
        <button
          type="button"
          onClick={onAddItem}
          aria-label="Add item"
          className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>
      <p className="mb-3 shrink-0 text-xs text-muted-foreground">{items.length} items · Total {total}</p>

      <div className="relative mb-3 shrink-0">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search playlist items..."
          className={`${inputClasses} pl-9`}
        />
      </div>

      {items.length === 0 ? (
        <p className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-dashed border-border px-4 text-center text-sm text-muted-foreground">
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
                  isSelected ? "bg-primary-soft" : "hover:bg-muted hover:shadow-sm"
                } ${
                  dropId === item.mediaAssetId && draggedId !== item.mediaAssetId
                    ? "ring-2 ring-primary/30"
                    : ""
                }`}
              >
                <span className="w-4 text-xs text-muted-foreground" aria-hidden="true">::</span>
                <span className="w-4 text-xs text-muted-foreground">{index + 1}</span>
                <MediaThumb url={previews.urls[item.mediaAssetId]} kind={item.kind ?? asset?.kind} alt={label} className="h-9 w-12" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    {nowPlayingId === item.mediaAssetId && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />}
                    <span className="truncate text-sm font-medium text-foreground">{label}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
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
        className="mt-3 flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-primary/30 py-2 text-sm font-medium text-primary hover:bg-primary-soft"
      >
        <PlusIcon className="h-4 w-4" /> Add Item
      </button>
      {items.length > 1 && (
        <p className="mt-2 shrink-0 text-center text-xs text-muted-foreground">
          Drag items to reorder
        </p>
      )}
    </div>
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
    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:text-muted-foreground";
  const normalItem = `${item} text-muted-foreground hover:bg-primary-soft hover:text-primary`;
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
        className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <MoreIcon className="h-4 w-4" />
      </summary>
      <div className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg">
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
          className={`${item} text-danger hover:bg-danger-soft hover:text-danger`}
          onClick={onRemove}
        >
          <TrashIcon className="h-4 w-4" /> Remove from Playlist
        </button>
      </div>
    </details>
  );
}
