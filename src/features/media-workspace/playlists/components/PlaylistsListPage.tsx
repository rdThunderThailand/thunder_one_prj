"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useListUrlState } from "@/hooks/use-list-url-state";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { NoAccess } from "@/components/ui/NoAccess";
import { Pagination } from "@/components/ui/Pagination";
import { fetchCampaigns } from "@/lib/api/media-api";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import type { Campaign } from "@/types/domain";
import { deletePlaylist, duplicatePlaylist, fetchPlaylists } from "../services/playlists-api";
import { copyName, filterPlaylists, paginate, playlistCampaignId, sortPlaylists, summarize } from "../list-filtering";
import { describeDeleteError } from "../status-display";
import { readListState, writeListState, DEFAULT_STATE } from "../list-url-state";
import type { OwnershipTab, Sort, SortKey } from "../list-filtering";
import type { PlaylistListItem } from "../types";
import { PlaylistsFilters, type FilterState } from "./PlaylistsFilters";
import { PlaylistsTable, type RowAction } from "./PlaylistsTable";
import { PlaylistSidePanel } from "./PlaylistSidePanel";
import { emptyCause, hasActiveFilters } from "../list-empty-state";
import { ListEmpty, ListError, ListSkeleton, StatCard, SummarySkeleton, TabButton } from "./PlaylistsListStates";

export function PlaylistsListPage({ currentUserId }: { currentUserId: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Read once on mount — the URL is the initial value, not a live subscription, so
  // typing in the search box doesn't fight with the effect that writes it back below.
  const [initial] = useState(() => readListState(new URLSearchParams(searchParams.toString())));
  const [playlists, setPlaylists] = useState<PlaylistListItem[] | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [error, setError] = useState<ClassifiedError | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<OwnershipTab>(initial.tab);
  const [filters, setFilters] = useState<FilterState>(initial.filters);
  const [sort, setSort] = useState<Sort>(initial.sort);
  const [page, setPage] = useState(initial.page);
  const [perPage, setPerPage] = useState(initial.perPage);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Keeps the URL in sync with the view (push/replace decided by useListUrlState — a
  // search-typing run collapses into one history step) and restores tab/filters/sort/page
  // from window.location on Back/Forward.
  const restore = useCallback(() => {
    const s = readListState(new URLSearchParams(window.location.search));
    setTab(s.tab);
    setFilters(s.filters);
    setSort(s.sort);
    setPage(s.page);
    setPerPage(s.perPage);
  }, []);
  // An empty query string is exactly the "everything is at its default" signal, so it
  // doubles as the test for whether "Clear all" would do anything.
  const qs = writeListState({ tab, filters, sort, page, perPage });
  useListUrlState(qs, restore);

  const handleSortChange = (key: SortKey) => {
    setSort((current) => {
      if (current.key === key) return { key, dir: current.dir === "asc" ? "desc" : "asc" };
      return { key, dir: key === "updated" || key === "duration" ? "desc" : "asc" };
    });
    setPage(1);
  };

  // One dataset feeds the cards, both tab counts, the filters and the page slice — the
  // list RPC already returns one row per playlist (Thunder_Core migration 087), so
  // nothing here has to guard against the same playlist arriving twice.
  useEffect(() => {
    let alive = true;
    fetchPlaylists(true)
      .then((data) => alive && setPlaylists(data))
      .catch(
        (err) => alive && setError(classifyApiError(err, "โหลด playlists ไม่สำเร็จ"))
      );
    return () => {
      alive = false;
    };
  }, []);

  // Filter options load beside the dataset: a failure here leaves the Campaign dropdown
  // with "All Campaigns" alone rather than blocking the table.
  useEffect(() => {
    let alive = true;
    fetchCampaigns()
      .then((data) => alive && setCampaigns(data))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Keeps current rows on failure — retry preserves filters/sort/tab/page since
  // they live in component state reload() never touches.
  const reload = () => {
    setRefreshing(true);
    return fetchPlaylists(true)
      .then((data) => {
        setPlaylists(data);
        setError(null);
        setRefreshing(false);
      })
      .catch((err) => {
        setError(classifyApiError(err, "โหลด playlists ไม่สำเร็จ"));
        setRefreshing(false);
      });
  };

  const campaignNames = useMemo(
    () => Object.fromEntries(campaigns.map((c) => [c.id, c.name])),
    [campaigns]
  );

  const mineCount = useMemo(
    () => (playlists ?? []).filter((p) => p.created_by?.id === currentUserId).length,
    [playlists, currentUserId]
  );

  const filtered = useMemo(
    () => filterPlaylists(playlists ?? [], { ...filters, tab, currentUserId }),
    [playlists, filters, tab, currentUserId]
  );

  const sorted = useMemo(
    () => sortPlaylists(filtered, sort, campaignNames),
    [filtered, sort, campaignNames]
  );

  // paginate() clamps the page itself, so narrowing a filter can never strand the view.
  const { rows, page: currentPage, totalPages } = paginate(sorted, page, perPage);
  const selected = filtered.find((p) => p.id === selectedId) ?? null;

  // Clear Filters resets filters to defaults and page to 1.
  // Resets the tab, sort and paging alongside the filters: the button says "Clear all",
  // and its promise is that the view — and the URL — come back to their pristine state.
  const handleClearAll = () => {
    setTab(DEFAULT_STATE.tab);
    setFilters(DEFAULT_STATE.filters);
    setSort(DEFAULT_STATE.sort);
    setPage(DEFAULT_STATE.page);
    setPerPage(DEFAULT_STATE.perPage);
  };

  const handleAction = async (action: RowAction, playlist: PlaylistListItem) => {
    if (action === "edit") {
      router.push(`/playlists/create?id=${playlist.id}`);
      return;
    }

    setActionError(null);
    setBusyId(playlist.id);
    try {
      if (action === "duplicate") {
        const { itemsCopied } = await duplicatePlaylist(
          playlist.id,
          copyName(playlist.name, (playlists ?? []).map((p) => p.name))
        );
        if (!itemsCopied) {
          setActionError("คัดลอก playlist แล้ว แต่ยังคัดลอกเนื้อหาไม่สำเร็จ — เปิดฉบับร่างเพื่อเพิ่มสื่อเอง");
        }
      } else {
        await deletePlaylist(playlist.id);
        setSelectedId((id) => (id === playlist.id ? null : id));
      }
      await reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setActionError(
        action === "delete"
          ? describeDeleteError(message)
          : classifyApiError(err, "คัดลอก playlist ไม่สำเร็จ").message
      );
    } finally {
      setBusyId(null);
    }
  };

  if (error?.kind === "forbidden") {
    return <NoAccess />;
  }

  // Stats are derived only when data is available — never show 0/0/0/0 during load.
  const stats = playlists !== null ? summarize(playlists) : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Playlists"
        subtitle="Create and manage playlists for your campaigns and channels."
        actions={
          <Link href="/media-workspace/playlists/create" className={buttonClasses("primary")}>
            + Create Playlist
          </Link>
        }
      />

      {/* Summary row: skeleton during initial load, real cards once data arrives */}
      {stats === null ? (
        <SummarySkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Playlists" value={stats.total} />
          <StatCard label="Active" value={stats.active} />
          <StatCard label="Inactive" value={stats.inactive} />
          <StatCard label="Draft" value={stats.draft} />
        </div>
      )}

      <div className={selected ? "grid gap-6 lg:grid-cols-[1fr_380px]" : ""}>
        <Card className="p-5">
          <div
            role="tablist"
            className="mb-4 flex items-center gap-1 border-b border-zinc-100 dark:border-zinc-800"
          >
            <TabButton
              active={tab === "all"}
              label="All Playlists"
              count={playlists?.length ?? 0}
              onClick={() => setTab("all")}
            />
            <TabButton
              active={tab === "mine"}
              label="My Playlists"
              count={mineCount}
              onClick={() => setTab("mine")}
            />
            {/* กำลังรีเฟรช… shown only during a background reload, not initial load */}
            {refreshing && playlists !== null && (
              <span className="ml-auto text-xs text-zinc-400">กำลังรีเฟรช…</span>
            )}
          </div>

          <PlaylistsFilters
            onClearAll={qs === "" ? undefined : handleClearAll}
            value={filters}
            campaigns={campaigns}
            onChange={(next) => {
              setFilters(next);
              setPage(1);
            }}
          />

          {actionError && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{actionError}</p>}

          {/* Error card shown above the table when a background refresh failed */}
          {error && playlists !== null && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
              <p className="text-sm text-red-500">{error.message}</p>
            </div>
          )}

          {playlists === null && !error ? (
            // Initial load — no data yet, no error: show skeletons
            <ListSkeleton />
          ) : playlists === null && error ? (
            // Initial load failed — no data at all: show full-page error with Retry, no spinner
            <ListError message={error.message} onRetry={reload} retrying={refreshing} />
          ) : rows.length === 0 ? (
            // Data loaded but this view is empty: show cause-specific message
            <ListEmpty
              cause={emptyCause({
                totalCount: playlists!.length,
                mineCount,
                tab,
                hasActiveFilters: hasActiveFilters(filters),
              })}
              onClearFilters={handleClearAll}
            />
          ) : (
            <>
              <PlaylistsTable
                rows={rows}
                campaignNames={campaignNames}
                selectedId={selectedId}
                busyId={busyId}
                sort={sort}
                onSelect={(playlist) => setSelectedId(playlist.id)}
                onAction={handleAction}
                onSortChange={handleSortChange}
              />
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                perPage={perPage}
                totalItems={sorted.length}
                rangeStart={(currentPage - 1) * perPage + 1}
                rangeEnd={Math.min(currentPage * perPage, sorted.length)}
                onPageChange={setPage}
                onPerPageChange={(next) => {
                  setPerPage(next);
                  setPage(1);
                }}
              />
            </>
          )}
        </Card>

        {selected && (
          <PlaylistSidePanel
            key={selected.id}
            playlist={selected}
            campaignName={campaignNames[playlistCampaignId(selected) ?? ""]}
            busy={busyId === selected.id}
            onClose={() => setSelectedId(null)}
            onDuplicate={() => handleAction("duplicate", selected)}
            onDelete={() => handleAction("delete", selected)}
          />
        )}
      </div>
    </div>
  );
}
