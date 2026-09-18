"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/lovable/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { LibrarySearch } from "../../content-library/LibraryShell";
import { LibraryViewToggle } from "../../assets/components/LibraryToolbar";
import { COMPOSITION_STATUSES } from "../types";
import type { ListFilters } from "../list-url-state";

const triggerClass = "h-9 w-30 text-[10px] shadow-none";
// Radix Select cannot hold an empty-string value.
const ANY_RESOLUTION = "__any__";

function FilterSelect<T extends string>({ label, value, onChange, items }: { label: string; value: T; onChange: (next: T) => void; items: Array<{ value: T; label: string }> }) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as T)}>
      <SelectTrigger className={triggerClass} aria-label={label}><SelectValue /></SelectTrigger>
      <SelectContent>{items.map((item) => <SelectItem key={item.value} value={item.value} className="text-xs">{item.label}</SelectItem>)}</SelectContent>
    </Select>
  );
}

/** Lovable toolbar controls (search + inline selects) on this list's real filters. */
export function CompositionsFilters({ value, referenceResolutions, isGrid, onChange, onClearAll, onViewChange }: {
  value: ListFilters;
  referenceResolutions: string[];
  isGrid: boolean;
  onChange: (next: ListFilters) => void;
  onClearAll?: () => void;
  onViewChange: (next: boolean) => void;
}) {
  return (
    <>
      <LibrarySearch value={value.query} onChange={(query) => onChange({ ...value, query })} placeholder="Search layouts..." />
      <FilterSelect
        label="Status"
        value={value.status}
        onChange={(status) => onChange({ ...value, status })}
        items={[{ value: "all" as ListFilters["status"], label: "All Status" }, ...COMPOSITION_STATUSES.map((status) => ({ value: status as ListFilters["status"], label: `${status[0].toUpperCase()}${status.slice(1)}` }))]}
      />
      <FilterSelect label="Content readiness" value={value.content} onChange={(content) => onChange({ ...value, content })} items={[{ value: "all", label: "All content" }, { value: "complete", label: "Complete" }, { value: "incomplete", label: "Needs content" }]} />
      <FilterSelect label="Publication usage" value={value.usage} onChange={(usage) => onChange({ ...value, usage })} items={[{ value: "all", label: "All usage" }, { value: "used", label: "Used" }, { value: "unused", label: "Unused" }]} />
      <FilterSelect
        label="Reference resolution"
        value={value.referenceResolution || ANY_RESOLUTION}
        onChange={(next) => onChange({ ...value, referenceResolution: next === ANY_RESOLUTION ? "" : next })}
        items={[{ value: ANY_RESOLUTION, label: "All resolutions" }, ...referenceResolutions.map((resolution) => ({ value: resolution, label: resolution }))]}
      />
      {onClearAll && <Button variant="ghost" size="sm" onClick={onClearAll}><X className="h-3.5 w-3.5" />Clear all</Button>}
      <LibraryViewToggle isGrid={isGrid} onIsGrid={onViewChange} />
    </>
  );
}
