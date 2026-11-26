import type { AssetCondition } from "./asset-condition.ts";
import type { AssetStatus } from "./asset-status.ts";
import type { CategoryStatus } from "./asset-category.ts";
import type { RowResult, Severity } from "./asset-import-types.ts";
import type { InventoryResult, SessionStatus, WarrantyStatus } from "./report.ts";
import type { LocationStatus } from "./location.ts";

/** ADR 0098 §3 (DS-04) — the one place that picks a colour for a status or condition.
 *  Tones are the shared Badge colours: green = success, blue = info, yellow = warning,
 *  red = error, zinc = neutral. Screens never choose per status. */
export type StatusTone = "green" | "blue" | "yellow" | "red" | "zinc";

// Inactive is an intentional availability state, not an error (shared design guide).
export const CATEGORY_STATUS_TONE: Record<CategoryStatus, StatusTone> = {
  Active: "green",
  Inactive: "zinc",
};

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

// Profile tabs FE 02 stepper (owner 2026-11-12).
export const LIFECYCLE_STEP_TONE: Record<"Completed" | "Current" | "Not Started", StatusTone> = {
  Completed: "green",
  Current: "blue",
  "Not Started": "zinc",
};

// Profile tabs FE 03 All History event tags (owner 2026-11-12): no purple/orange tokens, so the rest are neutral.
export const HISTORY_EVENT_TONE: Record<string, StatusTone> = {
  assign: "blue",
  transfer: "blue",
  return: "blue",
  status: "green",
};

/** A finding's state in the Discrepancies tab and the activity log. */
export const FINDING_STATE_TONE = {
  open: "yellow",
  reconciled: "green",
  dismissed: "zinc",
} as const satisfies Record<"open" | "reconciled" | "dismissed", StatusTone>;

/** Solid fill for a tone (a filled icon circle, white glyph on top). Same hues as the Badge tones. */
export const TONE_SOLID: Record<StatusTone, string> = {
  green: "bg-success",
  blue: "bg-info",
  yellow: "bg-warning",
  red: "bg-error",
  zinc: "bg-t1-gray-400",
};

/** The activity timeline shows positive entries (Verified, Completed, Reconciled) in blue, as in the design; every other
 *  tone is unchanged. Badges and tables elsewhere keep green. */
export const activityTone = (tone: StatusTone): StatusTone => (tone === "green" ? "blue" : tone);

/** Soft background for a tone (a KPI tile or a notice). */
export const TONE_SOFT: Record<StatusTone, string> = {
  green: "bg-success-muted",
  blue: "bg-info-muted",
  yellow: "bg-warning-muted",
  red: "bg-error-muted",
  zinc: "bg-muted",
};

/** Icon colour for a tone on its soft tile (darker shade, for contrast). */
export const TONE_ICON: Record<StatusTone, string> = {
  green: "text-t1-green-700",
  blue: "text-t1-blue-700",
  yellow: "text-t1-amber-700",
  red: "text-t1-red-700",
  zinc: "text-muted-foreground",
};
