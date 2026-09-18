"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/lovable/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { LibrarySearch } from "../../content-library/LibraryShell";
import type { ListFilters } from "../list-filtering";
import { LAYOUT_STATUSES, type LayoutStatus } from "../types";

const STATUS_OPTIONS: { value: LayoutStatus | "all"; label: string }[] = [
  { value: "all", label: "All Status" },
  ...LAYOUT_STATUSES.map((s) => ({ value: s, label: s === "active" ? "Active" : "Inactive" })),
];

/** Lovable toolbar controls on this list's real filters. */
export function LayoutsFilters({
  value,
  onChange,
  onClearAll,
}: {
  value: ListFilters;
  onChange: (next: ListFilters) => void;
  /** Omitted when the whole list state is already at its default, which is also exactly
   *  when the URL carries no query string — so the button appears only when it would do
   *  something. Resets sort and paging too, not just the filters shown here. */
  onClearAll?: () => void;
}) {
  return (
    <>
      <LibrarySearch value={value.query} onChange={(query) => onChange({ ...value, query })} placeholder="Search by template name..." />
      <Select value={value.status} onValueChange={(status) => onChange({ ...value, status: status as ListFilters["status"] })}>
        <SelectTrigger className="h-9 w-30 text-[10px] shadow-none" aria-label="Status"><SelectValue /></SelectTrigger>
        <SelectContent>{STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}</SelectContent>
      </Select>
      {onClearAll && <Button variant="ghost" size="sm" onClick={onClearAll}><X className="h-3.5 w-3.5" />Clear all</Button>}
    </>
  );
}
