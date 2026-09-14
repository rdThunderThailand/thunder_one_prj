"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useListUrlState } from "@/hooks/use-list-url-state";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { NoAccess } from "@/components/ui/NoAccess";
import { Pagination } from "@/components/ui/Pagination";
import { PlusIcon } from "@/components/ui/icons";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { fetchNowNext } from "../../publications/now-next";
import { filterChannels, summarizeChannels } from "../channel-logic";
import { indexNowNextByChannel } from "../now-playing";
import { fetchChannels } from "../services/channels-api";
import { fetchChannelGroupsCount } from "../services/channel-groups-api";
import { paginate, sortChannels } from "../list-filtering";
import { DEFAULT_STATE, readListState, writeListState } from "../list-url-state";
import type { ChannelListItem } from "../types";
import { ChannelDetailPanel } from "./ChannelDetailPanel";
import { ChannelFiltersBar } from "./ChannelFiltersBar";
import { ChannelSummaryTiles } from "./ChannelSummaryTiles";
import { ChannelTable } from "./ChannelTable";
import { ListEmpty, LoadError, TableSkeleton } from "./ChannelsListStates";

function ChannelsHeader() {
  return (
    <PageHeader
      title="All Channels"
      subtitle="Manage and monitor all your channels, grouped by type, location, and purpose."
      actions={
        <Link href="/media-workspace/channels/create" className={buttonClasses("primary")}>
          <PlusIcon />
          Create Channel
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

  // Independent of `channels`/`error` above: Now Playing and the Channel Groups tile degrade on
  // their own (a "–" cell, a skeleton tile) without blocking the Channels list itself.
  const [nowNext, setNowNext] = useState<ReturnType<typeof indexNowNextByChannel>>(new Map());
  const [displayTimezone, setDisplayTimezone] = useState("Asia/Bangkok");
  const [groupCount, setGroupCount] = useState<number | null>(null);

  const [state, setState] = useState(() => {
    if (typeof window !== "undefined") {
      return readListState(new URLSearchParams(window.location.search));
    }
    return readListState(new URLSearchParams());
  });

  const restore = useCallback(() => {
    setState(readListState(new URLSearchParams(window.location.search)));
  }, []);
  // An empty query string is exactly the "everything is at its default" signal, so it
  // doubles as the test for whether "Clear all" would do anything. Resetting the whole
  // ListState at once is the entire handler here — this page already holds it as one object.
  const qs = writeListState(state);
  useListUrlState(qs, restore);
  const handleClearAll = () => setState(DEFAULT_STATE);

  const load = useCallback(() => {
    return fetchChannels().then((data) => {
      setChannels(data);
      setError(null);
    });
  }, []);

  useEffect(() => {
    let alive = true;
    load().catch((caught) => {
      if (!alive) return;
      setError(classifyApiError(caught, "Could not load Channels. Try again."));
    });
    // Now Playing and the Groups tile are read-only extras — a failure here shows as an empty
    // "–" / skeleton rather than the page-level LoadError, so it must not throw into `load()`.
    fetchNowNext(60, true)
      .then((response) => {
        if (!alive) return;
        setNowNext(indexNowNextByChannel(response.rows));
        setDisplayTimezone(response.display_timezone);
      })
      .catch(() => {});
    fetchChannelGroupsCount()
      .then((count) => alive && setGroupCount(count))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [load]);

  const retry = () => {
    setRetrying(true);
    load()
      .catch((caught) => setError(classifyApiError(caught, "Could not load Channels. Try again.")))
      .finally(() => setRetrying(false));
  };

  const summary = useMemo(() => (channels === null ? null : summarizeChannels(channels)), [channels]);

  const { filtered, page } = useMemo(() => {
    if (channels === null) return { filtered: [], page: { rows: [], page: 1, totalPages: 1 } };
    const filtered = filterChannels(channels, state.filters);
    const sorted = sortChannels(filtered, state.sort);
    const page = paginate(sorted, state.page, state.perPage);
    return { filtered, page };
  }, [channels, state]);

  const selected = filtered.find((channel) => channel.id === selectedId) ?? null;
  const hasFilters =
    state.filters.search.trim() !== "" ||
    state.filters.type !== "all" ||
    state.filters.status !== "all" ||
    state.filters.lifecycle !== "all";

  const handleChanged = (updated: ChannelListItem) => {
    setChannels((current) => current?.map((c) => (c.id === updated.id ? updated : c)) ?? current);
  };

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
      {!(channels === null && error !== null) && (
        <ChannelSummaryTiles summary={summary} groupCount={groupCount} />
      )}

      {channels === null && error === null ? (
        <TableSkeleton />
      ) : channels === null && error !== null ? (
        <LoadError error={error} retrying={retrying} onRetry={retry} />
      ) : (
        <div className={selected ? "grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]" : "min-w-0"}>
          <Card className="min-w-0 overflow-hidden flex flex-col">
            <ChannelFiltersBar
              value={state.filters}
              sort={state.sort}
              onClearAll={qs === "" ? undefined : handleClearAll}
              onChange={(filters) => setState({ ...state, filters, page: 1 })}
              onSortChange={(sort) => setState({ ...state, sort, page: 1 })}
            />

            {filtered.length === 0 ? (
              <ListEmpty
                isEmpty={channels!.length === 0}
                hasFilters={hasFilters}
                onClearFilters={handleClearAll}
              />
            ) : (
              <>
                <ChannelTable
                  channels={page.rows}
                  nowNext={nowNext}
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
                  onChanged={handleChanged}
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
              occurrence={nowNext.get(selected.id)}
              displayTimezone={displayTimezone}
              onClose={() => {
                const trigger = detailTriggerRef.current;
                setSelectedId(null);
                requestAnimationFrame(() => trigger?.focus());
              }}
              onChanged={handleChanged}
            />
          )}
        </div>
      )}
    </div>
  );
}
