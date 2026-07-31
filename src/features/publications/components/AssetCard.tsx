"use client";

import { CheckIcon, PlayIcon } from "@/components/ui/icons";
import type { MediaAsset } from "../types";

export function AssetCard({
  asset,
  previewUrl,
  selected,
  onSelect,
}: {
  asset: MediaAsset;
  previewUrl?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const filename = asset.file?.original_filename ?? asset.title ?? asset.id;
  const isVideo =
    asset.kind === "video" ||
    (!asset.kind && asset.file?.mime_type?.startsWith("video/"));
  const kindLabel = isVideo ? "Video" : "Image";
  const dimensions =
    asset.width && asset.height ? `${asset.width} x ${asset.height}` : "—";
  const durationLabel = asset.duration_seconds
    ? `${Math.round(asset.duration_seconds)}s`
    : undefined;
  const approved = asset.approval_status === "approved";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition-colors ${
        selected
          ? "border-indigo-500 ring-2 ring-indigo-500/30"
          : "border-zinc-200 hover:border-zinc-300"
      }`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100 flex items-center justify-center">
        {previewUrl ? (
          isVideo ? (
            // #t=0.1 makes the browser paint the first frame as a poster.
            <video
              src={`${previewUrl}#t=0.1`}
              muted
              preload="metadata"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          ) : (
            <img
              src={previewUrl}
              alt={filename}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          )
        ) : null}
        {isVideo && (
          <span className="absolute flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-zinc-900">
            <PlayIcon className="h-4 w-4" />
          </span>
        )}
        {isVideo && durationLabel && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {durationLabel}
          </span>
        )}
        <span
          className={`absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
            selected
              ? "border-indigo-500 bg-indigo-500 text-white"
              : "border-white/80 bg-white/20"
          }`}
        >
          {selected && <CheckIcon className="h-3 w-3" />}
        </span>
      </div>
      <div className="flex flex-col gap-1 p-2">
        <p className="truncate text-xs font-medium text-zinc-900">{filename}</p>
        <p className="text-[11px] text-zinc-400">
          {kindLabel} · {dimensions}
          {durationLabel ? ` · ${durationLabel}` : ""}
        </p>
        {approved && (
          <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
            Approved
          </span>
        )}
      </div>
    </button>
  );
}
