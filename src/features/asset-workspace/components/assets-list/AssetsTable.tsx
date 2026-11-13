import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Checkbox } from "@/components/ui/lovable/checkbox";
import { EditIcon, EyeIcon } from "@/components/ui/icons";
import type { AssetListRow } from "../../services/assets-list-types";
import { AssetThumbnail } from "../AssetThumbnail";
import { AssetsConditionValue, AssetsStatusValue, AssetsUpdatedAt } from "./AssetsRowDetails";

const profileHref = (id: string) => `/asset-workspace/assets/${encodeURIComponent(id)}`;
const cell = "border-b border-border px-2 py-2 align-middle";

// Each data column: its header cell and body cell. Checkbox and actions stay first and last.
const COLUMNS: Record<string, { th: ReactNode; td: (row: AssetListRow) => ReactNode }> = {
  asset: {
    th: (
      <th
        scope="col"
        className="w-[22%] @min-[90rem]/assets-results:w-[28%]"
      >
        Asset
      </th>
    ),
    td: (row) => {
      const name = row.name || "Unnamed asset";
      return (
        <td className={cell}>
          <div className="flex min-w-0 items-center gap-2">
            <AssetThumbnail src={row.thumbnail_url} />
            <div className="min-w-0 flex-1">
              <Link
                href={profileHref(row.id)}
                title={name}
                className="block truncate rounded-xs font-semibold text-foreground hover:text-accent-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {name}
              </Link>
              <span
                className="block truncate text-2xs text-muted-foreground"
                title={row.serial_number || undefined}
              >
                {row.serial_number ? (
                  <>
                    <span className="sr-only">Serial Number: </span>SN {row.serial_number}
                  </>
                ) : (
                  "No serial number"
                )}
              </span>
            </div>
          </div>
        </td>
      );
    },
  },
  id: {
    th: (
      <th
        scope="col"
        className="w-24"
      >
        Asset ID
      </th>
    ),
    td: (row) => (
      <td className={`${cell} tabular-nums`}>
        <span
          className="block truncate font-medium text-foreground"
          title={row.asset_code || undefined}
        >
          {row.asset_code || "—"}
        </span>
      </td>
    ),
  },
  category: {
    th: (
      <th
        scope="col"
        className="w-28"
      >
        Category
      </th>
    ),
    td: (row) => (
      <td className={cell}>
        <span
          title={row.category_name || undefined}
          className="inline-block max-w-full truncate rounded-pill border border-border bg-card px-2 py-0.5 text-2xs text-muted-foreground"
        >
          {row.category_name || "Uncategorized"}
        </span>
      </td>
    ),
  },
  location: {
    th: <th scope="col">Location</th>,
    td: (row) => (
      <td className={cell}>
        <span
          className="block truncate"
          title={row.location_name || undefined}
        >
          {row.location_name || "—"}
        </span>
      </td>
    ),
  },
  status: {
    th: (
      <th
        scope="col"
        className="w-28"
      >
        Status
      </th>
    ),
    td: (row) => (
      <td className={cell}>
        <AssetsStatusValue value={row.status} />
      </td>
    ),
  },
  condition: {
    th: (
      <th
        scope="col"
        className="w-20"
      >
        Condition
      </th>
    ),
    td: (row) => (
      <td className={cell}>
        <AssetsConditionValue value={row.condition} />
      </td>
    ),
  },
  registered: {
    th: (
      <th
        scope="col"
        className="w-24"
      >
        Registered Date
      </th>
    ),
    td: (row) => (
      <td className={`${cell} tabular-nums text-muted-foreground`}>
        <AssetsUpdatedAt value={row.created_at} />
      </td>
    ),
  },
  assignee: {
    th: <th scope="col">Assignee</th>,
    td: (row) => (
      <td className={cell}>
        <span
          className={`block truncate ${row.custody ? "" : "text-muted-foreground"}`}
          title={row.custody?.name || undefined}
        >
          {row.custody ? row.custody.name || "Unnamed custodian" : "Unassigned"}
        </span>
      </td>
    ),
  },
  updated: {
    th: (
      <th
        scope="col"
        className="w-24"
      >
        Last Updated
      </th>
    ),
    td: (row) => (
      <td className={`${cell} tabular-nums text-muted-foreground`}>
        <AssetsUpdatedAt value={row.updated_at} />
      </td>
    ),
  },
};

const ASSETS_ORDER = ["asset", "id", "category", "location", "status", "condition", "assignee", "updated"];
// Location Detail Assets tab (05 §4.8), Figma order. Room / Area has no field yet, so Location sits in its place.
const LOCATION_ORDER = ["id", "asset", "category", "status", "condition", "location", "registered", "assignee", "updated"];

export interface AssetsTableProps {
  rows: AssetListRow[]; selected: Set<string>; pending: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  /** Location Detail Assets tab: Figma column order plus Registered Date. */
  locationLayout?: boolean;
}

/**
 * Every column, always (PO Assets table). Callers switch to `AssetsCompactList` when the results are too narrow
 * (64rem on the Assets page), so nothing hides behind a per-row disclosure.
 */
export function AssetsTable({ rows, selected, onSelect, onSelectAll, pending, locationLayout = false }: AssetsTableProps) {
  const count = rows.filter((row) => selected.has(row.id)).length;
  const columns = (locationLayout ? LOCATION_ORDER : ASSETS_ORDER).map((key) => ({ key, ...COLUMNS[key] }));

  return (
    <table className="w-full table-fixed border-separate border-spacing-0 text-left text-xs leading-snug">
      <caption className="sr-only">Assets in this organization. Updated times use Asia/Bangkok.</caption>
      <thead className="sticky top-0 z-20 bg-muted text-2xs text-muted-foreground [&_th]:h-10 [&_th]:border-y [&_th]:border-border [&_th]:px-2 [&_th]:font-medium">
        <tr>
          <th
            scope="col"
            className="w-9"
          >
            <Checkbox
              className="rounded-xs"
              aria-label="Select all assets on this page"
              disabled={pending || !rows.length}
              checked={count === 0 ? false : count === rows.length ? true : "indeterminate"}
              onCheckedChange={(checked) => onSelectAll(checked === true)}
            />
          </th>
          {columns.map((column) => (
            <Fragment key={column.key}>{column.th}</Fragment>
          ))}
          <th
            scope="col"
            className="w-18 text-center"
          >
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const name = row.name || "Unnamed asset";
          return (
            <tr
              key={row.id}
              data-selected={selected.has(row.id)}
              className={selected.has(row.id) ? "bg-accent" : "hover:bg-muted"}
            >
              <td className={cell}>
                <Checkbox
                  className="rounded-xs"
                  aria-label={`Select ${name}`}
                  disabled={pending}
                  checked={selected.has(row.id)}
                  onCheckedChange={(checked) => onSelect(row.id, checked === true)}
                />
              </td>
              {columns.map((column) => (
                <Fragment key={column.key}>{column.td(row)}</Fragment>
              ))}
              <td className={cell}>
                <div className="flex items-center justify-center gap-0.5">
                  <Button
                    asChild
                    variant="ghost"
                    size="icon-sm"
                  >
                    <Link
                      href={profileHref(row.id)}
                      aria-label={`View ${name}`}
                      title="View"
                    >
                      <EyeIcon
                        aria-hidden="true"
                        className="size-4"
                      />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    size="icon-sm"
                  >
                    <Link
                      href={`${profileHref(row.id)}/edit`}
                      aria-label={`Edit ${name}`}
                      title="Edit"
                    >
                      <EditIcon
                        aria-hidden="true"
                        className="size-4"
                      />
                    </Link>
                  </Button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
