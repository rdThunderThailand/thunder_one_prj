"use client";

import { useMemo, useState } from "react";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { Input } from "@/components/ui/lovable/input";
import type { MediaAsset } from "@/types/domain";
import type { PlaylistListItem } from "@/features/media-workspace/playlists";
import { formatDuration } from "@/features/media-workspace/playlists";
import { appendPickedAssets, type ZoneBindingDraft } from "../zone-bindings";

export function CompositionContentBrowser({ binding, assets, playlists, previews, playlistPreviews, onChange }: {
  binding: ZoneBindingDraft | null;
  assets: MediaAsset[];
  playlists: PlaylistListItem[];
  previews: Record<string, string | undefined>;
  playlistPreviews: Record<string, { url?: string; thumbnailUrl?: string }>;
  onChange: (next: ZoneBindingDraft) => void;
}) {
  const [tab, setTab] = useState<"media" | "playlists">("media");
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("");
  const [folder, setFolder] = useState("");
  const items = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (tab === "playlists") return playlists.filter((item) => !query || item.name.toLowerCase().includes(query));
    return assets.filter((item) => {
      const label = item.title ?? item.file?.original_filename ?? "";
      return (!query || label.toLowerCase().includes(query)) && (!kind || item.kind === kind) && (!folder || (item.folder_id ?? "uncategorized") === folder);
    });
  }, [assets, folder, kind, playlists, search, tab]);
  const folders = [...new Set(assets.map((asset) => asset.folder_id ?? "uncategorized"))];

  return (
    <section className="flex min-h-0 flex-col border-r border-border bg-card">
      <div className="border-b border-border p-3">
        <h2 className="text-[11px] font-bold text-foreground">Insert to Zone</h2>
        <p className="text-[9px] text-muted-foreground">{binding ? "Choose content for the selected zone." : "Select a zone to assign content."}</p>
      </div>
      <div className="grid grid-cols-2 border-b border-border p-2">
        <button type="button" className={`rounded-md py-2 text-xs font-semibold ${tab === "media" ? "bg-primary-soft text-primary" : "text-muted-foreground"}`} onClick={() => setTab("media")}>Media</button>
        <button type="button" className={`rounded-md py-2 text-xs font-semibold ${tab === "playlists" ? "bg-primary-soft text-primary" : "text-muted-foreground"}`} onClick={() => setTab("playlists")}>Playlists</button>
      </div>
      <div className="space-y-2 border-b border-border p-3">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${tab}…`} className="h-8 text-xs" />
        {tab === "media" && (
          <div className="grid grid-cols-2 gap-2">
            <select aria-label="Media type" value={kind} onChange={(event) => setKind(event.target.value)} className="h-8 rounded-md border border-border bg-card px-2 text-xs"><option value="">All types</option><option value="image">Images</option><option value="video">Videos</option></select>
            <select aria-label="Media folder" value={folder} onChange={(event) => setFolder(event.target.value)} className="h-8 rounded-md border border-border bg-card px-2 text-xs"><option value="">All folders</option>{folders.map((id) => <option key={id} value={id}>{id === "uncategorized" ? "Uncategorized" : "Folder"}</option>)}</select>
          </div>
        )}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-2 overflow-y-auto p-3">
        {items.map((item) => {
          const isPlaylist = tab === "playlists";
          const asset = isPlaylist ? null : item as MediaAsset;
          const playlist = isPlaylist ? item as PlaylistListItem : null;
          const label = playlist?.name ?? asset?.title ?? asset?.file?.original_filename ?? "Untitled";
          const url = playlist ? playlistPreviews[playlist.id]?.url : asset ? previews[asset.id] : undefined;
          return (
            <button
              key={item.id}
              type="button"
              disabled={!binding}
              onClick={() => {
                if (!binding) return;
                if (playlist) onChange({ ...binding, source: "playlist", playlistId: playlist.id, playlistName: playlist.name, assetItems: [] });
                if (asset) onChange(appendPickedAssets(binding, [{ id: asset.id, isImage: asset.kind === "image" }]));
              }}
              className="overflow-hidden rounded-lg border border-border bg-card text-left hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MediaThumb url={url} thumbnailUrl={playlist ? playlistPreviews[playlist.id]?.thumbnailUrl : undefined} kind={asset?.kind} mimeType={asset?.file?.mime_type} alt={label} className="aspect-video w-full rounded-none" />
              <span className="block truncate px-2 pt-1.5 text-[10px] font-medium">{label}</span>
              <span className="block truncate px-2 pb-1.5 text-[9px] text-muted-foreground">
                {playlist
                  ? `Playlist · ${playlist.total_duration_seconds == null ? "—" : formatDuration(playlist.total_duration_seconds)}`
                  : `${asset?.kind === "video" ? "Video" : "Image"}${asset?.duration_seconds == null ? "" : ` · ${formatDuration(asset.duration_seconds)}`}`}
              </span>
            </button>
          );
        })}
        {items.length === 0 && <p className="col-span-2 py-8 text-center text-xs text-muted-foreground">No content found.</p>}
      </div>
      <p className="border-t border-border p-3 text-[10px] text-muted-foreground">{binding ? "Click an item to add it to the selected Zone." : "Select a Zone to add content."}</p>
    </section>
  );
}
