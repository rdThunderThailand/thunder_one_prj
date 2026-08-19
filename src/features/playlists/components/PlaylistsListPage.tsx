"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { NoAccess } from "@/components/ui/NoAccess";
import { Pagination } from "@/components/ui/Pagination";
import { fetchCampaigns } from "@/lib/api/media-api";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import type { Campaign } from "@/types/domain";
import { deletePlaylist, duplicatePlaylist, fetchPlaylists } from "../services/playlists-api";
import { copyName, filterPlaylists, paginate, playlistCampaignId, summarize } from "../list-filtering";
import { describeDeleteError } from "../status-display";
import type { OwnershipTab } from "../list-filtering";
import type { PlaylistListItem } from "../types";
import { PlaylistsFilters, type FilterState } from "./PlaylistsFilters";
import { PlaylistsTable, type RowAction } from "./PlaylistsTable";
import { PlaylistSidePanel } from "./PlaylistSidePanel";

const EMPTY_FILTERS: FilterState = {
  query: "",
  status: "all",
  type: "all",
  campaignId: "all",
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{value}</p>
    </Card>
  );
}

function TabButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
          : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      }`}
    >
      {label} ({count})
    </button>
  );
}

export function PlaylistsListPage({ currentUserId }: { currentUserId: string | null }) {
  const router = useRouter();
  const [playlists, setPlaylists] = useState<PlaylistListItem[] | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [error, setError] = useState<ClassifiedError | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<OwnershipTab>("all");
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const reload = () =>
    fetchPlaylists(true)
      .then(setPlaylists)
      .catch((err) => setError(classifyApiError(err, "โหลด playlists ไม่สำเร็จ")));

  const campaignNames = useMemo(
    () => Object.fromEntries(campaigns.map((c) => [c.id, c.name])),
    [campaigns]
  );

  const stats = useMemo(() => summarize(playlists ?? []), [playlists]);
  const mineCount = useMemo(
    () => (playlists ?? []).filter((p) => p.created_by?.id === currentUserId).length,
    [playlists, currentUserId]
  );

  const filtered = useMemo(
    () => filterPlaylists(playlists ?? [], { ...filters, tab, currentUserId }),
    [playlists, filters, tab, currentUserId]
  );

  // paginate() clamps the page itself, so narrowing a filter can never strand the view
  // on a page that no longer exists — no reset effect needed.
  const { rows, page: currentPage, totalPages } = paginate(filtered, page, perPage);
  const selected = filtered.find((p) => p.id === selectedId) ?? null;

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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Playlists"
        subtitle="Create and manage playlists for your campaigns and channels."
        actions={
          <Link href="/playlists/create" className={buttonClasses("primary")}>
            + Create Playlist
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Playlists" value={stats.total} />
        <StatCard label="Active" value={stats.active} />
        <StatCard label="Inactive" value={stats.inactive} />
        <StatCard label="Draft" value={stats.draft} />
      </div>

      {error && (
        <Card className="p-4">
          <p className="text-sm text-red-500">{error.message}</p>
        </Card>
      )}

      <div className={selected ? "grid gap-6 lg:grid-cols-[1fr_380px]" : ""}>
        <Card className="p-5">
          <div
            role="tablist"
            className="mb-4 flex gap-1 border-b border-zinc-100 dark:border-zinc-800"
          >
            <TabButton
              active={tab === "all"}
              label="All Playlists"
              count={stats.total}
              onClick={() => setTab("all")}
            />
            <TabButton
              active={tab === "mine"}
              label="My Playlists"
              count={mineCount}
              onClick={() => setTab("mine")}
            />
          </div>

          <PlaylistsFilters
            value={filters}
            campaigns={campaigns}
            onChange={(next) => {
              setFilters(next);
              setPage(1);
            }}
          />

          {actionError && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{actionError}</p>}

          {playlists === null ? (
            <p className="py-10 text-center text-sm text-zinc-400">กำลังโหลด...</p>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-400">ไม่พบ playlist</p>
          ) : (
            <>
              <PlaylistsTable
                rows={rows}
                campaignNames={campaignNames}
                selectedId={selectedId}
                busyId={busyId}
                onSelect={(playlist) => setSelectedId(playlist.id)}
                onAction={handleAction}
              />
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                perPage={perPage}
                totalItems={filtered.length}
                rangeStart={(currentPage - 1) * perPage + 1}
                rangeEnd={Math.min(currentPage * perPage, filtered.length)}
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
