"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fetchMediaAssets } from "@/lib/api/media-api";
import type { MediaAsset } from "@/types/domain";
import type { ZonePreviewFrame } from "@/features/media-workspace/preview/preview-clock";
import { useUndoableState } from "../use-undoable-state";
import { usePlaylistPreviewHandoff } from "../use-playlist-preview-handoff";
import {
  appendItems,
  emptyEditorState,
  moveItem,
  savedStateLabel,
  type EditorState,
} from "../playlist-editor-state";
import type { DraftItem, PlaylistInfo, PlaylistPlayback } from "../types";
import { AddItemDrawer } from "./AddItemDrawer";
import { PlaylistEditorHeader } from "./PlaylistEditorHeader";
import { PlaylistItemsPane } from "./PlaylistItemsPane";
import { PlaylistTimelinePane } from "./PlaylistTimelinePane";
import { PlaylistPlaybackSettings } from "./PlaylistPlaybackSettings";
import { PlaylistPropertiesPane } from "./PlaylistPropertiesPane";
import { RevisionConflictCard } from "./RevisionConflictCard";
import { UnsavedLeaveConfirm } from "./UnsavedLeaveConfirm";
import { usePlaylistEditorRow } from "./usePlaylistEditorRow";

const LIST_PATH = "/media-workspace/playlists";

export function PlaylistEditorPage({ playlistId }: { playlistId?: string | null }) {
  const router = useRouter();
  const history = useUndoableState<EditorState>(emptyEditorState());
  const { present } = history;

  const [info, setInfo] = useState<PlaylistInfo>({ playlistType: "standard" });
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [nowPlayingItemId, setNowPlayingItemId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [propTab, setPropTab] = useState<"item" | "playlist">("playlist");
  const [seekRequest, setSeekRequest] = useState<{ seconds: number; id: number } | null>(null);

  const row = usePlaylistEditorRow({ playlistId, history, info, setInfo });

  useEffect(() => {
    if (!row.isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [row.isDirty]);

  useEffect(() => {
    let alive = true;
    fetchMediaAssets()
      .then((data) => alive && setAssets(data))
      .catch(() => undefined)
      .finally(() => alive && setAssetsLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const setName = (name: string) => history.commit((s) => ({ ...s, name }));
  const setPlayback = (patch: Partial<PlaylistPlayback>) =>
    history.commit((s) => ({ ...s, playback: { ...s.playback, ...patch } }));
  const patchItem = (assetId: string, patch: Partial<DraftItem>) =>
    history.commit((s) => ({
      ...s,
      items: s.items.map((i) => (i.mediaAssetId === assetId ? { ...i, ...patch } : i)),
    }));
  const removeItem = (assetId: string) => {
    history.commit((s) => ({ ...s, items: s.items.filter((i) => i.mediaAssetId !== assetId) }));
    setSelectedItemId((current) => (current === assetId ? null : current));
  };

  const addAssets = (picked: MediaAsset[]) =>
    history.commit((s) => ({ ...s, items: appendItems(s.items, picked, s.playback) }));

  const selectItem = (assetId: string) => {
    setSelectedItemId(assetId);
    setPropTab("item");
  };

  const referencedAssets = useMemo(() => {
    const ids = new Set(present.items.map((i) => i.mediaAssetId));
    return assets.filter((a) => ids.has(a.id));
  }, [assets, present.items]);
  const { openPreview } = usePlaylistPreviewHandoff(() => ({
    id: row.serverId,
    name: present.name,
    items: present.items,
    playback: present.playback,
    assets: referencedAssets,
  }));

  const goBack = () => {
    if (row.isDirty) {
      setConfirmLeave(true);
      return;
    }
    router.push(LIST_PATH);
  };

  if (row.loading) return <p className="p-6 text-sm text-zinc-400">กำลังโหลด...</p>;
  if (row.loadError) {
    return (
      <Card className="p-6">
        <p className="text-sm text-red-500">{row.loadError.message}</p>
        <Button className="mt-4" variant="secondary" onClick={() => router.push(LIST_PATH)}>
          กลับไป Playlists
        </Button>
      </Card>
    );
  }

  const savedLabel = savedStateLabel(row.isDirty, row.lastSavedAt, !!row.serverId);
  const selectedItem = present.items.find((i) => i.mediaAssetId === selectedItemId) ?? null;
  const onFrame = (frame: ZonePreviewFrame | null) =>
    setNowPlayingItemId(frame?.item?.mediaAssetId ?? null);

  return (
    <div className="flex h-[calc(100dvh-9rem)] min-h-0 flex-col gap-4 overflow-hidden">
      <PlaylistEditorHeader
        name={present.name}
        savedLabel={savedLabel}
        lastUpdatedAt={row.lastSavedAt}
        hasItems={present.items.length > 0}
        saving={row.saving}
        onName={setName}
        onCancel={goBack}
        onPreview={openPreview}
        onSave={row.save}
      />

      {confirmLeave && (
        <UnsavedLeaveConfirm onStay={() => setConfirmLeave(false)} onLeave={() => router.push(LIST_PATH)} />
      )}
      {row.saveError && (
        <Card className="border-red-200 p-4 dark:border-red-900">
          <p className="text-sm text-red-600 dark:text-red-400">{row.saveError}</p>
        </Card>
      )}
      {row.conflict && <RevisionConflictCard message={row.conflict} onReload={row.reloadFromServer} />}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[340px_minmax(0,1fr)_340px]">
        <PlaylistItemsPane
          items={present.items}
          assets={assets}
          selectedId={selectedItemId}
          nowPlayingId={nowPlayingItemId}
          onSelect={selectItem}
          onMove={(from, to) => history.commit((s) => ({ ...s, items: moveItem(s.items, from, to) }))}
          onRemove={removeItem}
          onSeek={(seconds) => setSeekRequest((current) => ({ seconds, id: (current?.id ?? 0) + 1 }))}
          onAddItem={() => setDrawerOpen(true)}
        />

        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto">
          <PlaylistTimelinePane
            name={present.name}
            items={present.items}
            playback={present.playback}
            assets={assets}
            selectedId={selectedItemId}
            nowPlayingId={nowPlayingItemId}
            onSelect={selectItem}
            onFrame={onFrame}
            seekRequest={seekRequest}
            onSeek={(seconds) => setSeekRequest((current) => ({ seconds, id: (current?.id ?? 0) + 1 }))}
          />
          <PlaylistPlaybackSettings playback={present.playback} onPlayback={setPlayback} />
        </div>

        <PlaylistPropertiesPane
          tab={propTab}
          onTab={setPropTab}
          selectedItem={selectedItem}
          asset={selectedItem ? assets.find((a) => a.id === selectedItem.mediaAssetId) : undefined}
          info={info}
          onItemPatch={(patch) => selectedItem && patchItem(selectedItem.mediaAssetId, patch)}
          onItemRemove={() => selectedItem && removeItem(selectedItem.mediaAssetId)}
          onInfoChange={(patch) => setInfo((c) => ({ ...c, ...patch }))}
        />
      </div>

      {drawerOpen && (
        <AddItemDrawer
          assets={assets}
          loading={assetsLoading}
          alreadyInPlaylist={present.items.map((i) => i.mediaAssetId)}
          onAdd={addAssets}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
}
