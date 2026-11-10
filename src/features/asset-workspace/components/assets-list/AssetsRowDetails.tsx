import type { ReactNode } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { ASSET_STATUSES, type AssetStatus } from "../../domain/asset-status";
import { ASSET_CONDITIONS, type AssetCondition } from "../../domain/asset-condition";
import type { AssetListRow } from "../../services/assets-list-types";
import { ConditionBadge, StatusBadge } from "../StatusBadges";

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Asia/Bangkok" });
const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Bangkok" });

export function AssetsUpdatedAt({ value }: { value: string | null }) {
  if (!value || !Number.isFinite(Date.parse(value))) return <span>—</span>;
  const date = new Date(value);
  return (
    <time dateTime={value} title={`${dateFormat.format(date)} ${timeFormat.format(date)} Asia/Bangkok`}>
      {dateFormat.format(date)}
    </time>
  );
}

export function AssetsStatusValue({ value }: { value: string }) {
  return ASSET_STATUSES.includes(value as AssetStatus)
    ? <StatusBadge status={value as AssetStatus} />
    : <span className="break-words text-muted-foreground">{value || "—"}</span>;
}

export function AssetsConditionValue({ value }: { value: string | null }) {
  return ASSET_CONDITIONS.includes(value as AssetCondition)
    ? <ConditionBadge condition={value as AssetCondition} />
    : <span className="break-words text-muted-foreground">{value || "—"}</span>;
}

export function AssetsRowDetails({ row, table = false }: { row: AssetListRow; table?: boolean }) {
  const fields: { label: string; value: ReactNode; tableClass: string }[] = [
    { label: "Serial Number", value: row.serial_number || "—", tableClass: "@min-[90rem]/assets-results:hidden" },
    { label: "Category", value: row.category_name || "Uncategorized", tableClass: "hidden" },
    { label: "Location", value: row.location_name || "—", tableClass: "hidden" },
    { label: "Condition", value: <AssetsConditionValue value={row.condition} />, tableClass: "@min-5xl/assets-results:hidden" },
    { label: "Assignee", value: row.custody ? row.custody.name || "Unnamed custodian" : "Unassigned", tableClass: "@min-6xl/assets-results:hidden" },
    { label: "Last updated", value: <AssetsUpdatedAt value={row.updated_at} />, tableClass: "@min-[90rem]/assets-results:hidden" },
  ];
  return (
    <details className={cn("group/asset-details min-w-0 text-xs", table && "@min-[90rem]/assets-results:hidden")}>
      <summary
        aria-label={`More details for ${row.name || "unnamed asset"}`}
        title="Show additional asset details"
        className={cn(
          "flex cursor-pointer list-none items-center gap-2 rounded-control text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden",
          table ? "absolute right-0 top-0 h-8 w-16 justify-center gap-1 text-2xs hover:bg-muted" : "min-h-8 w-fit py-1 max-sm:min-h-10",
        )}
      >
        <span>{table ? "Details" : "More details"}</span>
        <ChevronDownIcon aria-hidden="true" className="size-3 shrink-0 transition-transform group-open/asset-details:rotate-180 motion-reduce:transition-none" />
      </summary>
      <dl className="mt-2 grid gap-3 rounded-control bg-muted p-3 leading-relaxed">
        {fields.map((field) => (
          <div key={field.label} className={cn("min-w-0 space-y-1", table && field.tableClass)}>
            <dt className="text-muted-foreground">{field.label}</dt>
            <dd className="break-words text-foreground">{field.value}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
