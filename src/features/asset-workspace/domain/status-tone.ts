import type { AssetCondition } from "./asset-condition.ts";
import type { AssetStatus } from "./asset-status.ts";

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
