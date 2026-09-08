"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { ImageIcon, PlusIcon, XIcon } from "@/components/ui/icons";
import { isApprovedAsset, isImageAsset } from "@/features/media-workspace/publications/draft-mapping";
import { SelectedAssetList } from "@/features/media-workspace/publications/components/SelectedAssetList";
import { AddItemDrawer } from "@/features/media-workspace/playlists/components/AddItemDrawer";
import type { MediaAsset } from "@/types/domain";
import type { PlaylistListItem } from "@/features/media-workspace/playlists";
import { appendPickedAssets, reorderAssetItem, totalZoneDurationSeconds, type ZoneBindingDraft } from "../zone-bindings";

/**
 * The Content tab of Zone Properties (ticket 27) — an existing Playlist, or a set of picked
 * assets with per-asset duration/transition (ADR 0049 §3). No upload/AI-suggest chrome: that
 * belongs to the Publication wizard's full asset library, not this scoped picker. Playback
 * (`play_mode` / `repeat` / `start_from`) lives in the Content tab instead — see
 * `ZonePropertiesPanel.tsx`.
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
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
  const [stagedAssets, setStagedAssets] = useState<MediaAsset[]>([]);
  const [stagedPlaylist, setStagedPlaylist] = useState<PlaylistListItem | null>(null);

  const assetDurations = useMemo(
    () => Object.fromEntries(assets.map((a) => [a.id, a.duration_seconds ?? undefined])),
    [assets],
  );
  const durationSeconds = totalZoneDurationSeconds(binding, assetDurations, playlistDurations);
  const boundPlaylist = binding.playlistId ? playlists.find((playlist) => playlist.id === binding.playlistId) : null;
  const hasBoundContent = binding.source === "playlist" ? !!binding.playlistId : binding.assetItems.length > 0;
  const hasStagedContent = !!stagedPlaylist || stagedAssets.length > 0;

  const toggleAssetItem = ({ id, isImage }: { id: string; isImage: boolean }) => {
    const isSelected = binding.assetItems.some((item) => item.media_asset_id === id);
    const assetItems = isSelected
      ? binding.assetItems.filter((item) => item.media_asset_id !== id)
      : [...binding.assetItems, { media_asset_id: id, duration_seconds: isImage ? 10 : null, transition: "cut" as const }];
    onChange({ ...binding, source: "assets", playlistId: null, playlistName: undefined, assetItems });
  };

  const insertStaged = () => {
    if (stagedPlaylist) {
      onChange({ ...binding, source: "playlist", playlistId: stagedPlaylist.id, playlistName: stagedPlaylist.name, assetItems: [] });
    } else if (stagedAssets.length > 0) {
      onChange(appendPickedAssets(binding, stagedAssets.map((asset) => ({ id: asset.id, isImage: isImageAsset(asset) }))));
    }
    setStagedAssets([]);
    setStagedPlaylist(null);
  };

  return (
    <>
      <section className="flex h-full min-h-0 min-w-0 flex-col gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-700 xl:border-b-0 xl:border-r xl:pb-0 xl:pr-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Insert to Layout</p>
            <p className="text-xs text-zinc-400">Zone: {zoneName}</p>
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Total {durationSeconds}s</span>
        </div>

        {!hasBoundContent && !hasStagedContent ? (
          <button type="button" onClick={() => setIsAssetPickerOpen(true)} className="flex min-h-64 flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-6 text-center text-zinc-500 transition hover:border-indigo-400 hover:bg-indigo-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800/40">
            <ImageIcon className="h-8 w-8" />
            <span className="font-medium text-zinc-700 dark:text-zinc-200">Pick Media Assets</span>
            <span className="max-w-52 text-xs">Choose media or a Playlist for {zoneName}</span>
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm">
              <PlusIcon className="h-4 w-4" />
              Add Media
            </span>
          </button>
        ) : <>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          {hasBoundContent && <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">In this Zone</p>
          <SelectedAssetList
            bare
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
                onChange(reorderAssetItem(binding, mediaAssetId, index + direction));
              },
              moveAssetItemTo: (mediaAssetId, targetIndex) => onChange(reorderAssetItem(binding, mediaAssetId, targetIndex)),
            }}
          />
          {binding.source === "playlist" && binding.playlistId && <ShelfItem label={binding.playlistName ?? boundPlaylist?.name ?? "Playlist"} meta={`${boundPlaylist?.item_count ?? 0} items · ${boundPlaylist?.status ?? "bound"}`} url={playlistPreviews[binding.playlistId]?.url} thumbnailUrl={playlistPreviews[binding.playlistId]?.thumbnailUrl} onRemove={() => onChange({ ...binding, playlistId: null, playlistName: undefined, assetItems: [] })} />}
          </div>}
          {hasStagedContent && <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">Ready to add</p><div className="space-y-2">
            {stagedPlaylist && <ShelfItem label={stagedPlaylist.name} meta={`${stagedPlaylist.item_count} items · ${stagedPlaylist.status}`} url={playlistPreviews[stagedPlaylist.id]?.url} thumbnailUrl={playlistPreviews[stagedPlaylist.id]?.thumbnailUrl} onRemove={() => setStagedPlaylist(null)} />}
            {stagedAssets.map((asset) => <ShelfItem key={asset.id} label={asset.file?.original_filename ?? asset.title ?? asset.id} meta={`${asset.kind ?? "File"}${asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ""}`} url={previews[asset.id]} onRemove={() => setStagedAssets((current) => current.filter((item) => item.id !== asset.id))} />)}
          </div></div>}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-700">
          <Button variant="secondary" onClick={() => setIsAssetPickerOpen(true)}><PlusIcon /> Add Media or Playlist</Button>
          {hasStagedContent && <Button onClick={insertStaged}>Add to {zoneName}</Button>}
        </div>
        </>}
      </section>

      {isAssetPickerOpen && (
        <AddItemDrawer
          assets={assets.filter(isApprovedAsset)}
          loading={false}
          alreadyInPlaylist={binding.assetItems.map((item) => item.media_asset_id)}
          onAdd={(picked) => { setStagedAssets(picked); setStagedPlaylist(null); }}
          onClose={() => setIsAssetPickerOpen(false)}
          purpose="layout"
          side="right"
          playlists={playlists}
          playlistPreviews={playlistPreviews}
          onSelectPlaylist={(playlist) => { setStagedPlaylist(playlist); setStagedAssets([]); }}
        />
      )}
    </>
  );
}

function ShelfItem({ label, meta, url, thumbnailUrl, onRemove }: { label: string; meta: string; url?: string; thumbnailUrl?: string; onRemove: () => void }) {
  return <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-2 text-left dark:border-zinc-700 dark:bg-zinc-900"><MediaThumb url={url} thumbnailUrl={thumbnailUrl} alt={`${label} thumbnail`} className="h-14 w-20" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</span><span className="block truncate text-xs text-zinc-500">{meta}</span></span><button type="button" aria-label={`Remove ${label}`} onClick={onRemove} className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"><XIcon /></button></div>;
}
