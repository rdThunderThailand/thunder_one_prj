"use client";

import { Button } from "@/components/ui/Button";
import { GridIcon, ListIcon, SearchIcon } from "@/components/ui/icons";
import { COMPOSITION_STATUSES } from "../types";
import type { ListFilters } from "../list-url-state";

const selectClasses = "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900";
const viewButtonClasses = (active: boolean) =>
  `rounded-lg border p-2 ${active ? "border-indigo-200 bg-indigo-50 text-indigo-600" : "border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"}`;

export function CompositionsFilters({ value, referenceResolutions, isGrid, onChange, onClearAll, onViewChange }: {
  value: ListFilters;
  referenceResolutions: string[];
  isGrid: boolean;
  onChange: (next: ListFilters) => void;
  onClearAll?: () => void;
  onViewChange: (next: boolean) => void;
}) {
  return <div className="mb-4 flex flex-wrap items-center gap-3">
    <label className="relative min-w-56 flex-1">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <input value={value.query} onChange={(event) => onChange({ ...value, query: event.target.value })} placeholder="Search layouts..." className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900" />
    </label>
    <select aria-label="Status" value={value.status} onChange={(event) => onChange({ ...value, status: event.target.value as ListFilters["status"] })} className={selectClasses}>
      <option value="all">All Status</option>
      {COMPOSITION_STATUSES.map((status) => <option key={status} value={status}>{status[0].toUpperCase()}{status.slice(1)}</option>)}
    </select>
    <button type="button" aria-label="Grid view" aria-pressed={isGrid} onClick={() => onViewChange(true)} className={viewButtonClasses(isGrid)}><GridIcon /></button>
    <button type="button" aria-label="List view" aria-pressed={!isGrid} onClick={() => onViewChange(false)} className={viewButtonClasses(!isGrid)}><ListIcon /></button>
    <details className="relative">
      <summary className="cursor-pointer list-none rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">More filters</summary>
      <div className="absolute right-0 z-20 mt-2 grid w-56 gap-2 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
        <select aria-label="Content readiness" value={value.content} onChange={(event) => onChange({ ...value, content: event.target.value as ListFilters["content"] })} className={selectClasses}><option value="all">All content</option><option value="complete">Complete</option><option value="incomplete">Needs content</option></select>
        <select aria-label="Publication usage" value={value.usage} onChange={(event) => onChange({ ...value, usage: event.target.value as ListFilters["usage"] })} className={selectClasses}><option value="all">All usage</option><option value="used">Used</option><option value="unused">Unused</option></select>
        <select aria-label="Reference resolution" value={value.referenceResolution} onChange={(event) => onChange({ ...value, referenceResolution: event.target.value })} className={selectClasses}><option value="">All reference resolutions</option>{referenceResolutions.map((resolution) => <option key={resolution} value={resolution}>{resolution}</option>)}</select>
      </div>
    </details>
    {onClearAll && <Button variant="ghost" onClick={onClearAll}>Clear all</Button>}
  </div>;
}
