import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { EditIcon, MoreIcon, PlayIcon } from "@/components/ui/icons";
import { actionsForComposition, type CompositionLibraryAction } from "../library-actions";
import type { CompositionLibraryItem } from "../types";
import type { SortKey } from "../list-url-state";
import { statusBadge } from "../status-display";
import { CompositionLibraryPreview } from "./CompositionLibraryPreview";

function formatDate(value?: string) {
  return value
    ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "—";
}

function SortHeader({ label, sortKey, sort, onSort }: {
  label: string;
  sortKey: SortKey;
  sort: { key: SortKey; dir: "asc" | "desc" };
  onSort: (key: SortKey) => void;
}) {
  const active = sort.key === sortKey;
  return <th className="py-2" aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
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

function RowActions({ item, inTrash, disabled, onAction }: {
  item: CompositionLibraryItem;
  inTrash: boolean;
  disabled: boolean;
  onAction: (action: CompositionLibraryAction, item: CompositionLibraryItem) => void;
}) {
  const actions = actionsForComposition(item, inTrash);
  if (inTrash) return <div className="flex justify-end gap-2">{actions.map((action) =>
    <button key={action} type="button" disabled={disabled} onClick={() => onAction(action, item)} className={action === "delete-forever" ? "text-red-600 hover:underline" : "text-indigo-600 hover:underline"}>{labels[action]}</button>
  )}</div>;

  const itemClass = "block w-full px-3 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:text-zinc-200 dark:hover:bg-zinc-800";
  return <div className="flex items-center justify-end gap-2">
    <Link href={`/media-workspace/layouts/${item.id}?preview=1`} aria-label={`Preview ${item.name}`} title="Preview" className="flex h-8 w-8 items-center justify-center rounded-lg text-indigo-600 hover:bg-indigo-50"><PlayIcon /></Link>
    <Link href={`/media-workspace/layouts/${item.id}`} aria-label={`Edit ${item.name}`} title="Edit" className="flex h-8 w-8 items-center justify-center rounded-lg text-indigo-600 hover:bg-indigo-50"><EditIcon /></Link>
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
        className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
      ><MoreIcon /></summary>
      <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
        {actions.map((action) => <button key={action} type="button" disabled={disabled} onClick={() => onAction(action, item)} className={`${itemClass} ${action === "trash" ? "text-red-600 dark:text-red-400" : ""}`}>{labels[action]}</button>)}
      </div>
    </details>
  </div>;
}

export function CompositionsTable({ rows, sort, inTrash, busyId, onSort, onAction }: {
  rows: CompositionLibraryItem[];
  sort: { key: SortKey; dir: "asc" | "desc" };
  inTrash: boolean;
  busyId: string | null;
  onSort: (key: SortKey) => void;
  onAction: (action: CompositionLibraryAction, item: CompositionLibraryItem) => void;
}) {
  return <div><table className="w-full table-fixed text-left text-sm"><thead><tr className="border-b border-zinc-100 text-xs text-zinc-500 dark:border-zinc-800">
    <th className="w-[72px] py-2 pl-1">Preview</th><SortHeader label="Layout" sortKey="name" sort={sort} onSort={onSort}/><th className="w-[64px] py-2">Content</th><th className="w-[92px] py-2">Resolution</th><SortHeader label="Status" sortKey="status" sort={sort} onSort={onSort}/><SortHeader label="Used in" sortKey="usage" sort={sort} onSort={onSort}/><SortHeader label="Last modified" sortKey="updated" sort={sort} onSort={onSort}/><th className="w-[132px] py-2 pr-1 text-right">Actions</th>
  </tr></thead><tbody>{rows.map((item) => { const badge = statusBadge(item.status); return <tr key={item.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
    <td className="py-3 pl-1"><CompositionLibraryPreview zones={item.previewZones} /></td><td className="truncate py-3 pr-2 font-medium"><p className="truncate">{item.name}</p><p className="truncate text-xs font-normal text-zinc-500">{item.folderId ? "In folder" : "Uncategorized"}</p></td><td className="py-3">{item.bound_count}/{item.zone_count}</td><td className="py-3">{item.referenceResolution ?? "—"}</td><td className="py-3"><Badge color={badge.color} variant="pill">{badge.label}</Badge></td><td className="py-3">{item.usageCount ?? "—"}</td><td className="py-3 text-zinc-500"><div className="flex items-center gap-2"><Avatar name={item.createdBy?.displayName ?? "Unknown"} src={item.createdBy?.avatarUrl} size={24} /><span className="truncate">{formatDate(item.updated_at ?? item.created_at)}</span></div></td><td className="py-3 pr-1 text-right"><RowActions item={item} inTrash={inTrash} disabled={busyId === item.id} onAction={onAction} /></td>
  </tr>; })}</tbody></table></div>;
}

export function CompositionsGrid({ rows, inTrash, busyId, onAction }: {
  rows: CompositionLibraryItem[];
  inTrash: boolean;
  busyId: string | null;
  onAction: (action: CompositionLibraryAction, item: CompositionLibraryItem) => void;
}) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{rows.map((item) => {
    const badge = statusBadge(item.status);
    return <Card key={item.id} className="overflow-hidden p-4">
      <CompositionLibraryPreview zones={item.previewZones} />
      <div className="mt-3 space-y-2">
        <div className="min-w-0">
          <Link href={`/media-workspace/layouts/${item.id}`} className="block truncate text-sm font-semibold text-zinc-900 hover:text-indigo-600 dark:text-zinc-100">{item.name}</Link>
          <p className="truncate text-xs text-zinc-500">{item.folderId ? "In folder" : "Uncategorized"}</p>
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-500"><span>{item.bound_count}/{item.zone_count} content</span><span>{item.referenceResolution ?? "—"}</span></div>
        <div className="flex items-center justify-between"><Badge color={badge.color} variant="pill">{badge.label}</Badge><RowActions item={item} inTrash={inTrash} disabled={busyId === item.id} onAction={onAction} /></div>
      </div>
    </Card>;
  })}</div>;
}
