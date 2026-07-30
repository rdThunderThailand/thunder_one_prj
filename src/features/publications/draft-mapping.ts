import { DEFAULT_TIMEZONE, makeDefaultScheduleForm } from "./schedule";
import type {
  BasicInfoForm,
  ContentItem,
  MediaAsset,
  Priority,
  PublicationTarget,
  PublicationType,
  ScheduleForm,
  Screen,
} from "./types";
import type { BasicInfoState } from "./components/BasicInfoForm";
import type { ScheduleState } from "./mock-data";

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

export function scheduleStateToForm(state: ScheduleState): ScheduleForm {
  const defaultForm = makeDefaultScheduleForm();

  let schedule_type: ScheduleForm["schedule_type"] = "now";
  if (state.scheduleType === "publish-now") schedule_type = "now";
  else if (state.scheduleType === "schedule-later") schedule_type = "later";
  else if (state.scheduleType === "recurring") schedule_type = "recurring";
  else if (state.scheduleType === "custom-range") schedule_type = "range";

  // ponytail: Bangkok is the only zone the UI offers, so the display string
  // ("(GMT+07:00) Bangkok") always resolves to DEFAULT_TIMEZONE. Map it properly
  // here once `timeZones` in mock-data grows a second entry.
  const timezone = DEFAULT_TIMEZONE;

  const start_date = state.publishDate || defaultForm.start_date;
  const start_time = state.publishTime || defaultForm.start_time;

  const end_date = state.expirationEnabled ? state.expirationDate || "" : "";
  const end_time = state.expirationEnabled ? state.expirationTime || "" : "";

  return {
    schedule_type,
    start_date,
    start_time,
    timezone,
    end_date,
    end_time,
    days: defaultForm.days,
    daily_start: defaultForm.daily_start,
    daily_end: defaultForm.daily_end,
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
