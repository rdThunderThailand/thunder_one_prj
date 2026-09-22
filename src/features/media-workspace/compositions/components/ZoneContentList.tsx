"use client";

// Content tab of Zone Properties: what a Zone already holds, editable in place — remove an
// item, reorder, tweak an image's seconds, or drop the whole binding. Playlist Zones stay
// read-only here (edit at the Playlist editor); assets Zones are the Zone's own inline list.

import { ChevronDown, ChevronUp, ExternalLink, X } from "lucide-react";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { formatDuration } from "@/features/media-workspace/playlists";
import type { MediaAsset, PlaylistListItem } from "@/types/domain";
import { reorderAssetItem, totalZoneDurationSeconds, type ZoneBindingDraft } from "../zone-bindings";

export function ZoneContentList({ binding, assets, previews, playlists, playlistDurations, onBindingChange }: {
  binding: ZoneBindingDraft;
  assets: MediaAsset[];
  previews: Record<string, string | undefined>;
  playlists: PlaylistListItem[];
  playlistDurations: Record<string, number | undefined>;
  onBindingChange: (next: ZoneBindingDraft) => void;
}) {
  const assetById = new Map(assets.map((asset) => [asset.id, asset]));
  const assetDurations = Object.fromEntries(assets.map((asset) => [asset.id, asset.duration_seconds ?? undefined]));
  const durationSeconds = totalZoneDurationSeconds(binding, assetDurations, playlistDurations);
  const hasContent = binding.source === "playlist" ? Boolean(binding.playlistId) : binding.assetItems.length > 0;

  if (!hasContent) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
        No content — pick from Insert to Zone.
      </div>
    );
  }

  if (binding.source === "playlist" && binding.playlistId) {
    const playlist = playlists.find((item) => item.id === binding.playlistId);
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-lg border border-border bg-muted p-3">
          <p className="truncate text-xs font-semibold text-foreground">{playlist?.name ?? binding.playlistName ?? "Playlist"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {(playlist?.item_count ?? 0).toLocaleString()} item{playlist?.item_count === 1 ? "" : "s"}
          </p>
          <a
            href={`/media-workspace/playlists/${binding.playlistId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary"
          >
            Open playlist <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <DurationRow durationSeconds={durationSeconds} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        {binding.assetItems.map((item, index) => {
          const asset = assetById.get(item.media_asset_id);
          const isImage = asset?.kind === "image";
          const label = asset?.title ?? asset?.file?.original_filename ?? "Untitled";
          return (
            <div key={item.media_asset_id} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
              <MediaThumb
                url={previews[item.media_asset_id]}
                kind={asset?.kind}
                mimeType={asset?.file?.mime_type}
                alt={label}
                className="h-8 w-12 shrink-0 rounded"
              />
              <span className="min-w-0 flex-1">
                <span className="line-clamp-1 block text-xs font-medium text-foreground">{label}</span>
                {isImage ? (
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <input
                      type="number"
                      min={1}
                      value={item.duration_seconds ?? 10}
                      onChange={(event) => {
                        const seconds = Math.max(1, Number.parseInt(event.target.value, 10) || 1);
                        onBindingChange({
                          ...binding,
                          assetItems: binding.assetItems.map((current) =>
                            current.media_asset_id === item.media_asset_id ? { ...current, duration_seconds: seconds } : current
                          ),
                        });
                      }}
                      className="h-6 w-14 rounded border border-border bg-card px-1 text-xs"
                    />
                    s
                  </label>
                ) : (
                  <span className="block text-xs text-muted-foreground">{formatDuration(asset?.duration_seconds ?? 0)}</span>
                )}
              </span>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  aria-label="Move up"
                  disabled={index === 0}
                  onClick={() => onBindingChange(reorderAssetItem(binding, item.media_asset_id, index - 1))}
                  className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  disabled={index === binding.assetItems.length - 1}
                  onClick={() => onBindingChange(reorderAssetItem(binding, item.media_asset_id, index + 1))}
                  className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${label}`}
                  onClick={() => onBindingChange({ ...binding, assetItems: binding.assetItems.filter((current) => current.media_asset_id !== item.media_asset_id) })}
                  className="rounded p-1 text-muted-foreground hover:text-danger"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <DurationRow durationSeconds={durationSeconds} />
    </div>
  );
}

function DurationRow({ durationSeconds }: { durationSeconds: number }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">Duration</span>
      <span className="font-medium text-foreground">{formatDuration(durationSeconds)}</span>
    </div>
  );
}
