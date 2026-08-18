// Asset Intelligence's `Asset` — an organization-wide physical asset (laptop,
// printer, NAS, media-player hardware, ...). Distinct from `features/assets`'s
// `Asset` (a reusable media file) — see docs/adr/0023-asset-intelligence-feature-namespacing.md
// for why both are named `Asset` rather than one being renamed.

/**
 * `media_player_device` is the category that links an Asset Intelligence Asset
 * to a Media Workspace Device — see `Asset.externalRef` below and
 * docs/adr/0024-asset-device-cross-reference-model.md.
 */
export type AssetCategory = "laptop" | "printer" | "nas" | "media_player_device" | "other";

export type AssetStatus = "healthy" | "attention" | "critical";

/**
 * A minimal 2-value slice of the full onboarding state machine from the
 * requirement doc §5.1 (`unassigned → pending_department_ack →
 * assigned_pending_deploy → pending_employee_ack → active`) — just enough to
 * drive the Employee "register the asset I received" flow (EMP-01). Modeling
 * the full 5-state machine (department/technician handoff, deploy work order)
 * is separate future work, not decided here.
 */
export type AssetLifecycleStatus = "active" | "pending_acknowledgement";

export interface Asset {
  id: string;
  tag: string;
  category: AssetCategory;
  status: AssetStatus;
  lifecycleStatus: AssetLifecycleStatus;
  /** Friendly display name (e.g. "Dell Latitude 5450") — optional, mainly used by employee-facing views. */
  model?: string;
  locationId: string | null;
  departmentId: string | null;
  assigneeId: string | null;
  vendorId: string | null;
  warrantyExpiry: string | null;
  purchaseValue: number;
  healthScore: number;
  /**
   * Cross-reference to the corresponding row in another system (currently only
   * meaningful for `category: "media_player_device"`, pointing at a Media
   * Workspace Device). `null` for every asset until the Thunder_Core contract
   * exists — see docs/adr/0024-asset-device-cross-reference-model.md. Nothing
   * writes to this field yet.
   */
  externalRef: string | null;
}
