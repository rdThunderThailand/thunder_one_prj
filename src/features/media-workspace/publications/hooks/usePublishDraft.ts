"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  draftItemsToContentItems,
  basicInfoToForm,
  targetsFromSelection,
} from "../draft-mapping";
import { draftToSchedule, isDraftValid } from "../schedule-preset";
import {
  activatePublication,
  checkScheduleConflicts,
  fetchMediaAssets,
  fetchPublication,
  fetchTags,
  saveBasicInfo,
  savePublicationContent,
  savePublicationSchedule,
} from "../services/publications-api";
import { fetchChannels } from "../../channels/services/channels-api";
import type { ChannelListItem } from "../../channels/types";
import { selectedChannelDeviceIds } from "../channels-logic";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";
import { computeEligibility } from "../publish-eligibility";
import { classifyApiError, isConflict } from "@/lib/api/api-error";
import type { MediaAsset, Priority, PublicationSchedule, ScheduleConflict, Tag } from "../types";
import { DraftSaveError, draftSavePolicy, requireCompleteDraftSave, type DraftPersistResult } from "../draft-save-policy";

/** The two backend rejections that mean "the persisted draft id is no longer usable":
 * the row was deleted, or it left `draft` status (cancelled/activated elsewhere).
 * Matched on the message because the proxy only forwards `{ error: string }`. */
function isStaleDraftError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : "";
  return (
    msg.includes("publication not found for this tenant") ||
    msg.includes("only draft publications can be edited")
  );
}

export function usePublishDraft() {
  const router = useRouter();
  const [channels, setChannels] = useState<ChannelListItem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  // Assets load on their own track from the other refs: the wizard owns the single
  // read, and AssetLibraryStep's post-upload callback needs to re-run just this one.
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [assetsError, setAssetsError] = useState<string | null>(null);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [channelsError, setChannelsError] = useState<string | null>(null);
  const channelsRequest = useRef<Promise<{ channels: ChannelListItem[]; failed: boolean }> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [savingNext, setSavingNext] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [conflictsError, setConflictsError] = useState<string | null>(null);
  // Named distinctly from `conflicts` above — that's schedule/channel overlap
  // (media_schedule_conflicts). This is the draft revision optimistic-lock
  // conflict (docs/adr/0003), a different domain entirely.
  const [revisionConflict, setRevisionConflict] = useState<string | null>(null);

  const publicationId = usePublicationDraftStore((s) => s.publicationId);
  const idempotencyKey = usePublicationDraftStore((s) => s.idempotencyKey);
  const step = usePublicationDraftStore((s) => s.step);
  const furthestStep = usePublicationDraftStore((s) => s.furthestStep);
  const basicInfo = usePublicationDraftStore((s) => s.basicInfo);
  const assetItems = usePublicationDraftStore((s) => s.assetItems);
  const channelIds = usePublicationDraftStore((s) => s.channelIds);
  const groupIds = usePublicationDraftStore((s) => s.groupIds);
  const groupNamesById = usePublicationDraftStore((s) => s.groupNamesById);
  const schedule = usePublicationDraftStore((s) => s.schedule);
  const playlistId = usePublicationDraftStore((s) => s.playlistId);
  const compositionId = usePublicationDraftStore((s) => s.compositionId);

  const eligibility = computeEligibility({
    draft: { publicationId, idempotencyKey, step, furthestStep, basicInfo, assetItems, playlistId, compositionId, channelIds, groupIds, groupNamesById, schedule },
    assets,
    conflicts,
    conflictsError,
    // Assets not being in yet must read as "not ready to publish", the same as the
    // other refs — otherwise a held assetItem briefly shows as unverifiable.
    loadingRefs: loadingRefs || assetsLoading,
    checkingConflicts,
  });
  const canPublish = eligibility.canPublish;
  const eligibilityChecks = eligibility.checks;

  // The wizard's single Asset-library read. Returns the fresh list so the upload
  // callback in AssetLibraryStep can await it before selecting the new Asset.
  const reloadAssets = useCallback(
    (): Promise<MediaAsset[]> =>
      fetchMediaAssets()
        .then((data) => {
          setAssets(data);
          setAssetsError(null);
          return data;
        })
        .catch((err) => {
          setAssets([]);
          setAssetsError(err instanceof Error ? err.message : "Failed to load assets.");
          return [];
        })
        .finally(() => setAssetsLoading(false)),
    []
  );

  useEffect(() => {
    let isMounted = true;

    // #228: saves await this same read, including its failure result.
    const channelRead = fetchChannels().then((channels) => ({ channels, failed: false })).catch(() => {
        if (isMounted) {
          setChannelsError("โหลด Channels ไม่สำเร็จ กรุณาโหลดหน้าใหม่ก่อนบันทึก");
        }
        return { channels: [], failed: true };
      });
    channelsRequest.current = channelRead;
    Promise.all([
      channelRead,
      fetchTags().catch(() => []),
    ]).then(([fetchedChannels, fetchedTags]) => {
      if (isMounted) {
        setChannels(fetchedChannels.channels);
        setTags(fetchedTags);
        setLoadingRefs(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    void reloadAssets();
  }, [reloadAssets]);

  const channelIdsStr = channelIds.join(",");
  // The stored shape is the one thing a conflict depends on: any field of any preset
  // (month days, dates, Continuous times) that changes it re-triggers the check.
  const scheduleKey = isDraftValid(schedule) ? JSON.stringify(draftToSchedule(schedule)) : "";

  useEffect(() => {
    let cancelled = false;

    if (channelIds.length === 0 || scheduleKey === "") {
      // Deferred by a tick on purpose: this repo's lint (React Compiler rules)
      // rejects a synchronous setState inside an effect body.
      const resetTimer = setTimeout(() => {
        if (!cancelled) {
          setConflicts([]);
          setCheckingConflicts(false);
          setConflictsError(null);
        }
      }, 0);
      return () => {
        cancelled = true;
        clearTimeout(resetTimer);
      };
    }

    const timer = setTimeout(() => {
      setCheckingConflicts(true);
      const payload = JSON.parse(scheduleKey) as PublicationSchedule;
      checkScheduleConflicts({
        publication_id: publicationId,
        device_ids: selectedChannelDeviceIds(channels, channelIds),
        starts_at: payload.starts_at,
        ends_at: payload.ends_at,
        recurrence: payload.recurrence,
        timezone: payload.timezone,
        priority: basicInfo.priorityId as Priority,
      })
        .then((res) => {
          if (!cancelled) {
            setConflicts(res);
            setCheckingConflicts(false);
            setConflictsError(null);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setConflicts([]);
            setCheckingConflicts(false);
            setConflictsError(err instanceof Error ? err.message : "Failed to check schedule conflicts.");
          }
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    publicationId,
    channels,
    channelIds,
    channelIdsStr,
    scheduleKey,
    basicInfo.priorityId,
  ]);

  /**
   * Persists basic info → content → schedule with the fields captured for this request.
   * `forPublish` forces the targets and the schedule to be sent regardless of
   * which step the user is on: activation is refused without either. On a plain
   * draft save, targets go once Program has been reached — the backend treats a
   * received `targets` as authoritative, so sending an empty array earlier would
   * wipe targets that were already saved.
   */
  const persistDraft = async (forPublish: boolean): Promise<DraftPersistResult> => {
    const state = usePublicationDraftStore.getState();
    const policy = draftSavePolicy(state, forPublish);
    // A composition draft may be saved before step 2 picks a Composition — the backend allows it
    // (media_publication_upsert, ADR 0049 §12, revised 2026-08-26) exactly like an unpicked
    // Playlist. Publishing still requires it; that guard stays.
    if (forPublish && state.basicInfo.publicationType === "composition" && !state.compositionId) {
      throw new Error("กรุณาเลือก Layout ก่อนบันทึก");
    }
    // ver02 (ADR 0072 §2) runs Choose Content (step 1) before Prepare Content (step 2), where
    // the name is entered. `media_publication_upsert` refuses an empty name, so a draft with no
    // name yet has nothing to persist server-side — the selection lives in the localStorage
    // draft until step 2. Mirrors the same guard in `saveDraft`.
    if (!policy.shouldPersist) return { kind: "skipped" };
    const channelResult = policy.sendTargets ? await channelsRequest.current : null;
    if (policy.sendTargets && (!channelResult || channelResult.failed)) {
      throw new DraftSaveError("โหลด Channels ไม่สำเร็จ กรุณาโหลดหน้าใหม่ก่อนบันทึก");
    }
    const targets =
      policy.sendTargets
        ? targetsFromSelection(state.channelIds, state.groupIds, state.groupNamesById, channelResult?.channels ?? [])
        : undefined;

    const basicForm = basicInfoToForm(state.basicInfo, state.playlistId, state.compositionId);
    let res;
    try {
      res = await saveBasicInfo(basicForm, state.publicationId, targets, state.revision, state.idempotencyKey);
    } catch (err) {
      // The draft id lives in localStorage forever, but the row it points at can be
      // deleted (or leave `draft` via cancel/activate) from the /publications page —
      // which used to brick the wizard until the user hit Cancel. Re-create instead.
      if (state.publicationId && isStaleDraftError(err)) {
        // Re-minting first: reusing the old key would resolve the retry back to
        // the same dead row instead of creating a fresh draft (docs/adr/0007 media).
        state.resetIdempotencyKey();
        res = await saveBasicInfo(basicForm, null, targets, undefined, usePublicationDraftStore.getState().idempotencyKey);
      } else {
        // Surfaced as a dedicated banner (CreatePublicationPage), not the generic
        // error text — "reload" / "overwrite" are actions, not just a message.
        if (err instanceof Error && isConflict(err.message)) {
          setRevisionConflict(classifyApiError(err, err.message).message);
        }
        throw err;
      }
    }
    const newId = res.publication_id || res.id || state.publicationId;
    if (!newId) {
      throw new Error("No publication ID returned from backend.");
    }
    state.setPublicationId(newId);
    if (typeof res.revision === "number") {
      state.setRevision(res.revision);
    }

    const contentItems = draftItemsToContentItems(state.assetItems);
    const savedContent = contentItems.length > 0;
    if (savedContent && state.basicInfo.publicationType !== "playlist") {
      // The RPC deletes every item of the linked playlist before inserting, so calling it with a
      // playlist the operator owns empties that playlist (ADR 0011).
      await savePublicationContent(newId, contentItems);
    }

    const savedSchedule = policy.sendSchedule;
    if (savedSchedule) {
      await savePublicationSchedule(newId, draftToSchedule(state.schedule));
    }

    // `set_content`/`set_schedule` bump `revision` server-side too (ADR 0003) but
    // don't return it, so re-fetch to keep the client's expected_revision from
    // going stale and self-conflicting on the next save.
    if (savedContent || savedSchedule) {
      const fresh = await fetchPublication(newId);
      if (typeof fresh.revision === "number") {
        state.setRevision(fresh.revision);
      }
    }

    return { kind: "saved", publicationId: newId, draft: state, isComplete: policy.isComplete };
  };

  const saveDraft = async (): Promise<string | null> => {
    // The name is the one field the publications endpoint refuses to take empty,
    // and Save as Draft skips the step gate that Next runs — so a brand-new draft
    // would reach the API with `name: ""` and come back as a schema error. Nothing
    // else is required here: a draft should save with as little filled in as the
    // backend will accept.
    if (!usePublicationDraftStore.getState().basicInfo.name.trim()) {
      const message = "กรุณากรอกชื่อ Publication ก่อนบันทึกร่าง";
      setError(message);
      toast.error(message);
      return null;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await persistDraft(false);
      if (result.kind === "saved") router.replace(`/media-workspace/program/create?id=${encodeURIComponent(result.publicationId)}`);
      const complete = requireCompleteDraftSave(result);
      usePublicationDraftStore.getState().markSaved(complete.draft);
      usePublicationDraftStore.getState().setExplicitlySaved(true);
      toast.success("บันทึกร่างแล้ว");
      return complete.publicationId;
    } catch (err) {
      const classified = classifyApiError(err, "Failed to save draft.");
      // The revision-conflict banner already shows this — avoid saying it twice.
      if (classified.kind !== "conflict") {
        setError(classified.message);
        toast.error(classified.message);
      }
      return null;
    } finally {
      setSaving(false);
    }
  };

  const publishNow = async (): Promise<void> => {
    setSaving(true);
    setError(null);
    const state = usePublicationDraftStore.getState();
    try {
      const result = requireCompleteDraftSave(await persistDraft(true));
      const newId = result.publicationId;
      await activatePublication(newId);
      setPublishedId(newId);
      state.cancelDraft();
      router.push(`/media-workspace/program/${newId}`);
    } catch (err) {
      const classified = classifyApiError(err, "Failed to publish publication.");
      // A retry after a timed-out publish lands here: the backend refused because
      // the first attempt already activated it, so this is a success reaching us late.
      if (classified.kind === "already-active" && state.publicationId) {
        setPublishedId(state.publicationId);
        state.cancelDraft();
        router.push(`/media-workspace/program/${state.publicationId}`);
        return;
      }
      if (classified.kind !== "conflict") setError(classified.message);
    } finally {
      setSaving(false);
    }
  };

  return {
    channels,
    channelsError,
    tags,
    assets,
    reloadAssets,
    assetsLoading,
    assetsError,
    loadingRefs,
    saving,
    error,
    setError,
    publishedId,
    conflicts,
    checkingConflicts,
    conflictsError,
    revisionConflict,
    setRevisionConflict,
    saveDraft,
    publishNow,
    canPublish,
    eligibilityChecks,
    persistDraft,
    saveStatus,
    setSaveStatus,
    savingNext,
    setSavingNext,
  };
}
