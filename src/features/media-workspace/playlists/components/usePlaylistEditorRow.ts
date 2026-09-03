"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { classifyApiError, isConflict, type ClassifiedError } from "@/lib/api/api-error";
import { fetchPlaylist, setPlaylistItems, upsertPlaylist } from "../services/playlists-api";
import { encodeMetadata } from "../metadata";
import { resolveDraftStatus } from "../resolve-draft-status";
import type { UndoableState } from "../use-undoable-state";
import { editorSnapshot, editorStateFromDetail, emptyEditorState, type EditorState } from "../playlist-editor-state";
import type { PlaylistDetail, PlaylistInfo } from "../types";

const LIST_PATH = "/media-workspace/playlists";
const baseline = (state: EditorState, info: PlaylistInfo) => editorSnapshot(state) + JSON.stringify(info);

/** The Playlist row's lifecycle — load, optimistic-locked save, conflict reload — kept out of
 *  the editor component so the 3-pane view stays a layout. The working copy (name/items/playback)
 *  lives in `history`; descriptive `info` lives beside it. */
export function usePlaylistEditorRow({
  playlistId,
  history,
  info,
  setInfo,
}: {
  playlistId?: string | null;
  history: UndoableState<EditorState>;
  info: PlaylistInfo;
  setInfo: (info: PlaylistInfo) => void;
}) {
  const idempotencyKey = useRef<string | null>(null);
  const [serverId, setServerId] = useState<string | null>(playlistId ?? null);
  const [revision, setRevision] = useState<number | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(
    playlistId ? null : baseline(emptyEditorState(), info),
  );
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(!!playlistId);
  const [loadError, setLoadError] = useState<ClassifiedError | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);

  const hydrate = (detail: PlaylistDetail) => {
    const { state, revision: rev, info: loadedInfo } = editorStateFromDetail(detail);
    history.reset(state);
    setSavedSnapshot(baseline(state, loadedInfo));
    setServerId(detail.id);
    setRevision(rev);
    setInfo(loadedInfo);
  };

  useEffect(() => {
    if (!playlistId) return;
    let alive = true;
    fetchPlaylist(playlistId)
      .then((detail) => alive && hydrate(detail))
      .catch((err) => alive && setLoadError(classifyApiError(err, "โหลด Playlist ไม่สำเร็จ")))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlistId]);

  const isDirty = savedSnapshot !== null && baseline(history.present, info) !== savedSnapshot;

  const save = async () => {
    const present = history.present;
    if (!present.name.trim()) {
      setSaveError("กรุณากรอกชื่อ Playlist ก่อนบันทึก");
      return;
    }
    setSaveError(null);
    setConflict(null);
    setSaving(true);
    try {
      const existingId = serverId ?? playlistId ?? null;
      const upserted = await upsertPlaylist({
        name: present.name.trim(),
        status: resolveDraftStatus(existingId, false),
        metadata: encodeMetadata({ info, playback: present.playback }),
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
      if (!existingId) window.history.replaceState(null, "", `${LIST_PATH}/${upserted.playlist_id}`);
      setServerId(upserted.playlist_id);
      setSavedSnapshot(baseline(present, info));
      setLastSavedAt(new Date());
      toast.success("บันทึกแล้ว");
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (isConflict(message)) {
        setConflict(
          classifyApiError(err, "มีการแก้ไข Playlist นี้จากที่อื่นหลังจากคุณเปิดหน้านี้ — กด โหลดใหม่ เพื่อดูเวอร์ชันล่าสุด").message,
        );
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
    hydrate(await fetchPlaylist(id));
    setConflict(null);
  };

  return { serverId, isDirty, lastSavedAt, loading, loadError, saving, saveError, conflict, save, reloadFromServer };
}
