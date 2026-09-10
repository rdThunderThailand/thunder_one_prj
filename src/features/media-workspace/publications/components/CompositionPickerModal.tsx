"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { GridIcon, ImageIcon, ListIcon, SearchIcon } from "@/components/ui/icons";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import type { PreviewUrls } from "@/lib/api/media-api";
import { fetchComposition, fetchCompositionLibrary } from "@/features/media-workspace/compositions/services/compositions-api";
import type { CompositionDetail, CompositionLibraryItem, CompositionLibraryPreviewZone } from "@/features/media-workspace/compositions/types";
import { statusBadge } from "../../compositions/status-display";
import { parseResolution } from "../../layouts/geometry";
import {
  compositionOrientation,
  defaultCompositionPickerFilters,
  filterCompositionPickerItems,
  publishableCompositions,
  type CompositionPickerFilters,
} from "../composition-picker-filter";

const PER_PAGE = 9;

// ponytail: a flat wireframe from the preview zones — thumbnailUrls covers both images and
// videos, so no per-asset MIME branch here. Reach for CompositionLibraryPreview's video tag
// only if a still frame turns out not to be enough.
function Wireframe({ zones, referenceResolution, previews, className }: { zones?: CompositionLibraryPreviewZone[]; referenceResolution?: string | null; previews: PreviewUrls; className?: string }) {
  const ratio = referenceResolution ? parseResolution(referenceResolution) : null;
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-zinc-900 text-zinc-600 ${className ?? ""}`} style={{ aspectRatio: ratio ? `${ratio[0]} / ${ratio[1]}` : "16 / 9" }}>
      {!zones?.length && <ImageIcon />}
      {zones?.map((zone) => {
        const url = zone.firstAssetId ? previews.thumbnailUrls[zone.firstAssetId] ?? previews.urls[zone.firstAssetId] : undefined;
        return (
          <div key={zone.position} className="absolute overflow-hidden border border-white/60 bg-violet-500/40" style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.width}%`, height: `${zone.height}%` }}>
            {url && <img src={url} alt="" onError={(event) => { event.currentTarget.hidden = true; }} className="h-full w-full object-cover" />}
          </div>
        );
      })}
    </div>
  );
}

function zoneAssetIds(item: CompositionLibraryItem): string[] {
  return (item.previewZones ?? []).map((zone) => zone.firstAssetId).filter((id): id is string => !!id);
}

export function CompositionPickerModal({ selectedId, onClose, onSelect }: { selectedId: string | null; onClose: () => void; onSelect: (id: string) => void }) {
  const [items, setItems] = useState<CompositionLibraryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(defaultCompositionPickerFilters);
  const [stagedId, setStagedId] = useState(selectedId);
  const [detailResult, setDetailResult] = useState<{ id: string; detail: CompositionDetail } | null>(null);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"grid" | "list">("grid");

  useEffect(() => {
    let alive = true;
    // ponytail: 50 is the list endpoint's max page size; the picker filters/paginates the
    // rest in the browser. Page through the endpoint only if a tenant ever has >50 Layouts.
    fetchCompositionLibrary({ pageSize: 50 })
      .then((response) => { if (alive) setItems(publishableCompositions(response.data)); })
      .catch(() => { if (alive) setError("Failed to load Layouts."); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!stagedId) return;
    let alive = true;
    fetchComposition(stagedId).then((detail) => { if (alive) setDetailResult({ id: stagedId, detail }); }).catch(() => undefined);
    return () => { alive = false; };
  }, [stagedId]);

  const filtered = useMemo(() => filterCompositionPickerItems(items ?? [], filters), [items, filters]);
  const sorted = useMemo(() => [...filtered].sort((a, b) => (b.updated_at ?? b.created_at ?? "").localeCompare(a.updated_at ?? a.created_at ?? "")), [filtered]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const visible = sorted.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  const selected = items?.find((row) => row.id === stagedId);
  const detail = detailResult?.id === stagedId ? detailResult.detail : null;

  const covers = useMemo(() => [...new Set([...visible, ...(selected ? [selected] : [])].flatMap(zoneAssetIds))], [visible, selected]);
  const previews = usePreviewUrls(covers);

  const aspectRatios = useMemo(() => [...new Set((items ?? []).map((row) => row.referenceResolution).filter((value): value is string => !!value))].sort(), [items]);
  const update = (next: Partial<CompositionPickerFilters>) => { setFilters((current) => ({ ...current, ...next })); setPage(1); };

  const footer = <div className="flex min-w-0 flex-1 items-center justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><span className="shrink-0 text-xs font-medium text-zinc-600">{stagedId ? "1 item selected" : "0 items selected"}</span>{selected && <span className="inline-flex max-w-64 items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/60 px-2 py-1 text-xs text-zinc-700"><span className="truncate">{selected.name}</span><button type="button" onClick={() => setStagedId(null)} aria-label={`Remove ${selected.name}`} className="text-zinc-400 hover:text-zinc-700">×</button></span>}</div><div className="flex shrink-0 gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-zinc-200 px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Cancel</button><button type="button" disabled={!stagedId} onClick={() => stagedId && onSelect(stagedId)} className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">Select →</button></div></div>;

  return <Modal open onClose={onClose} title="Layout Picker" size="preview" showCloseButton footer={footer}>
    <p className="-mt-2 text-xs text-zinc-500">เลือก Layout ที่ต้องการใช้งาน</p>
    <div className="mt-1 flex items-center gap-2 border-y border-zinc-200 py-3"><label className="relative min-w-64 flex-1"><SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" /><input value={filters.query} onChange={(event) => update({ query: event.target.value })} placeholder="Search layouts by name, layout, or tag..." className="w-full rounded-lg border border-zinc-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></label><select aria-label="Layout status" value={filters.status} onChange={(event) => update({ status: event.target.value as CompositionPickerFilters["status"] })} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"><option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option></select><Link href="/media-workspace/layouts" target="_blank" className="px-2 py-2 text-sm font-medium text-indigo-700">Layout Library ↗</Link></div>
    <div className="grid h-[min(42rem,calc(100vh-15rem))] min-h-[30rem] grid-cols-[11rem_minmax(0,1fr)_16rem] overflow-hidden border-b border-zinc-200">
      <aside className="overflow-y-auto border-r border-zinc-200 px-3 py-4"><p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Filters</p><label className="mb-3 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Orientation<select value={filters.orientation} onChange={(event) => update({ orientation: event.target.value as CompositionPickerFilters["orientation"] })} className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-2 text-xs font-normal normal-case"><option value="all">Any</option><option value="landscape">Landscape</option><option value="portrait">Portrait</option></select></label><label className="mb-3 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Aspect ratio<select value={filters.aspectRatio} onChange={(event) => update({ aspectRatio: event.target.value })} className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-2 text-xs font-normal normal-case"><option value="all">Any</option>{aspectRatios.map((ratio) => <option key={ratio} value={ratio}>{ratio}</option>)}</select></label><label className="mt-4 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Category<select disabled className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-2 text-xs font-normal normal-case"><option>Not available</option></select></label></aside>
      <section className="min-w-0 overflow-y-auto p-4"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-medium text-zinc-700">{items === null ? "Loading layouts…" : error ?? `${sorted.length} layouts found`}</p><div className="flex rounded-lg border border-zinc-200 p-0.5"><button type="button" onClick={() => setView("grid")} aria-label="Grid view" className={`rounded p-1.5 ${view === "grid" ? "bg-indigo-50 text-indigo-600" : "text-zinc-400"}`}><GridIcon /></button><button type="button" onClick={() => setView("list")} aria-label="List view" className={`rounded p-1.5 ${view === "list" ? "bg-indigo-50 text-indigo-600" : "text-zinc-400"}`}><ListIcon /></button></div></div>{items === null && !error ? <div className="grid grid-cols-3 gap-3">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="aspect-video rounded-xl" />)}</div> : view === "grid" ? <div className="grid grid-cols-3 gap-3">{visible.map((item) => { const badge = statusBadge(item.status); return <button key={item.id} type="button" onClick={() => setStagedId(item.id)} className={`overflow-hidden rounded-xl border text-left ${stagedId === item.id ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-zinc-200"}`}><div className="relative"><Wireframe zones={item.previewZones} referenceResolution={item.referenceResolution} previews={previews} /><span className="absolute left-2 top-2 grid h-4 w-4 place-items-center rounded-full border border-white bg-white/90 text-[9px] text-indigo-600">{stagedId === item.id ? "✓" : ""}</span></div><div className="space-y-1 p-2"><p className="truncate text-xs font-semibold text-zinc-900">{item.name}</p><p className="text-[10px] text-zinc-500">{item.layout_name} · {item.zone_count} zones</p><Badge color={badge.color} variant="pill">{badge.label}</Badge></div></button>; })}</div> : <div className="space-y-2">{visible.map((item) => <button key={item.id} type="button" onClick={() => setStagedId(item.id)} className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs ${stagedId === item.id ? "border-indigo-500 bg-indigo-50" : "border-zinc-200"}`}><span className="truncate font-medium">{item.name}</span><span className="ml-3 shrink-0 text-zinc-500">{item.layout_name} · {item.zone_count} zones</span></button>)}</div>}{items !== null && !error && !visible.length && <p className="py-12 text-center text-sm text-zinc-500">No layouts match these filters.</p>}<Pagination page={currentPage} totalPages={totalPages} perPage={PER_PAGE} perPageOptions={[PER_PAGE]} totalItems={sorted.length} rangeStart={sorted.length ? (currentPage - 1) * PER_PAGE + 1 : 0} rangeEnd={Math.min(currentPage * PER_PAGE, sorted.length)} itemLabel="layouts" onPageChange={setPage} onPerPageChange={() => undefined} /></section>
      <aside className="overflow-y-auto border-l border-zinc-200"><p className="border-b border-zinc-200 px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Selected item</p>{selected ? <div className="space-y-4 p-4"><Wireframe zones={selected.previewZones} referenceResolution={selected.referenceResolution} previews={previews} className="rounded-lg" /><h3 className="text-sm font-semibold text-zinc-900">{selected.name}</h3><dl className="space-y-2 text-xs">{[["Layout", selected.layout_name], ["Aspect", selected.referenceResolution ?? "—"], ["Orientation", compositionOrientation(selected.referenceResolution) ?? "—"], ["Zones", `${selected.bound_count}/${selected.zone_count} bound`]].map(([label, value]) => <div key={label} className="flex justify-between gap-3"><dt className="text-zinc-500">{label}</dt><dd className="text-right text-zinc-800">{value}</dd></div>)}</dl><div><p className="text-xs text-zinc-500">Tags</p><div className="mt-1 flex flex-wrap gap-1">{selected.tags?.length ? selected.tags.map((tag) => <Badge key={tag.id} color="indigo" variant="pill">{tag.name}</Badge>) : <span className="text-xs text-zinc-400">—</span>}</div></div>{detail ? <div><p className="text-xs font-medium text-zinc-700">Zone details ({detail.zones.length})</p><ul className="mt-2 space-y-1">{detail.zones.map((zone) => <li key={zone.layout_zone_id} className="truncate text-xs text-zinc-500">{zone.position + 1}. {zone.name}{zone.playlist_id ? "" : " · unbound"}</li>)}</ul></div> : <Skeleton className="h-20 w-full" />}</div> : <p className="p-5 text-sm text-zinc-500">เลือก Layout เพื่อดูรายละเอียด</p>}</aside>
    </div>
  </Modal>;
}
