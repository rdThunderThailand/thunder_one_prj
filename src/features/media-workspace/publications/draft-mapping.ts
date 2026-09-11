import { type ScheduleTypeId } from "./mock-data.ts";
import type {
  BasicInfoForm,
  ContentItem,
  MediaAsset,
  Priority,
  PublicationTarget,
  PublicationType,
  ScheduleType,
  DraftAssetItem,
} from "./types";
import type { ChannelListItem } from "../channels/types";
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

export function basicInfoToForm(
  basicInfo: BasicInfoState,
  playlistId?: string | null,
  compositionId?: string | null
): BasicInfoForm {
  const form: BasicInfoForm = {
    name: basicInfo.name.trim(),
    description: basicInfo.description || undefined,
    publication_type: basicInfo.publicationType as PublicationType,
    priority: basicInfo.priorityId as Priority,
    tags: basicInfo.tags ?? [],
  };
  if (playlistId?.trim()) {
    form.playlist_id = playlistId.trim();
  }
  if (compositionId?.trim()) {
    form.composition_id = compositionId.trim();
  }
  return form;
}

export function channelIdsToTargets(
  channelIds: string[],
  channels: ChannelListItem[],
): PublicationTarget[] {
  return channelIds.map((id) => {
    const channel = channels.find((c) => c.id === id);
    return {
      target_type: "channel",
      channel_id: id,
      name: channel ? channel.name : null,
    };
  });
}

export function draftItemsToContentItems(items: DraftAssetItem[]): ContentItem[] {
  return items.map((item, index) => ({
    media_asset_id: item.media_asset_id,
    position: index + 1,
    duration_seconds: item.duration_seconds,
    ...(item.transition ? { transition: item.transition } : {}),
  }));
}

/** Mirrors the existing checks in AssetCard/ContentStep: explicit `kind` wins, mime type is the fallback. */
export function isImageAsset(asset: MediaAsset): boolean {
  if (asset.kind) return asset.kind === "image";
  return !asset.file?.mime_type?.startsWith("video/");
}

export const DEFAULT_IMAGE_DURATION_SECONDS = 10;
