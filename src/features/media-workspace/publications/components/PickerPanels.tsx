import type { ReactNode } from "react";
import { ChevronRightIcon } from "@/components/ui/icons";

export function PickerFilterChoice({ checked, label, marker, onClick }: { checked: boolean; label: string; marker?: ReactNode; onClick: () => void }) {
  return <button type="button" role="radio" aria-checked={checked} onClick={onClick} className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-xs text-zinc-600 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><span className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded border text-[9px] ${checked ? "border-indigo-600 bg-indigo-600 text-white" : "border-zinc-300 bg-white"}`}>{checked ? "✓" : ""}</span>{marker}{label}</button>;
}

export function PickerFilterPanel({ onClear, children }: { onClear: () => void; children: ReactNode }) {
  return <aside className="overflow-y-auto border-r border-zinc-200 px-3 py-4"><div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Filters</p><button type="button" onClick={onClear} className="text-[10px] font-semibold uppercase tracking-wide text-indigo-600 hover:text-indigo-500">Clear all</button></div>{children}</aside>;
}

export function PickerFilterSection({ label, children, divided = false }: { label: string; children: ReactNode; divided?: boolean }) {
  return <div className={divided ? "mt-3 border-t border-zinc-200 pt-3" : ""}><p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>{children}</div>;
}

export type PickerDetailField = { icon: ReactNode; label: string; value: ReactNode };

export function PickerDetailPanel({ preview, fields, tags, description, detailLabel, expanded, onToggle, children }: { preview: ReactNode; fields: PickerDetailField[]; tags: { id: string; name: string }[]; description: string; detailLabel: string; expanded: boolean; onToggle: () => void; children: ReactNode }) {
  return <div className="space-y-4 p-4">
    {preview}
    <section><p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Details</p><dl className="space-y-2.5 text-xs">{fields.map(({ icon, label, value }) => <div key={label} className="grid grid-cols-[1rem_5rem_minmax(0,1fr)] items-start gap-2"><span className="text-indigo-500">{icon}</span><dt className="font-medium text-zinc-600">{label}</dt><dd className="break-words text-right text-zinc-800">{value}</dd></div>)}</dl></section>
    <section><p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Tags</p><div className="flex flex-wrap gap-1.5">{tags.length ? tags.map((tag) => <span key={tag.id} className="rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-medium text-indigo-700">{tag.name}</span>) : <span className="text-xs text-zinc-400">—</span>}</div></section>
    <section><p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Description</p><p className="text-xs leading-5 text-zinc-600">{description}</p></section>
    <section><button type="button" aria-expanded={expanded} onClick={onToggle} className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><span>{detailLabel}</span><ChevronRightIcon className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`} /></button>{expanded && children}</section>
  </div>;
}
