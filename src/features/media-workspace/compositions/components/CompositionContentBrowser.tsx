"use client";

import { useMemo, useState } from "react";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { Input } from "@/components/ui/lovable/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/lovable/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/lovable/alert-dialog";
import type { MediaAsset } from "@/types/domain";
import type { PlaylistListItem } from "@/features/media-workspace/playlists";
import { formatDuration } from "@/features/media-workspace/playlists";
import { appendPickedAssets, type ZoneBindingDraft } from "../zone-bindings";

export function CompositionContentBrowser({ binding, selectedZoneLabel, assets, playlists, previews, playlistPreviews, onChange }: {
  binding: ZoneBindingDraft | null;
  /** e.g. "A · Header" — already formatted by the page, which owns the zone index/letter. */
  selectedZoneLabel: string | null;
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
  const [pendingAsset, setPendingAsset] = useState<{ id: string; isImage: boolean } | null>(null);
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
        <p className="text-xs text-muted-foreground">
          {selectedZoneLabel ? `Assigning to Zone ${selectedZoneLabel}` : "Select a zone to assign content."}
        </p>
      </div>
      <Tabs value={tab} onValueChange={(value) => setTab(value as "media" | "playlists")}>
        <TabsList className="h-9 w-full shrink-0 rounded-none border-b border-border bg-transparent p-0">
          <TabsTrigger value="media" className="flex-1 text-xs">Media</TabsTrigger>
          <TabsTrigger value="playlists" className="flex-1 text-xs">Playlists</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="space-y-2 border-b border-border p-3">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${tab}…`} className="h-8 text-xs md:text-xs" />
        {tab === "media" && (
          <div className="grid grid-cols-2 gap-2">
            <select aria-label="Media type" value={kind} onChange={(event) => setKind(event.target.value)} className="h-8 rounded-md border border-border bg-card px-2 text-xs"><option value="">All types</option><option value="image">Images</option><option value="video">Videos</option></select>
            <select aria-label="Media folder" value={folder} onChange={(event) => setFolder(event.target.value)} className="h-8 rounded-md border border-border bg-card px-2 text-xs"><option value="">All folders</option>{folders.map((id) => <option key={id} value={id}>{id === "uncategorized" ? "Uncategorized" : "Folder"}</option>)}</select>
          </div>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-3">
        {items.map((item) => {
          const isPlaylist = tab === "playlists";
          const asset = isPlaylist ? null : item as MediaAsset;
          const playlist = isPlaylist ? item as PlaylistListItem : null;
          const label = playlist?.name ?? asset?.title ?? asset?.file?.original_filename ?? "Untitled";
          const url = playlist ? playlistPreviews[playlist.id]?.url : asset ? previews[asset.id] : undefined;
          const caption = playlist
            ? `Playlist · ${playlist.total_duration_seconds == null ? "—" : formatDuration(playlist.total_duration_seconds)}`
            : `${asset?.kind === "video" ? "Video" : "Image"}${asset?.duration_seconds == null ? "" : ` · ${formatDuration(asset.duration_seconds)}`}`;
          return (
            <button
              key={item.id}
              type="button"
              title={label}
              disabled={!binding}
              onClick={() => {
                if (!binding) return;
                if (playlist) onChange({ ...binding, source: "playlist", playlistId: playlist.id, playlistName: playlist.name, assetItems: [] });
                if (asset) {
                  const picked = { id: asset.id, isImage: asset.kind === "image" };
                  if (binding.source === "playlist" && binding.playlistId) { setPendingAsset(picked); return; }
                  onChange(appendPickedAssets(binding, [picked]));
                }
              }}
              className="flex w-full items-center gap-2 rounded-lg border border-border bg-card p-2 text-left hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MediaThumb
                url={url}
                thumbnailUrl={playlist ? playlistPreviews[playlist.id]?.thumbnailUrl : undefined}
                kind={asset?.kind}
                mimeType={asset?.file?.mime_type}
                alt={label}
                className="h-10 w-16 shrink-0 rounded"
              />
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 block text-xs font-medium text-foreground">{label}</span>
                <span className="block truncate text-xs text-muted-foreground">{caption}</span>
              </span>
            </button>
          );
        })}
        {items.length === 0 && <p className="py-8 text-center text-xs text-muted-foreground">No content found.</p>}
      </div>
      <div className="m-3 mt-0 rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
        {binding ? "Click an item to add it to the selected Zone." : "Select a Zone, then click an item to add it."}
      </div>

      <AlertDialog open={pendingAsset != null} onOpenChange={(open) => { if (!open) setPendingAsset(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace the bound Playlist?</AlertDialogTitle>
            <AlertDialogDescription>
              This Zone is bound to the Playlist &ldquo;{binding?.playlistName ?? "Playlist"}&rdquo;. Adding Media replaces it with a Media list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingAsset(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (binding && pendingAsset) onChange(appendPickedAssets(binding, [pendingAsset]));
                setPendingAsset(null);
              }}
            >
              Replace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
