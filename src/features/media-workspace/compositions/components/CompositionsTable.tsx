import { useMemo } from "react";
import Link from "next/link";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { Badge } from "@/components/ui/Badge";
import { Checkbox } from "@/components/ui/lovable/checkbox";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { EditIcon, MoreIcon, PlayIcon, TrashIcon, UndoIcon } from "@/components/ui/icons";
import { actionsForComposition, type CompositionLibraryAction } from "../library-actions";
import type { CompositionLibraryItem } from "../types";
import type { SortKey } from "../list-url-state";
import { statusBadge } from "../status-display";
import { CompositionLibraryPreview } from "./CompositionLibraryPreview";

// One signing call for every zone thumbnail on the page, not one per row (ADR 0067).
function useRowPreviews(rows: CompositionLibraryItem[]) {
  const ids = useMemo(
    () => [
      ...new Set(
        rows.flatMap((item) =>
          item.previewZones?.flatMap((zone) => (zone.firstAssetId ? [zone.firstAssetId] : [])) ?? []
        )
      ),
    ],
    [rows]
  );
  return usePreviewUrls(ids);
}

function formatDate(value?: string) {
  return value
    ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "—";
}

function SortHeader({ label, sortKey, sort, onSort, className = "" }: {
  label: string;
  sortKey: SortKey;
  sort: { key: SortKey; dir: "asc" | "desc" };
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = sort.key === sortKey;
  return <th className={`${className} py-2`} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
    <button type="button" onClick={() => onSort(sortKey)}>{label}{active ? ` ${sort.dir === "asc" ? "▲" : "▼"}` : ""}</button>
  </th>;
}

const labels: Record<CompositionLibraryAction, string> = {
  duplicate: "Duplicate",
  activate: "Set active",
  deactivate: "Set inactive",
  move: "Move",
  trash: "Move to Trash",
  restore: "Restore",
  "delete-forever": "Delete forever",
};

function RowActions({ item, inTrash, disabled, previewing, onPreview, onAction }: {
  item: CompositionLibraryItem;
  inTrash: boolean;
  disabled: boolean;
  previewing: boolean;
  onPreview: (item: CompositionLibraryItem) => void;
  onAction: (action: CompositionLibraryAction, item: CompositionLibraryItem) => void;
}) {
  const actions = actionsForComposition(item, inTrash);
  if (inTrash) return <div className="flex justify-end gap-1">{actions.map((action) => (
    <button
      key={action}
      type="button"
      disabled={disabled}
      onClick={() => onAction(action, item)}
      aria-label={`${labels[action]} ${item.name}`}
      title={labels[action]}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-40 ${action === "delete-forever" ? "text-danger hover:bg-danger-soft" : "text-primary hover:bg-primary-soft"}`}
    >
      {action === "restore" ? <UndoIcon /> : <TrashIcon />}
    </button>
  ))}</div>;

  const itemClass = "block w-full px-3 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted disabled:opacity-50";
  return <div className="flex items-center justify-end gap-2">
    <button type="button" disabled={previewing} onClick={() => onPreview(item)} aria-label={`Preview ${item.name}`} title={previewing ? "Loading preview…" : "Preview"} className="flex h-8 w-8 items-center justify-center rounded-lg text-primary hover:bg-primary-soft disabled:cursor-wait disabled:text-primary"><PlayIcon /></button>
    <Link href={`/media-workspace/layouts/${item.id}`} aria-label={`Edit ${item.name}`} title="Edit" className="flex h-8 w-8 items-center justify-center rounded-lg text-primary hover:bg-primary-soft"><EditIcon /></Link>
    <details className="relative" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) event.currentTarget.removeAttribute("open"); }}>
      <summary
        aria-label={`More actions for ${item.name}`}
        role="button"
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          const details = event.currentTarget.parentElement as HTMLDetailsElement | null;
          if (details) details.open = !details.open;
        }}
        className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
      ><MoreIcon /></summary>
      <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg">
        {actions.map((action) => <button key={action} type="button" disabled={disabled} onClick={() => onAction(action, item)} className={`${itemClass} ${action === "trash" ? "text-danger" : ""}`}>{labels[action]}</button>)}
      </div>
    </details>
  </div>;
}

export function CompositionsTable({ rows, sort, inTrash, busyId, previewBusyId, onSort, onPreview, onAction, selectedIds, onSelectionChange }: {
  rows: CompositionLibraryItem[];
  sort: { key: SortKey; dir: "asc" | "desc" };
  inTrash: boolean;
  busyId: string | null;
  previewBusyId: string | null;
  onSort: (key: SortKey) => void;
  onPreview: (item: CompositionLibraryItem) => void;
  onAction: (action: CompositionLibraryAction, item: CompositionLibraryItem) => void;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
}) {
  const previews = useRowPreviews(rows);
  const isAllSelected = rows.length > 0 && rows.every((row) => selectedIds.has(row.id));
  return (
    <div>
      <table className="w-full table-fixed text-left text-[10px]">
        <thead>
          <tr className="border-b border-border text-[9px] font-semibold text-muted-foreground">
            <th className="w-8 py-2 pl-2">
              <Checkbox aria-label="Select all layouts on this page" checked={isAllSelected} onCheckedChange={(value) => onSelectionChange(value === true ? new Set(rows.map((row) => row.id)) : new Set())} />
            </th>
            <th className="w-[72px] py-2">Preview</th>
            <SortHeader label="Layout" sortKey="name" sort={sort} onSort={onSort} />
            <th className="w-[64px] py-2">Content</th>
            <th className="w-[130px] py-2">Resolution</th>
            <SortHeader className="w-[135px]" label="Status" sortKey="status" sort={sort} onSort={onSort} />
            <SortHeader className="w-[100px]" label="Used in" sortKey="usage" sort={sort} onSort={onSort} />
            <SortHeader label="Last modified" sortKey="updated" sort={sort} onSort={onSort} />
            <th className="w-[132px] py-2 pr-1 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => {
            const badge = statusBadge(item.status);
            return (
              <tr key={item.id} className="border-b border-border last:border-0">
                <td className="py-3 pl-2">
                  <Checkbox
                    aria-label={`Select ${item.name}`}
                    checked={selectedIds.has(item.id)}
                    onCheckedChange={(value) => {
                      const next = new Set(selectedIds);
                      if (value === true) next.add(item.id);
                      else next.delete(item.id);
                      onSelectionChange(next);
                    }}
                  />
                </td>
                <td className="py-3"><CompositionLibraryPreview zones={item.previewZones} previews={previews} /></td>
                <td className="truncate py-3 pr-2 font-medium">
                  <p className="truncate">{item.name}</p>
                  <p className="truncate text-[8px] font-normal text-muted-foreground">{item.folderId ? "In folder" : "Uncategorized"}</p>
                </td>
                <td className="py-3">{item.bound_count}/{item.zone_count}</td>
                <td className="py-3">{item.referenceResolution ?? "—"}</td>
                <td className="py-3"><Badge color={badge.color} variant="pill">{badge.label}</Badge></td>
                <td className="py-3">{item.usageCount ?? "—"}</td>
                <td className="py-3 text-muted-foreground">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar name={item.createdBy?.displayName ?? "Unknown"} src={item.createdBy?.avatarUrl} size={24} />
                    <span className="min-w-0">
                      <span className="block truncate text-muted-foreground">{item.createdBy?.displayName ?? "Unknown user"}</span>
                      <span className="block truncate text-[10px]">{formatDate(item.updated_at ?? item.created_at)}</span>
                    </span>
                  </div>
                </td>
                <td className="py-3 pr-1 text-right">
                  <RowActions item={item} inTrash={inTrash} disabled={busyId === item.id} previewing={previewBusyId === item.id} onPreview={onPreview} onAction={onAction} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function CompositionsGrid({ rows, inTrash, busyId, previewBusyId, onPreview, onAction }: {
  rows: CompositionLibraryItem[];
  inTrash: boolean;
  busyId: string | null;
  previewBusyId: string | null;
  onPreview: (item: CompositionLibraryItem) => void;
  onAction: (action: CompositionLibraryAction, item: CompositionLibraryItem) => void;
}) {
  const previews = useRowPreviews(rows);
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{rows.map((item) => {
    const badge = statusBadge(item.status);
    return <Card key={item.id} className="overflow-hidden p-4">
      <CompositionLibraryPreview zones={item.previewZones} previews={previews} />
      <div className="mt-3 space-y-2">
        <div className="min-w-0">
          <Link href={`/media-workspace/layouts/${item.id}`} className="block truncate text-[10px] font-semibold text-foreground hover:text-primary">{item.name}</Link>
          <p className="truncate text-[8px] text-muted-foreground">{item.folderId ? "In folder" : "Uncategorized"}</p>
        </div>
        <div className="flex items-center justify-between text-[8px] text-muted-foreground"><span>{item.bound_count}/{item.zone_count} content</span><span>{item.referenceResolution ?? "—"}</span></div>
        <div className="flex items-center justify-between"><Badge color={badge.color} variant="pill">{badge.label}</Badge><RowActions item={item} inTrash={inTrash} disabled={busyId === item.id} previewing={previewBusyId === item.id} onPreview={onPreview} onAction={onAction} /></div>
      </div>
    </Card>;
  })}</div>;
}
