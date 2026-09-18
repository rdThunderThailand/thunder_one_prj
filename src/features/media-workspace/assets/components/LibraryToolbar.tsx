"use client";

import { GridIcon, ListIcon, SearchIcon } from "@/components/ui/icons";

export function LibraryToolbar({
  search,
  onSearch,
  kind,
  onKind,
  isGrid,
  onIsGrid,
}: {
  search: string;
  onSearch: (value: string) => void;
  kind: "" | "image" | "video";
  onKind: (value: "" | "image" | "video") => void;
  isGrid: boolean;
  onIsGrid: (value: boolean) => void;
}) {
  return (
    <div className="mb-4 flex shrink-0 flex-wrap gap-3">
      <label className="relative min-w-56 flex-1">
        <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search media..."
          className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm"
        />
      </label>
      <select
        value={kind}
        onChange={(event) => onKind(event.target.value as "" | "image" | "video")}
        className="rounded-lg border border-border bg-card px-3 text-sm"
      >
        <option value="">All Types</option>
        <option value="image">Images</option>
        <option value="video">Videos</option>
      </select>
      <button
        onClick={() => onIsGrid(true)}
        aria-pressed={isGrid}
        className="rounded-lg border border-border p-2"
      >
        <GridIcon />
      </button>
      <button
        onClick={() => onIsGrid(false)}
        aria-pressed={!isGrid}
        className="rounded-lg border border-border p-2"
      >
        <ListIcon />
      </button>
    </div>
  );
}
