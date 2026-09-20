import { useMemo } from "react";
import Link from "next/link";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { Badge } from "@/components/ui/lovable/badge";
import { Checkbox } from "@/components/ui/lovable/checkbox";
import { EditIcon, MoreIcon, PlayIcon, TrashIcon, UndoIcon } from "@/components/ui/icons";
import { actionsForComposition, type CompositionLibraryAction } from "../library-actions";
import type { CompositionLibraryItem } from "../types";
import type { SortKey } from "../list-url-state";
import { statusBadge } from "../status-display";
import { CompositionLibraryPreview } from "./CompositionLibraryPreview";
import { LayoutWireframe } from "../../layouts/components/LayoutWireframe";
import { parseResolution } from "../../layouts/geometry";

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
const badgeVariant = (color: string) => color === "green" ? "success" : color === "yellow" ? "warning" : "neutral";

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

export function CompositionsTable({ rows, folders, sort, inTrash, busyId, previewBusyId, onSort, onPreview, onAction, selectedIds, onSelectionChange }: {
  rows: CompositionLibraryItem[];
  folders: Map<string, string>;
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
    <div className="overflow-x-auto">
      <table className="w-full min-w-220 text-left text-[10px]">
        <thead>
          <tr className="border-b border-border text-[9px] font-semibold text-muted-foreground">
            <th className="w-8 py-2 pl-2">
              <Checkbox aria-label="Select all layouts on this page" checked={isAllSelected} onCheckedChange={(value) => onSelectionChange(value === true ? new Set(rows.map((row) => row.id)) : new Set())} />
            </th>
            <SortHeader label="Layout" sortKey="name" sort={sort} onSort={onSort} />
            <th className="w-[80px] py-2">Zones</th>
            <th className="w-[130px] py-2">Resolution</th>
            <SortHeader label="Last modified" sortKey="updated" sort={sort} onSort={onSort} />
            <SortHeader className="w-[110px]" label="Status" sortKey="status" sort={sort} onSort={onSort} />
            <SortHeader className="w-[100px]" label="Used In" sortKey="usage" sort={sort} onSort={onSort} />
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
                <td className="py-3 pr-2 font-medium">
                  <div className="flex items-center gap-3">
                    <CompositionLibraryPreview zones={item.previewZones} previews={previews} />
                    <span className="min-w-0">
                      <span className="block truncate">{item.name}</span>
                      <span className="block truncate text-[8px] font-normal text-muted-foreground">/{item.folderId ? folders.get(item.folderId) ?? "Folder" : "Uncategorized"} · {item.bound_count}/{item.zone_count} content ready</span>
                    </span>
                  </div>
                </td>
                <td className="py-3">{item.zone_count} Zone{item.zone_count === 1 ? "" : "s"}</td>
                <td className="py-3">{item.referenceResolution ?? "—"}</td>
                <td className="py-3 text-muted-foreground">
                  <span className="block truncate">{item.createdBy?.displayName ?? "Unknown user"}</span>
                  <span className="block truncate text-[9px]">{formatDate(item.updated_at ?? item.created_at)}</span>
                </td>
                <td className="py-3"><Badge variant={badgeVariant(badge.color)} className="rounded-full px-2 py-0 text-[9px]">{badge.label}</Badge></td>
                <td className="py-3">{item.usageCount ? `${item.usageCount} Program${item.usageCount === 1 ? "" : "s"}` : "—"}</td>
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
    const resolution = item.referenceResolution ? parseResolution(item.referenceResolution) : null;
    const zones = (item.previewZones ?? []).map((zone) => ({ ...zone, id: String(zone.position), name: `Zone ${zone.position}` }));
    return <article key={item.id} className="group overflow-hidden rounded-lg border border-border bg-card transition hover:border-foreground/20 hover:shadow-float">
      <div className="relative aspect-video bg-layout-canvas">
        <CompositionLibraryPreview zones={item.previewZones} previews={previews} referenceResolution={item.referenceResolution} className="h-full w-full rounded-none" />
        <LayoutWireframe zones={zones} background="transparent" aspectRatio={resolution ? `${resolution[0]}:${resolution[1]}` : "16:9"} programStyle className="absolute inset-0 h-full w-full" />
        <div className="absolute right-2 top-2 rounded-lg bg-card opacity-0 shadow-float group-hover:opacity-100"><RowActions item={item} inTrash={inTrash} disabled={busyId === item.id} previewing={previewBusyId === item.id} onPreview={onPreview} onAction={onAction} /></div>
      </div>
      <div className="space-y-2 p-3">
        <div className="min-w-0">
          <Link href={`/media-workspace/layouts/${item.id}`} className="block truncate text-[10px] font-semibold text-foreground hover:text-primary">{item.name}</Link>
          <p className="mt-1 text-[8px] text-muted-foreground">{item.zone_count} Zones · {item.referenceResolution ?? "—"}</p>
        </div>
        <div className="flex items-center justify-between"><Badge variant={badgeVariant(badge.color)} className="rounded-full px-2 py-0 text-[9px]">{badge.label}</Badge><span className="text-[8px] text-muted-foreground">Updated {formatDate(item.updated_at ?? item.created_at)}</span></div>
      </div>
    </article>;
  })}</div>;
}
