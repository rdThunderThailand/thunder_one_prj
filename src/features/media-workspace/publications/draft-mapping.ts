import type {
  BasicInfoForm,
  ContentItem,
  MediaAsset,
  Priority,
  PublicationTarget,
  PublicationType,
  DraftAssetItem,
} from "./types";
import type { ChannelListItem } from "../channels/types";
import type { BasicInfoState } from "./components/BasicInfoForm";

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

export function targetsFromSelection(
  channelIds: string[],
  groupIds: string[],
  groupNamesById: Record<string, string>,
  channels: ChannelListItem[],
): PublicationTarget[] {
  const channelTargets: PublicationTarget[] = channelIds.map((id) => {
    const channel = channels.find((c) => c.id === id);
    return {
      target_type: "channel",
      channel_id: id,
      name: channel ? channel.name : null,
    };
  });
  const groupTargets: PublicationTarget[] = groupIds.map((id) => {
    const group = channels.flatMap((channel) => channel.groups ?? []).find((item) => item.id === id);
    return {
      target_type: "group",
      group_id: id,
      name: groupNamesById[id] ?? group?.name ?? null,
    };
  });
  return [...channelTargets, ...groupTargets];
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
