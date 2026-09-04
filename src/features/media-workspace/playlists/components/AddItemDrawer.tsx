"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { XIcon } from "@/components/ui/icons";
import { fetchContentFolders, fetchTags } from "@/lib/api/media-api";
import type { ContentFolder, MediaAsset, Tag } from "@/types/domain";
import { AssetPicker } from "./AssetPicker";

/** #35: the editor's one way to add content. A staged selection is committed with one
 *  "Add N Items" action; upload is a link out so a slow upload never locks the editor. */
export function AddItemDrawer({
  assets,
  loading,
  alreadyInPlaylist,
  onAdd,
  onClose,
}: {
  assets: MediaAsset[];
  loading: boolean;
  alreadyInPlaylist: string[];
  onAdd: (assets: MediaAsset[]) => void;
  onClose: () => void;
}) {
  const [staged, setStaged] = useState<string[]>([]);
  const [folders, setFolders] = useState<ContentFolder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    fetchContentFolders("asset").then(setFolders).catch(() => undefined);
    fetchTags().then(setTags).catch(() => undefined);
  }, []);

  // Assets already in the Playlist are off the table — re-adding one would be a silent no-op.
  const pickable = useMemo(
    () => assets.filter((a) => !alreadyInPlaylist.includes(a.id)),
    [assets, alreadyInPlaylist],
  );

  const toggle = (asset: MediaAsset) =>
    setStaged((s) => (s.includes(asset.id) ? s.filter((id) => id !== asset.id) : [...s, asset.id]));

  const commit = () => {
    const byId = new Map(assets.map((a) => [a.id, a]));
    // Selection order, not list order (guideline: "adds them all in one action").
    onAdd(staged.map((id) => byId.get(id)).filter((a): a is MediaAsset => !!a));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-2xl flex-col bg-white shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 p-5 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Add Item</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              เลือก media ที่จะเพิ่มลง Playlist ·{" "}
              <Link href="/media-workspace/assets/upload" target="_blank" className="text-indigo-600 hover:underline dark:text-indigo-400">
                Upload new media ↗
              </Link>
            </p>
          </div>
          <button type="button" aria-label="ปิด" onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <XIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <AssetPicker
            assets={pickable}
            loading={loading}
            selectedIds={staged}
            onToggle={toggle}
            folders={folders}
            tags={tags}
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-zinc-100 p-4 dark:border-zinc-800">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {staged.length} items selected
            {staged.length > 0 && (
              <button type="button" onClick={() => setStaged([])} className="ml-3 text-indigo-600 hover:underline dark:text-indigo-400">
                Clear
              </button>
            )}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={commit} disabled={staged.length === 0}>
              Add {staged.length} {staged.length === 1 ? "Item" : "Items"}
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
