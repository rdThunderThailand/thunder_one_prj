import { useEffect, useEffectEvent, useState } from "react";
import { Card } from "@/components/ui/Card";
import { SearchIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/lovable/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import type { AssetCategory, CategoryListQuery } from "../../domain/asset-category";
import { CATEGORY_SEARCH_MAX_LENGTH } from "../../services/category-list-query";

export function CategoriesFilters({ query, parents, disabled, onChange }: {
  query: CategoryListQuery;
  parents: AssetCategory[];
  disabled: boolean;
  onChange: (updates: Record<string, string | undefined>) => void;
}) {
  const [input, setInput] = useState({ source: query.q, draft: query.q, submitted: undefined as string | undefined });
  if (input.source !== query.q) {
    setInput({ source: query.q, draft: input.submitted === query.q ? input.draft : query.q, submitted: undefined });
  }

  function applySearch(value: string) {
    setInput((previous) => ({ ...previous, submitted: value }));
    onChange({ q: value || undefined });
  }
  const submitSearch = useEffectEvent(applySearch);
  useEffect(() => {
    if (disabled || input.draft.trim() === query.q) return;
    const timer = window.setTimeout(() => submitSearch(input.draft.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [disabled, input.draft, query.q]);

  return (
    <Card className="@container/category-filters min-w-0 p-3">
      <section aria-label="Category filters" className="grid min-w-0 items-end gap-3 @min-2xl/category-filters:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1.5fr)]">
        <form role="search" className="min-w-0" onSubmit={(event) => { event.preventDefault(); applySearch(input.draft.trim()); }}>
          <label htmlFor="categories-search" className="mb-1 block text-xs font-medium text-foreground">
            Search
          </label>
          <div className="relative">
            <SearchIcon aria-hidden="true" className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              id="categories-search"
              type="search"
              value={input.draft}
              disabled={disabled}
              maxLength={CATEGORY_SEARCH_MAX_LENGTH}
              placeholder="Search category name..."
              className="h-10 pl-9 md:text-xs"
              onChange={(event) => setInput((previous) => ({ ...previous, draft: event.target.value }))}
            />
          </div>
        </form>
        <div className="min-w-0">
          <label htmlFor="categories-status" className="mb-1 block text-xs font-medium text-foreground">
            Status
          </label>
          <Select value={query.status ?? "all"} disabled={disabled} onValueChange={(value) => onChange({ status: value === "all" ? undefined : value })}>
            <SelectTrigger id="categories-status" className="h-10 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0">
          <label htmlFor="categories-parent" className="mb-1 block text-xs font-medium text-foreground">
            Parent Category
          </label>
          <Select value={query.parent ?? "all"} disabled={disabled} onValueChange={(value) => onChange({ parent: value === "all" ? undefined : value })}>
            <SelectTrigger id="categories-parent" className="h-10 min-w-0 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="top-level">Top Level</SelectItem>
              {query.parent && query.parent !== "top-level" && !parents.some((parent) => parent.id === query.parent) && (
                <SelectItem value={query.parent}>Selected parent</SelectItem>
              )}
              {parents.map((parent) => (
                <SelectItem key={parent.id} value={parent.id}>
                  {parent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>
    </Card>
  );
}
