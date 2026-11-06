import Link from "next/link";
import { Button } from "@/components/ui/lovable/button";
import { Checkbox } from "@/components/ui/lovable/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/lovable/dropdown-menu";
import { EyeIcon, MoreIcon } from "@/components/ui/icons";
import type { AssetListRow } from "../../services/assets-list-types";
import { AssetThumbnail } from "../AssetThumbnail";
import { AssetsConditionValue, AssetsRowDetails, AssetsStatusValue, AssetsUpdatedAt } from "./AssetsRowDetails";

const profileHref = (id: string) => `/asset-workspace/assets/${encodeURIComponent(id)}`;

export interface AssetsTableProps {
  rows: AssetListRow[]; selected: Set<string>; pending: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
}

export function AssetsTable({ rows, selected, onSelect, onSelectAll, pending }: AssetsTableProps) {
  const count = rows.filter((row) => selected.has(row.id)).length;
  const cell = "border-b border-border px-2 py-2 align-top";

  return (
    <table className="w-full table-fixed border-separate border-spacing-0 text-left text-xs leading-relaxed">
      <caption className="sr-only">Assets in this organization. Updated times use Asia/Bangkok.</caption>
      <thead className="sticky top-0 z-20 bg-muted text-2xs text-muted-foreground [&_th]:h-10 [&_th]:border-y [&_th]:border-border [&_th]:px-2 [&_th]:font-medium">
        <tr>
          <th scope="col" className="w-9">
            <Checkbox className="rounded-xs" aria-label="Select all assets on this page" disabled={pending || !rows.length}
              checked={count === 0 ? false : count === rows.length ? true : "indeterminate"}
              onCheckedChange={(checked) => onSelectAll(checked === true)} />
          </th>
          <th scope="col" className="w-1/4 @min-[90rem]/assets-results:w-1/5">Asset</th>
          <th scope="col" className="w-32 @min-[90rem]/assets-results:w-28">
            Asset Tag<span className="@min-[90rem]/assets-results:hidden"> / Serial</span>
          </th>
          <th scope="col" className="hidden w-36 @min-[90rem]/assets-results:table-cell">Serial Number</th>
          <th scope="col">Category</th>
          <th scope="col">Location</th>
          <th scope="col" className="w-32">Status</th>
          <th scope="col" className="hidden w-24 @min-5xl/assets-results:table-cell">Condition</th>
          <th scope="col" className="hidden @min-6xl/assets-results:table-cell">Assignee</th>
          <th scope="col" className="hidden w-28 @min-[90rem]/assets-results:table-cell">Last Updated</th>
          <th scope="col" className="w-12">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} data-selected={selected.has(row.id)} className={`group h-12 ${selected.has(row.id) ? "bg-accent" : "hover:bg-muted"}`}>
            <td className={cell}>
              <Checkbox className="rounded-xs" aria-label={`Select ${row.name || "unnamed asset"}`} disabled={pending} checked={selected.has(row.id)} onCheckedChange={(checked) => onSelect(row.id, checked === true)} />
            </td>
            <td className={cell}>
              <div className="flex items-start gap-2">
                <AssetThumbnail src={row.thumbnail_url} />
                <div className="relative min-w-0 flex-1 break-words">
                  <Link
                    href={profileHref(row.id)}
                    title={row.name || "Unnamed asset"}
                    className="block min-h-8 rounded-xs font-semibold text-foreground hover:text-accent-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring @max-[90rem]/assets-results:pr-16"
                  >
                    <span className="line-clamp-2">{row.name || "Unnamed asset"}</span>
                  </Link>
                  <AssetsRowDetails row={row} table />
                </div>
              </div>
            </td>
            <td className={`${cell} tabular-nums`}>
              <span className="block truncate font-medium text-foreground" title={row.asset_code || undefined}>
                {row.asset_code || "—"}
              </span>
              <span className="block truncate text-2xs text-muted-foreground @min-[90rem]/assets-results:hidden" title={row.serial_number || undefined}>
                <span className="sr-only">Serial Number: </span>
                {row.serial_number || "No serial number"}
              </span>
            </td>
            <td className={`${cell} hidden @min-[90rem]/assets-results:table-cell`}>
              <span className="block truncate" title={row.serial_number || undefined}>{row.serial_number || "—"}</span>
            </td>
            <td className={cell}>
              <span title={row.category_name || undefined} className="inline-block max-w-full truncate rounded-pill border border-border bg-card px-2 py-1 text-2xs text-muted-foreground">
                {row.category_name || "Uncategorized"}
              </span>
            </td>
            <td className={cell}>
              <span className="block truncate" title={row.location_name || undefined}>{row.location_name || "—"}</span>
            </td>
            <td className={cell}>
              <AssetsStatusValue value={row.status} />
            </td>
            <td className={`${cell} hidden @min-5xl/assets-results:table-cell`}>
              <AssetsConditionValue value={row.condition} />
            </td>
            <td className={`${cell} hidden @min-6xl/assets-results:table-cell`}>
              <span className="block truncate" title={row.custody?.name || undefined}>
                {row.custody ? row.custody.name || "Unnamed custodian" : "Unassigned"}
              </span>
            </td>
            <td className={`${cell} hidden text-muted-foreground @min-[90rem]/assets-results:table-cell`}>
              <AssetsUpdatedAt value={row.updated_at} />
            </td>
            <td className={cell}>
              {/* Row actions arrive with their backend PRs; the Asset Profile is the only one for now. */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${row.name || "asset"}`}>
                    <MoreIcon className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={profileHref(row.id)}>
                      <EyeIcon className="size-4" />
                      View profile
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
