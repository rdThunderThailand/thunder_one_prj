// Pure translation from Thunder_Core's asset shapes to the canonical domain
// (P1-04). Kept apart from asset-core-adapter.ts so the check script can load
// it without the server-only fetch code. Each gap marker below names a field
// Core cannot give us yet; grep for them to build the list the PE carries
// into the Core contract.
import type { AssetDetail, AssetListRow, AssetListStatus, AssetSummary } from "../../asset-intelligence/assets/services/asset-list-api.ts";
import type { AssetCondition } from "../domain/asset-condition.ts";
import { ASSET_STATUSES, type AssetStatus } from "../domain/asset-status.ts";
import type { CustodyTarget } from "../domain/custody.ts";

// CORE-GAP:status-enum — Core still has the four legacy values and no Disposed.
const STATUS_FROM_CORE: Record<AssetListStatus, AssetStatus> = {
  Ready: "Available",
  "In Use": "Assigned",
  "In Progress": "In Maintenance",
  "Retired-Cancelled": "Retired",
};

export function statusFromCore(status: AssetListStatus): AssetStatus {
  return STATUS_FROM_CORE[status];
}

/** For list filters. `null` = Core cannot filter by this status (Disposed). */
export function statusToCore(status: AssetStatus): AssetListStatus | null {
  const entry = Object.entries(STATUS_FROM_CORE).find(([, canonical]) => canonical === status);
  return entry ? (entry[0] as AssetListStatus) : null;
}

export interface WorkspaceAsset {
  id: string;
  // CORE-GAP:asset-tag — Asset Tag is required and unique (03 §2.4), but Core sends it on the
  // detail response only (`assetTag` = `assets.asset_code`, nullable); list rows have none.
  tag: string | null;
  name: string;
  serial: string | null;
  category: string | null;
  status: AssetStatus;
  // CORE-GAP:condition — Core has no condition column; null until it does.
  condition: AssetCondition | null;
  custody: CustodyTarget | null;
  department: string | null;
  building: string | null;
  floor: string | null;
  room: string | null;
  receivedDate: string | null;
  valueTHB: number | null;
}

// CORE-GAP:custody-target — Core sends the owner as display text only: no id,
// and no way to tell a person from an organizational unit.
function custodyFromOwner(owner: string | null): CustodyTarget | null {
  return owner ? { type: "person", id: "", label: owner } : null;
}

export function assetFromCore(row: AssetListRow | AssetDetail): WorkspaceAsset {
  return {
    id: row.id,
    tag: "assetTag" in row ? row.assetTag : null,
    name: row.name,
    serial: row.serial,
    category: row.category,
    status: statusFromCore(row.status),
    condition: null,
    custody: custodyFromOwner(row.owner),
    department: row.department,
    building: row.building,
    floor: row.floor,
    room: row.room,
    receivedDate: row.receivedDate,
    valueTHB: row.valueTHB,
  };
}

export interface WorkspaceAssetSummary {
  total: number;
  /** One entry per canonical status, in ASSET_STATUSES order; Disposed is always 0 today. */
  byStatus: { status: AssetStatus; count: number }[];
}

export function summaryFromCore(summary: AssetSummary): WorkspaceAssetSummary {
  return {
    total: summary.total,
    byStatus: ASSET_STATUSES.map((status) => ({
      status,
      count: summary.byStatus
        .filter((entry) => statusFromCore(entry.status) === status)
        .reduce((sum, entry) => sum + entry.count, 0),
    })),
  };
}
