"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { classifyApiError, UserFacingError, type ClassifiedError } from "@/lib/api/api-error";
import { useEditorLifecycle } from "../../editor-lifecycle/useEditorLifecycle";
import { fetchPlaylist, setPlaylistItems, upsertPlaylist } from "../services/playlists-api";
import { encodeMetadata } from "../metadata";
import { resolveDraftStatus } from "../resolve-draft-status";
import { playlistDisplayStatus } from "../status-display";
import type { UndoableState } from "../use-undoable-state";
import { editorStateFromDetail, type EditorState } from "../playlist-editor-state";
import type { PlaylistDetail, PlaylistInfo, PlaylistStatus } from "../types";

const LIST_PATH = "/media-workspace/playlists";

type PlaylistSnapshot = { state: EditorState; info: PlaylistInfo };
type SaveIntent = { activate: boolean };

/** The Playlist row's lifecycle — load, optimistic-locked save, conflict reload — kept out of
 *  the editor component so the 3-pane view stays a layout. The working copy (name/items/playback)
 *  lives in `history`; descriptive `info` lives beside it. Dirty / save-slot / conflict /
 *  leave-guard mechanics come from `useEditorLifecycle` (ADR 0127). */
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
  const [status, setStatus] = useState<PlaylistStatus>("draft");
  const [inUseCount, setInUseCount] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(!!playlistId);
  const [loadError, setLoadError] = useState<ClassifiedError | null>(null);

  /** Writes `snapshot` (not `history.present`, which a Save click may not have caught up with yet). */
  const write = async (snapshot: PlaylistSnapshot, intent?: SaveIntent): Promise<string> => {
    const { state: present, info: savedInfo } = snapshot;
    if (!present.name.trim()) throw new UserFacingError("กรุณากรอกชื่อ Playlist ก่อนบันทึก");
    const existingId = serverId ?? playlistId ?? null;
    const upserted = await upsertPlaylist({
      name: present.name.trim(),
      status: resolveDraftStatus(existingId, intent?.activate ?? false),
      metadata: encodeMetadata({ info: savedInfo, playback: present.playback }),
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
        ...(item.transitionDurationSeconds != null
          ? { transition_duration_seconds: item.transitionDurationSeconds }
          : {}),
        ...(item.fit ? { fit: item.fit } : {}),
        ...(item.backgroundColor ? { background_color: item.backgroundColor } : {}),
        ...(item.notes ? { notes: item.notes } : {}),
      })),
    );
    setRevision(itemsRes.revision ?? upserted.revision);
    return upserted.playlist_id;
  };

  const lifecycle = useEditorLifecycle<PlaylistSnapshot, SaveIntent, string>({
    snapshot: { state: history.present, info },
    hasRow: !!serverId,
    write,
    reload: async () => {
      const id = serverId ?? playlistId;
      if (!id) return;
      hydrate(await fetchPlaylist(id));
    },
    fallbackError: "บันทึก Playlist ไม่สำเร็จ",
    onSaved: (id, intent) => {
      if (!(serverId ?? playlistId)) window.history.replaceState(null, "", `${LIST_PATH}/${id}`);
      setServerId(id);
      // Save & Activate reads Active at once, whether or not a Program uses it yet (ADR 0125).
      if (intent?.activate) setStatus((current) => (current === "draft" ? "active" : current));
      toast.success(intent?.activate && status === "draft" ? "บันทึกและเปิดใช้งานแล้ว" : "บันทึกแล้ว");
    },
  });

  const hydrate = (detail: PlaylistDetail) => {
    const { state, revision: rev, info: loadedInfo } = editorStateFromDetail(detail);
    history.reset(state);
    lifecycle.resetBaseline({ state, info: loadedInfo });
    setServerId(detail.id);
    setRevision(rev);
    setStatus(playlistDisplayStatus(detail));
    setInUseCount(detail.in_use_count);
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

  /** Resolves to the saved row's id, or `null` when nothing was written; Publish Changes and the
   *  publish prep dialog must not go on after a failed save. `activate` marks a draft ready (#404):
   *  the editor's primary Save does it, "Save Draft" does not. */
  const save = async (activate = false, nameOverride?: string): Promise<string | null> => {
    const current = history.present;
    const present = nameOverride === undefined ? current : { ...current, name: nameOverride };
    // An empty name must not become an undo step; `write` refuses it.
    if (present.name.trim() && present.name !== current.name) history.commit((state) => ({ ...state, name: present.name }));
    return lifecycle.save({ activate }, { state: present, info });
  };

  return {
    serverId,
    status,
    inUseCount,
    isDirty: lifecycle.isDirty,
    saveStatus: lifecycle.status,
    lastSavedAt: lifecycle.lastSavedAt,
    loading,
    loadError,
    saving: lifecycle.isSaving,
    saveError: lifecycle.saveError,
    conflict: lifecycle.conflict,
    save,
    ensureSaved: lifecycle.ensureSaved,
    reloadFromServer: lifecycle.reloadFromServer,
    requestLeave: lifecycle.requestLeave,
    leaveDialog: lifecycle.leaveDialog,
  };
}
