// Asset Intelligence's `Asset` — an organization-wide physical asset (laptop,
// printer, NAS, media-player hardware, ...). Distinct from `features/assets`'s
// `Asset` (a reusable media file) — see docs/adr/0023-asset-intelligence-feature-namespacing.md
// for why both are named `Asset` rather than one being renamed.

/**
 * `media_player_device` is the category that links an Asset Intelligence Asset
 * to a Communication Device — see `Asset.externalRef` below and
 * docs/adr/0024-asset-device-cross-reference-model.md.
 */
export type AssetCategory = "laptop" | "printer" | "nas" | "media_player_device" | "other";

export type AssetStatus = "healthy" | "attention" | "critical";

/**
 * A partial slice of the full onboarding state machine from the requirement
 * doc §5.1 (`unassigned → pending_department_ack → assigned_pending_deploy →
 * pending_employee_ack → active`) — just enough to drive the two
 * acknowledge-a-transfer flows that exist so far: Department Manager's
 * Approvals (DM-01, `pending_department_ack`) and Employee's Scan QR
 * (EMP-01, `pending_acknowledgement` — a stand-in for `pending_employee_ack`).
 * `assigned_pending_deploy` (the Technician deploy work order in between) is
 * not modeled — separate future work, not decided here.
 */
export type AssetLifecycleStatus = "active" | "pending_department_ack" | "pending_acknowledgement";

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

/**
 * Request body for `POST /api/core/v1/tenants/{id}/assets` — registers a real
 * device with Thunder_Core directly. This is a different, narrower shape than
 * `Asset` above: Thunder_Core's device registry has no `category`,
 * `departmentId`, `purchaseValue`, etc., and this UI only surfaces a subset
 * of the API's accepted fields (the rest — `app_version`, `ip_address`,
 * `screen_ratio`, `screen_dimension`, `activation_code`, `image_url`,
 * `download_mode`, the `*_log_enable`/`*_log_days` pair, `capture_screen`,
 * `sync_media`, `cctv_url`, `location_url` — exist server-side with their own
 * defaults but have no form control here yet). `device_name` is the only
 * required field.
 */
export interface CreateAssetDeviceInput {
  device_name: string;
  serial_number?: string;
  mac_address?: string;
  model?: string;
  /** Free-text; server defaults to `"Other"` when omitted. */
  device_type?: string;
  site?: string;
  zone?: string;
  tags?: string[];
}

/** Only the fields this UI reads back — the real row almost certainly carries
 *  more (every request field above, plus server-generated ones), left
 *  untyped rather than guessed. */
export interface CreatedAssetDevice {
  id: string;
  device_name: string;
  serial_number: string | null;
  mac_address: string | null;
}

/** Generated server-side alongside the asset row; shown once so the operator
 *  can provision the physical device — not retrievable again from any
 *  endpoint this app currently calls. */
export interface AssetDeviceCredentials {
  mqtt_client_id: string;
  access_token: string;
}

export interface CreateAssetDeviceResult {
  asset: CreatedAssetDevice;
  credentials: AssetDeviceCredentials;
}
