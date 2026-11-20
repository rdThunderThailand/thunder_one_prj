"use client";

import { DisposeIcon, RetireIcon, ToolIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { ASSET_CONDITIONS } from "../../domain/asset-condition";
import { ASSET_STATUSES } from "../../domain/asset-status";
import { LIFECYCLE_CLEAR, LIFECYCLE_TILES, lifecycleTileUpdate } from "../../domain/lifecycle-list";
import { STATUS_TONE } from "../../domain/status-tone";
import type { LifecycleTabData } from "../../services/warranty-workspace-api";
import { useListUrlState } from "../list-page/useListUrlState";
import { EmptyState } from "../states/states";
import { LifecycleAssetsTable } from "./LifecycleAssetsTable";
import { LIFECYCLE_COLUMNS } from "./lw-columns";
import { LwFilters } from "./LwFilters";
import { LwHeader } from "./LwHeader";
import { LwListBody } from "./LwListBody";
import { LwTiles } from "./LwTiles";
import { LwWorkspace } from "./LwWorkspace";

const TILE_ICONS = {
  "In Maintenance": <ToolIcon />, Retired: <RetireIcon />, Disposed: <DisposeIcon />, "Condition Issues": <WarningTriangleIcon />,
};

/** FE 02: four tiles, five filters, the asset table with its lifecycle menu. */
export function LifecycleTabView({ data }: { data: LifecycleTabData }) {
  const url = useListUrlState();
  if (!data.signedIn) {
    return (
      <LwWorkspace>
        <LwHeader tab="lifecycle" />
        <EmptyState title="Sign in again to continue" body="Your session ended. Sign in to see lifecycle data." />
      </LwWorkspace>
    );
  }
  const current = { status: url.get("status"), condition: url.get("condition") };
  const counts = data.counts;
  const issues = counts ? (counts.byCondition.Damaged ?? 0) + (counts.byCondition.Unusable ?? 0) : null;
  const references = (items: { id: string; name: string | null }[] = []) =>
    items.map((item) => ({ value: item.id, label: item.name || `Unnamed (${item.id})` }));
  const custody = url.get("custody_id") ? `${url.get("custody_type")}:${url.get("custody_id")}` : "";

  return (
    <LwWorkspace>
      <LwHeader tab="lifecycle" />
      <LwTiles
        label="Lifecycle totals"
        disabled={url.isPending}
        tiles={LIFECYCLE_TILES.map(({ key }) => ({
          key,
          label: key,
          count: key === "Condition Issues" ? issues : counts?.byStatus[key] ?? null,
          tone: key === "Condition Issues" ? "red" : STATUS_TONE[key],
          icon: TILE_ICONS[key],
          onClick: () => url.set(lifecycleTileUpdate(key, current)),
        }))}
      />
      <LwFilters
        url={url}
        placeholder="Search name, tag or serial…"
        clear={LIFECYCLE_CLEAR}
        optionsFailed={!data.filters}
        selects={[
          { key: "status", label: "Status", value: current.status ?? "",
            options: ASSET_STATUSES.map((value) => ({ value, label: value })) },
          { key: "condition", label: "Condition", value: current.condition ?? "",
            options: ASSET_CONDITIONS.map((value) => ({ value, label: value })) },
          { key: "category_id", label: "Category", value: url.get("category_id") ?? "",
            options: references(data.filters?.categories) },
          { key: "location_id", label: "Location", value: url.get("location_id") ?? "",
            options: references(data.filters?.locations) },
          { key: "custody", label: "Custodian", value: custody,
            options: (data.filters?.custodyTargets ?? []).map((target) => ({
              value: `${target.type}:${target.id}`,
              label: `${target.name || "Unnamed custodian"} (${target.type === "person" ? "Person" : "Organizational Unit"})`,
            })),
            onChange: (value) => { const [type, id] = value?.split(":") ?? []; url.set({ custody_type: type, custody_id: id }); } },
        ]}
      />
      <LwListBody
        tab="lifecycle"
        url={url}
        list={data.list}
        columns={LIFECYCLE_COLUMNS}
        noun="assets"
        emptyTitle="No assets match these filters."
        clear={LIFECYCLE_CLEAR}
        scrollKey={Object.values(current).join("|") + (url.get("page") ?? "")}
      >
        {(rows) => <LifecycleAssetsTable rows={rows} />}
      </LwListBody>
    </LwWorkspace>
  );
}
