"use client";

import Link from "next/link";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import {
  DisposeIcon, EyeIcon, HeartIcon, LocationIcon, RefreshIcon, RetireIcon,
} from "@/components/ui/icons";
import { AssetThumbnail } from "../AssetThumbnail";
import { ConditionBadge, StatusBadge } from "../StatusBadges";
import { ASSET_CONDITIONS, type AssetCondition } from "../../domain/asset-condition";
import { ASSET_STATUSES, type AssetStatus } from "../../domain/asset-status";
import { assignmentDate } from "../../domain/assignment-current";
import { lifecycleRowMenu } from "../../domain/lifecycle-list";
import type { AssetListRow } from "../../services/assets-list-types";
import { LwRowMenu } from "./LwRowMenu";
import { LIFECYCLE_COLUMNS } from "./lw-columns";

const MENU_ICONS = {
  view: EyeIcon, "change-status": RefreshIcon, "change-condition": HeartIcon,
  "move-location": LocationIcon, retire: RetireIcon, dispose: DisposeIcon,
};

const asStatus = (value: string) => (ASSET_STATUSES as readonly string[]).includes(value) ? value as AssetStatus : null;
const asCondition = (value: string | null) =>
  value && (ASSET_CONDITIONS as readonly string[]).includes(value) ? value as AssetCondition : null;

export function LifecycleAssetsTable({ rows }: { rows: AssetListRow[] }) {
  const router = useRouter();
  const refreshed = useRef(new Set<string>());
  return (
    <table className="w-full min-w-2xl table-fixed text-left text-xs">
      <caption className="sr-only">Assets with their lifecycle status and condition. Select a row to open the asset.</caption>
      <thead className="sticky top-0 z-10 bg-muted text-2xs text-muted-foreground">
        <tr>
          {LIFECYCLE_COLUMNS.map((column) => (
            <th key={column.key} scope="col" className={`border-b border-border px-3 py-3 font-semibold first:pl-4 last:pr-4 ${column.className}`}>
              {column.key === "menu" ? <span className="sr-only">{column.label}</span> : column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {rows.map((row) => {
          const href = `/asset-workspace/assets/${encodeURIComponent(row.id)}`;
          const status = asStatus(row.status);
          return (
            <tr
              key={row.id}
              className="cursor-pointer transition-colors duration-150 hover:bg-muted/50 motion-reduce:transition-none"
              onClick={(event) => {
                const target = event.target as Element;
                if (target.closest("a, button, [role=menu]") || window.getSelection()?.toString()) return;
                router.push(href);
              }}
            >
              <td className="relative py-2 pr-3 pl-4 align-middle">
                <AssetThumbnail
                  src={row.thumbnail_url}
                  alt=""
                  className="size-10 object-contain!"
                  onFailed={() => {
                    if (refreshed.current.has(row.id)) return;
                    refreshed.current.add(row.id);
                    router.refresh();
                  }}
                />
              </td>
              <td className="px-3 py-2 align-middle">
                <Link href={href} className="block rounded-control font-semibold text-foreground underline-offset-4 wrap-anywhere hover:text-accent-foreground hover:underline">
                  {row.name || "Unnamed asset"}
                </Link>
                <p className="text-2xs text-muted-foreground wrap-anywhere @4xl/lw:hidden">{row.location_name || "No location"}</p>
                <p className="text-2xs text-muted-foreground wrap-anywhere @6xl/lw:hidden">Custodian: {row.custody?.name || "—"}</p>
              </td>
              <td className="px-3 py-2 align-middle tabular-nums wrap-anywhere text-muted-foreground">{row.asset_code || "Not available"}</td>
              <td className="hidden px-3 py-2 align-middle wrap-anywhere text-muted-foreground @5xl/lw:table-cell">{row.category_name || "Unnamed category"}</td>
              <td className="hidden px-3 py-2 align-middle wrap-anywhere text-muted-foreground @4xl/lw:table-cell">{row.location_name || "No location"}</td>
              <td className="hidden px-3 py-2 align-middle wrap-anywhere text-muted-foreground @6xl/lw:table-cell">{row.custody?.name || "—"}</td>
              <td className="px-3 py-2 align-middle">
                {status ? <StatusBadge status={status} /> : <span className="text-muted-foreground">{row.status || "—"}</span>}
              </td>
              <td className="px-3 py-2 align-middle">
                <ConditionBadge condition={asCondition(row.condition)} />
              </td>
              <td className="hidden px-3 py-2 align-middle tabular-nums text-muted-foreground @4xl/lw:table-cell">
                <time dateTime={row.status_since}>{assignmentDate(row.status_since)}</time>
              </td>
              <td className="relative py-2 pr-4 pl-3 align-middle">
                <div className="flex justify-end">
                  <LwRowMenu name={row.name || "Unnamed asset"} items={lifecycleRowMenu(row)} icons={MENU_ICONS} />
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
