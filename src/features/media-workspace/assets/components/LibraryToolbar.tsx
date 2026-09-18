"use client";

import { Grid2X2, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/lovable/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { LibrarySearch } from "../../content-library/LibraryShell";

export type AssetKindFilter = "" | "image" | "video";

// Radix Select cannot hold an empty-string value, so "all" stands in for "".
const KIND_ITEMS: Array<{ value: "all" | "image" | "video"; label: string }> = [
  { value: "all", label: "All Types" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
];

/** Lovable Media Library toolbar, limited to the filters this page really has. */
export function LibraryToolbar({ search, onSearch, kind, onKind, isGrid, onIsGrid }: {
  search: string;
  onSearch: (value: string) => void;
  kind: AssetKindFilter;
  onKind: (value: AssetKindFilter) => void;
  isGrid: boolean;
  onIsGrid: (value: boolean) => void;
}) {
  return (
    <>
      <LibrarySearch value={search} onChange={onSearch} placeholder="Search media..." />
      <Select value={kind || "all"} onValueChange={(value) => onKind(value === "all" ? "" : (value as AssetKindFilter))}>
        <SelectTrigger className="h-9 w-30 text-[10px] shadow-none" aria-label="Media type">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          {KIND_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value} className="text-xs">{item.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <LibraryViewToggle isGrid={isGrid} onIsGrid={onIsGrid} />
    </>
  );
}

export function LibraryViewToggle({ isGrid, onIsGrid }: { isGrid: boolean; onIsGrid: (value: boolean) => void }) {
  return (
    <div className="ml-auto flex items-center gap-1">
      <Button variant={isGrid ? "secondary" : "ghost"} size="icon" className="h-9 w-9" onClick={() => onIsGrid(true)} aria-label="Grid View" aria-pressed={isGrid}>
        <Grid2X2 className="h-4 w-4" />
      </Button>
      <Button variant={isGrid ? "ghost" : "secondary"} size="icon" className="h-9 w-9" onClick={() => onIsGrid(false)} aria-label="List View" aria-pressed={!isGrid}>
        <LayoutList className="h-4 w-4" />
      </Button>
    </div>
  );
}
