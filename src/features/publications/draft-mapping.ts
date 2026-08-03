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
  DraftAssetItem,
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

export function draftItemsToContentItems(items: DraftAssetItem[]): ContentItem[] {
  return items.map((item, index) => ({
    media_asset_id: item.media_asset_id,
    position: index + 1,
    duration_seconds: item.duration_seconds,
  }));
}

/** Mirrors the existing checks in AssetCard/ContentStep: explicit `kind` wins, mime type is the fallback. */
export function isImageAsset(asset: MediaAsset): boolean {
  if (asset.kind) return asset.kind === "image";
  return !asset.file?.mime_type?.startsWith("video/");
}

export const DEFAULT_IMAGE_DURATION_SECONDS = 10;
