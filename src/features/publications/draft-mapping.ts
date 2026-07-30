import type { ScheduleTypeId } from "./mock-data";
import type {
  BasicInfoForm,
  ContentItem,
  MediaAsset,
  Priority,
  PublicationTarget,
  PublicationType,
  ScheduleType,
  Screen,
} from "./types";
import type { BasicInfoState } from "./components/BasicInfoForm";

export const SCHEDULE_TYPE_BY_CARD: Record<ScheduleTypeId, ScheduleType> = {
  "publish-now": "now",
  "schedule-later": "later",
  recurring: "recurring",
  "custom-range": "range",
};

export const CARD_BY_SCHEDULE_TYPE: Record<ScheduleType, ScheduleTypeId> = {
  now: "publish-now",
  later: "schedule-later",
  recurring: "recurring",
  range: "custom-range",
};

export function basicInfoToForm(basicInfo: BasicInfoState): BasicInfoForm {
  const languageCode =
    basicInfo.language === "Thai" || basicInfo.language === "th"
      ? "th"
      : basicInfo.language === "English" || basicInfo.language === "en"
      ? "en"
      : basicInfo.language;

  return {
    name: basicInfo.name.trim(),
    description: basicInfo.description || undefined,
    campaign_id: basicInfo.campaignId || undefined,
    publication_type: basicInfo.publicationType as PublicationType,
    priority: basicInfo.priorityId as Priority,
    language: languageCode,
    tags: basicInfo.tags ?? [],
  };
}

export function channelIdsToTargets(channelIds: string[], screens: Screen[]): PublicationTarget[] {
  return channelIds.map((id) => {
    const screen = screens.find((s) => s.id === id);
    return {
      target_type: "device",
      device_id: id,
      name: screen ? screen.name : null,
    };
  });
}

export function assetToContentItems(asset: MediaAsset | undefined): ContentItem[] {
  if (!asset) return [];
  return [
    {
      media_asset_id: asset.id,
      position: 1,
      duration_seconds: asset.kind === "image" ? 10 : (asset.duration_seconds ?? null),
    },
  ];
}
