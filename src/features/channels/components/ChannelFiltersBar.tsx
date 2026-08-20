"use client";

import { SearchIcon } from "@/components/ui/icons";
import type { ChannelFilters } from "../types";

const selectClasses =
  "h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200";

export function ChannelFiltersBar({
  value,
  onChange,
}: {
  value: ChannelFilters;
  onChange: (next: ChannelFilters) => void;
}) {
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

      <select
        aria-label="Category"
        value={value.category}
        onChange={(event) =>
          onChange({ ...value, category: event.target.value as ChannelFilters["category"] })
        }
        className={selectClasses}
      >
        <option value="all">All categories</option>
        <option value="dooh">DOOH</option>
        <option value="in_store">In-store</option>
      </select>

      <select
        aria-label="Lifecycle"
        value={value.lifecycle}
        onChange={(event) =>
          onChange({ ...value, lifecycle: event.target.value as ChannelFilters["lifecycle"] })
        }
        className={selectClasses}
      >
        <option value="all">All lifecycle</option>
        <option value="draft">Draft</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      <select
        aria-label="Health"
        value={value.health}
        onChange={(event) =>
          onChange({ ...value, health: event.target.value as ChannelFilters["health"] })
        }
        className={selectClasses}
      >
        <option value="all">All health</option>
        <option value="online">Online</option>
        <option value="warning">Warning</option>
        <option value="degraded">Degraded</option>
        <option value="offline">Offline</option>
        <option value="unknown">Unassigned</option>
      </select>
    </div>
  );
}
