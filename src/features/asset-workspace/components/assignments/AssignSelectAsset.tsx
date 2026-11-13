"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/lovable/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { SearchIcon } from "@/components/ui/icons";
import { assetAssignBlock } from "../../domain/assignment-assign";
import type { AssetCondition } from "../../domain/asset-condition";
import { useProfileRead } from "../../hooks/use-asset-profile";
import { searchAvailableAssets } from "../../services/asset-assignments-write";
import { getAssetsFilters } from "../../services/assets-list-api";
import { AssetThumbnail } from "../AssetThumbnail";
import { ConditionBadge } from "../StatusBadges";
import { AssetsPagination } from "../assets-list/AssetsPagination";
import { ErrorState } from "../states/ErrorState";
import { EmptyState, LoadingState } from "../states/states";
import { assignmentWriteText } from "./assignment-error-text";
import type { AssignFlow } from "./use-assign-flow";

type Row = {
  id: string; name: string; code: string; serial: string | null; category: string | null; location: string | null;
  condition: string | null; thumbnail: string | null; blocked?: boolean;
};
const ALL = "__all__";
const columns = ["Asset", "Asset ID", "Category", "Location", "Condition"];

function FilterSelect({ label, value, options, onChange }: {
  label: string; value: string; options: { id: string; name: string | null }[]; onChange: (value: string) => void;
}) {
  return (
    <Select value={value || ALL} onValueChange={(next) => onChange(next === ALL ? "" : next)}>
      <SelectTrigger aria-label={label} className="h-9 w-44 max-w-full text-xs max-sm:h-10 [&>span]:truncate">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All {label === "Category" ? "categories" : "locations"}</SelectItem>
        {options.map((option) => <SelectItem key={option.id} value={option.id}>{option.name || "Unnamed"}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function AssetRow({ row, checked, pinned, onPick }: { row: Row; checked: boolean; pinned?: boolean; onPick: () => void }) {
  return (
    <tr
      onClick={() => { if (!row.blocked) onPick(); }}
      className={`cursor-pointer hover:bg-muted [&>td]:px-3 [&>td]:py-2 [&>td]:align-middle ${checked ? "bg-accent" : ""} ${row.blocked ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <td className="w-8">
        <input
          type="radio"
          name="assign-asset"
          aria-label={`${row.name} (${row.code})`}
          className="size-4 accent-primary"
          checked={checked}
          disabled={row.blocked}
          onChange={onPick}
        />
      </td>
      <td>
        <div className="flex min-w-0 items-center gap-2">
          <AssetThumbnail src={row.thumbnail} className="size-9" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground wrap-anywhere">{row.name}</p>
            <p className="text-2xs text-muted-foreground wrap-anywhere">
              {row.blocked ? "Has a custodian. Use Transfer." : pinned ? "Selected" : row.serial ? `S/N ${row.serial}` : "No serial number"}
            </p>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap">{row.code}</td>
      <td className="wrap-break-word">{row.category ?? "—"}</td>
      <td className="wrap-break-word">{row.location ?? "—"}</td>
      <td className="whitespace-nowrap"><ConditionBadge condition={row.condition as AssetCondition | null} /></td>
    </tr>
  );
}

/** Step 1 on the list route: find an Available asset by search, category, location and page, then pick it. */
export function AssignSelectAsset({ context, flow }: { context: string; flow: AssignFlow }) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState({ q: "", page: 1, category_id: "", location_id: "" });
  useEffect(() => {
    const timer = setTimeout(() => setQuery((previous) => previous.q === search.trim() ? previous : { ...previous, q: search.trim(), page: 1 }), 350);
    return () => clearTimeout(timer);
  }, [search]);
  const list = useProfileRead(`${context}:assign-search:${JSON.stringify(query)}`, (signal) => searchAvailableAssets(context, query, signal));
  const filters = useProfileRead(`${context}:assign-filters`, (signal) => getAssetsFilters(context, signal));
  const options = filters.result?.ok ? filters.result.data : { categories: [], locations: [] };
  const page = list.result?.ok ? list.result.data : null;
  const rows: Row[] = (page?.rows ?? []).map((row) => ({
    id: row.id, name: row.name, code: row.asset_code, serial: row.serial_number, category: row.category_name,
    location: row.location_name, condition: row.condition, thumbnail: row.thumbnail_url,
    blocked: Boolean(assetAssignBlock({ id: row.id, lifecycleStatus: row.status, condition: row.condition, custody: row.custody })),
  }));
  // The picked asset stays on top while the user pages or filters away from it.
  const asset = flow.asset?.id === flow.picked?.id ? flow.asset : null;
  const pinned: Row | null = asset && !rows.some((row) => row.id === asset.id) ? {
    id: asset.id, name: asset.name, code: asset.assetTag, serial: asset.serialNumber, category: asset.category?.name ?? null,
    location: asset.location?.name ?? null, condition: asset.condition, thumbnail: flow.picked?.thumbnailUrl ?? null,
  } : null;
  const pick = (row: Row) => flow.pick(row.id, row.thumbnail);

  return (
    <Card className="space-y-3 p-4">
      <h2 className="text-sm font-semibold text-foreground">1. Select Asset</h2>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            aria-label="Search assets"
            placeholder="Search by asset name, tag or serial"
            className="h-9 pl-9 max-sm:h-10"
            value={search}
            maxLength={200}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") { event.preventDefault(); setQuery((previous) => ({ ...previous, q: search.trim(), page: 1 })); }
            }}
          />
        </div>
        <FilterSelect label="Category" value={query.category_id} options={options.categories}
          onChange={(category_id) => setQuery((previous) => ({ ...previous, category_id, page: 1 }))} />
        <FilterSelect label="Location" value={query.location_id} options={options.locations}
          onChange={(location_id) => setQuery((previous) => ({ ...previous, location_id, page: 1 }))} />
      </div>
      {!list.result || (list.pending && !page) ? (
        <LoadingState rows={3} />
      ) : !list.result.ok ? (
        <ErrorState
          title="Couldn't load assets"
          body={list.result.code === "PERMISSION_DENIED" ? assignmentWriteText("PERMISSION_DENIED") : "Assets could not be loaded. Check your connection and retry."}
          onRetry={list.reload}
        />
      ) : rows.length === 0 && !pinned ? (
        <EmptyState
          title={query.q || query.category_id || query.location_id ? "No matching assets" : "No available assets"}
          body="Only Available assets without a custodian can be assigned."
        />
      ) : (
        <fieldset className="min-w-0 space-y-2" aria-busy={list.pending}>
          <legend className="sr-only">Available assets</legend>
          <div className="min-w-0 overflow-x-auto rounded-control border border-border">
            <table className="w-full min-w-xl text-left text-xs">
              <thead className="bg-muted text-2xs text-muted-foreground">
                <tr>
                  <th scope="col"><span className="sr-only">Select</span></th>
                  {columns.map((label) => <th key={label} scope="col" className="px-3 py-2 font-semibold">{label}</th>)}
                </tr>
              </thead>
              <tbody className={`divide-y divide-border ${list.pending ? "opacity-60" : ""}`}>
                {pinned && <AssetRow row={pinned} checked pinned onPick={() => pick(pinned)} />}
                {rows.map((row) => <AssetRow key={row.id} row={row} checked={flow.picked?.id === row.id} onPick={() => pick(row)} />)}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && <p className="text-2xs text-muted-foreground">No other available assets match these filters.</p>}
          {page && page.totalPages > 1 && (
            <AssetsPagination data={page} pending={list.pending} compact
              onPage={(next) => setQuery((previous) => ({ ...previous, page: next }))} onPageSize={() => {}} />
          )}
        </fieldset>
      )}
    </Card>
  );
}
