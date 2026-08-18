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

export interface Asset {
  id: string;
  tag: string;
  category: AssetCategory;
  status: AssetStatus;
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
