"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { CalendarIcon, ClockIcon, ExternalLinkIcon, GridIcon, ListIcon, SearchIcon, UsersIcon } from "@/components/ui/icons";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { fetchPlaylist, fetchPlaylists } from "@/lib/api/media-api";
import type { PlaylistDetail, PlaylistListItem } from "@/types/domain";
import { formatDuration } from "../../playlists/duration";
import { decodeMetadata } from "../../playlists/metadata";
import { playlistDisplayStatus, statusBadge } from "../../playlists/status-display";
import { defaultPlaylistPickerFilters, filterPlaylistPickerItems, type PlaylistPickerFilters } from "../playlist-picker-filter";
import { PickerDetailPanel, PickerFilterChoice, PickerFilterPanel, PickerFilterSection, type PickerDetailField } from "./PickerPanels";

const PER_PAGE = 9;
const coverId = (playlist: PlaylistListItem) => playlist.cover_asset_id ?? decodeMetadata(playlist.metadata).info.coverAssetId;

const formatDate = (value?: string) =>
  value && !Number.isNaN(new Date(value).getTime())
    ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—";

const formatDateTime = (value?: string) =>
  value && !Number.isNaN(new Date(value).getTime())
    ? new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

export function PlaylistPickerModal({ selectedId, onClose, onSelect }: { selectedId: string | null; onClose: () => void; onSelect: (id: string) => void }) {
  const [playlists, setPlaylists] = useState<PlaylistListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(defaultPlaylistPickerFilters);
  const [stagedId, setStagedId] = useState(selectedId);
  const [detailResult, setDetailResult] = useState<{ id: string; detail: PlaylistDetail } | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"newest" | "oldest" | "name">("newest");
  const [view, setView] = useState<"grid" | "list">("list");
  const [contentExpanded, setContentExpanded] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchPlaylists().then((rows) => { if (alive) setPlaylists(rows); }).catch(() => { if (alive) setError("Failed to load playlists."); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!stagedId) return;
    let alive = true;
    fetchPlaylist(stagedId).then((detail) => { if (alive) setDetailResult({ id: stagedId, detail }); }).catch(() => undefined);
    return () => { alive = false; };
  }, [stagedId]);

  const filtered = useMemo(() => filterPlaylistPickerItems(playlists ?? [], filters), [playlists, filters]);
  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        const comparison = (b.updated_at ?? b.created_at ?? "").localeCompare(a.updated_at ?? a.created_at ?? "");
        return sort === "oldest" ? -comparison : comparison;
      }),
    [filtered, sort],
  );
  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const visible = sorted.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  const selected = playlists?.find((row) => row.id === stagedId);
  const detail = detailResult?.id === stagedId ? detailResult.detail : null;
  const covers = useMemo(
    () => [...new Set([...visible, ...(selected ? [selected] : [])].map(coverId).filter((id): id is string => !!id))],
    [visible, selected],
  );
  const previews = usePreviewUrls(covers);
  const creators = useMemo(
    () => [...new Map((playlists ?? []).flatMap((row) => (row.created_by ? [[row.created_by.id, row.created_by]] : []))).values()],
    [playlists],
  );
  const tags = useMemo(
    () => [...new Map((playlists ?? []).flatMap((row) => (row.tags ?? []).map((tag) => [tag.id, tag]))).values()],
    [playlists],
  );
  const update = (next: Partial<PlaylistPickerFilters>) => { setFilters((current) => ({ ...current, ...next })); setPage(1); };
  const selectPlaylist = (id: string) => { setStagedId(id); setContentExpanded(false); };

  const footer = (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="shrink-0 text-xs font-medium text-zinc-600">{stagedId ? "1 item selected" : "0 items selected"}</span>
        {selected && (
          <span className="inline-flex max-w-64 items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/60 px-2 py-1 text-xs text-zinc-700">
            <span className="truncate">{selected.name}</span>
            <button type="button" onClick={() => setStagedId(null)} aria-label={`Remove ${selected.name}`} className="text-zinc-400 hover:text-zinc-700">×</button>
          </span>
        )}
      </div>
      <div className="flex shrink-0 gap-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-zinc-200 px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Cancel</button>
        <button type="button" disabled={!stagedId} onClick={() => stagedId && onSelect(stagedId)} className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">Select →</button>
      </div>
    </div>
  );

  return (
    <Modal open onClose={onClose} title="Playlist Picker" size="preview" showCloseButton footer={footer}>
      <p className="-mt-2 text-xs text-zinc-500">เลือก Playlist ที่ต้องการใช้งาน</p>
      <div className="mt-1 flex items-center gap-2 border-y border-zinc-200 py-3">
        <label className="relative min-w-64 flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={filters.query}
            onChange={(event) => update({ query: event.target.value })}
            placeholder="Search playlists by name, creator, or tag..."
            className="w-full rounded-lg border border-zinc-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>
        <Link href="/media-workspace/playlists" target="_blank" className="inline-flex items-center gap-1 px-2 py-2 text-sm font-medium text-indigo-700">
          Playlist Library <ExternalLinkIcon />
        </Link>
      </div>
      <div className="grid h-[min(42rem,calc(100vh-15rem))] min-h-[30rem] grid-cols-[11rem_minmax(0,1fr)_16rem] overflow-hidden border-b border-zinc-200">
        <PickerFilterPanel onClear={() => { setFilters(defaultPlaylistPickerFilters); setPage(1); }}>
          <PickerFilterSection label="Status">
            <div role="radiogroup" aria-label="Status">
              <PickerFilterChoice checked={filters.status === "all"} label="All Status" onClick={() => update({ status: "all" })} />
              <PickerFilterChoice
                checked={filters.status === "active"}
                label="Active"
                marker={<span className="h-2 w-2 rounded-full bg-emerald-500" />}
                onClick={() => update({ status: "active" })}
              />
              <PickerFilterChoice
                checked={filters.status === "draft"}
                label="Draft"
                marker={<span className="h-2 w-2 rounded-full bg-amber-500" />}
                onClick={() => update({ status: "draft" })}
              />
              <PickerFilterChoice
                checked={filters.status === "inactive"}
                label="Inactive"
                marker={<span className="h-2 w-2 rounded-full bg-zinc-400" />}
                onClick={() => update({ status: "inactive" })}
              />
            </div>
          </PickerFilterSection>
          <PickerFilterSection label="Duration" divided>
            <div className="flex items-center gap-1">
              <input
                aria-label="Minimum duration"
                inputMode="numeric"
                value={filters.minDuration}
                onChange={(event) => update({ minDuration: event.target.value })}
                placeholder="Min"
                className="min-w-0 rounded-lg border border-zinc-200 px-2 py-2 text-xs"
              />
              <span className="text-[10px] text-zinc-400">to</span>
              <input
                aria-label="Maximum duration"
                inputMode="numeric"
                value={filters.maxDuration}
                onChange={(event) => update({ maxDuration: event.target.value })}
                placeholder="Max"
                className="min-w-0 rounded-lg border border-zinc-200 px-2 py-2 text-xs"
              />
            </div>
          </PickerFilterSection>
          <PickerFilterSection label="Created by" divided>
            <select aria-label="Created by" value={filters.creatorId} onChange={(event) => update({ creatorId: event.target.value })} className="w-full rounded-lg border border-zinc-200 px-2 py-2 text-xs">
              <option value="">All Creators</option>
              {creators.map((creator) => <option key={creator.id} value={creator.id}>{creator.display_name}</option>)}
            </select>
          </PickerFilterSection>
          <PickerFilterSection label="Tags" divided>
            <select aria-label="Tag" value={filters.tagId} onChange={(event) => update({ tagId: event.target.value })} className="w-full rounded-lg border border-zinc-200 px-2 py-2 text-xs">
              <option value="">Select or type tags</option>
              {tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
            </select>
          </PickerFilterSection>
        </PickerFilterPanel>
        <section className="flex min-w-0 flex-col overflow-hidden p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-700">{playlists === null ? "Loading playlists…" : error ?? `${sorted.length} playlists found`}</p>
            <div className="flex items-center gap-2">
              <select
                aria-label="Sort playlists"
                value={sort}
                onChange={(event) => setSort(event.target.value as typeof sort)}
                className="rounded-lg border border-zinc-200 px-2 py-1.5 text-xs"
              >
                <option value="newest">Sort by: Recently Updated</option>
                <option value="oldest">Sort by: Oldest</option>
                <option value="name">Sort by: Name</option>
              </select>
              <div className="flex rounded-lg border border-zinc-200 p-0.5">
                <button type="button" onClick={() => setView("grid")} aria-label="Grid view" className={`rounded p-1.5 ${view === "grid" ? "bg-indigo-50 text-indigo-600" : "text-zinc-400"}`}><GridIcon /></button>
                <button type="button" onClick={() => setView("list")} aria-label="List view" className={`rounded p-1.5 ${view === "list" ? "bg-indigo-50 text-indigo-600" : "text-zinc-400"}`}><ListIcon /></button>
              </div>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {playlists === null && !error ? (
              <div className="space-y-2">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-[4.5rem] rounded-xl" />)}</div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-3 gap-3">
                {visible.map((playlist) => (
                  <PlaylistGridCard key={playlist.id} playlist={playlist} selected={stagedId === playlist.id} previews={previews} onSelect={() => selectPlaylist(playlist.id)} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {visible.map((playlist) => (
                  <PlaylistRow key={playlist.id} playlist={playlist} selected={stagedId === playlist.id} previews={previews} onSelect={() => selectPlaylist(playlist.id)} />
                ))}
              </div>
            )}
            {playlists !== null && !error && !visible.length && <p className="py-12 text-center text-sm text-zinc-500">No playlists match these filters.</p>}
          </div>
          <div className="shrink-0 border-t border-zinc-100 bg-white">
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              perPage={PER_PAGE}
              perPageOptions={[PER_PAGE]}
              totalItems={sorted.length}
              rangeStart={sorted.length ? (currentPage - 1) * PER_PAGE + 1 : 0}
              rangeEnd={Math.min(currentPage * PER_PAGE, sorted.length)}
              itemLabel="playlists"
              onPageChange={setPage}
              onPerPageChange={() => undefined}
            />
          </div>
        </section>
        <aside className="overflow-y-auto border-l border-zinc-200">
          {selected ? (
            <PlaylistDetailPanel playlist={selected} detail={detail} previews={previews} expanded={contentExpanded} onToggle={() => setContentExpanded((value) => !value)} />
          ) : (
            <p className="p-5 text-sm text-zinc-500">เลือก Playlist เพื่อดูรายละเอียด</p>
          )}
        </aside>
      </div>
    </Modal>
  );
}

function PlaylistDetailPanel({ playlist, detail, previews, expanded, onToggle }: { playlist: PlaylistListItem; detail: PlaylistDetail | null; previews: ReturnType<typeof usePreviewUrls>; expanded: boolean; onToggle: () => void }) {
  const badge = statusBadge(playlistDisplayStatus(playlist));
  const metadata = decodeMetadata(detail?.metadata ?? playlist.metadata);
  const fields: PickerDetailField[] = [
    { icon: <ClockIcon />, label: "Duration", value: formatDuration(playlist.total_duration_seconds ?? 0) },
    { icon: <GridIcon />, label: "Items", value: `${playlist.item_count} items` },
    { icon: <UsersIcon />, label: "Created by", value: detail?.created_by?.display_name ?? playlist.created_by?.display_name ?? "—" },
    { icon: <CalendarIcon />, label: "Created", value: formatDateTime(playlist.created_at) },
    { icon: <ClockIcon />, label: "Updated", value: formatDateTime(playlist.updated_at) },
  ];
  const preview = (
    <div className="relative overflow-hidden rounded-lg">
      <PlaylistCover playlist={playlist} previews={previews} className="aspect-video w-full" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-2 pt-8 text-white">
        <p className="truncate text-sm font-semibold">{playlist.name}</p>
        <div className="mt-1 flex items-center justify-between">
          <Badge color={badge.color} variant="pill">{badge.label}</Badge>
          <span className="text-xs font-medium">{formatDuration(playlist.total_duration_seconds ?? 0)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <PickerDetailPanel
      preview={preview}
      fields={fields}
      tags={playlist.tags ?? []}
      description={metadata.info.description ?? "—"}
      detailLabel={`ดูรายการทั้งหมด (${playlist.item_count})`}
      expanded={expanded}
      onToggle={onToggle}
    >
      {detail ? (
        <ul className="mt-2 space-y-1 rounded-lg bg-zinc-50 p-3">
          {detail.items.map((item) => (
            <li key={`${item.media_asset_id}-${item.position}`} className="truncate text-xs text-zinc-600">
              {item.position + 1}. {item.title ?? item.media_asset_id.slice(0, 8)}
            </li>
          ))}
        </ul>
      ) : (
        <Skeleton className="mt-2 h-20 w-full" />
      )}
    </PickerDetailPanel>
  );
}

type CardProps = { playlist: PlaylistListItem; selected: boolean; previews: ReturnType<typeof usePreviewUrls>; onSelect: () => void };

function PlaylistCover({ playlist, previews, className }: Pick<CardProps, "playlist" | "previews"> & { className: string }) {
  const cover = coverId(playlist);
  return <MediaThumb url={cover ? previews.urls[cover] : undefined} thumbnailUrl={cover ? previews.thumbnailUrls[cover] : undefined} alt={playlist.name} className={className} />;
}

function PlaylistGridCard({ playlist, selected, previews, onSelect }: CardProps) {
  const badge = statusBadge(playlistDisplayStatus(playlist));
  return (
    <button type="button" onClick={onSelect} className={`overflow-hidden rounded-xl border text-left ${selected ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-zinc-200"}`}>
      <PlaylistCover playlist={playlist} previews={previews} className="aspect-video w-full rounded-none" />
      <div className="space-y-1 p-2">
        <p className="truncate text-xs font-semibold text-zinc-900">{playlist.name}</p>
        <p className="text-[10px] text-zinc-500">{playlist.item_count} items · {formatDuration(playlist.total_duration_seconds ?? 0)}</p>
        <Badge color={badge.color} variant="pill">{badge.label}</Badge>
      </div>
    </button>
  );
}

function PlaylistRow({ playlist, selected, previews, onSelect }: CardProps) {
  const badge = statusBadge(playlistDisplayStatus(playlist));
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`grid w-full grid-cols-[1.5rem_5rem_minmax(0,1fr)_7rem] items-center gap-3 rounded-xl border p-2 text-left transition-colors ${selected ? "border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-100" : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"}`}
    >
      <span className={`grid h-5 w-5 place-items-center rounded-full border text-[10px] ${selected ? "border-indigo-600 bg-indigo-600 text-white" : "border-zinc-300 bg-white"}`}>
        {selected ? "✓" : ""}
      </span>
      <PlaylistCover playlist={playlist} previews={previews} className="aspect-video h-12 w-20 rounded-lg" />
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-zinc-900">{playlist.name}</span>
          {playlist.tags?.[0] && <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-600">{playlist.tags[0].name}</span>}
        </span>
        <span className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-zinc-500">
          <span>{formatDuration(playlist.total_duration_seconds ?? 0)}</span>
          <span>{playlist.item_count} items</span>
          <span>Updated {formatDate(playlist.updated_at ?? playlist.created_at)}</span>
        </span>
      </span>
      <span className="text-right">
        <Badge color={badge.color} variant="pill">{badge.label}</Badge>
        <span className="mt-1 block truncate text-[10px] text-zinc-500">{playlist.created_by?.display_name ?? "—"}</span>
      </span>
    </button>
  );
}
