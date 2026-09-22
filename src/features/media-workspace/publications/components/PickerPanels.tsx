import type { ReactNode } from "react";
import { ChevronRightIcon } from "@/components/ui/icons";

export function PickerFilterChoice({ checked, label, marker, onClick }: { checked: boolean; label: string; marker?: ReactNode; onClick: () => void }) {
  return <button type="button" role="radio" aria-checked={checked} onClick={onClick} className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-xs text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"><span className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded border text-[9px] ${checked ? "border-primary bg-primary text-white" : "border-border bg-card"}`}>{checked ? "✓" : ""}</span>{marker}{label}</button>;
}

export function PickerFilterPanel({ onClear, children }: { onClear: () => void; children: ReactNode }) {
  return <aside className="overflow-y-auto border-r border-border px-3 py-4"><div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Filters</p><button type="button" onClick={onClear} className="text-[10px] font-semibold uppercase tracking-wide text-primary hover:text-primary">Clear all</button></div>{children}</aside>;
}

export function PickerFilterSection({ label, children, divided = false }: { label: string; children: ReactNode; divided?: boolean }) {
  return <div className={divided ? "mt-3 border-t border-border pt-3" : ""}><p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>{children}</div>;
}

export type PickerDetailField = { icon: ReactNode; label: string; value: ReactNode };

export function PickerDetailPanel({ preview, fields, tags, description, detailLabel, expanded, onToggle, children }: { preview: ReactNode; fields: PickerDetailField[]; tags: { id: string; name: string }[]; description: string; detailLabel: string; expanded: boolean; onToggle: () => void; children: ReactNode }) {
  return <div className="space-y-4 p-4">
    {preview}
    <section><p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Details</p><dl className="space-y-2.5 text-xs">{fields.map(({ icon, label, value }) => <div key={label} className="grid grid-cols-[1rem_5rem_minmax(0,1fr)] items-start gap-2"><span className="text-primary">{icon}</span><dt className="font-medium text-muted-foreground">{label}</dt><dd className="break-words text-right text-foreground">{value}</dd></div>)}</dl></section>
    <section><p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tags</p><div className="flex flex-wrap gap-1.5">{tags.length ? tags.map((tag) => <span key={tag.id} className="rounded-md bg-primary-soft px-2 py-1 text-[10px] font-medium text-primary">{tag.name}</span>) : <span className="text-xs text-muted-foreground">—</span>}</div></section>
    <section><p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Description</p><p className="text-xs leading-5 text-muted-foreground">{description}</p></section>
    <section><button type="button" aria-expanded={expanded} onClick={onToggle} className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"><span>{detailLabel}</span><ChevronRightIcon className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`} /></button>{expanded && children}</section>
  </div>;
}
