import { Checkbox } from "@/components/ui/lovable/checkbox";
import { Button } from "@/components/ui/lovable/button";
import { BoxIcon, ChevronDownIcon, EditIcon, EyeIcon, MoreIcon } from "@/components/ui/icons";
import { ASSET_STATUSES, type AssetStatus } from "../../domain/asset-status";
import { ASSET_CONDITIONS, type AssetCondition } from "../../domain/asset-condition";
import type { AssetListRow } from "../../services/assets-list-types";
import type { AssetListQuery } from "../../services/assets-list-query";
import { ConditionBadge, StatusBadge } from "../StatusBadges";
import { UnavailableAction } from "./AssetsListToolbar";

interface AssetsTableProps {
  rows: AssetListRow[];
  selected: Set<string>;
  query: AssetListQuery;
  onSelect: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onSort: (sort: AssetListQuery["sort"]) => void;
  pending: boolean;
}
const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Asia/Bangkok" });
const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Bangkok" });

function UpdatedAt({ value }: { value: string | null }) {
  if (!value || !Number.isFinite(Date.parse(value))) return <span>—</span>;
  const date = new Date(value);
  return (
    <time dateTime={value} title={`${dateFormat.format(date)} ${timeFormat.format(date)} Asia/Bangkok`}>
      {dateFormat.format(date)}
      <span className="block text-2xs text-muted-foreground">{timeFormat.format(date)}</span>
    </time>
  );
}

export function AssetsTable({ rows, selected, query, onSelect, onSelectAll, onSort, pending }: AssetsTableProps) {
  const count = rows.filter((row) => selected.has(row.id)).length;
  const sortHeading = (label: string, key: AssetListQuery["sort"]) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-0 text-2xs"
      disabled={pending}
      onClick={() => onSort(key)}
    >
      {label}
      <ChevronDownIcon className={`size-3 ${query.sort === key && query.direction === "asc" ? "rotate-180" : ""}`} />
    </Button>
  );
  const ariaSort = (key: AssetListQuery["sort"]) => query.sort === key ? query.direction === "asc" ? "ascending" as const : "descending" as const : "none" as const;

  return (
    <table className="w-full table-fixed text-left text-xs">
      <caption className="sr-only">Assets in your authorized organization scope. Updated times use Asia/Bangkok.</caption>
      <thead className="border-y border-border bg-muted/50 text-2xs text-muted-foreground">
        <tr>
          <th scope="col" className="w-10 px-3 py-2">
            <Checkbox
              aria-label="Select all assets on this page"
              disabled={pending || !rows.length}
              checked={count === 0 ? false : count === rows.length ? true : "indeterminate"}
              onCheckedChange={(checked) => onSelectAll(checked === true)}
            />
          </th>
          <th scope="col" aria-sort={ariaSort("name")} className="px-2 font-medium">{sortHeading("Asset", "name")}</th>
          <th scope="col" aria-sort={ariaSort("asset_code")} className="hidden w-28 px-2 font-medium @2xl:table-cell">{sortHeading("Asset Tag", "asset_code")}</th>
          <th scope="col" className="hidden w-28 px-2 font-medium @7xl:table-cell">Type / Model</th>
          <th scope="col" className="hidden w-28 px-2 font-medium @5xl:table-cell">Category</th>
          <th scope="col" className="hidden w-28 px-2 font-medium @4xl:table-cell">Location</th>
          <th scope="col" className="w-32 px-2 font-medium">Status</th>
          <th scope="col" className="hidden w-24 px-2 font-medium @3xl:table-cell">Condition</th>
          <th scope="col" className="hidden w-28 px-2 font-medium @6xl:table-cell">Assignee</th>
          <th scope="col" aria-sort={ariaSort("updated_at")} className="hidden w-28 px-2 font-medium @6xl:table-cell">{sortHeading("Last Updated", "updated_at")}</th>
          <th scope="col" className="hidden w-28 px-2 font-medium @5xl:table-cell">Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.id}
            className={`border-b border-border last:border-0 ${selected.has(row.id) ? "bg-info-muted/40" : "hover:bg-muted/50"}`}
          >
            <td className="px-3 py-3 align-top">
              <Checkbox
                aria-label={`Select ${row.name || "unnamed asset"}`}
                disabled={pending}
                checked={selected.has(row.id)}
                onCheckedChange={(checked) => onSelect(row.id, checked === true)}
              />
            </td>
            <td className="px-2 py-3 align-top">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-control bg-muted text-muted-foreground"
                >
                  <BoxIcon className="size-5" />
                </span>
                <div className="min-w-0 break-words">
                  <span className="font-semibold text-foreground">{row.name || "Unnamed asset"}</span>
                  <span className="mt-1 block text-2xs text-muted-foreground">{[row.brand, row.model].filter(Boolean).join(" ") || row.serial_number || "—"}</span>
                  <span className="mt-1 block text-2xs text-muted-foreground @2xl:hidden">{row.asset_code || "No Asset Tag"}</span>
                  <span className="mt-1 block text-2xs text-muted-foreground @4xl:hidden">{row.location_name || "No location"}</span>
                  <span className="mt-1 block text-2xs text-muted-foreground @6xl:hidden">
                    {row.custody ? row.custody.name || "Unnamed custodian" : "Unassigned"}
                  </span>
                </div>
              </div>
            </td>
            <td className="hidden break-words px-2 py-3 align-top text-muted-foreground @2xl:table-cell">{row.asset_code || "—"}</td>
            <td className="hidden break-words px-2 py-3 align-top @7xl:table-cell">
              {row.asset_type || "—"}
              <span className="block text-2xs text-muted-foreground">{row.model || "—"}</span>
            </td>
            <td className="hidden px-2 py-3 align-top @5xl:table-cell">
              <span className="inline-block max-w-full break-words rounded-pill border border-border bg-card px-2 py-1 text-2xs text-muted-foreground">{row.category_name || "—"}</span>
            </td>
            <td className="hidden break-words px-2 py-3 align-top @4xl:table-cell">{row.location_name || "—"}</td>
            <td className="whitespace-nowrap px-2 py-3 align-top">
              {ASSET_STATUSES.includes(row.status as AssetStatus) ? (
                <StatusBadge status={row.status as AssetStatus} />
              ) : (
                <span className="whitespace-normal break-words text-muted-foreground">{row.status || "—"}</span>
              )}
              <span className="mt-2 block whitespace-normal @3xl:hidden">
                <span className="sr-only">Condition: </span>
                {ASSET_CONDITIONS.includes(row.condition as AssetCondition) ? (
                  <ConditionBadge condition={row.condition as AssetCondition} />
                ) : (
                  <span className="break-words text-muted-foreground">{row.condition || "—"}</span>
                )}
              </span>
            </td>
            <td className="hidden px-2 py-3 align-top @3xl:table-cell">
              {ASSET_CONDITIONS.includes(row.condition as AssetCondition) ? (
                <ConditionBadge condition={row.condition as AssetCondition} />
              ) : (
                <span className="break-words text-muted-foreground">{row.condition || "—"}</span>
              )}
            </td>
            <td className="hidden break-words px-2 py-3 align-top @6xl:table-cell">{row.custody ? row.custody.name || "Unnamed custodian" : "Unassigned"}</td>
            <td className="hidden px-2 py-3 align-top text-muted-foreground @6xl:table-cell">
              <UpdatedAt value={row.updated_at} />
            </td>
            <td className="hidden px-2 py-3 align-top @5xl:table-cell">
              <div className="flex items-center">
                <UnavailableAction
                  label={`View ${row.name || "asset"}`}
                  icon={EyeIcon}
                  className="border-transparent bg-transparent"
                />
                <UnavailableAction
                  label={`Edit ${row.name || "asset"}`}
                  icon={EditIcon}
                  className="border-transparent bg-transparent"
                />
                <UnavailableAction
                  label={`More actions for ${row.name || "asset"}`}
                  icon={MoreIcon}
                  className="border-transparent bg-transparent"
                />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
