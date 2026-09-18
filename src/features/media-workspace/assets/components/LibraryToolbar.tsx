"use client";

import { Grid2X2, LayoutList, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";

export type AssetKindFilter = "" | "image" | "video";

// Radix Select cannot hold an empty-string value, so "all" stands in for "".
const KIND_ITEMS: Array<{ value: "all" | "image" | "video"; label: string }> = [
  { value: "all", label: "All Types" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
];

export function LibraryToolbar({
  search,
  onSearch,
  kind,
  onKind,
  isGrid,
  onIsGrid,
  onFolders,
}: {
  search: string;
  onSearch: (value: string) => void;
  kind: AssetKindFilter;
  onKind: (value: AssetKindFilter) => void;
  isGrid: boolean;
  onIsGrid: (value: boolean) => void;
  /** Opens the folder/tag drawer below the `xl` breakpoint. */
  onFolders: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
      <Button variant="outline" size="sm" className="xl:hidden" onClick={onFolders}>
        <Menu className="h-3.5 w-3.5" />
        Folders
      </Button>
      <label className="relative min-w-48 flex-1 sm:max-w-60">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search media..."
          className="pl-9 text-[10px] shadow-none"
        />
      </label>
      <Select value={kind || "all"} onValueChange={(value) => onKind(value === "all" ? "" : (value as AssetKindFilter))}>
        <SelectTrigger className="h-9 w-30 text-[10px] shadow-none" aria-label="Media type">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          {KIND_ITEMS.map((item) => (
            <SelectItem key={item.value} value={item.value} className="text-xs">
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="ml-auto flex items-center gap-1">
        <Button
          variant={isGrid ? "secondary" : "ghost"}
          size="icon"
          className="h-9 w-9"
          onClick={() => onIsGrid(true)}
          aria-label="Grid View"
          aria-pressed={isGrid}
        >
          <Grid2X2 className="h-4 w-4" />
        </Button>
        <Button
          variant={isGrid ? "ghost" : "secondary"}
          size="icon"
          className="h-9 w-9"
          onClick={() => onIsGrid(false)}
          aria-label="List View"
          aria-pressed={!isGrid}
        >
          <LayoutList className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
