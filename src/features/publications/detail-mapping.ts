import type { PlaylistDetail, PublicationDetail, ScheduleForm } from "./types";
import type { BasicInfoState } from "./components/BasicInfoForm";
import { scheduleToForm } from "./schedule";

export type ResumedDraft = {
  basicInfo: BasicInfoState;
  assetId: string;
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

  let assetId = "";
  if (playlist?.items && playlist.items.length > 0) {
    const sorted = [...playlist.items].sort((a, b) => a.position - b.position);
    assetId = sorted[0]?.media_asset_id ?? "";
  }

  const channelIds = (detail.publication_targets ?? [])
    .filter((t) => t.target_type === "device" && Boolean(t.device_id))
    .map((t) => t.device_id as string);

  const scheduleForm = scheduleToForm(detail.schedule);

  return {
    basicInfo,
    assetId,
    channelIds,
    scheduleForm,
  };
}
