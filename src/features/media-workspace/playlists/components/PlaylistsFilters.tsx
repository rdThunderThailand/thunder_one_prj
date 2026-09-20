"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/lovable/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { LibrarySearch } from "../../content-library/LibraryShell";
import { LibraryViewToggle } from "../../assets/components/LibraryToolbar";
import { CONTENT_TYPES, type ContentType, type Sort, type SortKey } from "../list-filtering";
import type { PlaylistStatus } from "../types";

export type FilterState = {
  query: string;
  status: PlaylistStatus | "all";
  type: ContentType | "all";
};

const TYPE_LABELS: Record<ContentType, string> = { video: "Video", image: "Image", mixed: "Mixed" };

const STATUS_OPTIONS: { value: PlaylistStatus | "all"; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "draft", label: "Draft" },
];

const triggerClass = "h-9 w-30 text-[10px] shadow-none";

/** Lovable toolbar controls (search + selects) on this list's real filters. */
export function PlaylistsFilters({
  value,
  onChange,
  onClearAll,
  isGrid,
  sort,
  onViewChange,
  onSortChange,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
  /** Omitted when the whole list state is already at its default, which is also exactly
   *  when the URL carries no query string — so the button appears only when it would do
   *  something. Resets folder, sort and paging too, not just the filters shown here. */
  onClearAll?: () => void;
  isGrid: boolean;
  sort: Sort;
  onViewChange: (next: boolean) => void;
  onSortChange: (key: SortKey) => void;
}) {
  return (
    <>
      <LibrarySearch value={value.query} onChange={(query) => onChange({ ...value, query })} placeholder="Search by playlist name..." />
      <Select value={value.status} onValueChange={(status) => onChange({ ...value, status: status as FilterState["status"] })}>
        <SelectTrigger className={triggerClass} aria-label="Status"><SelectValue /></SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={value.type} onValueChange={(type) => onChange({ ...value, type: type as FilterState["type"] })}>
        <SelectTrigger className={triggerClass} aria-label="Type"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs">All Types</SelectItem>
          {CONTENT_TYPES.map((t) => <SelectItem key={t} value={t} className="text-xs">{TYPE_LABELS[t]}</SelectItem>)}
        </SelectContent>
      </Select>
      {onClearAll && (
        <Button variant="ghost" size="sm" onClick={onClearAll}><X className="h-3.5 w-3.5" />Clear filters</Button>
      )}
      <LibraryViewToggle isGrid={isGrid} onIsGrid={onViewChange} />
      <Select value={sort.key} onValueChange={(key) => onSortChange(key as SortKey)}>
        <SelectTrigger className={triggerClass} aria-label="Sort playlists"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="updated">Last Modified</SelectItem>
          <SelectItem value="name">Name</SelectItem>
          <SelectItem value="type">Type</SelectItem>
          <SelectItem value="duration">Duration</SelectItem>
          <SelectItem value="status">Status</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
}
