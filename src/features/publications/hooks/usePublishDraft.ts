"use client";

import { useEffect, useState } from "react";
import {
  assetToContentItems,
  basicInfoToForm,
  channelIdsToTargets,
  scheduleStateToForm,
} from "../draft-mapping";
import { isScheduleFormValid, scheduleFormToPayload } from "../schedule";
import {
  activatePublication,
  fetchCampaigns,
  fetchMediaAssets,
  fetchScreens,
  saveBasicInfo,
  savePublicationContent,
  savePublicationSchedule,
} from "../services/publications-api";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";
import type { Campaign, MediaAsset, Screen } from "../types";

export function usePublishDraft() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishedId, setPublishedId] = useState<string | null>(null);

  const basicInfo = usePublicationDraftStore((s) => s.basicInfo);
  const assetId = usePublicationDraftStore((s) => s.assetId);
  const channelIds = usePublicationDraftStore((s) => s.channelIds);

  const canPublish =
    basicInfo.name.trim().length > 0 &&
    Boolean(assetId) &&
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

    const res = await saveBasicInfo(basicInfoToForm(state.basicInfo), state.publicationId, targets);
    const newId = res.publication_id || res.id || state.publicationId;
    if (!newId) {
      throw new Error("No publication ID returned from backend.");
    }
    state.setPublicationId(newId);

    const contentItems = assetToContentItems(assets.find((a) => a.id === state.assetId));
    if (contentItems.length > 0) {
      await savePublicationContent(newId, contentItems);
    }

    const form = scheduleStateToForm(state.scheduleState);
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
    saveDraft,
    publishNow,
    canPublish,
  };
}
