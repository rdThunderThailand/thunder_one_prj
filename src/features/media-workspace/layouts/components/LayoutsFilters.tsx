"use client";

import { Button } from "@/components/ui/Button";
import { SearchIcon } from "@/components/ui/icons";
import type { ListFilters } from "../list-filtering";
import { LAYOUT_STATUSES, type LayoutStatus } from "../types";

const STATUS_OPTIONS: { value: LayoutStatus | "all"; label: string }[] = [
  { value: "all", label: "All Status" },
  ...LAYOUT_STATUSES.map((s) => ({ value: s, label: s === "active" ? "Active" : "Inactive" })),
];

const selectClasses =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm capitalize outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900";

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
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-56 flex-1">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          value={value.query}
          onChange={(e) => onChange({ ...value, query: e.target.value })}
          placeholder="Search by layout name..."
          className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <select
        aria-label="Status"
        value={value.status}
        onChange={(e) => onChange({ ...value, status: e.target.value as ListFilters["status"] })}
        className={selectClasses}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {onClearAll ? (
        <Button variant="ghost" onClick={onClearAll}>
          Clear all
        </Button>
      ) : null}
    </div>
  );
}
