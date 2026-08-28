"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { SearchIcon } from "@/components/ui/icons";
import { isApprovedAsset, isImageAsset } from "@/features/media-workspace/publications/draft-mapping";
import { AssetCard } from "@/features/media-workspace/publications/components/AssetCard";
import { SelectedAssetList } from "@/features/media-workspace/publications/components/SelectedAssetList";
import type { MediaAsset } from "@/types/domain";
import type { PlaylistListItem } from "@/features/media-workspace/playlists";
import { DEFAULT_ZONE_PLAYBACK, totalZoneDurationSeconds, type ZoneBindingDraft } from "../zone-bindings";

const tabClasses = (active: boolean) =>
  `flex-1 rounded-lg px-3 py-1.5 text-sm font-medium ${active ? "bg-white text-indigo-700 shadow-sm" : "text-zinc-500"}`;

/**
 * The content picker for one Composition Zone — an existing Playlist, or a set of picked
 * assets with per-asset duration/transition (ADR 0049 §3). No upload/AI-suggest chrome: that
 * belongs to the Publication wizard's full asset library, not this scoped picker.
 */
export function ZoneContentPicker({
  zoneName,
  binding,
  onChange,
  assets,
  playlists,
  previews,
  playlistPreviews,
  playlistDurations,
}: {
  zoneName: string;
  binding: ZoneBindingDraft;
  onChange: (next: ZoneBindingDraft) => void;
  assets: MediaAsset[];
  playlists: PlaylistListItem[];
  previews: Record<string, string | undefined>;
  playlistPreviews: Record<string, { url?: string; thumbnailUrl?: string }>;
  playlistDurations: Record<string, number | undefined>;
}) {
  const [query, setQuery] = useState("");

  const assetDurations = useMemo(
    () => Object.fromEntries(assets.map((a) => [a.id, a.duration_seconds ?? undefined])),
    [assets],
  );
  const durationSeconds = totalZoneDurationSeconds(binding, assetDurations, playlistDurations);

  const filteredAssets = useMemo(() => {
    if (!query.trim()) return assets;
    const q = query.toLowerCase();
    return assets.filter((asset) => {
      const filename = asset.file?.original_filename ?? "";
      const title = asset.title ?? "";
      return filename.toLowerCase().includes(q) || title.toLowerCase().includes(q);
    });
  }, [assets, query]);

  const filteredPlaylists = useMemo(() => {
    let list = playlists;
    if (binding.playlistId && binding.source === "playlist" && !list.some((p) => p.id === binding.playlistId)) {
      list = [
        ...list,
        { id: binding.playlistId, name: binding.playlistName ?? "Bound Playlist", status: "draft", item_count: 0 },
      ];
    }
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((p) => p.name.toLowerCase().includes(q));
  }, [playlists, binding, query]);

  const toggleAssetItem = ({ id, isImage }: { id: string; isImage: boolean }) => {
    const isSelected = binding.assetItems.some((item) => item.media_asset_id === id);
    const assetItems = isSelected
      ? binding.assetItems.filter((item) => item.media_asset_id !== id)
      : [...binding.assetItems, { media_asset_id: id, duration_seconds: isImage ? 10 : null, transition: "cut" as const }];
    onChange({ ...binding, source: "assets", playlistId: null, playlistName: undefined, assetItems });
  };

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Zone: {zoneName}</p>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">Total {durationSeconds}s</span>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-800">
        <button type="button" className={tabClasses(binding.source === "playlist")} onClick={() => onChange({ ...binding, source: "playlist" })}>
          Existing Playlist
        </button>
        <button type="button" className={tabClasses(binding.source === "assets")} onClick={() => onChange({ ...binding, source: "assets" })}>
          Pick assets
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <label className="text-xs text-zinc-500">
          Play mode
          <select
            value={binding.playback.playMode}
            onChange={(e) => onChange({ ...binding, playback: { ...binding.playback, playMode: e.target.value as ZoneBindingDraft["playback"]["playMode"] } })}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="sequential">Sequential</option>
            <option value="shuffle">Shuffle</option>
          </select>
        </label>
        <label className="text-xs text-zinc-500">
          Repeat
          <select
            value={binding.playback.repeat}
            onChange={(e) => onChange({ ...binding, playback: { ...binding.playback, repeat: e.target.value as ZoneBindingDraft["playback"]["repeat"] } })}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="loop">Loop</option>
            <option value="once">Once</option>
          </select>
        </label>
        <label className="text-xs text-zinc-500">
          Start from
          <select
            value={binding.playback.startFrom}
            onChange={(e) => onChange({ ...binding, playback: { ...binding.playback, startFrom: e.target.value as ZoneBindingDraft["playback"]["startFrom"] } })}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="first">First item</option>
            <option value="resume">Resume</option>
          </select>
        </label>
      </div>

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={binding.source === "playlist" ? "Search playlists..." : "Search assets..."}
          className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      {binding.source === "playlist" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {filteredPlaylists.map((playlist) => {
            const selected = binding.playlistId === playlist.id;
            const preview = playlistPreviews[playlist.id];
            return (
              <AssetCard
                key={playlist.id}
                kind="playlist"
                playlist={playlist}
                previewUrl={preview?.url}
                thumbnailUrl={preview?.thumbnailUrl}
                selected={selected}
                onSelect={() => onChange({ ...binding, source: "playlist", playlistId: selected ? null : playlist.id, playlistName: playlist.name, assetItems: [] })}
              />
            );
          })}
          {filteredPlaylists.length === 0 && <p className="col-span-full text-sm text-zinc-400">ไม่พบ Playlist</p>}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {filteredAssets.map((asset) => {
              const approved = isApprovedAsset(asset);
              return (
                <AssetCard
                  key={asset.id}
                  kind="asset"
                  asset={asset}
                  previewUrl={previews[asset.id]}
                  selected={binding.assetItems.some((i) => i.media_asset_id === asset.id)}
                  onSelect={() => approved && toggleAssetItem({ id: asset.id, isImage: isImageAsset(asset) })}
                  disabled={!approved}
                />
              );
            })}
            {filteredAssets.length === 0 && <p className="col-span-full text-sm text-zinc-400">ไม่พบ Asset</p>}
          </div>

          <SelectedAssetList
            assets={assets}
            previews={previews}
            selection={{
              assetItems: binding.assetItems,
              toggleAssetItem,
              setAssetDuration: (mediaAssetId, seconds) =>
                onChange({
                  ...binding,
                  assetItems: binding.assetItems.map((item) => (item.media_asset_id === mediaAssetId ? { ...item, duration_seconds: seconds } : item)),
                }),
              setAssetTransition: (mediaAssetId, transition) =>
                onChange({
                  ...binding,
                  assetItems: binding.assetItems.map((item) => (item.media_asset_id === mediaAssetId ? { ...item, transition } : item)),
                }),
              moveAssetItem: (mediaAssetId, direction) => {
                const index = binding.assetItems.findIndex((item) => item.media_asset_id === mediaAssetId);
                const nextIndex = index + direction;
                if (index < 0 || nextIndex < 0 || nextIndex >= binding.assetItems.length) return;
                const assetItems = [...binding.assetItems];
                [assetItems[index], assetItems[nextIndex]] = [assetItems[nextIndex], assetItems[index]];
                onChange({ ...binding, assetItems });
              },
            }}
          />
        </>
      )}
    </Card>
  );
}

export function defaultBinding(layoutZoneId: string): ZoneBindingDraft {
  return {
    layoutZoneId,
    source: "playlist",
    playlistId: null,
    assetItems: [],
    playback: { ...DEFAULT_ZONE_PLAYBACK },
  };
}
