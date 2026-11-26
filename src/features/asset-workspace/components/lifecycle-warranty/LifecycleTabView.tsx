"use client";

import { DisposeIcon, RetireIcon, ToolIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { ASSET_CONDITIONS } from "../../domain/asset-condition";
import { ASSET_STATUSES } from "../../domain/asset-status";
import { LIFECYCLE_CLEAR, LIFECYCLE_TILES, lifecycleTileUpdate } from "../../domain/lifecycle-list";
import { STATUS_TONE } from "../../domain/status-tone";
import { useLifecycleTab } from "../../hooks/use-lifecycle-tab";
import type { LifecycleSeeds } from "../../services/lifecycle-tab-api";
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

export function LifecycleSignedOut() {
  return (
    <LwWorkspace>
      <LwHeader tab="lifecycle" />
      <EmptyState title="Sign in again to continue" body="Your session ended. Sign in to see lifecycle data." />
    </LwWorkspace>
  );
}

/** FE 02: four tiles, five filters, the asset table with its lifecycle menu. */
export function LifecycleTabView({ context, seeds }: { context: string; seeds: LifecycleSeeds }) {
  const tab = useLifecycleTab(context, seeds);
  const { url } = tab;
  if (tab.signedOut) return <LifecycleSignedOut />;
  const current = { status: url.get("status"), condition: url.get("condition") };
  const counts = tab.counts.data;
  const options = tab.filters.data;
  const optionsLoading = tab.filters.pending && !options;
  const issues = counts ? (counts.byCondition.Damaged ?? 0) + (counts.byCondition.Unusable ?? 0) : null;
  const references = (items: { id: string; name: string | null }[] = []) =>
    items.map((item) => ({ value: item.id, label: item.name || `Unnamed (${item.id})` }));
  const custody = url.get("custody_id") ? `${url.get("custody_type")}:${url.get("custody_id")}` : "";

  return (
    <LwWorkspace>
      <LwHeader tab="lifecycle" />
      <LwTiles
        label="Lifecycle totals"
        disabled={false}
        loading={tab.counts.pending && !counts}
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
        optionsFailed={Boolean(tab.filters.error)}
        selects={[
          { key: "status", label: "Status", value: current.status ?? "",
            options: ASSET_STATUSES.map((value) => ({ value, label: value })) },
          { key: "condition", label: "Condition", value: current.condition ?? "",
            options: ASSET_CONDITIONS.map((value) => ({ value, label: value })) },
          { key: "category_id", label: "Category", value: url.get("category_id") ?? "",
            loading: optionsLoading, options: references(options?.categories) },
          { key: "location_id", label: "Location", value: url.get("location_id") ?? "",
            loading: optionsLoading, options: references(options?.locations) },
          { key: "custody", label: "Custodian", value: custody,
            loading: optionsLoading, options: (options?.custodyTargets ?? []).map((target) => ({
              value: `${target.type}:${target.id}`,
              label: `${target.name || "Unnamed custodian"} (${target.type === "person" ? "Person" : "Organizational Unit"})`,
            })),
            onChange: (value) => { const [type, id] = value?.split(":") ?? []; url.set({ custody_type: type, custody_id: id }); } },
        ]}
      />
      <LwListBody
        tab="lifecycle"
        url={{ ...url, isPending: tab.loading }}
        list={tab.rows}
        onRetry={tab.retry}
        columns={LIFECYCLE_COLUMNS}
        noun="assets"
        emptyTitle="No assets match these filters."
        clear={LIFECYCLE_CLEAR}
        scrollKey={Object.values(current).join("|") + (url.get("page") ?? "")}
      >
        {(rows) => <LifecycleAssetsTable rows={rows} onPhotoFailed={tab.refreshPhotos} />}
      </LwListBody>
    </LwWorkspace>
  );
}
