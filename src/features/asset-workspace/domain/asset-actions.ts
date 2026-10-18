import type { AssetStatus } from "./asset-status.ts";

/** Spec v1.1.5 §4.11 — actions offered per status. Export lives apart (below). */
export type AssetActionKey =
  | "assign"
  | "transfer"
  | "return"
  | "change_status_condition"
  | "move_location"
  | "retire"
  | "dispose"
  | "print_label";

export const ACTIONS_BY_STATUS: Record<AssetStatus, readonly AssetActionKey[]> = {
  Available: ["assign", "change_status_condition", "move_location", "retire", "print_label"],
  Assigned: ["transfer", "return", "change_status_condition", "move_location", "print_label"],
  "In Maintenance": ["change_status_condition", "move_location", "retire", "print_label"],
  Retired: ["dispose", "print_label"],
  Disposed: [],
};

/**
 * Export is offered for every status, but its behaviour is UC-014 (still OPEN),
 * so it stays a separate constant that the UI can switch off without touching the table above.
 */
export const EXPORT_STATUSES: readonly AssetStatus[] = ["Available", "Assigned", "In Maintenance", "Retired", "Disposed"];

export function actionsFor(status: AssetStatus): readonly AssetActionKey[] {
  return ACTIONS_BY_STATUS[status];
}

export function canExport(status: AssetStatus): boolean {
  return EXPORT_STATUSES.includes(status);
}
