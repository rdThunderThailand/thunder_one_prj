"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/lovable/input";
import { SearchIcon } from "@/components/ui/icons";
import { assetAssignBlock } from "../../domain/assignment-assign";
import type { AssetStatus } from "../../domain/asset-status";
import { useProfileRead } from "../../hooks/use-asset-profile";
import { searchAvailableAssets } from "../../services/asset-assignments-write";
import { AssetThumbnail } from "../AssetThumbnail";
import { StatusBadge } from "../StatusBadges";
import { ErrorState } from "../states/ErrorState";
import { EmptyState, LoadingState } from "../states/states";
import { assignmentWriteText } from "./assignment-error-text";
import type { AssignFlow } from "./use-assign-flow";

/** Step 1 on the list route: search Available assets, pick one. */
export function AssignSelectAsset({ context, flow }: { context: string; flow: AssignFlow }) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);
  const list = useProfileRead(`${context}:assign-search:${query}`, (signal) => searchAvailableAssets(context, query, signal));
  return (
    <Card className="space-y-3 p-4">
      <h2 className="text-sm font-semibold text-foreground">1. Select Asset</h2>
      <div className="relative">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          aria-label="Search assets"
          placeholder="Search by asset name or tag"
          className="pl-9 max-sm:h-10"
          value={search}
          maxLength={200}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); setQuery(search.trim()); } }}
        />
      </div>
      {!list.result || list.pending ? (
        <LoadingState rows={3} />
      ) : !list.result.ok ? (
        <ErrorState
          title="Couldn't load assets"
          body={list.result.code === "PERMISSION_DENIED" ? assignmentWriteText("PERMISSION_DENIED") : "Assets could not be loaded. Check your connection and retry."}
          onRetry={list.reload}
        />
      ) : list.result.data.rows.length === 0 ? (
        <EmptyState
          title="No available assets"
          body="Only Available assets without a custodian can be assigned."
        />
      ) : (
        <fieldset className="min-w-0">
          <legend className="sr-only">Available assets</legend>
          <ul className="divide-y divide-border rounded-control border border-border">
            {list.result.data.rows.map((row) => {
              const blocked = assetAssignBlock({ id: row.id, lifecycleStatus: row.status, condition: row.condition, custody: row.custody });
              return (
                <li key={row.id}>
                  <label className="relative flex min-w-0 cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted has-disabled:cursor-not-allowed has-disabled:opacity-60 has-checked:bg-accent">
                    <input
                      type="radio"
                      name="assign-asset"
                      className="size-4 shrink-0 accent-primary"
                      checked={flow.picked?.id === row.id}
                      disabled={Boolean(blocked)}
                      onChange={() => flow.pick(row.id, row.thumbnail_url)}
                    />
                    <AssetThumbnail
                      src={row.thumbnail_url}
                      className="size-10"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-foreground wrap-anywhere">{row.name}</span>
                      <span className="block text-2xs text-muted-foreground wrap-anywhere">
                        {[row.asset_code, row.category_name].filter(Boolean).join(" · ")}
                      </span>
                      {blocked && <span className="block text-2xs text-muted-foreground">Has a custodian. Use Transfer.</span>}
                    </span>
                    <StatusBadge status={row.status as AssetStatus} />
                  </label>
                </li>
              );
            })}
          </ul>
          {list.result.data.total > list.result.data.rows.length && (
            <p className="mt-2 text-2xs text-muted-foreground">
              Showing {list.result.data.rows.length} of {list.result.data.total}. Search to narrow the list.
            </p>
          )}
        </fieldset>
      )}
    </Card>
  );
}
