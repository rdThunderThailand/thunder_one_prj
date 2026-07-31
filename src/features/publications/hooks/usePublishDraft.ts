"use client";

import { useEffect, useState } from "react";
import {
  draftItemsToContentItems,
  basicInfoToForm,
  channelIdsToTargets,
} from "../draft-mapping";
import { isScheduleFormValid, scheduleFormToPayload } from "../schedule";
import {
  activatePublication,
  checkScheduleConflicts,
  fetchCampaigns,
  fetchMediaAssets,
  fetchScreens,
  saveBasicInfo,
  savePublicationContent,
  savePublicationSchedule,
} from "../services/publications-api";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";
import type { Campaign, MediaAsset, ScheduleConflict, Screen } from "../types";

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
  const [screens, setScreens] = useState<Screen[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  const publicationId = usePublicationDraftStore((s) => s.publicationId);
  const basicInfo = usePublicationDraftStore((s) => s.basicInfo);
  const assetItems = usePublicationDraftStore((s) => s.assetItems);
  const channelIds = usePublicationDraftStore((s) => s.channelIds);
  const scheduleForm = usePublicationDraftStore((s) => s.scheduleForm);

  const canPublish =
    basicInfo.name.trim().length > 0 &&
    assetItems.length > 0 &&
    channelIds.length > 0;

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      fetchScreens().catch(() => []),
      fetchCampaigns().catch(() => []),
      fetchMediaAssets().catch(() => []),
    ]).then(([fetchedScreens, fetchedCampaigns, fetchedAssets]) => {
      if (isMounted) {
        setScreens(fetchedScreens);
        setCampaigns(fetchedCampaigns);
        setAssets(fetchedAssets);
        setLoadingRefs(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const channelIdsStr = channelIds.join(",");
  const daysStr = scheduleForm.days.join(",");

  useEffect(() => {
    let cancelled = false;

    if (channelIds.length === 0 || !isScheduleFormValid(scheduleForm)) {
      // Deferred by a tick on purpose: this repo's lint (React Compiler rules)
      // rejects a synchronous setState inside an effect body.
      const resetTimer = setTimeout(() => {
        if (!cancelled) {
          setConflicts([]);
          setCheckingConflicts(false);
        }
      }, 0);
      return () => {
        cancelled = true;
        clearTimeout(resetTimer);
      };
    }

    const timer = setTimeout(() => {
      setCheckingConflicts(true);
      const payload = scheduleFormToPayload(scheduleForm);
      checkScheduleConflicts({
        publication_id: publicationId,
        device_ids: channelIds,
        starts_at: payload.starts_at,
        ends_at: payload.ends_at,
      })
        .then((res) => {
          if (!cancelled) {
            setConflicts(res);
            setCheckingConflicts(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setConflicts([]);
            setCheckingConflicts(false);
          }
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    publicationId,
    channelIds,
    scheduleForm,
    channelIdsStr,
    daysStr,
    scheduleForm.schedule_type,
    scheduleForm.start_date,
    scheduleForm.start_time,
    scheduleForm.timezone,
    scheduleForm.end_date,
    scheduleForm.end_time,
    scheduleForm.daily_start,
    scheduleForm.daily_end,
  ]);

  /**
   * Persists basic info → content → schedule and returns the publication id.
   * `forPublish` forces the targets and the schedule to be sent regardless of
   * which step the user is on: activation is refused without either. On a plain
   * draft save, targets only go from step 3 onwards — the backend treats a
   * received `targets` as authoritative, so sending an empty array earlier would
   * wipe targets that were already saved.
   */
  const persistDraft = async (forPublish: boolean): Promise<string | null> => {
    const state = usePublicationDraftStore.getState();
    const targets =
      forPublish || state.step >= 3 ? channelIdsToTargets(state.channelIds, screens) : undefined;

    const basicForm = basicInfoToForm(state.basicInfo);
    let res;
    try {
      res = await saveBasicInfo(basicForm, state.publicationId, targets);
    } catch (err) {
      // The draft id lives in localStorage forever, but the row it points at can be
      // deleted (or leave `draft` via cancel/activate) from the /publications page —
      // which used to brick the wizard until the user hit Cancel. Re-create instead.
      if (state.publicationId && isStaleDraftError(err)) {
        res = await saveBasicInfo(basicForm, null, targets);
      } else {
        throw err;
      }
    }
    const newId = res.publication_id || res.id || state.publicationId;
    if (!newId) {
      throw new Error("No publication ID returned from backend.");
    }
    state.setPublicationId(newId);

    const contentItems = draftItemsToContentItems(state.assetItems);
    if (contentItems.length > 0) {
      await savePublicationContent(newId, contentItems);
    }

    const form = state.scheduleForm;
    if (forPublish || (state.step >= 4 && isScheduleFormValid(form))) {
      await savePublicationSchedule(newId, scheduleFormToPayload(form));
    }

    return newId;
  };

  const saveDraft = async (): Promise<string | null> => {
    setSaving(true);
    setError(null);
    try {
      return await persistDraft(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft.");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const publishNow = async (): Promise<void> => {
    setSaving(true);
    setError(null);
    try {
      const newId = await persistDraft(true);
      if (!newId) return;
      await activatePublication(newId);
      setPublishedId(newId);
      usePublicationDraftStore.getState().cancelDraft();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish publication.");
    } finally {
      setSaving(false);
    }
  };

  return {
    screens,
    campaigns,
    assets,
    loadingRefs,
    saving,
    error,
    publishedId,
    conflicts,
    checkingConflicts,
    saveDraft,
    publishNow,
    canPublish,
  };
}
