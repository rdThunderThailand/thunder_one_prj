import type { PlaylistDetail, PublicationDetail, ScheduleForm, DraftAssetItem } from "./types";
import type { BasicInfoState } from "./components/BasicInfoForm";
import { scheduleToForm } from "./schedule.ts";

export type ResumedDraft = {
  basicInfo: BasicInfoState;
  assetItems: DraftAssetItem[];
  channelIds: string[];
  scheduleForm: ScheduleForm;
  compositionId: string | null;
};

export function detailToDraft(
  detail: PublicationDetail,
  playlist?: PlaylistDetail | null,
): ResumedDraft {
  const basicInfo: BasicInfoState = {
    campaignId: detail.campaign_id ?? "",
    publicationType: detail.publication_type,
    name: detail.name,
    description: detail.description ?? "",
    priorityId: detail.priority,
    language: detail.language ?? "th",
    tags: detail.tags ?? [],
  };

  const assetItems: DraftAssetItem[] = [...(playlist?.items ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((item) => ({
      media_asset_id: item.media_asset_id,
      duration_seconds: item.duration_seconds ?? null,
      transition: item.transition ?? "cut",
    }));

  // Only Channel targets rehydrate into the wizard. A draft saved before ADR 0037
  // holds device targets, which step 3 can no longer express — it resumes with an
  // empty selection so the operator re-picks Channels rather than silently
  // publishing to a set the UI cannot show.
  const channelIds = (detail.publication_targets ?? [])
    .filter((t) => t.target_type === "channel" && Boolean(t.channel_id))
    .map((t) => t.channel_id as string);

  const scheduleForm = scheduleToForm(detail.schedule);

  return {
    basicInfo,
    assetItems,
    channelIds,
    scheduleForm,
    compositionId: detail.composition?.id ?? null,
  };
}
