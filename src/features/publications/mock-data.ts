// R&D placeholder data for the Create Publication wizard — no backend exists yet.
// Replace with real data fetching once the `campaigns`/`publications` services are implemented.

export type PublicationTypeId = "image" | "video" | "playlist" | "html" | "dynamic";

export interface PublicationTypeOption {
  id: PublicationTypeId;
  label: string;
  sublabel: string;
}

export const publicationTypes: PublicationTypeOption[] = [
  { id: "image", label: "Image", sublabel: "Single image" },
  { id: "video", label: "Video", sublabel: "Video file" },
  { id: "playlist", label: "Playlist", sublabel: "Media playlist" },
  { id: "html", label: "HTML / Web", sublabel: "Website / HTML" },
  { id: "dynamic", label: "Dynamic", sublabel: "Data-driven" },
];

export type PriorityId = "low" | "normal" | "high" | "urgent";

export interface PriorityOption {
  id: PriorityId;
  label: string;
  color: string;
}

export const priorities: PriorityOption[] = [
  { id: "low", label: "Low", color: "bg-zinc-400" },
  { id: "normal", label: "Normal", color: "bg-emerald-500" },
  { id: "high", label: "High", color: "bg-amber-500" },
  { id: "urgent", label: "Urgent", color: "bg-red-500" },
];

export const languages = ["Thai", "English"];

export const wizardSteps = [
  { step: 1, label: "Basic Info" },
  { step: 2, label: "Content" },
  { step: 3, label: "Channels" },
  { step: 4, label: "Schedule" },
  { step: 5, label: "Review & Publish" },
];

export const contentTabs = [
  { id: "content-asset", label: "Content Asset", enabled: true },
  { id: "format-template", label: "Format & Template", enabled: false },
  { id: "text-caption", label: "Text & Caption", enabled: false },
  { id: "call-to-action", label: "Call to Action", enabled: false },
  { id: "localization", label: "Localization", enabled: false },
];

export const assetLibraryTabs = [
  { id: "all", label: "All Assets", enabled: true },
  { id: "mine", label: "My Assets", enabled: false },
  { id: "favorites", label: "Favorites", enabled: false },
  { id: "recent", label: "Recently Used", enabled: false },
];


export type ChannelCategoryId = "dooh" | "in-store" | "online" | "social" | "others";

export interface ChannelCategory {
  id: ChannelCategoryId;
  label: string;
}

export const channelCategories: ChannelCategory[] = [
  { id: "dooh", label: "Digital Out Of Home" },
  { id: "in-store", label: "In-Store" },
  { id: "online", label: "Online" },
  { id: "social", label: "Social Media" },
  { id: "others", label: "Others" },
];

export type ChannelStatus = "online" | "warning" | "offline";

export interface ChannelItem {
  id: string;
  name: string;
  category: ChannelCategoryId;
  subLabel: string;
  status: ChannelStatus;
  resolution?: string;
}

export type ScheduleTypeId = "publish-now" | "schedule-later" | "recurring" | "custom-range";

export interface ScheduleTypeOption {
  id: ScheduleTypeId;
  label: string;
  sublabel: string;
  enabled: boolean;
}

export const scheduleTypes: ScheduleTypeOption[] = [
  { id: "publish-now", label: "Publish Now", sublabel: "เผยแพร่ทันที", enabled: true },
  { id: "schedule-later", label: "Schedule Later", sublabel: "กำหนดเวลาภายหลัง", enabled: false },
  { id: "recurring", label: "Recurring Schedule", sublabel: "ตั้งเวลาซ้ำ", enabled: false },
  { id: "custom-range", label: "Custom Date Range", sublabel: "กำหนดช่วงเวลาเอง", enabled: false },
];

export const timeZones = ["(GMT+07:00) Bangkok"];

export const delayUnits = ["seconds", "minutes", "hours"];

export type PublishOrder = "same-time" | "sequence";

export interface ScheduleState {
  scheduleType: ScheduleTypeId;
  publishDate: string;
  publishTime: string;
  timeZone: string;
  expirationEnabled: boolean;
  expirationDate: string;
  expirationTime: string;
  publishOrder: PublishOrder;
  delayValue: string;
  delayUnit: string;
}

export const defaultScheduleState: ScheduleState = {
  scheduleType: "publish-now",
  publishDate: "2025-05-16",
  publishTime: "09:00",
  timeZone: timeZones[0],
  expirationEnabled: false,
  expirationDate: "",
  expirationTime: "",
  publishOrder: "same-time",
  delayValue: "10",
  delayUnit: "seconds",
};

export const prePublishChecklist = [
  "ไฟล์สื่อผ่านการตรวจสอบแล้ว",
  "กำหนดวันและเวลาถูกต้อง",
  "เลือกช่องทางและอุปกรณ์ครบถ้วน",
  "เนื้อหาไม่ขัดต่อนโยบายการเผยแพร่",
  "ไม่มีความขัดแย้งของตารางเผยแพร่",
];

export const createdByMeta = {
  name: "Kanittha W.",
  createdAt: "7 May 2025, 11:30",
  updatedAt: "12 May 2025, 16:45",
};
