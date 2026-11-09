import type { AssetCondition } from "./asset-condition.ts";
import type { AssetStatus } from "./asset-status.ts";
import type { RowResult, Severity } from "./asset-import-types.ts";
import type { InventoryResult, SessionStatus, WarrantyStatus } from "./report.ts";
import type { LocationStatus } from "./location.ts";

/** ADR 0098 §3 (DS-04) — the one place that picks a colour for a status or condition.
 *  Tones are the shared Badge colours: green = success, blue = info, yellow = warning,
 *  red = error, zinc = neutral. Screens never choose per status. */
export type StatusTone = "green" | "blue" | "yellow" | "red" | "zinc";

export const STATUS_TONE: Record<AssetStatus, StatusTone> = {
  Available: "green",
  Assigned: "blue",
  "In Maintenance": "yellow",
  // End states, not alerts.
  Retired: "zinc",
  Disposed: "zinc",
};

export const CONDITION_TONE: Record<AssetCondition, StatusTone> = {
  Good: "green",
  Fair: "zinc",
  Damaged: "yellow",
  Unusable: "red",
};

export const IMPORT_SEVERITY_BADGE = {
  valid: "success",
  warning: "warning",
  error: "danger",
} as const satisfies Record<Severity, string>;

export const IMPORT_RESULT_BADGE = {
  created: "success",
  created_with_warning: "warning",
  not_registered: "danger",
} as const satisfies Record<RowResult, string>;

export const INVENTORY_RESULT_TONE: Record<InventoryResult, StatusTone> = {
  Verified: "green",
  Mismatch: "yellow",
  "Not Found": "red",
  Unexpected: "blue",
};

export const SESSION_STATUS_TONE: Record<SessionStatus, StatusTone> = {
  Draft: "zinc",
  "In Progress": "blue",
  Completed: "green",
  Closed: "zinc",
  Cancelled: "zinc",
};

export const WARRANTY_TONE: Record<WarrantyStatus, StatusTone> = {
  Active: "green",
  "Expiring Soon": "yellow",
  Expired: "red",
  "No Warranty": "zinc",
};

/** Location master status (05 §4.8). Inactive is an admin state, not an alert. */
export const LOCATION_STATUS_TONE: Record<LocationStatus, StatusTone> = {
  Active: "green",
  Inactive: "zinc",
};
