import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { CompositionLibraryItem } from "../types";
import type { SortKey } from "../list-url-state";
import { statusBadge } from "../status-display";
import { CompositionLibraryPreview } from "./CompositionLibraryPreview";

function formatDate(value?: string) {
  return value ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
}

function SortHeader({ label, sortKey, sort, onSort }: { label: string; sortKey: SortKey; sort: { key: SortKey; dir: "asc" | "desc" }; onSort: (key: SortKey) => void }) {
  return <th className="py-2"><button type="button" onClick={() => onSort(sortKey)}>{label}{sort.key === sortKey ? ` ${sort.dir === "asc" ? "▲" : "▼"}` : ""}</button></th>;
}

export function CompositionsTable({ rows, sort, onSort }: { rows: CompositionLibraryItem[]; sort: { key: SortKey; dir: "asc" | "desc" }; onSort: (key: SortKey) => void }) {
  return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-zinc-100 text-xs text-zinc-500 dark:border-zinc-800"><th className="py-2 pl-1">Preview</th><SortHeader label="Layout" sortKey="name" sort={sort} onSort={onSort}/><th className="py-2">Geometry</th><th className="py-2">Content</th><th className="py-2">Reference</th><SortHeader label="Status" sortKey="status" sort={sort} onSort={onSort}/><SortHeader label="Used in Publications" sortKey="usage" sort={sort} onSort={onSort}/><SortHeader label="Last modified" sortKey="updated" sort={sort} onSort={onSort}/><th className="py-2 pr-1 text-right">Actions</th></tr></thead><tbody>{rows.map((item) => { const badge = statusBadge(item.status); return <tr key={item.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"><td className="py-3 pl-1"><CompositionLibraryPreview zones={item.previewZones} /></td><td className="py-3 font-medium"><p>{item.name}</p><p className="text-xs font-normal text-zinc-500">{item.folderId ? "In folder" : "Uncategorized"}</p></td><td className="py-3">{item.layoutKind === "inline" ? "Custom" : "Template-based"}</td><td className="py-3">{item.bound_count}/{item.zone_count}</td><td className="py-3">{item.referenceResolution ?? "—"}</td><td className="py-3"><Badge color={badge.color} variant="pill">{badge.label}</Badge></td><td className="py-3">{item.usageCount ?? "—"}</td><td className="py-3 text-zinc-500">{formatDate(item.updated_at ?? item.created_at)}</td><td className="py-3 pr-1 text-right"><Link href={`/media-workspace/layouts/${item.id}`} className="text-indigo-600 hover:underline">Edit</Link></td></tr>; })}</tbody></table></div>;
}
