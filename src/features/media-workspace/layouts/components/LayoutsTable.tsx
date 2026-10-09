"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/lovable/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/lovable/dropdown-menu";
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
const badgeVariant = (color: string) => color === "green" ? "success" : "neutral";

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
          <tr className="border-b border-border text-[9px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
            <SortHeader label="Template" sortKey="name" sort={sort} onSortChange={onSortChange} className="px-3 py-2" />
            <SortHeader label="Zones" sortKey="zones" sort={sort} onSortChange={onSortChange} className="px-3 py-2" />
            <SortHeader label="Resolution" sortKey="aspectRatio" sort={sort} onSortChange={onSortChange} className="px-3 py-2" />
            <SortHeader label="Last Modified" sortKey="updated" sort={sort} onSortChange={onSortChange} className="px-3 py-2" />
            <SortHeader label="Status" sortKey="status" sort={sort} onSortChange={onSortChange} className="px-3 py-2" />
            <th className="px-3 py-2 text-right">Actions</th>
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
                <td className="px-3 py-2.5">
                  <Link href={`/media-workspace/layouts/templates/${layout.id}`} className="flex items-center gap-3">
                    <LayoutWireframe zones={layout.zones} background={layout.background} aspectRatio={layout.aspect_ratio} programStyle className="h-11 w-16 rounded border border-border" />
                    <span className="truncate text-[11px] font-semibold text-foreground">{layout.name}</span>
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-[10px]">{layout.zone_count} Zone{layout.zone_count === 1 ? "" : "s"}</td>
                <td className="px-3 py-2.5 text-[10px]">{layout.reference_resolution ?? layout.aspect_ratio}</td>
                <td className="px-3 py-2.5">
                  {layout.created_by?.display_name && <p className="text-[10px] font-semibold">{layout.created_by.display_name}</p>}
                  <p className="text-[9px] text-muted-foreground">{formatUpdatedAt(layout.updated_at ?? layout.created_at)}</p>
                </td>
                <td className="px-3 py-2.5"><Badge variant={badgeVariant(badge.color)} className="rounded-full px-2 py-0 text-[9px]">{badge.label}</Badge></td>
                <td className="px-3 py-2.5 text-right">
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

export function LayoutsGrid({ rows, busyId, onAction }: { rows: LayoutListItem[]; busyId: string | null; onAction: (action: RowAction, layout: LayoutListItem) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {rows.map((layout) => {
        const badge = statusBadge(layout.status);
        return (
          <article key={layout.id} className="group overflow-hidden rounded-lg border border-border bg-card transition hover:border-foreground/20 hover:shadow-float">
            <div className="relative aspect-video bg-layout-canvas">
              <LayoutWireframe zones={layout.zones} background={layout.background} aspectRatio={layout.aspect_ratio} programStyle className="h-full w-full" />
              <div className="absolute right-2 top-2 rounded-lg bg-card opacity-0 shadow-float group-hover:opacity-100">
                <RowActions status={layout.status} disabled={busyId === layout.id} onAction={(action) => onAction(action, layout)} />
              </div>
            </div>
            <div className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/media-workspace/layouts/templates/${layout.id}`} className="block truncate text-[11px] font-bold hover:text-primary">
                    {layout.name}
                  </Link>
                  <p className="mt-1 text-[8px] text-muted-foreground">
                    {layout.zone_count} Zones · {layout.reference_resolution ?? layout.aspect_ratio}
                  </p>
                </div>
                <Badge variant={badgeVariant(badge.color)} className="rounded-full px-2 py-0 text-[9px]">
                  {badge.label}
                </Badge>
              </div>
              <p className="mt-2 text-[8px] text-muted-foreground">
                Updated {formatUpdatedAt(layout.updated_at ?? layout.created_at)}
              </p>
            </div>
          </article>
        );
      })}
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
        className="inline-flex items-center gap-1 uppercase hover:text-foreground"
      >
        {label}
        {active && <span aria-hidden="true">{sort.dir === "asc" ? "▲" : "▼"}</span>}
      </button>
    </th>
  );
}

// QA 2026-10-08 #10: portalled menu (replaces the native <details> one), so the table's overflow
// cannot clip it. The span keeps clicks — React bubbles them out of the portal — off the row.
function RowActions({
  status,
  disabled,
  onAction,
}: {
  status: LayoutListItem["status"];
  disabled: boolean;
  onAction: (action: RowAction) => void;
}) {
  return (
    <span onClick={(event) => event.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Actions"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <MoreIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-40"
        >
          <DropdownMenuItem onSelect={() => onAction("edit")}>Edit</DropdownMenuItem>
          <DropdownMenuItem disabled={disabled} onSelect={() => onAction("duplicate")}>
            Duplicate
          </DropdownMenuItem>
          {status === "active" ? (
            <DropdownMenuItem
              className="text-danger focus:text-danger"
              disabled={disabled}
              onSelect={() => onAction("archive")}
            >
              Archive
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled={disabled} onSelect={() => onAction("restore")}>
              Restore
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  );
}
