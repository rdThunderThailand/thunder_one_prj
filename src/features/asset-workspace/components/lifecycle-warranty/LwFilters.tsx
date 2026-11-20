"use client";

import { useEffect, useEffectEvent, useId, useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { SearchIcon } from "@/components/ui/icons";
import type { ListUrlState } from "../list-page/useListUrlState";

export type LwSelect = {
  key: string; label: string; value: string; options: { value: string; label: string }[];
  onChange?: (value?: string) => void;
};

/** One labelled select pill, as AssignmentsCurrentFilters. */
function LwFilter({ select, disabled, url }: { select: LwSelect; disabled: boolean; url: ListUrlState }) {
  const id = useId();
  const change = select.onChange ?? ((value?: string) => url.set({ [select.key]: value }));
  return (
    <div className="flex h-10 min-w-0 items-center gap-2 rounded-control border border-input bg-card px-3 focus-within:ring-2 focus-within:ring-ring">
      <span id={id} className="shrink-0 text-2xs text-muted-foreground">{select.label}</span>
      <Select value={select.value || "__all__"} disabled={disabled} onValueChange={(next) => change(next === "__all__" ? undefined : next)}>
        <SelectTrigger aria-labelledby={id} className="h-8 min-w-0 border-0 px-0 py-0 text-xs font-medium text-foreground shadow-none focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All</SelectItem>
          {select.value && !select.options.some((option) => option.value === select.value) && (
            <SelectItem value={select.value}>Current selection</SelectItem>
          )}
          {select.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Search plus the tab's filters on one row (Q31: no "Filters" button). `clear` resets every key the tab owns. */
export function LwFilters({ url, placeholder, selects, clear, optionsFailed }: {
  url: ListUrlState; placeholder: string; selects: LwSelect[]; clear: Record<string, undefined>; optionsFailed: boolean;
}) {
  const searchId = useId();
  const current = url.get("q") ?? "";
  const [input, setInput] = useState({ source: current, draft: current, submitted: undefined as string | undefined });
  if (input.source !== current) setInput({ source: current, draft: input.submitted === current ? input.draft : current, submitted: undefined });
  const search = input.draft;
  function apply(value: string) {
    setInput((previous) => ({ ...previous, submitted: value }));
    url.set({ q: value || undefined });
  }
  const applyDebounced = useEffectEvent(apply);
  useEffect(() => {
    if (search.trim() === current || url.isPending) return;
    const timer = setTimeout(() => applyDebounced(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search, current, url.isPending]);
  const filtered = Object.keys(clear).some((key) => url.get(key));
  const columns = selects.length === 5
    ? "@5xl/lw:grid-cols-[minmax(0,1.6fr)_repeat(5,minmax(0,1fr))]"
    : "@4xl/lw:grid-cols-[minmax(0,1.8fr)_repeat(3,minmax(0,1fr))]";

  return (
    <div className="w-full min-w-0 space-y-2">
      <div className={`grid min-w-0 grid-cols-1 items-start gap-2 @xl/lw:grid-cols-3 ${columns}`}>
        <form
          role="search"
          className={`relative min-w-0 @xl/lw:col-span-3 ${selects.length === 5 ? "@5xl/lw:col-span-1" : "@4xl/lw:col-span-1"}`}
          onSubmit={(event) => { event.preventDefault(); apply(search.trim()); }}
        >
          <label htmlFor={searchId} className="sr-only">{placeholder}</label>
          <SearchIcon aria-hidden="true" className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" />
          <Input id={searchId} name="q" type="search" maxLength={200} value={search}
            onChange={(event) => setInput((previous) => ({ ...previous, draft: event.target.value }))}
            placeholder={placeholder} className="h-10 pl-9" />
        </form>
        {selects.map((select) => (
          <LwFilter key={select.key} select={select} url={url} disabled={url.isPending} />
        ))}
      </div>
      {filtered && <Button size="sm" variant="ghost" disabled={url.isPending} onClick={() => url.set(clear)}>Clear filters</Button>}
      {optionsFailed && (
        <p role="status" className="text-xs text-muted-foreground">Some filter options couldn&apos;t load. Search still works; reload to try again.</p>
      )}
    </div>
  );
}
