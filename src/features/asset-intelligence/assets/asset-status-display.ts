// Display mapping for the real Core status enum (asset-list-api.ts) — Core
// returns English workflow values, this feature's UI is otherwise Thai, so
// every consumer needs the same label/color pair rather than each
// reinventing one.
import type { BadgeColor } from "@/components/ui/Badge";
import type { AssetListStatus } from "./services/asset-list-api";

export const ASSET_STATUS_LABEL_TH: Record<AssetListStatus, string> = {
  Ready: "พร้อมใช้งาน",
  "In Use": "อยู่ระหว่างใช้งาน",
  "In Progress": "ระหว่างดำเนินการ",
  "Retired-Cancelled": "หมดสภาพ / ยกเลิก",
};

export const ASSET_STATUS_BADGE_COLOR: Record<AssetListStatus, BadgeColor> = {
  Ready: "green",
  "In Use": "yellow",
  "In Progress": "indigo",
  "Retired-Cancelled": "red",
};
