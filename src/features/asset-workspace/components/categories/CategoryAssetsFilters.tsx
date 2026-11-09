import { useEffect, useEffectEvent, useState } from "react";
import { Input } from "@/components/ui/lovable/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { SearchIcon } from "@/components/ui/icons";
import type { AssetListQuery } from "../../services/assets-list-query";
import type { AssetFilterOptions } from "../../services/assets-list-types";

export function CategoryAssetsFilters({ query, options, disabled, onChange }: {
  query: AssetListQuery | null;
  options: AssetFilterOptions | null;
  disabled: boolean;
  onChange: (updates: Record<string, string | undefined>) => void;
}) {
  const [input, setInput] = useState({ source: query?.q ?? "", draft: query?.q ?? "" });
  const q = query?.q ?? "";
  if (input.source !== q) setInput({ source: q, draft: q });
  const submitSearch = useEffectEvent((value: string) => onChange({ q: value || undefined }));
  useEffect(() => {
    if (input.draft.trim() === q) return;
    const timer = window.setTimeout(() => submitSearch(input.draft.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [input.draft, q]);
  const filters = [
    { key: "status", label: "Status", value: query?.status, items: options?.statuses.map((value) => ({ id: value, name: value })) ?? [] },
    { key: "location_id", label: "Location", value: query?.location_id, items: options?.locations ?? [] },
    { key: "condition", label: "Condition", value: query?.condition, items: options?.conditions.map((value) => ({ id: value, name: value })) ?? [] },
  ];
  return (
    <div className="grid min-w-0 items-end gap-3 @min-2xl/assets-results:grid-cols-2 @min-5xl/assets-results:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
      <form role="search" className="min-w-0 space-y-1" onSubmit={(event) => { event.preventDefault(); onChange({ q: input.draft.trim() || undefined }); }}>
        <label htmlFor="category-assets-search" className="block text-xs font-medium">Search assets</label>
        <div className="relative">
          <SearchIcon aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="category-assets-search" type="search" maxLength={100} placeholder="Search name, asset tag or serial…"
            value={input.draft} className="h-10 pl-9 md:text-xs"
            onChange={(event) => setInput({ source: q, draft: event.target.value })} />
        </div>
      </form>
      {filters.map((filter) => (
        <div key={filter.key} className="min-w-0 space-y-1">
          <label htmlFor={`category-assets-${filter.key}`} className="block text-xs font-medium">{filter.label}</label>
          <Select value={filter.value ?? "all"} disabled={disabled} onValueChange={(value) => onChange({ [filter.key]: value === "all" ? undefined : value })}>
            <SelectTrigger id={`category-assets-${filter.key}`} className="h-10 min-w-0 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{filter.key === "status" ? "All statuses" : filter.key === "location_id" ? "All locations" : "All conditions"}</SelectItem>
              {filter.value && !filter.items.some((item) => item.id === filter.value) && (
                <SelectItem value={filter.value}>Selected {filter.label.toLowerCase()}</SelectItem>
              )}
              {filter.items.map((item) => <SelectItem key={item.id} value={item.id} className="wrap-anywhere">{item.name || "Unnamed location"}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}
