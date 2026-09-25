import type { PlaylistDetail, PublicationDetail, ScheduleForm, DraftAssetItem } from "./types";
import type { BasicInfoState } from "./components/BasicInfoForm";
import { scheduleToForm } from "./schedule.ts";

export type ResumedDraft = {
  basicInfo: BasicInfoState;
  assetItems: DraftAssetItem[];
  channelIds: string[];
  groupIds: string[];
  groupNamesById: Record<string, string>;
  scheduleForm: ScheduleForm;
  playlistId: string | null;
  compositionId: string | null;
};

export function detailToDraft(
  detail: PublicationDetail,
  playlist?: PlaylistDetail | null,
): ResumedDraft {
  const basicInfo: BasicInfoState = {
    publicationType: detail.publication_type,
    name: detail.name,
    description: detail.description ?? "",
    priorityId: detail.priority,
    tags: detail.tags ?? [],
  };

  const assetItems: DraftAssetItem[] = [...(playlist?.items ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((item) => ({
      media_asset_id: item.media_asset_id,
      duration_seconds: item.duration_seconds ?? null,
      transition: item.transition ?? "cut",
    }));

  // Channel and Group intent rehydrate into the wizard. A draft saved before ADR 0037
  // can still hold device targets, which step 3 cannot express — those stay dropped so
  // the operator re-picks Channels rather than silently publishing to hidden Devices.
  const targets = detail.publication_targets ?? [];
  const channelIds = targets
    .filter((t) => t.target_type === "channel" && Boolean(t.channel_id))
    .map((t) => t.channel_id as string);
  const groupIds = targets
    .filter((t) => t.target_type === "group" && Boolean(t.group_id))
    .map((t) => t.group_id as string);
  const groupNamesById = Object.fromEntries(
    targets
      .filter((t) => t.target_type === "group" && Boolean(t.group_id) && Boolean(t.name))
      .map((t) => [t.group_id as string, t.name as string]),
  );

  const scheduleForm = scheduleToForm(detail.schedule);

  return {
    basicInfo,
    assetItems,
    channelIds,
    groupIds,
    groupNamesById,
    scheduleForm,
    playlistId: detail.playlist?.id ?? null,
    compositionId: detail.composition?.id ?? null,
  };
}
