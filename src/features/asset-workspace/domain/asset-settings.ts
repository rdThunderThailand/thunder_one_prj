// Asset Workspace Settings (PO 05 §4.12; checklist E:\ThunderOne\docs\settings\asset-ws-settings-checklist.md).
// Core: GET / PATCH `/api/core/v2/tenants/{id}/asset-workspace/settings`, Asset Admin only (02 §3.4).
// Three sections are stored: assetTag.prefix, labels.identifier, inventoryDefaults. Workspace Preferences stores nothing (D15).

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

export interface AssetSettings {
  assetTag: { prefix: string; /** `null` once every number is issued. */ nextTag: string | null; mode: "both" };
  labels: { identifier: LabelIdentifier; fields: LabelFieldSettings };
  inventoryDefaults: { dueDays: number; /** Empty = all categories. */ categoryIds: string[] };
  /** `null` until the first save; sent back as `expectedUpdatedAt`. */
  updatedAt: string | null;
  updatedBy: { id: string; name: string | null } | null;
}

/** One tab's changes. Sent with `expectedUpdatedAt`; Core saves the sections that are present. */
export type SettingsChange =
  | { assetTag: { prefix: string } }
  | { labels: { identifier?: LabelIdentifier; fields?: Partial<LabelFieldSettings> } }
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
