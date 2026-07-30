"use client";

import { CheckIcon, PlayIcon, StarIcon } from "@/components/ui/icons";
import type { AssetItem } from "../mock-data";

export function AssetCard({
  asset,
  selected,
  onSelect,
}: {
  asset: AssetItem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition-colors ${
        selected ? "border-indigo-500 ring-2 ring-indigo-500/30" : "border-zinc-200 hover:border-zinc-300"
      }`}
    >
      <div className={`relative flex aspect-square w-full items-center justify-center bg-gradient-to-br ${asset.accent}`}>
        {asset.kind === "video" && (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-zinc-900">
            <PlayIcon className="h-4 w-4" />
          </span>
        )}
        {asset.kind === "video" && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {asset.durationLabel}
          </span>
        )}
        <span
          className={`absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
            selected ? "border-indigo-500 bg-indigo-500 text-white" : "border-white/80 bg-white/20"
          }`}
        >
          {selected && <CheckIcon className="h-3 w-3" />}
        </span>
        <span className="absolute right-1.5 top-1.5 text-white/80">
          <StarIcon className="h-4 w-4" filled={asset.favorite} />
        </span>
      </div>
      <div className="flex flex-col gap-1 p-2">
        <p className="truncate text-xs font-medium text-zinc-900">{asset.filename}</p>
        <p className="text-[11px] text-zinc-400">
          {asset.kind === "image" ? "Image" : "Video"} · {asset.dimensions}
          {asset.durationLabel ? ` · ${asset.durationLabel}` : ""}
        </p>
        {asset.approved && (
          <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
            Approved
          </span>
        )}
      </div>
    </button>
  );
}
