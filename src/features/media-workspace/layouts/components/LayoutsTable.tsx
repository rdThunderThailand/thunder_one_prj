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
      <table className="w-full text-left text-[10px]">
        <thead>
          <tr className="border-b border-border text-[9px] font-semibold text-muted-foreground">
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
                className="border-b border-border last:border-0 hover:bg-muted"
              >
                <td className="py-3 pl-1">
                  <LayoutWireframe
                    zones={layout.zones}
                    background={layout.background}
                    aspectRatio={layout.aspect_ratio}
                    className="h-10 w-16 rounded border border-border"
                  />
                </td>
                <td className="py-3 text-[10px] font-semibold text-foreground">{layout.name}</td>
                <td className="py-3 text-[10px] text-muted-foreground">{layout.aspect_ratio}</td>
                <td className="py-3 text-[10px] text-muted-foreground">{layout.zone_count}</td>
                <td className="py-3">
                  <Badge color={badge.color} variant="pill">
                    {badge.label}
                  </Badge>
                </td>
                <td className="py-3 text-[10px] text-muted-foreground">
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
        className="inline-flex items-center gap-1 hover:text-foreground"
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
    "block w-full px-3 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted";

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
        className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <MoreIcon />
      </summary>
      <div className="absolute right-0 z-10 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg">
        <button type="button" className={item} onClick={() => onAction("edit")}>
          Edit
        </button>
        <button type="button" className={item} disabled={disabled} onClick={() => onAction("duplicate")}>
          Duplicate
        </button>
        {status === "active" ? (
          <button
            type="button"
            className={`${item} text-danger hover:bg-danger-soft`}
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
