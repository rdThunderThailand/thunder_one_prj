import { Checkbox } from "@/components/ui/lovable/checkbox";
import { BoxIcon, EditIcon, EyeIcon, MoreIcon } from "@/components/ui/icons";
import { ASSET_STATUSES, type AssetStatus } from "../../domain/asset-status";
import { ASSET_CONDITIONS, type AssetCondition } from "../../domain/asset-condition";
import type { AssetListRow } from "../../services/assets-list-types";
import { ConditionBadge, StatusBadge } from "../StatusBadges";
import { UnavailableAction } from "./AssetsListToolbar";

interface AssetsTableProps {
  rows: AssetListRow[]; selected: Set<string>; pending: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
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

export function AssetsTable({ rows, selected, onSelect, onSelectAll, pending }: AssetsTableProps) {
  const count = rows.filter((row) => selected.has(row.id)).length;
  const cell = "border-b border-border px-2 py-2 align-top";

  return (
    <table className="w-full min-w-[76rem] table-fixed border-separate border-spacing-0 text-left text-xs">
      <caption className="sr-only">Assets in this organization. Updated times use Asia/Bangkok.</caption>
      <colgroup>
        <col className="w-9" />
        <col className="w-44 @4xl:w-56" />
        <col className="w-32" />
        <col className="w-33" />
        <col className="w-28" />
        <col className="w-28" />
        <col className="w-26" />
        <col className="w-22" />
        <col className="w-28" />
        <col className="w-28" />
        <col className="w-26" />
      </colgroup>
      <thead className="sticky top-0 z-20 bg-muted text-2xs text-muted-foreground [&_th]:h-10 [&_th]:border-y [&_th]:border-border [&_th]:px-2 [&_th]:font-medium">
        <tr>
          <th scope="col">
            <Checkbox aria-label="Select all assets on this page" disabled={pending || !rows.length}
              checked={count === 0 ? false : count === rows.length ? true : "indeterminate"}
              onCheckedChange={(checked) => onSelectAll(checked === true)} />
          </th>
          <th scope="col" className="sticky left-0 z-30 transform-gpu bg-muted">Asset</th>
          <th scope="col">Asset Tag</th>
          <th scope="col">Serial Number</th>
          <th scope="col">Category</th>
          <th scope="col">Location</th>
          <th scope="col">Status</th>
          <th scope="col">Condition</th>
          <th scope="col">Assignee</th>
          <th scope="col">Last Updated</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} data-selected={selected.has(row.id)} className={`group h-12 ${selected.has(row.id) ? "bg-info-muted" : "hover:bg-muted"}`}>
            <td className={cell}>
              <Checkbox aria-label={`Select ${row.name || "unnamed asset"}`} disabled={pending} checked={selected.has(row.id)} onCheckedChange={(checked) => onSelect(row.id, checked === true)} />
            </td>
            {/* Composite the pinned background with its text to prevent scroll paint-through. */}
            <td className={`${cell} sticky left-0 z-10 transform-gpu bg-card group-hover:bg-muted group-data-[selected=true]:bg-info-muted`}>
              <div className="flex items-start gap-2">
                <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-control bg-muted text-muted-foreground">
                  <BoxIcon className="size-5" />
                </span>
                <div className="min-w-0 break-words">
                  <span className="font-semibold text-foreground">{row.name || "Unnamed asset"}</span>
                </div>
              </div>
            </td>
            <td className={`${cell} break-words text-muted-foreground`}>{row.asset_code || "—"}</td>
            <td className={`${cell} break-words`}>{row.serial_number || "—"}</td>
            <td className={cell}>
              <span className="inline-block max-w-full break-words rounded-pill border border-border bg-card px-2 py-1 text-2xs text-muted-foreground">
                {row.category_name || "Uncategorized"}
              </span>
            </td>
            <td className={`${cell} break-words`}>{row.location_name || "—"}</td>
            <td className={cell}>
              {ASSET_STATUSES.includes(row.status as AssetStatus) ? (
                <StatusBadge status={row.status as AssetStatus} />
              ) : (
                <span className="break-words text-muted-foreground">{row.status || "—"}</span>
              )}
            </td>
            <td className={cell}>
              {ASSET_CONDITIONS.includes(row.condition as AssetCondition) ? (
                <ConditionBadge condition={row.condition as AssetCondition} />
              ) : (
                <span className="break-words text-muted-foreground">{row.condition || "—"}</span>
              )}
            </td>
            <td className={`${cell} break-words`}>{row.custody ? row.custody.name || "Unnamed custodian" : "Unassigned"}</td>
            <td className={`${cell} text-muted-foreground`}>
              <UpdatedAt value={row.updated_at} />
            </td>
            <td className={cell}>
              <div className="flex items-center">
                <UnavailableAction label={`View ${row.name || "asset"}`} icon={EyeIcon} className="border-transparent bg-transparent" />
                <UnavailableAction label={`Edit ${row.name || "asset"}`} icon={EditIcon} className="border-transparent bg-transparent" />
                <UnavailableAction label={`More actions for ${row.name || "asset"}`} icon={MoreIcon} className="border-transparent bg-transparent" />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
