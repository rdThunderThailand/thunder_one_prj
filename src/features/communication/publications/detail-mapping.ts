import type { PlaylistDetail, PublicationDetail, ScheduleForm, DraftAssetItem } from "./types";
import type { BasicInfoState } from "./components/BasicInfoForm";
import { scheduleToForm } from "./schedule";

export type ResumedDraft = {
  basicInfo: BasicInfoState;
  assetItems: DraftAssetItem[];
  channelIds: string[];
  scheduleForm: ScheduleForm;
};

export function detailToDraft(
  detail: PublicationDetail,
  playlist?: PlaylistDetail | null
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
    }));

  const channelIds = (detail.publication_targets ?? [])
    .filter((t) => t.target_type === "device" && Boolean(t.device_id))
    .map((t) => t.device_id as string);

  const scheduleForm = scheduleToForm(detail.schedule);

  return {
    basicInfo,
    assetItems,
    channelIds,
    scheduleForm,
  };
}
