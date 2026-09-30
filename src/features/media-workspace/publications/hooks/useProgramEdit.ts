"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { fetchPlaylist } from "@/features/media-workspace/playlists";
import { fetchChannels } from "../../channels/services/channels-api";
import type { ChannelListItem } from "../../channels/types";
import {
  buildUpdatePublishedBody,
  detailToEditState,
  isProgramDirty,
  parseUpdatePublishedError,
  removedTargetLabels,
  targetDeviceIds,
  type ProgramEditState,
  type UpdatePublishedFailure,
} from "../program-edit";
import {
  activatePublication,
  checkScheduleConflicts,
  fetchPublication,
  saveBasicInfo,
  updatePublishedPublication,
} from "../services/publications-api";
import type { PublicationDetail, ScheduleConflict } from "../types";

/** Owns the Edit page's one state object (ADR 0080): load, dirty tracking, save and publish. */
export function useProgramEdit(id: string) {
  const [detail, setDetail] = useState<PublicationDetail | null>(null);
  const [state, setState] = useState<ProgramEditState | null>(null);
  const [baseline, setBaseline] = useState<ProgramEditState | null>(null);
  const [channels, setChannels] = useState<ChannelListItem[]>([]);
  const [loadError, setLoadError] = useState<ClassifiedError | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<UpdatePublishedFailure | null>(null);

  useEffect(() => {
    let alive = true;
    fetchPublication(id)
      .then(async (pub) => {
        // Core builds the badge (ADR 0080); an older Core would leave the page loading forever.
        if (!pub.display_status) throw new Error("Core did not return display_status");
        const playlist = pub.playlist?.id ? await fetchPlaylist(pub.playlist.id) : null;
        const next = detailToEditState(pub, playlist?.items);
        if (!alive) return;
        setDetail(pub);
        setState(next);
        setBaseline(next);
      })
      .catch((err) => {
        if (alive) setLoadError(classifyApiError(err, "โหลด Program ไม่สำเร็จ"));
      });
    // The Channel list is only needed for the advisory conflict check; a failure there must not
    // block editing, so it is swallowed here and the check reports "could not check" instead.
    fetchChannels()
      .then((list) => {
        if (alive) setChannels(list);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [id]);

  const isDirty = useMemo(
    () => (state && baseline ? isProgramDirty(baseline, state) : false),
    [state, baseline],
  );
  const displayStatus = detail?.display_status ?? null;

  const patch = useCallback((change: Partial<ProgramEditState>) => {
    setState((prev) => (prev ? { ...prev, ...change } : prev));
    setFailure(null);
  }, []);

  const removedTargets = useMemo(
    () => (state && baseline ? removedTargetLabels(baseline.targets, state.targets) : []),
    [state, baseline],
  );

  const checkConflicts = useCallback(async (): Promise<ScheduleConflict[]> => {
    if (!state?.schedule) return [];
    return checkScheduleConflicts({
      publication_id: id,
      device_ids: targetDeviceIds(channels, state.targets),
      starts_at: state.schedule.starts_at,
      ends_at: state.schedule.ends_at,
      recurrence: state.schedule.recurrence,
      timezone: state.schedule.timezone,
      priority: state.priority,
    });
  }, [id, state, channels]);

  /** Runs a write; resolves `null` on success, otherwise the failure (also kept in `failure`). */
  const run = useCallback(async (action: () => Promise<void>): Promise<UpdatePublishedFailure | null> => {
    setBusy(true);
    setFailure(null);
    try {
      await action();
      return null;
    } catch (err) {
      const next = parseUpdatePublishedError(err instanceof Error ? err.message : "Publish failed");
      setFailure(next);
      return next;
    } finally {
      setBusy(false);
    }
  }, []);

  /** Scheduled / Live: one call carrying the whole Program; continue from the returned revision. */
  const publishChanges = useCallback(
    () =>
      run(async () => {
        if (!state || !detail) throw new Error("Program is not loaded");
        const result = await updatePublishedPublication(
          id,
          buildUpdatePublishedBody(state, detail.revision ?? 0),
        );
        setDetail({ ...detail, name: state.name, revision: result.revision });
        setBaseline(state);
      }),
    [run, state, detail, id],
  );

  /** Draft: writes the details only — content, targets and schedule are still saved by the wizard. */
  const saveDraft = useCallback(
    (thenActivate: boolean) =>
      run(async () => {
        if (!state || !detail) throw new Error("Program is not loaded");
        const saved = await saveBasicInfo(
          {
            name: state.name.trim(),
            description: state.description,
            priority: state.priority,
            tags: state.tags,
            publication_type: state.content.type,
            playlist_id: state.content.playlistId ?? undefined,
            composition_id: state.content.compositionId ?? undefined,
          },
          id,
          undefined,
          detail.revision,
        );
        setDetail({ ...detail, revision: saved.revision ?? detail.revision });
        setBaseline(state);
        if (thenActivate) await activatePublication(id);
      }),
    [run, state, detail, id],
  );

  return {
    detail,
    state,
    channels,
    loadError,
    busy,
    failure,
    isDirty,
    displayStatus,
    removedTargets,
    patch,
    checkConflicts,
    publishChanges,
    saveDraft,
  };
}
