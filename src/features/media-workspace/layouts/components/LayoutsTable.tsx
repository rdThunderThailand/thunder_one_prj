"use client";

import { Badge } from "@/components/ui/Badge";
import { MoreIcon } from "@/components/ui/icons";
import type { Sort, SortKey } from "../list-filtering";
import { statusBadge } from "../status-display";
import type { LayoutListItem } from "../types";
import { LayoutWireframe } from "./LayoutWireframe";

/** "14 May 2025 10:30" — the list is client-rendered after its fetch, so the browser's
 *  own formatting never has server HTML to mismatch against. */
function formatUpdatedAt(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })} ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

export type RowAction = "edit" | "duplicate" | "archive" | "restore";

export function LayoutsTable({
  rows,
  busyId,
  sort,
  onAction,
  onSortChange,
}: {
  rows: LayoutListItem[];
  busyId: string | null;
  sort: Sort;
  onAction: (action: RowAction, layout: LayoutListItem) => void;
  onSortChange: (key: SortKey) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-100 text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th className="py-2 pl-1">Preview</th>
            <SortHeader label="Layout Name" sortKey="name" sort={sort} onSortChange={onSortChange} className="py-2" />
            <SortHeader label="Aspect ratio" sortKey="aspectRatio" sort={sort} onSortChange={onSortChange} className="py-2" />
            <SortHeader label="Zones" sortKey="zones" sort={sort} onSortChange={onSortChange} className="py-2" />
            <SortHeader label="Status" sortKey="status" sort={sort} onSortChange={onSortChange} className="py-2" />
            <SortHeader label="Last Updated" sortKey="updated" sort={sort} onSortChange={onSortChange} className="py-2" />
            <th className="py-2 pr-1 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((layout) => {
            const badge = statusBadge(layout.status);
            return (
              <tr
                key={layout.id}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <td className="py-3 pl-1">
                  <LayoutWireframe
                    zones={layout.zones}
                    background={layout.background}
                    aspectRatio={layout.aspect_ratio}
                    className="h-10 w-16 rounded border border-zinc-200 dark:border-zinc-700"
                  />
                </td>
                <td className="py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">{layout.name}</td>
                <td className="py-3 text-sm text-zinc-600 dark:text-zinc-300">{layout.aspect_ratio}</td>
                <td className="py-3 text-sm text-zinc-600 dark:text-zinc-300">{layout.zone_count}</td>
                <td className="py-3">
                  <Badge color={badge.color} variant="pill">
                    {badge.label}
                  </Badge>
                </td>
                <td className="py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatUpdatedAt(layout.updated_at ?? layout.created_at)}
                </td>
                <td className="py-3 pr-1 text-right">
                  <RowActions
                    status={layout.status}
                    disabled={busyId === layout.id}
                    onAction={(action) => onAction(action, layout)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SortHeader({
  label,
  sortKey,
  sort,
  onSortChange,
  className,
}: {
  label: string;
  sortKey: SortKey;
  sort: Sort;
  onSortChange: (key: SortKey) => void;
  className?: string;
}) {
  const active = sort.key === sortKey;
  return (
    <th className={className} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onSortChange(sortKey)}
        className="inline-flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-200"
      >
        {label}
        {active && <span aria-hidden="true">{sort.dir === "asc" ? "▲" : "▼"}</span>}
      </button>
    </th>
  );
}

// ponytail: native <details> menu — no outside-click dismiss, no positioning library.
// Swap to the popover API if the open menu ever gets in the way.
function RowActions({
  status,
  disabled,
  onAction,
}: {
  status: LayoutListItem["status"];
  disabled: boolean;
  onAction: (action: RowAction) => void;
}) {
  const item =
    "block w-full px-3 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800";

  return (
    <details
      className="relative inline-block text-left"
      onClick={(e) => e.stopPropagation()}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          e.currentTarget.removeAttribute("open");
        }
      }}
    >
      <summary
        aria-label="Actions"
        className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
      >
        <MoreIcon />
      </summary>
      <div className="absolute right-0 z-10 mt-1 w-40 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
        <button type="button" className={item} onClick={() => onAction("edit")}>
          Edit
        </button>
        <button type="button" className={item} disabled={disabled} onClick={() => onAction("duplicate")}>
          Duplicate
        </button>
        {status === "active" ? (
          <button
            type="button"
            className={`${item} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10`}
            disabled={disabled}
            onClick={() => onAction("archive")}
          >
            Archive
          </button>
        ) : (
          <button type="button" className={item} disabled={disabled} onClick={() => onAction("restore")}>
            Restore
          </button>
        )}
      </div>
    </details>
  );
}
