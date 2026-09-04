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
    <div className="flex shrink-0 flex-wrap gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800">
      <label className="relative min-w-56 flex-1">
        <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search media..."
          className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      <select
        value={kind}
        onChange={(event) => onKind(event.target.value as "" | "image" | "video")}
        className="rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="">All Types</option>
        <option value="image">Images</option>
        <option value="video">Videos</option>
      </select>
      <button disabled className="rounded-lg border border-zinc-200 px-3 text-sm text-zinc-400 dark:border-zinc-700">
        Tags · Soon
      </button>
      <button
        onClick={() => onIsGrid(true)}
        aria-pressed={isGrid}
        className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-700"
      >
        <GridIcon />
      </button>
      <button
        onClick={() => onIsGrid(false)}
        aria-pressed={!isGrid}
        className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-700"
      >
        <ListIcon />
      </button>
    </div>
  );
}
