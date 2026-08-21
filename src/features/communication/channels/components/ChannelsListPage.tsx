"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { NoAccess } from "@/components/ui/NoAccess";
import { Pagination } from "@/components/ui/Pagination";
import { PlusIcon } from "@/components/ui/icons";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { filterChannels, summarizeChannels } from "../channel-logic";
import { fetchChannels } from "../services/channels-api";
import { groupByCategory, paginate, sortChannels } from "../list-filtering";
import { DEFAULT_STATE, readListState, writeListState } from "../list-url-state";
import type { ChannelCategory, ChannelListItem } from "../types";
import { ChannelDetailPanel } from "./ChannelDetailPanel";
import { ChannelFiltersBar } from "./ChannelFiltersBar";
import { ChannelSummaryTiles } from "./ChannelSummaryTiles";
import { ChannelTable } from "./ChannelTable";
import { ListEmpty, LoadError, TableSkeleton, TabButton } from "./ChannelsListStates";

const categoryTabs: { value: ChannelCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "dooh", label: "DOOH" },
  { value: "in_store", label: "In-store" },
  { value: "online", label: "Online" },
  { value: "social", label: "Social" },
];

function ChannelsHeader() {
  return (
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
  );
}

export function ChannelsListPage() {
  const [channels, setChannels] = useState<ChannelListItem[] | null>(null);
  const [error, setError] = useState<ClassifiedError | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detailTriggerRef = useRef<HTMLButtonElement | null>(null);

  const [state, setState] = useState(() => {
    if (typeof window !== "undefined") {
      return readListState(new URLSearchParams(window.location.search));
    }
    return readListState(new URLSearchParams());
  });

  useEffect(() => {
    window.history.replaceState(null, "", "?" + writeListState(state));
  }, [state]);

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
      .catch((caught) => setError(classifyApiError(caught, "Could not load Channels. Try again.")))
      .finally(() => setRetrying(false));
  };

  const summary = useMemo(() => (channels === null ? null : summarizeChannels(channels)), [channels]);
  
  const { filtered, page, groups } = useMemo(() => {
    if (channels === null) return { filtered: [], page: { rows: [], page: 1, totalPages: 1 }, groups: [] };
    const filtered = filterChannels(channels, state.filters);
    const sorted = sortChannels(filtered, state.sort);
    const page = paginate(sorted, state.page, state.perPage);
    const groups = groupByCategory(page.rows);
    return { filtered, page, groups };
  }, [channels, state]);

  const selected = filtered.find((channel) => channel.id === selectedId) ?? null;
  const hasFilters =
    state.filters.search.trim() !== "" ||
    state.filters.category !== "all" ||
    state.filters.lifecycle !== "all";

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
        <div className={selected ? "grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]" : "min-w-0"}>
          <Card className="min-w-0 overflow-hidden flex flex-col">
            <div
              role="group"
              aria-label="Filter by channel category"
              className="flex items-center border-b border-zinc-100 px-4 dark:border-zinc-800"
            >
              {categoryTabs.map((tab) => (
                <TabButton
                  key={tab.value}
                  active={state.filters.category === tab.value}
                  label={tab.label}
                  count={
                    tab.value === "all"
                      ? channels!.length
                      : channels!.filter((c) => c.category === tab.value).length
                  }
                  onClick={() =>
                    setState({ ...state, filters: { ...state.filters, category: tab.value }, page: 1 })
                  }
                />
              ))}
            </div>

            <ChannelFiltersBar
              value={state.filters}
              onChange={(filters) => setState({ ...state, filters, page: 1 })}
            />

            {filtered.length === 0 ? (
              <ListEmpty
                isEmpty={channels!.length === 0}
                hasFilters={hasFilters}
                onClearFilters={() =>
                  setState({ ...state, filters: DEFAULT_STATE.filters, page: 1 })
                }
              />
            ) : (
              <>
                <ChannelTable
                  groups={groups}
                  sort={state.sort}
                  onSortChange={(key) =>
                    setState({
                      ...state,
                      sort: { key, dir: state.sort.key === key && state.sort.dir === "desc" ? "asc" : "desc" },
                      page: 1,
                    })
                  }
                  selectedId={selectedId}
                  onSelect={(channel, trigger) => {
                    if (trigger && selectedId === channel.id) {
                      setSelectedId(null);
                      return;
                    }
                    detailTriggerRef.current =
                      trigger ??
                      (document.getElementById(`channel-detail-trigger-${channel.id}`) as HTMLButtonElement | null);
                    setSelectedId(channel.id);
                  }}
                />
                <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
                  <Pagination
                    page={page.page}
                    totalPages={page.totalPages}
                    perPage={state.perPage}
                    totalItems={filtered.length}
                    rangeStart={(page.page - 1) * state.perPage + 1}
                    rangeEnd={Math.min(page.page * state.perPage, filtered.length)}
                    onPageChange={(p) => setState({ ...state, page: p })}
                    onPerPageChange={(per) => setState({ ...state, perPage: per, page: 1 })}
                  />
                </div>
              </>
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
