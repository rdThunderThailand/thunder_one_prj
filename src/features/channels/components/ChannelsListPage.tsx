"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { NoAccess } from "@/components/ui/NoAccess";
import { Skeleton } from "@/components/ui/Skeleton";
import { PlusIcon } from "@/components/ui/icons";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { filterChannels, summarizeChannels } from "../channel-logic";
import { fetchChannels } from "../services/channels-api";
import type { ChannelCategory, ChannelFilters, ChannelListItem } from "../types";
import { ChannelDetailPanel } from "./ChannelDetailPanel";
import { ChannelFiltersBar } from "./ChannelFiltersBar";
import { ChannelSummaryTiles } from "./ChannelSummaryTiles";
import { ChannelTable } from "./ChannelTable";

const defaultFilters: ChannelFilters = {
  search: "",
  category: "all",
  lifecycle: "all",
  health: "all",
};

const categoryTabs: { value: ChannelCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "dooh", label: "DOOH" },
  { value: "in_store", label: "In-store" },
];

function ChannelsHeader() {
  return (
    <div className="space-y-3">
      <nav aria-label="Breadcrumb" className="text-xs font-medium text-zinc-400">
        <span>Media Workspace</span>
        <span className="mx-2 text-zinc-300 dark:text-zinc-700">/</span>
        <span className="text-indigo-600 dark:text-indigo-400">Channels</span>
      </nav>
      <PageHeader
        title="Channels"
        subtitle="Manage physical delivery endpoints, assignments and operational health."
        actions={
          <Link href="/channels/create" className={buttonClasses("primary")}>
            <PlusIcon />
            Add Channel
          </Link>
        }
      />
    </div>
  );
}

function TableSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <Skeleton className="h-8 w-full max-w-sm" />
      </div>
      <div className="space-y-2 p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-full" />
        ))}
      </div>
    </Card>
  );
}

function LoadError({
  error,
  retrying,
  onRetry,
}: {
  error: ClassifiedError;
  retrying: boolean;
  onRetry: () => void;
}) {
  return (
    <Card className="border-red-200 p-8 text-center dark:border-red-900/70">
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Channels are unavailable
      </p>
      <p className="mx-auto mt-2 max-w-xl text-sm text-red-600 dark:text-red-400">
        {error.message}
      </p>
      <button
        type="button"
        disabled={retrying}
        onClick={onRetry}
        className="mt-4 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        {retrying ? "Retrying…" : "Retry"}
      </button>
    </Card>
  );
}

export function ChannelsListPage() {
  const [channels, setChannels] = useState<ChannelListItem[] | null>(null);
  const [error, setError] = useState<ClassifiedError | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [filters, setFilters] = useState<ChannelFilters>(defaultFilters);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detailTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let alive = true;
    fetchChannels()
      .then((data) => {
        if (!alive) return;
        setChannels(data);
        setError(null);
      })
      .catch((caught) => {
        if (!alive) return;
        setError(classifyApiError(caught, "Could not load Channels. Try again."));
      });
    return () => {
      alive = false;
    };
  }, []);

  const retry = () => {
    setRetrying(true);
    fetchChannels()
      .then((data) => {
        setChannels(data);
        setError(null);
      })
      .catch((caught) => {
        setError(classifyApiError(caught, "Could not load Channels. Try again."));
      })
      .finally(() => setRetrying(false));
  };

  const summary = useMemo(
    () => (channels === null ? null : summarizeChannels(channels)),
    [channels],
  );
  const filtered = useMemo(
    () => filterChannels(channels ?? [], filters),
    [channels, filters],
  );
  const selected = filtered.find((channel) => channel.id === selectedId) ?? null;
  const hasFilters =
    filters.search.trim() !== "" ||
    filters.category !== "all" ||
    filters.lifecycle !== "all" ||
    filters.health !== "all";

  if (error?.kind === "forbidden") {
    return (
      <div data-testid="channels-list">
        <NoAccess message={error.message} />
      </div>
    );
  }

  return (
    <div data-testid="channels-list" className="flex flex-col gap-5">
      <ChannelsHeader />
      {!(channels === null && error !== null) && <ChannelSummaryTiles summary={summary} />}

      {channels === null && error === null ? (
        <TableSkeleton />
      ) : channels === null && error !== null ? (
        <LoadError error={error} retrying={retrying} onRetry={retry} />
      ) : (
        <div
          className={
            selected
              ? "grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]"
              : "min-w-0"
          }
        >
          <Card className="min-w-0 overflow-hidden">
            <div
              role="group"
              aria-label="Filter by channel category"
              className="flex items-center border-b border-zinc-100 px-4 dark:border-zinc-800"
            >
              {categoryTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  aria-pressed={filters.category === tab.value}
                  onClick={() => setFilters({ ...filters, category: tab.value })}
                  className={`border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
                    filters.category === tab.value
                      ? "border-indigo-600 text-indigo-700 dark:text-indigo-400"
                      : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              <span className="ml-auto text-xs tabular-nums text-zinc-400">
                {filtered.length} of {channels!.length}
              </span>
            </div>

            <ChannelFiltersBar value={filters} onChange={setFilters} />

            {filtered.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {channels!.length === 0
                    ? "No Channels yet"
                    : "No Channels match these filters"}
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  {channels!.length === 0
                    ? "Use Add Channel to create the first delivery endpoint."
                    : "Adjust the search or filters to widen the result set."}
                </p>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={() => setFilters(defaultFilters)}
                    className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <ChannelTable
                rows={filtered}
                selectedId={selectedId}
                onSelect={(channel, trigger) => {
                  if (trigger && selectedId === channel.id) {
                    setSelectedId(null);
                    return;
                  }
                  detailTriggerRef.current =
                    trigger ??
                    (document.getElementById(
                      `channel-detail-trigger-${channel.id}`,
                    ) as HTMLButtonElement | null);
                  setSelectedId(channel.id);
                }}
              />
            )}
          </Card>

          {selected && (
            <ChannelDetailPanel
              channel={selected}
              onClose={() => {
                const trigger = detailTriggerRef.current;
                setSelectedId(null);
                requestAnimationFrame(() => trigger?.focus());
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
