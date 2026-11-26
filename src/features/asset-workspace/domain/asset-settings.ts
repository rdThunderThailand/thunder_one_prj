// Asset Workspace Settings (PO 05 §4.12; checklist E:\ThunderOne\docs\settings\asset-ws-settings-checklist.md).
// Core: GET / PATCH `/api/core/v2/tenants/{id}/asset-workspace/settings`, Asset Admin only (02 §3.4).
// Four sections are stored: assetTag.prefix, labels, preferences (org defaults, D15), inventoryDefaults.

export const LABEL_IDENTIFIERS = ["qr", "barcode", "both"] as const;
export type LabelIdentifier = (typeof LABEL_IDENTIFIERS)[number];

export const LABEL_IDENTIFIER_COPY: Record<LabelIdentifier, { title: string; body: string }> = {
  qr: { title: "QR Code", body: "Opens the Asset Profile when scanned with a phone camera." },
  barcode: { title: "Barcode", body: "Code128 of the Asset Tag, for barcode scanners." },
  both: { title: "QR Code + Barcode", body: "Recommended. Prints both on every label." },
};

/** Optional label fields (Figma "Show on Asset Tag"). The Asset Tag and the identifier are always on the label. */
export const LABEL_FIELD_KEYS = ["name", "serial", "category", "location", "logo"] as const;
export type LabelFieldKey = (typeof LABEL_FIELD_KEYS)[number];
export type LabelFieldSettings = Record<LabelFieldKey, boolean>;
export const LABEL_FIELD_NAMES: Record<LabelFieldKey, string> = {
  name: "Asset Name",
  serial: "Serial Number",
  category: "Category",
  location: "Location",
  logo: "Organization Logo",
};

/** Workspace Preferences: org defaults for the list screens (owner decision on D15; the PO has not confirmed). */
export const PREFERENCE_VIEWS = ["table", "list"] as const;
export type PreferenceView = (typeof PREFERENCE_VIEWS)[number];
export const PREFERENCE_MENUS = ["assets", "assignments", "inventory", "locations"] as const;
export type PreferenceMenu = (typeof PREFERENCE_MENUS)[number];
export const PREFERENCE_MENU_NAMES: Record<PreferenceMenu, string> = {
  assets: "Assets",
  assignments: "Assignments",
  inventory: "Inventory",
  locations: "Locations",
};
export const PAGE_SIZES = [10, 25, 50, 100] as const;
/** Only what the assets list route can sort by today (`sort` on GET v2/asset-workspace/assets). */
export const PREFERENCE_SORTS = ["created_at", "status_since"] as const;
export type PreferenceSort = (typeof PREFERENCE_SORTS)[number];
export const PREFERENCE_SORT_NAMES: Record<PreferenceSort, string> = {
  created_at: "Newest first",
  status_since: "Longest in current status first",
};
export const FIRST_DAYS = ["monday", "sunday"] as const;
export type FirstDay = (typeof FIRST_DAYS)[number];
export const FIRST_DAY_NAMES: Record<FirstDay, string> = { monday: "Monday", sunday: "Sunday" };

export interface WorkspacePreferences {
  views: Record<PreferenceMenu, PreferenceView>;
  pageSize: (typeof PAGE_SIZES)[number];
  sort: PreferenceSort;
  rememberFilters: boolean;
  firstDayOfWeek: FirstDay;
}

export interface AssetSettings {
  assetTag: { prefix: string; /** `null` once every number is issued. */ nextTag: string | null; mode: "both" };
  labels: { identifier: LabelIdentifier; fields: LabelFieldSettings };
  preferences: WorkspacePreferences;
  inventoryDefaults: { dueDays: number; /** Empty = all categories. */ categoryIds: string[] };
  /** `null` until the first save; sent back as `expectedUpdatedAt`. */
  updatedAt: string | null;
  updatedBy: { id: string; name: string | null } | null;
}

/** One tab's changes. Sent with `expectedUpdatedAt`; Core saves the sections that are present. */
export type SettingsChange =
  | { assetTag: { prefix: string } }
  | { labels: { identifier?: LabelIdentifier; fields?: Partial<LabelFieldSettings> } }
  | { preferences: { views?: Partial<WorkspacePreferences["views"]> } & Partial<Omit<WorkspacePreferences, "views">> }
  | { inventoryDefaults: { dueDays: number; categoryIds: string[] } };

export const PREFIX_PATTERN = /^[A-Z0-9]{2,8}$/;
export const DUE_DAYS = { min: 1, max: 365 } as const;

/** Prefix is saved upper-cased and trimmed, like Core does. Returns the message, or `null` when valid. */
export function prefixError(value: string): string | null {
  const prefix = value.trim().toUpperCase();
  if (!prefix) return "Enter a prefix.";
  return PREFIX_PATTERN.test(prefix) ? null : "Use 2–8 characters: letters A–Z and digits 0–9 only.";
}

export function dueDaysError(value: string): string | null {
  if (!/^\d{1,3}$/.test(value.trim())) return `Enter a whole number from ${DUE_DAYS.min} to ${DUE_DAYS.max}.`;
  const days = Number(value);
  return days >= DUE_DAYS.min && days <= DUE_DAYS.max ? null : `Enter a whole number from ${DUE_DAYS.min} to ${DUE_DAYS.max}.`;
}

/** The next tag if the prefix were `prefix`: the number part stays (the counter never resets, R1). */
export function previewNextTag(nextTag: string | null, prefix: string): string | null {
  if (!nextTag) return null;
  const number = nextTag.slice(nextTag.lastIndexOf("-") + 1);
  return `${prefix.trim().toUpperCase() || "…"}-${number}`;
}

export function sameIds(a: string[], b: string[]): boolean {
  return a.length === b.length && [...a].sort().join() === [...b].sort().join();
}
