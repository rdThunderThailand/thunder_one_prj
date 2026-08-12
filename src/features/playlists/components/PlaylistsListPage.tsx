"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { SearchIcon } from "@/components/ui/icons";
import { NoAccess } from "@/components/ui/NoAccess";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { fetchPlaylists, upsertPlaylist } from "../services/playlists-api";
import { decodeMetadata, resolveCoverAssetId } from "../metadata";
import { statusBadge } from "../status-display";
import type { PlaylistListItem, PlaylistStatus } from "../types";
import { PlaylistDetailPanel } from "./PlaylistDetailPanel";

const STATUS_FILTERS: { value: PlaylistStatus | "all"; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "draft", label: "Draft" },
];

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{value}</p>
    </Card>
  );
}

function PlaylistRow({
  playlist,
  selected,
  onSelect,
}: {
  playlist: PlaylistListItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const metadata = decodeMetadata(playlist.metadata);
  const coverId = playlist.cover_asset_id ?? resolveCoverAssetId(metadata.info.coverAssetId, []);
  const coverIds = useMemo(() => (coverId ? [coverId] : []), [coverId]);
  const previews = usePreviewUrls(coverIds);

  return (
    <tr
      onClick={onSelect}
      className={`cursor-pointer border-b border-zinc-100 last:border-0 dark:border-zinc-800 ${
        selected ? "bg-indigo-50/60 dark:bg-indigo-500/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      }`}
    >
      <td className="py-3 pl-1">
        <div className="flex items-center gap-3">
          <MediaThumb url={coverId ? previews[coverId] : undefined} alt={playlist.name} className="h-10 w-14" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {playlist.name}
            </p>
            {playlist.created_by?.display_name && (
              <p className="truncate text-xs text-zinc-400">
                By {playlist.created_by.display_name}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="py-3 text-sm text-zinc-600 dark:text-zinc-300">
        {metadata.info.playlistType ?? "standard"}
      </td>
      <td className="py-3 text-sm text-zinc-600 dark:text-zinc-300">{playlist.item_count}</td>
      <td className="py-3">
        <Badge color={statusBadge(playlist.status).color} variant="pill">
          {statusBadge(playlist.status).label}
        </Badge>
      </td>
      <td className="py-3 text-sm text-zinc-500 dark:text-zinc-400">
        {playlist.created_at?.slice(0, 10) ?? "—"}
      </td>
    </tr>
  );
}

export function PlaylistsListPage() {
  const [playlists, setPlaylists] = useState<PlaylistListItem[] | null>(null);
  const [error, setError] = useState<ClassifiedError | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PlaylistStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchPlaylists(true)
      .then((data) => alive && setPlaylists(data))
      .catch((err) => alive && setError(classifyApiError(err, "โหลด playlists ไม่สำเร็จ")));
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!playlists) return [];
    const needle = query.trim().toLowerCase();
    return playlists.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (needle && !p.name.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [playlists, query, status]);

  const stats = useMemo(() => {
    const total = playlists?.length ?? 0;
    const active = playlists?.filter((p) => p.status === "active").length ?? 0;
    const inactive = playlists?.filter((p) => p.status === "inactive").length ?? 0;
    const draft = playlists?.filter((p) => p.status === "draft").length ?? 0;
    return { total, active, inactive, draft };
  }, [playlists]);

  const selected = filtered.find((p) => p.id === selectedId) ?? null;

  const handleStatusChange = async (id: string, next: PlaylistStatus) => {
    const target = playlists?.find((p) => p.id === id);
    if (!target) return;
    // Optimistic: archiving is low-stakes and instantly reversible from the same panel.
    setPlaylists((prev) => prev?.map((p) => (p.id === id ? { ...p, status: next } : p)) ?? prev);
    try {
      await upsertPlaylist({ playlistId: id, name: target.name, status: next });
    } catch (err) {
      setPlaylists((prev) => prev?.map((p) => (p.id === id ? { ...p, status: target.status } : p)) ?? prev);
      setError(classifyApiError(err, "อัปเดตสถานะไม่สำเร็จ"));
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

      <div className="flex flex-1 gap-4">
        <Card className="flex-1 p-5">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-56 flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by playlist name..."
                className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PlaylistStatus | "all")}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {playlists === null ? (
            <p className="py-10 text-center text-sm text-zinc-400">กำลังโหลด...</p>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-400">ไม่พบ playlist</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  <th className="py-2 pl-1">Playlist Name</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Items</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <PlaylistRow
                    key={p.id}
                    playlist={p}
                    selected={p.id === selectedId}
                    onSelect={() => setSelectedId(p.id === selectedId ? null : p.id)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {selected && (
          <PlaylistDetailPanel
            playlist={selected}
            onClose={() => setSelectedId(null)}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>
    </div>
  );
}
