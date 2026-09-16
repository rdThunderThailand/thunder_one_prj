"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { SearchIcon, XIcon } from "@/components/ui/icons";
import type { PlaylistListItem } from "@/features/media-workspace/playlists";
import { fetchContentFolders, fetchTags } from "@/lib/api/media-api";
import type { ContentFolder, MediaAsset, Tag } from "@/types/domain";
import { AssetPicker } from "./AssetPicker";

/** #35: the editor's one way to add content. A staged selection is committed with one
 *  "Add N Items" action; upload is a link out so a slow upload never locks the editor.
 *
 *  Closing hides the drawer rather than unmounting it, so the search, folder and tag filters
 *  survive a close/reopen and the folder + tag reads happen once per editor session instead of
 *  once per open. The first open is what mounts it: `AssetPicker` resolves preview URLs for
 *  everything it lists, and mounting eagerly would pay for that on editors nobody adds to. */
export function AddItemDrawer({
  open,
  assets,
  loading,
  alreadyInPlaylist,
  onAdd,
  onClose,
  purpose = "playlist",
  side = "right",
  playlists = [],
  playlistPreviews = {},
  onSelectPlaylist,
}: {
  open: boolean;
  assets: MediaAsset[];
  loading: boolean;
  alreadyInPlaylist: string[];
  onAdd: (assets: MediaAsset[]) => void;
  onClose: () => void;
  purpose?: "playlist" | "layout";
  side?: "left" | "right";
  playlists?: PlaylistListItem[];
  playlistPreviews?: Record<string, { url?: string; thumbnailUrl?: string }>;
  onSelectPlaylist?: (playlist: PlaylistListItem) => void;
}) {
  const [staged, setStaged] = useState<string[]>([]);
  const [source, setSource] = useState<"media" | "playlists">("media");
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [playlistQuery, setPlaylistQuery] = useState("");
  const [folders, setFolders] = useState<ContentFolder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  // Latched on the first open. Adjusting state during render is React's own answer to
  // "derive from a prop change" — an effect here would trip the no-sync-setState rule.
  const [hasOpened, setHasOpened] = useState(open);
  if (open && !hasOpened) setHasOpened(true);

  useEffect(() => {
    if (!hasOpened) return;
    fetchContentFolders("asset").then(setFolders).catch(() => undefined);
    fetchTags().then(setTags).catch(() => undefined);
  }, [hasOpened]);

  // Assets already in the Playlist are off the table — re-adding one would be a silent no-op.
  const pickable = useMemo(
    () => assets.filter((a) => !alreadyInPlaylist.includes(a.id)),
    [assets, alreadyInPlaylist],
  );

  const toggle = (asset: MediaAsset) =>
    setStaged((s) => (s.includes(asset.id) ? s.filter((id) => id !== asset.id) : [...s, asset.id]));

  // Only the staged selection is dropped on close — keeping it would re-offer assets the
  // commit just added. The filters around it are the part worth remembering.
  const close = () => {
    setStaged([]);
    setPlaylistId(null);
    onClose();
  };

  const commit = () => {
    if (source === "playlists") {
      const playlist = playlists.find((candidate) => candidate.id === playlistId);
      if (playlist) onSelectPlaylist?.(playlist);
      close();
      return;
    }
    const byId = new Map(assets.map((a) => [a.id, a]));
    // Selection order, not list order (guideline: "adds them all in one action").
    onAdd(staged.map((id) => byId.get(id)).filter((a): a is MediaAsset => !!a));
    close();
  };

  const isLayout = purpose === "layout";

  if (!hasOpened) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex bg-black/30 transition-opacity duration-200 ${side === "left" ? "justify-start" : "justify-end"} ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      onClick={close}
      inert={!open}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="asset-picker-title"
        className={`flex h-full w-full max-w-2xl flex-col bg-white shadow-xl transition-transform duration-200 dark:bg-zinc-900 ${open ? "translate-x-0" : side === "left" ? "-translate-x-full" : "translate-x-full"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 p-5 dark:border-zinc-800">
          <div>
            <h2 id="asset-picker-title" className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {isLayout ? "Pick Media Asset" : "Add Item"}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {isLayout ? "Select media to insert into this Zone." : "เลือก media ที่จะเพิ่มลง Playlist"} ·{" "}
              <Link href="/media-workspace/assets/upload" target="_blank" className="text-indigo-600 hover:underline dark:text-indigo-400">Upload new media ↗</Link>
            </p>
          </div>
          <button type="button" aria-label="ปิด" onClick={close} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <XIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLayout && (
            <div className="mb-4 flex rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-800">
              {(["media", "playlists"] as const).map((value) => (
                <button key={value} type="button" onClick={() => setSource(value)} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${source === value ? "bg-white text-indigo-700 shadow-sm dark:bg-zinc-900 dark:text-indigo-300" : "text-zinc-500"}`}>
                  {value === "media" ? "Media" : "Playlists"}
                </button>
              ))}
            </div>
          )}
          {source === "media" ? (
            <AssetPicker assets={pickable} loading={loading} selectedIds={staged} onToggle={toggle} folders={folders} tags={tags} />
          ) : (
            <div className="flex flex-col gap-3">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input value={playlistQuery} onChange={(event) => setPlaylistQuery(event.target.value)} placeholder="Search playlists..." className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900" />
              </div>
              {playlists.filter((playlist) => playlist.name.toLowerCase().includes(playlistQuery.trim().toLowerCase())).map((playlist) => (
                <button key={playlist.id} type="button" onClick={() => setPlaylistId(playlist.id)} className={`flex items-center gap-3 rounded-xl border p-3 text-left ${playlistId === playlist.id ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" : "border-zinc-200 dark:border-zinc-700"}`}>
                  <MediaThumb url={playlistPreviews[playlist.id]?.url} thumbnailUrl={playlistPreviews[playlist.id]?.thumbnailUrl} alt={`${playlist.name} thumbnail`} className="h-12 w-20" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{playlist.name}</span><span className="text-xs text-zinc-500">{playlist.item_count} items · {playlist.status}</span></span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-zinc-100 p-4 dark:border-zinc-800">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {source === "playlists" ? (playlistId ? "1 playlist selected" : "No playlist selected") : `${staged.length} ${isLayout ? "assets" : "items"} selected`}
            {source === "media" && staged.length > 0 && (
              <button type="button" onClick={() => setStaged([])} className="ml-3 text-indigo-600 hover:underline dark:text-indigo-400">
                Clear
              </button>
            )}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button onClick={commit} disabled={source === "playlists" ? !playlistId : staged.length === 0}>
              {source === "playlists" ? "Add Playlist" : `Add ${staged.length} ${isLayout ? (staged.length === 1 ? "Asset" : "Assets") : (staged.length === 1 ? "Item" : "Items")}`}
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
