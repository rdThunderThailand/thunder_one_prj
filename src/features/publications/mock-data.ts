// R&D placeholder data for the Create Publication wizard — no backend exists yet.
// Replace with real data fetching once the `campaigns`/`publications` services are implemented.

export interface CampaignOption {
  id: string;
  name: string;
  emoji: string;
}

// Campaign is out of MVP scope (see CONTEXT.md), but the wizard design references
// it, so this list is sourced the same way Overview's mock widgets are — UI only.
export const campaigns: CampaignOption[] = [
  { id: "kfc-wow-wednesday", name: "KFC Wow Wednesday", emoji: "🍗" },
  { id: "summer-promotion-2024", name: "Summer Promotion 2024", emoji: "☀️" },
  { id: "coffee-lovers", name: "Coffee Lovers", emoji: "☕" },
  { id: "spring-menu-2024", name: "Spring Menu 2024", emoji: "🌸" },
];

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

export interface AssetItem {
  id: string;
  filename: string;
  kind: "image" | "video";
  dimensions: string;
  durationLabel?: string;
  approved: boolean;
  favorite?: boolean;
  accent: string;
}

export const assetLibrary: AssetItem[] = [
  { id: "1", filename: "kv_wed_special_01.jpg", kind: "image", dimensions: "1920 x 1080", approved: true, accent: "from-red-500 to-rose-700" },
  { id: "2", filename: "kv_wed_special_02.jpg", kind: "image", dimensions: "1080 x 1080", approved: true, favorite: true, accent: "from-orange-500 to-red-600" },
  { id: "3", filename: "kv_wed_special_03.jpg", kind: "image", dimensions: "1080 x 1920", approved: true, accent: "from-amber-500 to-orange-600" },
  { id: "4", filename: "video_wed_special_15s.mp4", kind: "video", dimensions: "1920 x 1080", durationLabel: "15s", approved: true, accent: "from-rose-600 to-red-800" },
  { id: "5", filename: "video_wed_special_06s.mp4", kind: "video", dimensions: "1080 x 1080", durationLabel: "6s", approved: true, accent: "from-red-600 to-orange-700" },
  { id: "6", filename: "banner_wed_01.png", kind: "image", dimensions: "1200 x 628", approved: true, accent: "from-red-700 to-rose-900" },
  { id: "7", filename: "banner_wed_02.png", kind: "image", dimensions: "1200 x 300", approved: true, accent: "from-orange-600 to-amber-700" },
  { id: "8", filename: "product_8pcs_bucket.png", kind: "image", dimensions: "800 x 800", approved: true, accent: "from-amber-600 to-red-700" },
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

export const channels: ChannelItem[] = [
  // Digital Out Of Home (8)
  { id: "dooh-1", name: "Central World - LED Screen 1", category: "dooh", subLabel: "Pathum Wan, Bangkok", status: "online", resolution: "1920 x 1080" },
  { id: "dooh-2", name: "KFC Drive Thru Screens", category: "dooh", subLabel: "All branches", status: "online", resolution: "1920 x 1080" },
  { id: "dooh-3", name: "Siam Paragon - Digital Wall", category: "dooh", subLabel: "Pathum Wan, Bangkok", status: "online", resolution: "2160 x 3840" },
  { id: "dooh-4", name: "Central World - LED Screen 3", category: "dooh", subLabel: "Pathum Wan, Bangkok", status: "offline", resolution: "1920 x 1080" },
  { id: "dooh-5", name: "IconSiam - LED Screen", category: "dooh", subLabel: "Khlong San, Bangkok", status: "online", resolution: "1920 x 1080" },
  { id: "dooh-6", name: "MBK Center - LED Screen", category: "dooh", subLabel: "Pathum Wan, Bangkok", status: "warning", resolution: "1920 x 1080" },
  { id: "dooh-7", name: "Airport Link - Digital Screen", category: "dooh", subLabel: "Phaya Thai, Bangkok", status: "online", resolution: "1920 x 1080" },
  { id: "dooh-8", name: "EmQuartier - LED Wall", category: "dooh", subLabel: "Khlong Toei, Bangkok", status: "online", resolution: "2160 x 3840" },
  // In-Store (6)
  { id: "instore-1", name: "KFC Siam Square Branch", category: "in-store", subLabel: "Siam Square, Bangkok", status: "online", resolution: "1920 x 1080" },
  { id: "instore-2", name: "KFC Central Ladprao", category: "in-store", subLabel: "Chatuchak, Bangkok", status: "online", resolution: "1920 x 1080" },
  { id: "instore-3", name: "KFC Mega Bangna", category: "in-store", subLabel: "Bangna, Bangkok", status: "warning", resolution: "1920 x 1080" },
  { id: "instore-4", name: "KFC Future Park Rangsit", category: "in-store", subLabel: "Thanyaburi, Pathum Thani", status: "offline", resolution: "1920 x 3840" },
  { id: "instore-5", name: "KFC Rama 9", category: "in-store", subLabel: "Huai Khwang, Bangkok", status: "online", resolution: "1920 x 1080" },
  { id: "instore-6", name: "KFC Bangkapi", category: "in-store", subLabel: "Bang Kapi, Bangkok", status: "online", resolution: "1920 x 1080" },
  // Online (10)
  { id: "online-1", name: "Website Homepage Banner", category: "online", subLabel: "kfc.co.th", status: "online" },
  { id: "online-2", name: "Website Product Page Banner", category: "online", subLabel: "kfc.co.th", status: "online" },
  { id: "online-3", name: "Website Footer Banner", category: "online", subLabel: "kfc.co.th", status: "online" },
  { id: "online-4", name: "Website Popup Banner", category: "online", subLabel: "kfc.co.th", status: "online" },
  { id: "online-5", name: "Website Category Page", category: "online", subLabel: "kfc.co.th", status: "online" },
  { id: "online-6", name: "Mobile App Splash Screen", category: "online", subLabel: "KFC Thailand App", status: "online" },
  { id: "online-7", name: "Mobile App Home Banner", category: "online", subLabel: "KFC Thailand App", status: "online" },
  { id: "online-8", name: "Mobile App Push Banner", category: "online", subLabel: "KFC Thailand App", status: "online" },
  { id: "online-9", name: "Mobile App Reward Screen", category: "online", subLabel: "KFC Thailand App", status: "online" },
  { id: "online-10", name: "Landing Page - Wow Wednesday", category: "online", subLabel: "kfc.co.th", status: "online" },
  // Social Media (4)
  { id: "social-1", name: "Facebook Page", category: "social", subLabel: "KFC Thailand", status: "online" },
  { id: "social-2", name: "Instagram Feed Post", category: "social", subLabel: "KFC Thailand", status: "online" },
  { id: "social-3", name: "Instagram Story", category: "social", subLabel: "KFC Thailand", status: "online" },
  { id: "social-4", name: "LINE OA Broadcast", category: "social", subLabel: "KFC Thailand", status: "online" },
  // Others (4)
  { id: "others-1", name: "Email Newsletter", category: "others", subLabel: "Marketing list", status: "online" },
  { id: "others-2", name: "SMS Campaign", category: "others", subLabel: "Loyalty members", status: "online" },
  { id: "others-3", name: "Digital Receipt Ad", category: "others", subLabel: "POS system", status: "online" },
  { id: "others-4", name: "QR Code Table Tent", category: "others", subLabel: "In-store tables", status: "online" },
];

export const defaultSelectedChannelIds = ["dooh-1", "dooh-2", "instore-1"];

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
