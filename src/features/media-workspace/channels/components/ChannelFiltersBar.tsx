"use client";

import { Button } from "@/components/ui/Button";
import { FilterIcon, SearchIcon } from "@/components/ui/icons";
import type { Sort, SortKey } from "../list-filtering";
import type { ChannelFilters } from "../types";

const selectClasses =
  "h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200";

// D1's "Sort by" dropdown. Name offers both directions; Location/Status sort ascending only —
// there is no mockup evidence for a Z-A reading of either.
const SORT_OPTIONS: { value: string; label: string; key: SortKey; dir: "asc" | "desc" }[] = [
  { value: "name:asc", label: "Name (A–Z)", key: "name", dir: "asc" },
  { value: "name:desc", label: "Name (Z–A)", key: "name", dir: "desc" },
  { value: "location:asc", label: "Location", key: "location", dir: "asc" },
  { value: "status:asc", label: "Status", key: "status", dir: "asc" },
];

function sortToValue(sort: Sort): string {
  const match = SORT_OPTIONS.find((option) => option.key === sort.key && option.dir === sort.dir);
  return match?.value ?? SORT_OPTIONS[0]!.value;
}

export function ChannelFiltersBar({
  value,
  sort,
  onChange,
  onSortChange,
  onClearAll,
}: {
  value: ChannelFilters;
  sort: Sort;
  onChange: (next: ChannelFilters) => void;
  onSortChange: (sort: Sort) => void;
  /** Omitted when the whole list state is already at its default, which is also exactly
   *  when the URL carries no query string — so the button appears only when it would do
   *  something. Resets sort and paging too, not just the filters shown here. */
  onClearAll?: () => void;
}) {
  const updateFilters = (next: ChannelFilters, target: HTMLSelectElement) => {
    onChange(next);
    target.closest("details")?.removeAttribute("open");
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
      <label className="relative min-w-60 flex-1">
        <span className="sr-only">Search channels</span>
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          value={value.search}
          onChange={(event) => onChange({ ...value, search: event.target.value })}
          placeholder="Search channel, location or device"
          className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:bg-zinc-900"
        />
      </label>

      <details className="relative">
        <summary
          aria-label="Filter channels"
          className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <FilterIcon />
        </summary>
        <div className="absolute right-0 z-20 mt-2 grid w-52 gap-2 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <select
            aria-label="Type"
            value={value.type}
            onChange={(event) =>
              updateFilters({ ...value, type: event.target.value as ChannelFilters["type"] }, event.currentTarget)
            }
            className={selectClasses}
          >
            <option value="all">All types</option>
            <option value="screen">Screen</option>
            <option value="tv">TV</option>
            <option value="kiosk">Kiosk</option>
            <option value="multi">Multi-screen</option>
          </select>

          <select
            aria-label="Status"
            value={value.status}
            onChange={(event) =>
              updateFilters({ ...value, status: event.target.value as ChannelFilters["status"] }, event.currentTarget)
            }
            className={selectClasses}
          >
            <option value="all">All statuses</option>
            <option value="online">Online</option>
            <option value="warning">Warning</option>
            <option value="offline">Offline</option>
            <option value="no_player">No player</option>
          </select>

          <select
            aria-label="Lifecycle"
            value={value.lifecycle}
            onChange={(event) =>
              updateFilters(
                { ...value, lifecycle: event.target.value as ChannelFilters["lifecycle"] },
                event.currentTarget,
              )
            }
            className={selectClasses}
          >
            <option value="all">All lifecycle</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </details>

      <select
        aria-label="Sort by"
        value={sortToValue(sort)}
        onChange={(event) => {
          const option = SORT_OPTIONS.find((candidate) => candidate.value === event.target.value);
          if (option) onSortChange({ key: option.key, dir: option.dir });
        }}
        className={selectClasses}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            Sort by: {option.label}
          </option>
        ))}
      </select>

      {onClearAll ? (
        <Button variant="ghost" onClick={onClearAll} className="h-9 px-3 py-0">
          Clear all
        </Button>
      ) : null}
    </div>
  );
}
