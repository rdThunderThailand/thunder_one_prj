"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { GridIcon, ListIcon, SearchIcon } from "@/components/ui/icons";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { fetchPlaylist, fetchPlaylists } from "@/lib/api/media-api";
import type { PlaylistDetail, PlaylistListItem } from "@/types/domain";
import { formatDuration } from "../../playlists/duration";
import { decodeMetadata } from "../../playlists/metadata";
import { playlistDisplayStatus, statusBadge } from "../../playlists/status-display";
import { defaultPlaylistPickerFilters, filterPlaylistPickerItems, type PlaylistPickerFilters } from "../playlist-picker-filter";

const PER_PAGE = 9;

function coverId(playlist: PlaylistListItem): string | undefined {
  return playlist.cover_asset_id ?? decodeMetadata(playlist.metadata).info.coverAssetId;
}

export function PlaylistPickerModal({ selectedId, onClose, onSelect }: { selectedId: string | null; onClose: () => void; onSelect: (id: string) => void }) {
  const [playlists, setPlaylists] = useState<PlaylistListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(defaultPlaylistPickerFilters);
  const [stagedId, setStagedId] = useState(selectedId);
  const [detailResult, setDetailResult] = useState<{ id: string; detail: PlaylistDetail } | null>(null);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"grid" | "list">("grid");

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
  const sorted = useMemo(() => [...filtered].sort((a, b) => (b.updated_at ?? b.created_at ?? "").localeCompare(a.updated_at ?? a.created_at ?? "")), [filtered]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const visible = sorted.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  const covers = useMemo(() => [...new Set([...visible, ...(stagedId ? (playlists ?? []).filter((row) => row.id === stagedId) : [])].map(coverId).filter((id): id is string => !!id))], [visible, stagedId, playlists]);
  const previews = usePreviewUrls(covers);
  const selected = playlists?.find((row) => row.id === stagedId);
  const detail = detailResult?.id === stagedId ? detailResult.detail : null;
  const creators = useMemo(() => [...new Map((playlists ?? []).flatMap((row) => row.created_by ? [[row.created_by.id, row.created_by]] : [])).values()], [playlists]);
  const tags = useMemo(() => [...new Map((playlists ?? []).flatMap((row) => (row.tags ?? []).map((tag) => [tag.id, tag]))).values()], [playlists]);
  const update = (next: Partial<PlaylistPickerFilters>) => { setFilters((current) => ({ ...current, ...next })); setPage(1); };

  const footer = <div className="flex min-w-0 flex-1 items-center justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><span className="shrink-0 text-xs font-medium text-zinc-600">{stagedId ? "1 item selected" : "0 items selected"}</span>{selected && <span className="inline-flex max-w-64 items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/60 px-2 py-1 text-xs text-zinc-700"><span className="truncate">{selected.name}</span><button type="button" onClick={() => setStagedId(null)} aria-label={`Remove ${selected.name}`} className="text-zinc-400 hover:text-zinc-700">×</button></span>}</div><div className="flex shrink-0 gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-zinc-200 px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Cancel</button><button type="button" disabled={!stagedId} onClick={() => stagedId && onSelect(stagedId)} className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">Select →</button></div></div>;

  return <Modal open onClose={onClose} title="Playlist Picker" size="preview" showCloseButton footer={footer}>
    <p className="-mt-2 text-xs text-zinc-500">เลือก Playlist ที่ต้องการใช้งาน</p>
    <div className="mt-1 flex items-center gap-2 border-y border-zinc-200 py-3"><label className="relative min-w-64 flex-1"><SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" /><input value={filters.query} onChange={(event) => update({ query: event.target.value })} placeholder="Search playlists by name, creator, or tag..." className="w-full rounded-lg border border-zinc-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></label><select aria-label="Playlist status" value={filters.status} onChange={(event) => update({ status: event.target.value as PlaylistPickerFilters["status"] })} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"><option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option></select><Link href="/media-workspace/playlists" target="_blank" className="px-2 py-2 text-sm font-medium text-indigo-700">Playlist Library ↗</Link></div>
    <div className="grid h-[min(42rem,calc(100vh-15rem))] min-h-[30rem] grid-cols-[11rem_minmax(0,1fr)_16rem] overflow-hidden border-b border-zinc-200">
      <aside className="overflow-y-auto border-r border-zinc-200 px-3 py-4"><p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Filters</p><label className="mb-3 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Created by<select value={filters.creatorId} onChange={(event) => update({ creatorId: event.target.value })} className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-2 text-xs font-normal normal-case"><option value="">All creators</option>{creators.map((creator) => <option key={creator.id} value={creator.id}>{creator.display_name}</option>)}</select></label><label className="mb-3 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Tags<select value={filters.tagId} onChange={(event) => update({ tagId: event.target.value })} className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-2 text-xs font-normal normal-case"><option value="">All tags</option>{tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</select></label><p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Duration</p><div className="flex items-center gap-1"><input aria-label="Minimum duration" inputMode="numeric" value={filters.minDuration} onChange={(event) => update({ minDuration: event.target.value })} placeholder="Min" className="min-w-0 rounded border border-zinc-200 px-2 py-1.5 text-xs" /><span className="text-zinc-400">–</span><input aria-label="Maximum duration" inputMode="numeric" value={filters.maxDuration} onChange={(event) => update({ maxDuration: event.target.value })} placeholder="Max" className="min-w-0 rounded border border-zinc-200 px-2 py-1.5 text-xs" /></div><label className="mt-4 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Category<select disabled className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-2 text-xs font-normal normal-case"><option>Not available</option></select></label></aside>
      <section className="min-w-0 overflow-y-auto p-4"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-medium text-zinc-700">{playlists === null ? "Loading playlists…" : error ?? `${sorted.length} playlists found`}</p><div className="flex rounded-lg border border-zinc-200 p-0.5"><button type="button" onClick={() => setView("grid")} aria-label="Grid view" className={`rounded p-1.5 ${view === "grid" ? "bg-indigo-50 text-indigo-600" : "text-zinc-400"}`}><GridIcon /></button><button type="button" onClick={() => setView("list")} aria-label="List view" className={`rounded p-1.5 ${view === "list" ? "bg-indigo-50 text-indigo-600" : "text-zinc-400"}`}><ListIcon /></button></div></div>{playlists === null && !error ? <div className="grid grid-cols-3 gap-3">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="aspect-video rounded-xl" />)}</div> : view === "grid" ? <div className="grid grid-cols-3 gap-3">{visible.map((playlist) => { const cover = coverId(playlist); const badge = statusBadge(playlistDisplayStatus(playlist)); return <button key={playlist.id} type="button" onClick={() => setStagedId(playlist.id)} className={`overflow-hidden rounded-xl border text-left ${stagedId === playlist.id ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-zinc-200"}`}><div className="relative aspect-video bg-zinc-100"><MediaThumb url={cover ? previews.urls[cover] : undefined} thumbnailUrl={cover ? previews.thumbnailUrls[cover] : undefined} alt={playlist.name} className="h-full w-full rounded-none" /><span className="absolute left-2 top-2 grid h-4 w-4 place-items-center rounded-full border border-white bg-white/90 text-[9px] text-indigo-600">{stagedId === playlist.id ? "✓" : ""}</span></div><div className="space-y-1 p-2"><p className="truncate text-xs font-semibold text-zinc-900">{playlist.name}</p><p className="text-[10px] text-zinc-500">{playlist.item_count} items · {formatDuration(playlist.total_duration_seconds ?? 0)}</p><Badge color={badge.color} variant="pill">{badge.label}</Badge></div></button>; })}</div> : <div className="space-y-2">{visible.map((playlist) => <button key={playlist.id} type="button" onClick={() => setStagedId(playlist.id)} className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs ${stagedId === playlist.id ? "border-indigo-500 bg-indigo-50" : "border-zinc-200"}`}><span className="truncate font-medium">{playlist.name}</span><span className="ml-3 shrink-0 text-zinc-500">{playlist.item_count} items · {formatDuration(playlist.total_duration_seconds ?? 0)}</span></button>)}</div>}{playlists !== null && !error && !visible.length && <p className="py-12 text-center text-sm text-zinc-500">No playlists match these filters.</p>}<Pagination page={currentPage} totalPages={totalPages} perPage={PER_PAGE} perPageOptions={[PER_PAGE]} totalItems={sorted.length} rangeStart={sorted.length ? (currentPage - 1) * PER_PAGE + 1 : 0} rangeEnd={Math.min(currentPage * PER_PAGE, sorted.length)} itemLabel="playlists" onPageChange={setPage} onPerPageChange={() => undefined} /></section>
      <aside className="overflow-y-auto border-l border-zinc-200"><p className="border-b border-zinc-200 px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Selected item</p>{selected ? <div className="space-y-4 p-4"><div className="aspect-video overflow-hidden rounded-lg bg-zinc-100"><MediaThumb url={coverId(selected) ? previews.urls[coverId(selected)!] : undefined} thumbnailUrl={coverId(selected) ? previews.thumbnailUrls[coverId(selected)!] : undefined} alt={selected.name} className="h-full w-full rounded-none" /></div><h3 className="text-sm font-semibold text-zinc-900">{selected.name}</h3><dl className="space-y-2 text-xs">{[["Items", String(selected.item_count)], ["Duration", formatDuration(selected.total_duration_seconds ?? 0)], ["Created by", selected.created_by?.display_name ?? "—"]].map(([label, value]) => <div key={label} className="flex justify-between gap-3"><dt className="text-zinc-500">{label}</dt><dd className="text-right text-zinc-800">{value}</dd></div>)}</dl><div><p className="text-xs text-zinc-500">Tags</p><div className="mt-1 flex flex-wrap gap-1">{selected.tags?.length ? selected.tags.map((tag) => <Badge key={tag.id} color="indigo" variant="pill">{tag.name}</Badge>) : <span className="text-xs text-zinc-400">—</span>}</div></div>{detail ? <div><p className="text-xs font-medium text-zinc-700">Content ({detail.items.length})</p><ul className="mt-2 space-y-1">{detail.items.slice(0, 4).map((item) => <li key={`${item.media_asset_id}-${item.position}`} className="truncate text-xs text-zinc-500">{item.position + 1}. {item.title ?? item.media_asset_id.slice(0, 8)}</li>)}</ul>{detail.items.length > 4 && <p className="mt-2 text-xs font-medium text-indigo-600">See all {detail.items.length} items</p>}</div> : <Skeleton className="h-20 w-full" />}</div> : <p className="p-5 text-sm text-zinc-500">เลือก Playlist เพื่อดูรายละเอียด</p>}</aside>
    </div>
  </Modal>;
}
