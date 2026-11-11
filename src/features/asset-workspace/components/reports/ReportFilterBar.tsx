"use client";

// One filter bar per Reports tab; it drives the KPIs, charts and table together (filters live in the URL,
// the server page re-fetches every report with them). Used by Inventory and Warranty; the asset tabs use AssetsFilters.
import { RefreshIcon, SearchIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import type { ListUrlState } from "../list-page/useListUrlState";

export interface FilterOption {
  value: string;
  label: string;
}

export interface SelectFilter {
  /** URL key. */
  key: string;
  label: string;
  options: FilterOption[];
}

const ALL = "all";

export function ReportFilterBar({
  url,
  searchPlaceholder,
  selects,
  dateRange,
}: {
  url: ListUrlState;
  /** Omit for a route without `q` (e.g. Location History): no search box. */
  searchPlaceholder?: string;
  selects: SelectFilter[];
  /** Two URL keys for a from / to date pair. */
  dateRange?: { label: string; from: string; to: string };
}) {
  return (
    <>
      {searchPlaceholder && (
        <form
          role="search"
          className="relative w-full sm:w-72"
          onSubmit={(event) => {
            event.preventDefault();
            const q = new FormData(event.currentTarget).get("q");
            url.set({ q: typeof q === "string" ? q.trim() : undefined });
          }}
        >
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            key={url.get("q") ?? ""}
            name="q"
            type="search"
            aria-label={searchPlaceholder}
            placeholder={searchPlaceholder}
            defaultValue={url.get("q")}
            className="pl-9"
          />
        </form>
      )}
      {selects.map((filter) => (
        <Select
          key={filter.key}
          value={url.get(filter.key) ?? ALL}
          onValueChange={(value) => url.set({ [filter.key]: value === ALL ? undefined : value })}
        >
          <SelectTrigger
            aria-label={filter.label}
            className="w-full sm:w-44"
          >
            <span className="mr-1 text-muted-foreground">{filter.label}:</span>
            {/* Explicit label: Radix leaves the value blank until the menu has opened once. */}
            <SelectValue>
              {filter.options.find((option) => option.value === url.get(filter.key))?.label ?? url.get(filter.key) ?? "All"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All</SelectItem>
            {filter.options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      {dateRange && (
        <fieldset className="flex w-full items-center gap-2 text-sm sm:w-auto">
          <legend className="sr-only">{dateRange.label}</legend>
          <span
            aria-hidden="true"
            className="text-muted-foreground"
          >
            {dateRange.label}
          </span>
          {[dateRange.from, dateRange.to].map((key, i) => (
            <Input
              key={key}
              type="date"
              aria-label={`${dateRange.label} ${i === 0 ? "from" : "to"}`}
              value={url.get(key) ?? ""}
              onChange={(event) => url.set({ [key]: event.target.value || undefined })}
              className="w-full min-w-0 sm:w-40"
            />
          ))}
        </fieldset>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="text-primary"
        onClick={() =>
          url.set(
            Object.fromEntries(
              [...(searchPlaceholder ? ["q"] : []), ...selects.map((s) => s.key), ...(dateRange ? [dateRange.from, dateRange.to] : [])].map((key) => [key, undefined]),
            ),
          )
        }
      >
        <RefreshIcon className="h-4 w-4" />
        Clear Filters
      </Button>
    </>
  );
}
