"use client";

import { AlertCircleIcon, ClockIcon, MinusIcon, ShieldIcon } from "@/components/ui/icons";
import { WARRANTY_STATUSES } from "../../domain/report";
import { WARRANTY_TONE } from "../../domain/status-tone";
import { WARRANTY_CLEAR, WARRANTY_TILE_LABEL, WARRANTY_TILES, warrantyTileUpdate } from "../../domain/warranty-list";
import type { WarrantyTabData } from "../../services/warranty-workspace-api";
import { useListUrlState } from "../list-page/useListUrlState";
import { EmptyState } from "../states/states";
import { LwFilters } from "./LwFilters";
import { LwHeader } from "./LwHeader";
import { LwListBody } from "./LwListBody";
import { LwTiles } from "./LwTiles";
import { LwWorkspace } from "./LwWorkspace";
import { WARRANTY_COLUMNS } from "./lw-columns";
import { WarrantyAssetsTable } from "./WarrantyAssetsTable";

const TILE_ICONS = {
  Active: <ShieldIcon />, "Expiring Soon": <ClockIcon />, Expired: <AlertCircleIcon />, "No Warranty": <MinusIcon />,
};

/** FE 03: four tiles, Status / Warranty Type / Provider, one row per non-Disposed asset with its current warranty. */
export function WarrantyTabView({ data }: { data: WarrantyTabData }) {
  const url = useListUrlState();
  if (!data.signedIn) {
    return (
      <LwWorkspace>
        <LwHeader tab="warranty" />
        <EmptyState title="Sign in again to continue" body="Your session ended. Sign in to see warranty data." />
      </LwWorkspace>
    );
  }
  const status = url.get("status");
  const counts = data.counts;

  return (
    <LwWorkspace>
      <LwHeader tab="warranty" />
      <LwTiles
        label="Warranty totals"
        disabled={url.isPending}
        tiles={WARRANTY_TILES.map((key) => ({
          key,
          label: WARRANTY_TILE_LABEL[key],
          count: counts ? counts.byStatus[key] ?? 0 : null,
          tone: WARRANTY_TONE[key],
          icon: TILE_ICONS[key],
          onClick: () => url.set(warrantyTileUpdate(key, status)),
        }))}
      />
      <LwFilters
        url={url}
        placeholder="Search name, tag or serial…"
        clear={WARRANTY_CLEAR}
        optionsFailed={!counts}
        selects={[
          { key: "status", label: "Status", value: status ?? "",
            options: WARRANTY_STATUSES.map((value) => ({ value, label: value })) },
          { key: "warranty_type", label: "Warranty Type", value: url.get("warranty_type") ?? "",
            options: (counts?.byWarrantyType ?? []).map(({ warrantyType }) => ({ value: warrantyType, label: warrantyType })) },
          { key: "provider", label: "Provider", value: url.get("provider") ?? "",
            options: (counts?.byProvider ?? []).map(({ provider }) => ({ value: provider, label: provider })) },
        ]}
      />
      <LwListBody
        tab="warranty"
        url={url}
        list={data.list}
        columns={WARRANTY_COLUMNS}
        noun="warranties"
        emptyTitle="No warranties match these filters."
        clear={WARRANTY_CLEAR}
        scrollKey={[status, url.get("provider"), url.get("warranty_type"), url.get("page")].join("|")}
      >
        {(rows) => <WarrantyAssetsTable rows={rows} />}
      </LwListBody>
    </LwWorkspace>
  );
}
