"use client";

import { useEffect, useEffectEvent, useId, useState } from "react";
import { Input } from "@/components/ui/lovable/input";
import { Button } from "@/components/ui/lovable/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { ChevronDownIcon, SearchIcon } from "@/components/ui/icons";
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
  const from = url.get("date_from") ?? "";
  const to = url.get("date_to") ?? "";
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
        <details className="relative min-w-0 rounded-control border border-input bg-card">
          <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-control px-3 text-xs focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            <span className="text-2xs text-muted-foreground">Date Range</span>
            <span className="min-w-0 flex-1 wrap-anywhere">{from || to ? `${from || "—"} – ${to || "—"}` : "All"}</span>
            <ChevronDownIcon aria-hidden="true" className="size-4" />
          </summary>
          <div className="space-y-3 border-t border-border p-3">
            <div className="space-y-1">
              <label htmlFor={`${id}-from`} className="text-xs">From</label>
              <Input id={`${id}-from`} type="date" value={from} disabled={url.isPending}
                onChange={(event) => url.set({ date_from: event.target.value || undefined })} />
            </div>
            <div className="space-y-1">
              <label htmlFor={`${id}-to`} className="text-xs">To</label>
              <Input id={`${id}-to`} type="date" value={to} disabled={url.isPending}
                onChange={(event) => url.set({ date_to: event.target.value || undefined })} />
            </div>
          </div>
        </details>
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
