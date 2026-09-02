"use client";

import { Button } from "@/components/ui/Button";
import { SearchIcon } from "@/components/ui/icons";
import type { Campaign } from "@/types/domain";
import { CONTENT_TYPES, type ContentType } from "../list-filtering";
import type { PlaylistStatus } from "../types";

export type FilterState = {
  query: string;
  status: PlaylistStatus | "all";
  type: ContentType | "all";
  campaignId: string | "all";
};

const TYPE_LABELS: Record<ContentType, string> = { video: "Video", image: "Image", mixed: "Mixed" };

const STATUS_OPTIONS: { value: PlaylistStatus | "all"; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "draft", label: "Draft" },
];

const selectClasses =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm capitalize outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900";

export function PlaylistsFilters({
  value,
  campaigns,
  onChange,
  onClearAll,
}: {
  value: FilterState;
  /** Empty while campaigns are loading or after that call failed — the dropdown then
   *  offers "All Campaigns" alone rather than blocking the rest of the filters. */
  campaigns: Campaign[];
  onChange: (next: FilterState) => void;
  /** Omitted when the whole list state is already at its default, which is also exactly
   *  when the URL carries no query string — so the button appears only when it would do
   *  something. Resets the tab, sort and paging too, not just the filters shown here. */
  onClearAll?: () => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="relative min-w-56 flex-1">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          value={value.query}
          onChange={(e) => onChange({ ...value, query: e.target.value })}
          placeholder="Search by playlist name..."
          className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <select
        aria-label="Status"
        value={value.status}
        onChange={(e) => onChange({ ...value, status: e.target.value as FilterState["status"] })}
        className={selectClasses}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        aria-label="Type"
        value={value.type}
        onChange={(e) => onChange({ ...value, type: e.target.value as FilterState["type"] })}
        className={selectClasses}
      >
        <option value="all">All Types</option>
        {CONTENT_TYPES.map((t) => (
          <option key={t} value={t}>
            {TYPE_LABELS[t]}
          </option>
        ))}
      </select>

      <select
        aria-label="Campaign"
        value={value.campaignId}
        onChange={(e) => onChange({ ...value, campaignId: e.target.value })}
        className={selectClasses}
      >
        <option value="all">All Campaigns</option>
        {campaigns.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
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
