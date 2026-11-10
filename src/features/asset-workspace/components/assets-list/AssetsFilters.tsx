import { useEffect, useEffectEvent, useId, useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/lovable/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { FilterIcon, SearchIcon } from "@/components/ui/icons";
import type { AssetFilterOptions, AssetReadResult } from "../../services/assets-list-types";
import type { AssetsListUrlState } from "../../hooks/use-assets-list-url";
import { ASSET_SEARCH_MAX_LENGTH } from "../../services/assets-list-query";
import { AssetsFilterOptionsLoading } from "./AssetsListLoading";
import { UnavailableAction } from "./AssetsListToolbar";

interface FilterSelectProps {
  label: string;
  allLabel: string;
  value: string;
  options: { value: string; label: string }[];
  pending: boolean;
  onChange: (value: string | undefined) => void;
}

function FilterSelect({ label, allLabel, value, options, pending, onChange }: FilterSelectProps) {
  const labelId = useId();
  const allValue = "__all__";
  return (
    <div className="flex h-10 min-w-0 flex-col justify-center rounded-control border border-input bg-card px-3 focus-within:ring-2 focus-within:ring-ring">
      <span id={labelId} className="text-2xs text-muted-foreground">{label}</span>
      <Select value={value || allValue} disabled={pending} onValueChange={(next) => onChange(next === allValue ? undefined : next)}>
        <SelectTrigger aria-labelledby={labelId} className="h-5 min-w-0 border-0 px-0 py-0 text-xs shadow-none focus:ring-0 [&>span]:min-w-0 [&>span]:truncate">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={allValue}>{allLabel}</SelectItem>
          {value && !options.some((option) => option.value === value) && <SelectItem value={value}>Current selection</SelectItem>}
          {options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

export function AssetsFilters({ result, url, loading = false, selectedCategory }: {
  result: AssetReadResult<AssetFilterOptions> | null;
  url: AssetsListUrlState;
  loading?: boolean;
  selectedCategory?: { id: string; name: string };
}) {
  const currentSearch = url.get("q") ?? "";
  const [input, setInput] = useState({ source: currentSearch, draft: currentSearch, submitted: undefined as string | undefined });
  // Keep newer typing when our search completes; restore the URL value on Back/Forward.
  if (input.source !== currentSearch) {
    setInput({
      source: currentSearch,
      draft: input.submitted === currentSearch ? input.draft : currentSearch,
      submitted: undefined,
    });
  }
  const search = input.draft;
  function applySearch(value: string) {
    setInput((previous) => ({ ...previous, submitted: value }));
    url.set({ q: value || undefined });
  }
  const submitSearch = useEffectEvent(applySearch);
  useEffect(() => {
    if (search.trim() === currentSearch || url.isPending) return;
    const timer = setTimeout(() => submitSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search, currentSearch, url.isPending]);

  const options = result?.ok ? result.data : null;
  const pending = url.isPending || !options;
  const custody = url.get("custody_id") ? `${url.get("custody_type")}:${url.get("custody_id")}` : url.get("custody_type") ?? "";
  const references = (items: { id: string; name: string | null }[]) => items.map((item) => ({
    value: item.id, label: item.name || `Unnamed (${item.id})`,
  }));
  const categories = references(options?.categories ?? []);
  if (selectedCategory && !categories.some((category) => category.value === selectedCategory.id)) {
    categories.push({ value: selectedCategory.id, label: selectedCategory.name });
  }
  const categoryOptions = categories.map((category) => ({
    ...category,
    label: category.value === url.get("category_id") && url.get("include_child_categories") === "true"
      ? `${category.label} and child categories` : category.label,
  }));

  return (
    <section aria-label="Asset filters" className="@container/asset-filters min-w-0 space-y-3">
      <div className="grid items-start gap-2 @min-2xl/asset-filters:grid-cols-[minmax(0,1fr)_auto] @min-6xl/asset-filters:grid-cols-[minmax(12rem,1.7fr)_minmax(0,4fr)_auto]">
        <form
          role="search"
          className="relative min-w-0 @min-2xl/asset-filters:col-span-2 @min-6xl/asset-filters:col-span-1"
          onSubmit={(event) => { event.preventDefault(); applySearch(search.trim()); }}
        >
          <label htmlFor="assets-search" className="sr-only">Search assets by name, Asset Tag or serial number</label>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground"
          >
            <SearchIcon className="size-4" />
          </span>
          <Input
            id="assets-search"
            name="q"
            type="search"
            maxLength={ASSET_SEARCH_MAX_LENGTH}
            value={search}
            onChange={(event) => setInput((previous) => ({ ...previous, source: currentSearch, draft: event.target.value }))}
            placeholder="Search name, Asset Tag, serial number…"
            className="h-10 pl-9 md:text-xs"
          />
        </form>
        {loading ? <AssetsFilterOptionsLoading /> : <div className="grid min-w-0 grid-cols-1 gap-2 @min-xs/asset-filters:grid-cols-2 @min-2xl/asset-filters:grid-cols-4">
          <FilterSelect
            label="Category"
            allLabel="All Categories"
            value={url.get("category_id") ?? ""}
            options={categoryOptions}
            pending={pending}
            onChange={(value) => url.set({ category_id: value, include_child_categories: undefined })}
          />
          <FilterSelect
            label="Location"
            allLabel="All Locations"
            value={url.get("location_id") ?? ""}
            options={references(options?.locations ?? [])}
            pending={pending}
            onChange={(value) => url.set({ location_id: value })}
          />
          <FilterSelect
            label="Status"
            allLabel="All Statuses"
            value={url.get("status") ?? ""}
            options={(options?.statuses ?? []).map((value) => ({ value, label: value }))}
            pending={pending}
            onChange={(value) => url.set({ status: value })}
          />
          <FilterSelect
            label="Assignee"
            allLabel="All Assignees"
            value={custody}
            options={(options?.custodyTargets ?? []).map((target) => ({ value: `${target.type}:${target.id}`, label: `${target.name || target.id} (${target.type === "person" ? "Person" : "Organizational Unit"})` }))}
            pending={pending}
            onChange={(value) => {
              const [type, id] = value?.split(":") ?? [];
              url.set({ custody_type: type, custody_id: id });
            }}
          />
        </div>}
        <div className="flex flex-wrap items-center gap-2 @min-2xl/asset-filters:justify-end">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-10" disabled={pending}>
                <FilterIcon aria-hidden="true" className="size-4" />
                More Filters{url.get("condition") ? " (1)" : ""}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" collisionPadding={12} className="w-72 max-w-[calc(100vw-2rem)] rounded-control p-3">
              <FilterSelect
                label="Condition"
                allLabel="All Conditions"
                value={url.get("condition") ?? ""}
                options={(options?.conditions ?? []).map((value) => ({ value, label: value }))}
                pending={pending}
                onChange={(value) => url.set({ condition: value })}
              />
            </PopoverContent>
          </Popover>
          <UnavailableAction className="h-10">Save View</UnavailableAction>
        </div>
      </div>
    </section>
  );
}
