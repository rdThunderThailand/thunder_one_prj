"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/lovable/button";
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
  const [propTab, setPropTab] = useState<"item" | "playlist">("item");
  const [seekRequest, setSeekRequest] = useState<{ seconds: number; id: number } | null>(null);

  const row = usePlaylistEditorRow({ playlistId, history, info, setInfo });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "z") return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      event.preventDefault();
      if (event.shiftKey) history.redo();
      else history.undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [history]);

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

  if (row.loading) return <p className="p-6 text-sm text-muted-foreground">กำลังโหลด...</p>;
  if (row.loadError) {
    return (
      <Card className="p-6">
        <p className="text-sm text-danger">{row.loadError.message}</p>
        <Button className="mt-4" variant="outline" onClick={() => router.push(LIST_PATH)}>
          กลับไป Playlists
        </Button>
      </Card>
    );
  }

  const savedLabel = savedStateLabel(row.isDirty, row.lastSavedAt, !!row.serverId);
  const effectiveSelectedItemId = selectedItemId ?? present.items[0]?.mediaAssetId ?? null;
  const selectedItem = present.items.find((i) => i.mediaAssetId === effectiveSelectedItemId) ?? null;
  const onFrame = (frame: ZonePreviewFrame | null) =>
    setNowPlayingItemId(frame?.item?.mediaAssetId ?? null);

  return (
    <div className="flex min-h-[calc(100dvh-9rem)] flex-col gap-4 xl:h-[calc(100dvh-9rem)] xl:min-h-0 xl:overflow-hidden">
      <PlaylistEditorHeader
        name={present.name}
        status={row.status}
        savedLabel={savedLabel}
        lastUpdatedAt={row.lastSavedAt}
        hasItems={present.items.length > 0}
        saving={row.saving}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onName={setName}
        onUndo={history.undo}
        onRedo={history.redo}
        onCancel={goBack}
        onPreview={openPreview}
        onPublish={() => router.push(`/media-workspace/publications/create?playlistId=${row.serverId}`)}
        publishDisabledReason={
          !row.serverId
            ? "บันทึก Playlist ก่อนเผยแพร่"
            : row.isDirty
              ? "บันทึกการแก้ไขล่าสุดก่อนเผยแพร่"
              : null
        }
        onSave={row.save}
      />

      {confirmLeave && (
        <UnsavedLeaveConfirm onStay={() => setConfirmLeave(false)} onLeave={() => router.push(LIST_PATH)} />
      )}
      {row.saveError && (
        <Card className="border-danger/30 p-4">
          <p className="text-sm text-danger">{row.saveError}</p>
        </Card>
      )}
      {row.conflict && <RevisionConflictCard message={row.conflict} onReload={row.reloadFromServer} />}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[300px_minmax(0,1fr)_290px] xl:overflow-hidden">
        <PlaylistItemsPane
          items={present.items}
          playback={present.playback}
          assets={assets}
          selectedId={effectiveSelectedItemId}
          nowPlayingId={nowPlayingItemId}
          onSelect={selectItem}
          onMove={(from, to) => history.commit((s) => ({ ...s, items: moveItem(s.items, from, to) }))}
          onRemove={removeItem}
          onSeek={(seconds) => setSeekRequest((current) => ({ seconds, id: (current?.id ?? 0) + 1 }))}
          onAddItem={() => setDrawerOpen(true)}
        />

        <div className="flex min-h-0 flex-col gap-3">
          <PlaylistTimelinePane
            name={present.name}
            items={present.items}
            playback={present.playback}
            assets={assets}
            selectedId={effectiveSelectedItemId}
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
          playback={present.playback}
          onItemPatch={(patch) => selectedItem && patchItem(selectedItem.mediaAssetId, patch)}
          onItemRemove={() => selectedItem && removeItem(selectedItem.mediaAssetId)}
          onInfoChange={(patch) => setInfo((c) => ({ ...c, ...patch }))}
        />
      </div>

      <AddItemDrawer
        open={drawerOpen}
        assets={assets}
        loading={assetsLoading}
        alreadyInPlaylist={present.items.map((i) => i.mediaAssetId)}
        onAdd={addAssets}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
