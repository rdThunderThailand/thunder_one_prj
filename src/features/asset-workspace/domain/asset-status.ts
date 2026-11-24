/** Spec v1.1.5 §4.4 — the only status moves the product allows. */
export const ASSET_STATUSES = ["Available", "Assigned", "In Maintenance", "Retired", "Disposed"] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];

/** The controlled action that performs a move; matches the keys in asset-actions.ts. */
export type TransitionVia = "assign" | "return" | "change_status_condition" | "retire" | "dispose";

export interface StatusTransition {
  from: AssetStatus;
  to: AssetStatus;
  via: TransitionVia;
  /** Controlled lifecycle changes carry a Reason (§4.13.3). */
  requiresReason: boolean;
  /** In Maintenance → Available may not leave custody behind (§4.4). */
  requiresNoCustody: boolean;
}

export const STATUS_TRANSITIONS: readonly StatusTransition[] = [
  { from: "Available", to: "Assigned", via: "assign", requiresReason: false, requiresNoCustody: false },
  { from: "Assigned", to: "Available", via: "return", requiresReason: false, requiresNoCustody: false },
  { from: "Available", to: "In Maintenance", via: "change_status_condition", requiresReason: true, requiresNoCustody: false },
  // Custody is kept; the move never clears it.
  { from: "Assigned", to: "In Maintenance", via: "change_status_condition", requiresReason: true, requiresNoCustody: false },
  { from: "In Maintenance", to: "Available", via: "change_status_condition", requiresReason: true, requiresNoCustody: true },
  { from: "Available", to: "Retired", via: "retire", requiresReason: true, requiresNoCustody: false },
  { from: "In Maintenance", to: "Retired", via: "retire", requiresReason: true, requiresNoCustody: false },
  { from: "Retired", to: "Disposed", via: "dispose", requiresReason: true, requiresNoCustody: false },
];

export function findTransition(from: AssetStatus, to: AssetStatus): StatusTransition | undefined {
  return STATUS_TRANSITIONS.find((row) => row.from === from && row.to === to);
}

export function canTransition(from: AssetStatus, to: AssetStatus): boolean {
  return findTransition(from, to) !== undefined;
}
