import { languageCode, type ScheduleTypeId } from "./mock-data.ts";
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
  return {
    name: basicInfo.name.trim(),
    description: basicInfo.description || undefined,
    campaign_id: basicInfo.campaignId || undefined,
    publication_type: basicInfo.publicationType as PublicationType,
    priority: basicInfo.priorityId as Priority,
    language: languageCode(basicInfo.language),
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

/** `media_publication_set_content` rejects the whole save if any item points at an
 *  asset that is not `approved`, so an unapproved pick makes the draft unsavable. */
export function isApprovedAsset(asset: MediaAsset): boolean {
  return asset.approval_status === "approved";
}

/** Drops items the RPC would reject. Items whose asset is absent from `assets` are
 *  kept — a short or failed library load must not silently wipe a valid selection. */
export function dropUnapprovedItems(
  items: DraftAssetItem[],
  assets: MediaAsset[]
): DraftAssetItem[] {
  return items.filter((item) => {
    const asset = assets.find((a) => a.id === item.media_asset_id);
    return !asset || isApprovedAsset(asset);
  });
}

export const DEFAULT_IMAGE_DURATION_SECONDS = 10;
