"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { classifyApiError, isConflict, type ClassifiedError } from "@/lib/api/api-error";
import { fetchMediaAssets } from "@/lib/api/media-api";
import type { MediaAsset } from "@/types/domain";
import { fetchPlaylist, setPlaylistItems, upsertPlaylist } from "../services/playlists-api";
import { encodeMetadata } from "../metadata";
import { resolveDraftStatus } from "../resolve-draft-status";
import { formatDuration } from "../duration";
import { useUndoableState } from "../use-undoable-state";
import { usePlaylistPreviewHandoff } from "../use-playlist-preview-handoff";
import {
  DEFAULT_IMAGE_DURATION_SECONDS,
  editorSnapshot,
  editorStateFromDetail,
  emptyEditorState,
  moveItem,
  savedStateLabel,
  totalItemsDurationSeconds,
  type EditorState,
} from "../playlist-editor-state";
import type { DraftItem, PlaylistInfo, PlaylistPlayback } from "../types";
import { PlaylistContentLibrary } from "./PlaylistContentLibrary";
import { SelectedItems } from "./SelectedItems";
import { PlaylistPlaybackFields } from "./PlaylistPlaybackFields";
import { RevisionConflictCard } from "./RevisionConflictCard";
import { UnsavedLeaveConfirm } from "./UnsavedLeaveConfirm";

const LIST_PATH = "/media-workspace/playlists";

export function PlaylistEditorPage({ playlistId }: { playlistId?: string | null }) {
  const router = useRouter();
  const idempotencyKey = useRef<string | null>(null);
  const history = useUndoableState<EditorState>(emptyEditorState());
  const { present } = history;

  const [serverId, setServerId] = useState<string | null>(playlistId ?? null);
  const [revision, setRevision] = useState<number | null>(null);
  const [info, setInfo] = useState<PlaylistInfo>({ playlistType: "standard" });
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(
    playlistId ? null : editorSnapshot(emptyEditorState()),
  );
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [loading, setLoading] = useState(!!playlistId);
  const [loadError, setLoadError] = useState<ClassifiedError | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const isDirty = savedSnapshot !== null && editorSnapshot(present) !== savedSnapshot;

  // Sidebar / browser-back can't be caught with a React modal — the native prompt covers them
  // while dirty; the in-page Cancel button uses UnsavedLeaveConfirm.
  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

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

  useEffect(() => {
    if (!playlistId) return;
    let alive = true;
    fetchPlaylist(playlistId)
      .then((detail) => {
        if (!alive) return;
        const { state, revision: rev, info: loadedInfo } = editorStateFromDetail(detail);
        history.reset(state);
        setSavedSnapshot(editorSnapshot(state));
        setServerId(detail.id);
        setRevision(rev);
        setInfo(loadedInfo);
      })
      .catch((err) => alive && setLoadError(classifyApiError(err, "โหลด Playlist ไม่สำเร็จ")))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlistId]);

  const setName = (name: string) => history.commit((s) => ({ ...s, name }));
  const setPlayback = (patch: Partial<PlaylistPlayback>) =>
    history.commit((s) => ({ ...s, playback: { ...s.playback, ...patch } }));
  const addAsset = (asset: MediaAsset) =>
    history.commit((s) => {
      // Already in the list: no-op. Removal is the explicit X in SelectedItems so a stray
      // click in the picker can't silently drop an item's per-item duration/transition edits.
      if (s.items.some((i) => i.mediaAssetId === asset.id)) return s;
      const item: DraftItem = {
        mediaAssetId: asset.id,
        title: asset.title,
        kind: asset.kind,
        durationSeconds: asset.kind === "video" ? null : (s.playback.defaultImageDuration ?? DEFAULT_IMAGE_DURATION_SECONDS),
        transition: s.playback.defaultTransition ?? "fade",
      };
      return { ...s, items: [...s.items, item] };
    });

  const handleUploaded = async (asset: MediaAsset | null) => {
    const fresh = await fetchMediaAssets().catch(() => assets);
    setAssets(fresh);
    if (asset) addAsset(fresh.find((a) => a.id === asset.id) ?? asset);
  };

  // ADR 0061 §4: the handoff carries only the assets its items reference.
  const referencedAssets = useMemo(() => {
    const ids = new Set(present.items.map((i) => i.mediaAssetId));
    return assets.filter((a) => ids.has(a.id));
  }, [assets, present.items]);
  const { openPreview } = usePlaylistPreviewHandoff(() => ({
    id: serverId,
    name: present.name,
    items: present.items,
    playback: present.playback,
    assets: referencedAssets,
  }));

  const persist = async () => {
    const existingId = serverId ?? playlistId ?? null;
    const metadata = encodeMetadata({ info, playback: present.playback });
    const upserted = await upsertPlaylist({
      name: present.name.trim(),
      status: resolveDraftStatus(existingId, false),
      metadata,
      playlistId: existingId,
      expectedRevision: revision,
      idempotencyKey: (idempotencyKey.current ??= crypto.randomUUID()),
    });
    const itemsRes = await setPlaylistItems(
      upserted.playlist_id,
      present.items.map((item, index) => ({
        media_asset_id: item.mediaAssetId,
        position: index,
        ...(item.durationSeconds != null ? { duration_seconds: item.durationSeconds } : {}),
        transition: item.transition,
      })),
    );
    setRevision(itemsRes.revision ?? upserted.revision);
    if (!existingId) {
      // ADR 0060 §1: the URL catches up to the row without a full navigation.
      window.history.replaceState(null, "", `${LIST_PATH}/${upserted.playlist_id}`);
    }
    setServerId(upserted.playlist_id);
    setSavedSnapshot(editorSnapshot(present));
    setLastSavedAt(new Date());
  };

  const handleSave = async () => {
    if (!present.name.trim()) {
      setSaveError("กรุณากรอกชื่อ Playlist ก่อนบันทึก");
      return;
    }
    setSaveError(null);
    setConflict(null);
    setSaving(true);
    try {
      await persist();
      toast.success("บันทึกแล้ว");
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (isConflict(message)) {
        setConflict(classifyApiError(err, "มีการแก้ไข Playlist นี้จากที่อื่นหลังจากคุณเปิดหน้านี้ — กด โหลดใหม่ เพื่อดูเวอร์ชันล่าสุด").message);
      } else {
        setSaveError(classifyApiError(err, "บันทึก Playlist ไม่สำเร็จ").message);
      }
    } finally {
      setSaving(false);
    }
  };

  const reloadFromServer = async () => {
    const id = serverId ?? playlistId;
    if (!id) return;
    const { state, revision: rev, info: loadedInfo } = editorStateFromDetail(await fetchPlaylist(id));
    history.reset(state);
    setSavedSnapshot(JSON.stringify(state));
    setRevision(rev);
    setInfo(loadedInfo);
    setConflict(null);
  };

  const goBack = () => {
    if (isDirty) {
      setConfirmLeave(true);
      return;
    }
    router.push(LIST_PATH);
  };

  if (loading) return <p className="p-6 text-sm text-zinc-400">กำลังโหลด...</p>;
  if (loadError) {
    return (
      <Card className="p-6">
        <p className="text-sm text-red-500">{loadError.message}</p>
        <Button className="mt-4" variant="secondary" onClick={() => router.push(LIST_PATH)}>
          กลับไป Playlists
        </Button>
      </Card>
    );
  }

  const savedLabel = savedStateLabel(isDirty, lastSavedAt, !!serverId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={serverId ? "Edit Playlist" : "New Playlist"}
        subtitle={`${present.items.length} items · ${formatDuration(totalItemsDurationSeconds(present.items, assets))} · ${savedLabel}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={goBack}>Cancel</Button>
            <Button variant="secondary" onClick={history.undo} disabled={!history.canUndo}>Undo</Button>
            <Button variant="secondary" onClick={history.redo} disabled={!history.canRedo}>Redo</Button>
            <Button
              variant="secondary"
              onClick={openPreview}
              disabled={present.items.length === 0}
              title={present.items.length === 0 ? "เพิ่ม media ก่อนดู preview" : undefined}
            >
              Preview
            </Button>
            <Button onClick={handleSave} disabled={saving || !present.name.trim()}>
              {saving ? "กำลังบันทึก..." : "Save Draft"}
            </Button>
          </div>
        }
      />

      {confirmLeave && (
        <UnsavedLeaveConfirm onStay={() => setConfirmLeave(false)} onLeave={() => router.push(LIST_PATH)} />
      )}
      {saveError && (
        <Card className="border-red-200 p-4 dark:border-red-900">
          <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
        </Card>
      )}
      {conflict && <RevisionConflictCard message={conflict} onReload={reloadFromServer} />}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <PlaylistContentLibrary
            assets={assets}
            loading={assetsLoading}
            selectedIds={present.items.map((i) => i.mediaAssetId)}
            onToggle={addAsset}
            onUploaded={handleUploaded}
          />

          <Card className="p-5">
            <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Selected for Playlist ({present.items.length})
            </h2>
            <SelectedItems
              items={present.items}
              assets={assets}
              onMove={(from, to) => history.commit((s) => ({ ...s, items: moveItem(s.items, from, to) }))}
              onRemove={(assetId) =>
                history.commit((s) => ({ ...s, items: s.items.filter((i) => i.mediaAssetId !== assetId) }))
              }
              onPatch={(assetId, patch) =>
                history.commit((s) => ({
                  ...s,
                  items: s.items.map((i) => (i.mediaAssetId === assetId ? { ...i, ...patch } : i)),
                }))
              }
            />
          </Card>
        </div>

        <PlaylistPlaybackFields
          name={present.name}
          playback={present.playback}
          onName={setName}
          onPlayback={setPlayback}
        />
      </div>
    </div>
  );
}
