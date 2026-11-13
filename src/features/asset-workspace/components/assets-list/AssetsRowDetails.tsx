import type { ReactNode } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";
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

/** Compact cards only: the fields the card face doesn't show. */
export function AssetsRowDetails({ row }: { row: AssetListRow }) {
  const fields: { label: string; value: ReactNode }[] = [
    { label: "Serial Number", value: row.serial_number || "—" },
    { label: "Condition", value: <AssetsConditionValue value={row.condition} /> },
    { label: "Assignee", value: row.custody ? row.custody.name || "Unnamed custodian" : "Unassigned" },
    { label: "Last updated", value: <AssetsUpdatedAt value={row.updated_at} /> },
  ];
  return (
    <details className="group/asset-details min-w-0 text-xs">
      <summary
        aria-label={`More details for ${row.name || "unnamed asset"}`}
        title="Show additional asset details"
        className="flex min-h-8 w-fit cursor-pointer list-none items-center gap-2 rounded-control py-1 text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring max-sm:min-h-10 [&::-webkit-details-marker]:hidden"
      >
        <span>More details</span>
        <ChevronDownIcon aria-hidden="true" className="size-3 shrink-0 transition-transform group-open/asset-details:rotate-180 motion-reduce:transition-none" />
      </summary>
      <dl className="mt-2 grid gap-3 rounded-control bg-muted p-3 leading-relaxed">
        {fields.map((field) => (
          <div key={field.label} className="min-w-0 space-y-1">
            <dt className="text-muted-foreground">{field.label}</dt>
            <dd className="break-words text-foreground">{field.value}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
