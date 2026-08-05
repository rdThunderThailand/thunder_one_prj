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
import { computeEligibility } from "../publish-eligibility";
import { classifyApiError } from "../api-error";
import type { Campaign, MediaAsset, Priority, ScheduleConflict, Screen } from "../types";

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
  const [screensError, setScreensError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [savingNext, setSavingNext] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [conflictsError, setConflictsError] = useState<string | null>(null);

  const publicationId = usePublicationDraftStore((s) => s.publicationId);
  const step = usePublicationDraftStore((s) => s.step);
  const basicInfo = usePublicationDraftStore((s) => s.basicInfo);
  const assetItems = usePublicationDraftStore((s) => s.assetItems);
  const channelIds = usePublicationDraftStore((s) => s.channelIds);
  const scheduleForm = usePublicationDraftStore((s) => s.scheduleForm);

  const eligibility = computeEligibility({
    draft: { publicationId, step, basicInfo, assetItems, channelIds, scheduleForm },
    assets,
    conflicts,
    conflictsError,
    loadingRefs,
    checkingConflicts,
  });
  const canPublish = eligibility.canPublish;
  const eligibilityChecks = eligibility.checks;

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      fetchScreens().catch((err) => {
        if (isMounted) {
          setScreensError(err instanceof Error ? err.message : "Failed to load channels.");
        }
        return [];
      }),
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
      const payload = scheduleFormToPayload(scheduleForm);
      checkScheduleConflicts({
        publication_id: publicationId,
        device_ids: channelIds,
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
    basicInfo.priorityId,
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
      const resId = await persistDraft(false);
      usePublicationDraftStore.getState().markSaved();
      usePublicationDraftStore.getState().setExplicitlySaved(true);
      return resId;
    } catch (err) {
      setError(classifyApiError(err, "Failed to save draft.").message);
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
      const newId = await persistDraft(true);
      if (!newId) return;
      await activatePublication(newId);
      setPublishedId(newId);
      state.cancelDraft();
    } catch (err) {
      const classified = classifyApiError(err, "Failed to publish publication.");
      // A retry after a timed-out publish lands here: the backend refused because
      // the first attempt already activated it, so this is a success reaching us late.
      if (classified.kind === "already-active" && state.publicationId) {
        setPublishedId(state.publicationId);
        state.cancelDraft();
        return;
      }
      setError(classified.message);
    } finally {
      setSaving(false);
    }
  };

  return {
    screens,
    screensError,
    campaigns,
    assets,
    loadingRefs,
    saving,
    error,
    setError,
    publishedId,
    conflicts,
    checkingConflicts,
    conflictsError,
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
