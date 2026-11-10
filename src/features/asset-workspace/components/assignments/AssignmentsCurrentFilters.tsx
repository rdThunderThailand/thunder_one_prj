"use client";

import { useEffect, useEffectEvent, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { SearchIcon } from "@/components/ui/icons";
import type { ListUrlState } from "../list-page/useListUrlState";
import type { AssetFilterOptions } from "../../services/assets-list-types";
import type { AssignmentRead } from "../../services/asset-assignments-api";

export const CLEAR_ASSIGNMENT_FILTERS = {
  q: undefined, category_id: undefined, location_id: undefined, custody_type: undefined, custody_id: undefined,
};

function AssignmentFilter({ label, all, value, options, disabled, onChange }: {
  label: string; all: string; value: string; options: { value: string; label: string }[];
  disabled: boolean; onChange: (value?: string) => void;
}) {
  const id = useId();
  return (
    <div className="flex h-10 min-w-0 items-center gap-2 rounded-control border border-input bg-card px-3 focus-within:ring-2 focus-within:ring-ring">
      <span id={id} className="shrink-0 text-2xs text-muted-foreground">{label}</span>
      <Select value={value || "__all__"} disabled={disabled} onValueChange={(next) => onChange(next === "__all__" ? undefined : next)}>
        <SelectTrigger aria-labelledby={id} className="h-8 min-w-0 border-0 px-0 py-0 text-xs shadow-none focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{all}</SelectItem>
          {value && !options.some((option) => option.value === value) && <SelectItem value={value}>Current selection</SelectItem>}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function AssignmentsCurrentFilters({ url, result }: { url: ListUrlState; result: AssignmentRead<AssetFilterOptions> }) {
  const router = useRouter();
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
  const options = result.ok ? result.data : null;
  const disabled = url.isPending || !options;
  const references = (items: { id: string; name: string | null }[]) => items.map((item) => ({ value: item.id, label: item.name || `Unnamed (${item.id})` }));
  const custody = url.get("custody_id") ? `${url.get("custody_type")}:${url.get("custody_id")}` : url.get("custody_type") ?? "";
  const filtered = Object.keys(CLEAR_ASSIGNMENT_FILTERS).some((key) => url.get(key));
  return (
    <div className="w-full min-w-0 space-y-2">
      <div className="grid min-w-0 grid-cols-1 items-start gap-2 @xl/assignments:grid-cols-3 @4xl/assignments:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]">
        <form role="search" className="relative min-w-0 @xl/assignments:col-span-3 @4xl/assignments:col-span-1" onSubmit={(event) => { event.preventDefault(); apply(search.trim()); }}>
          <label htmlFor={searchId} className="sr-only">Search assignments</label>
          <SearchIcon aria-hidden="true" className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" />
          <Input id={searchId} name="q" type="search" maxLength={200} value={search}
            onChange={(event) => setInput((previous) => ({ ...previous, draft: event.target.value }))}
            placeholder="Search asset name, Asset Tag, serial number or custodian…" className="h-10 pl-9" />
        </form>
        <AssignmentFilter label="Category" all="All Categories" value={url.get("category_id") ?? ""}
          options={references(options?.categories ?? [])} disabled={disabled} onChange={(value) => url.set({ category_id: value })} />
        <AssignmentFilter label="Location" all="All Locations" value={url.get("location_id") ?? ""}
          options={references(options?.locations ?? [])} disabled={disabled} onChange={(value) => url.set({ location_id: value })} />
        <AssignmentFilter label="Custodian" all="All Custodians" value={custody}
          options={(options?.custodyTargets ?? []).map((target) => ({ value: `${target.type}:${target.id}`, label: `${target.name || "Unnamed custodian"} (${target.type === "person" ? "Person" : "Organizational Unit"})` }))}
          disabled={disabled} onChange={(value) => { const [type, id] = value?.split(":") ?? []; url.set({ custody_type: type, custody_id: id }); }} />
      </div>
      {filtered && <Button size="sm" variant="ghost" disabled={url.isPending} onClick={() => url.set(CLEAR_ASSIGNMENT_FILTERS)}>Clear filters</Button>}
      {!result.ok && (
        <div role="alert" className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <p>Couldn&apos;t load filter options. Retry to choose a category, location or custodian.</p>
          <Button size="sm" variant="outline" disabled={url.isPending} onClick={() => router.refresh()}>Retry filters</Button>
        </div>
      )}
    </div>
  );
}
