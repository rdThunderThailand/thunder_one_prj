"use client";

import { useEffect, useEffectEvent, useId, useState } from "react";
import { Input } from "@/components/ui/lovable/input";
import { Button } from "@/components/ui/lovable/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { SearchIcon } from "@/components/ui/icons";
import { AssignmentsHistoryDateRange } from "./AssignmentsHistoryDateRange";
import type { ListUrlState } from "../list-page/useListUrlState";
import { ASSIGNMENT_EVENT_LABEL, HISTORY_FILTER_KEYS } from "../../domain/assignment-history";

export function AssignmentsHistoryFilters({ url }: { url: ListUrlState }) {
  const id = useId();
  const current = url.get("q") ?? "";
  const [search, setSearch] = useState({ source: current, draft: current });
  if (search.source !== current) setSearch({ source: current, draft: current });
  function applySearch() {
    url.set({ q: search.draft.trim() || undefined });
  }
  const applyDebounced = useEffectEvent(applySearch);
  useEffect(() => {
    if (search.draft.trim() === current || url.isPending) return;
    const timer = setTimeout(applyDebounced, 350);
    return () => clearTimeout(timer);
  }, [search.draft, current, url.isPending]);
  return (
    <div className="min-w-0 space-y-2">
      <div className="grid min-w-0 grid-cols-1 items-start gap-2 @xl/assignments:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <form role="search" className="relative min-w-0" onSubmit={(event) => { event.preventDefault(); applySearch(); }}>
          <label htmlFor={`${id}-search`} className="sr-only">Search assignment history</label>
          <SearchIcon aria-hidden="true" className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" />
          <Input id={`${id}-search`} name="q" type="search" maxLength={200} value={search.draft}
            placeholder="Search assignment history..." className="h-10 pl-9"
            onChange={(event) => setSearch((previous) => ({ ...previous, draft: event.target.value }))} />
        </form>
        <div className="flex h-10 min-w-0 items-center gap-2 rounded-control border border-input bg-card px-3 focus-within:ring-2 focus-within:ring-ring">
          <span id={`${id}-event`} className="shrink-0 text-2xs text-muted-foreground">Event Type</span>
          <Select value={url.get("event_type") || "__all__"} disabled={url.isPending}
            onValueChange={(value) => url.set({ event_type: value === "__all__" ? undefined : value })}>
            <SelectTrigger aria-labelledby={`${id}-event`} className="h-8 min-w-0 border-0 px-0 py-0 text-xs shadow-none focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              {Object.entries(ASSIGNMENT_EVENT_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <AssignmentsHistoryDateRange url={url} />
      </div>
      {HISTORY_FILTER_KEYS.some((key) => url.get(key)) && (
        <Button size="sm" variant="ghost" disabled={url.isPending}
          onClick={() => url.set(Object.fromEntries(HISTORY_FILTER_KEYS.map((key) => [key, undefined])))}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
