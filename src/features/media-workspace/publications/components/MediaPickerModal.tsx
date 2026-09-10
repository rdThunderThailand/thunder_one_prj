"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GridIcon, ListIcon, SearchIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { formatBytes } from "@/features/media-workspace/playlists/totals";
import type { MediaAsset, Tag } from "@/types/domain";
import { assetKind, defaultAssetPickerFilters, filterAssets, type AssetPickerFilters } from "../asset-filter";
import { canSelectAsset } from "../content-selection";
import type { PublicationType } from "../types";
import { AssetCard } from "./AssetCard";

const PER_PAGE_OPTIONS = [9, 18, 36];
const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "ready", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
  { value: "expired", label: "Expired" },
];

function FilterChoice({ checked, disabled = false, label, onClick }: { checked: boolean; disabled?: boolean; label: string; onClick: () => void }) {
  return <button type="button" role="checkbox" aria-checked={checked} disabled={disabled} onClick={onClick} className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-xs text-zinc-600 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"><span className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded border text-[9px] ${checked ? "border-indigo-600 bg-indigo-600 text-white" : "border-zinc-300 bg-white"}`}>{checked ? "✓" : ""}</span>{label}</button>;
}

function AssetDetail({ asset, previewUrl, thumbnailUrl }: { asset?: MediaAsset; previewUrl?: string; thumbnailUrl?: string }) {
  if (!asset) return <p className="p-5 text-sm text-zinc-500">เลือกไฟล์เพื่อดูรายละเอียด</p>;
  const filename = asset.file?.original_filename ?? asset.title ?? asset.id;
  const imageUrl = thumbnailUrl ?? (assetKind(asset) === "image" ? previewUrl : undefined);
  const fields = [
    ["Type", assetKind(asset)],
    ["Resolution", asset.width && asset.height ? `${asset.width} × ${asset.height}` : "—"],
    ["Duration", asset.duration_seconds ? `${Math.round(asset.duration_seconds)}s` : "—"],
    ["File size", asset.file?.file_size_bytes === undefined ? "—" : formatBytes(asset.file.file_size_bytes)],
    ["Created", asset.created_at ? new Date(asset.created_at).toLocaleDateString() : "—"],
    ["Created by", asset.created_by?.display_name ?? "—"],
  ];

  return <div className="space-y-4 p-4">
    <div className="relative aspect-video overflow-hidden rounded-lg bg-zinc-100">{imageUrl && <Image src={imageUrl} alt={filename} fill sizes="260px" className="object-cover" />}</div>
    <div className="flex items-start justify-between gap-2"><h3 className="min-w-0 break-words text-sm font-semibold text-zinc-900">{filename}</h3><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">{asset.status === "ready" ? "Active" : asset.status ?? "—"}</span></div>
    <dl className="space-y-2 text-xs">{fields.map(([label, value]) => <div key={label} className="flex justify-between gap-3"><dt className="text-zinc-500">{label}</dt><dd className="text-right text-zinc-800">{value}</dd></div>)}</dl>
    <div><p className="text-xs text-zinc-500">Tags</p><div className="mt-1 flex flex-wrap gap-1">{asset.tags?.length ? asset.tags.map((tag) => <span key={tag.id} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] text-indigo-700">{tag.name}</span>) : <span className="text-xs text-zinc-400">—</span>}</div></div>
    <div><p className="text-xs text-zinc-500">Description</p><p className="mt-1 text-xs leading-5 text-zinc-700">{asset.title ?? "—"}</p></div>
  </div>;
}

export function MediaPickerModal({ assets, tags, publicationType, selectedIds, loading, error, onClose, onSelect, onUpload }: { assets: MediaAsset[]; tags: Tag[]; publicationType: PublicationType; selectedIds: string[]; loading: boolean; error: string | null; onClose: () => void; onSelect: (ids: string[]) => void; onUpload: () => void }) {
  // ponytail: keep this wizard-local until #80/#81 prove a common picker contract.
  const [filters, setFilters] = useState<AssetPickerFilters>({ ...defaultAssetPickerFilters, kind: publicationType === "video" ? "video" : "image" });
  const [stagedIds, setStagedIds] = useState(selectedIds);
  const [detailId, setDetailId] = useState(selectedIds[0] ?? null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(PER_PAGE_OPTIONS[0]);
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => filterAssets(assets, filters), [assets, filters]);
  const visible = useMemo(() => [...filtered].sort((a, b) => sort === "oldest" ? (a.created_at ?? "").localeCompare(b.created_at ?? "") : sort === "name" ? (a.title ?? a.file?.original_filename ?? "").localeCompare(b.title ?? b.file?.original_filename ?? "") : (b.created_at ?? "").localeCompare(a.created_at ?? "")), [filtered, sort]);
  const totalPages = Math.max(1, Math.ceil(visible.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const pageAssets = visible.slice((currentPage - 1) * perPage, currentPage * perPage);
  const previewIds = useMemo(() => [...new Set([...pageAssets.map((asset) => asset.id), ...stagedIds])], [pageAssets, stagedIds]);
  const previews = usePreviewUrls(previewIds);
  const detailAsset = assets.find((asset) => asset.id === detailId);
  const stagedAssets = stagedIds.flatMap((id) => assets.find((asset) => asset.id === id) ?? []);
  const resolutions = useMemo(() => [...new Set(assets.flatMap((asset) => asset.width && asset.height ? [`${asset.width}x${asset.height}`] : []))], [assets]);

  const update = (next: Partial<AssetPickerFilters>) => { setFilters((current) => ({ ...current, ...next })); setPage(1); };
  const toggle = (asset: MediaAsset) => {
    if (!canSelectAsset(publicationType, asset)) return;
    setDetailId(asset.id);
    setStagedIds((ids) => ids.includes(asset.id) ? ids.filter((id) => id !== asset.id) : [...ids, asset.id]);
  };

  const footer = <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
    <div className="flex min-w-0 items-center gap-3"><span className="shrink-0 text-xs font-medium text-zinc-600">{stagedIds.length} item{stagedIds.length === 1 ? "" : "s"} selected</span><div className="flex min-w-0 gap-2 overflow-x-auto">{stagedAssets.map((asset) => <span key={asset.id} className="inline-flex max-w-48 shrink-0 items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/60 px-2 py-1 text-xs text-zinc-700"><span className="truncate">{asset.file?.original_filename ?? asset.title ?? asset.id}</span><button type="button" onClick={() => setStagedIds((ids) => ids.filter((id) => id !== asset.id))} aria-label={`Remove ${asset.title ?? asset.id}`} className="text-zinc-400 hover:text-zinc-700">×</button></span>)}</div></div>
    <div className="flex shrink-0 gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-zinc-200 px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Cancel</button><button type="button" disabled={!stagedIds.length} onClick={() => onSelect(stagedIds)} className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Select →</button></div>
  </div>;

  return <Modal open onClose={onClose} title="Media Picker" size="preview" showCloseButton footer={footer}>
    <p className="-mt-2 text-xs text-zinc-500">เลือกสื่อที่ต้องการใช้งาน</p>
    <div className="mt-1 flex flex-wrap items-center gap-2 border-y border-zinc-200 py-3">
      <label className="relative min-w-64 flex-1"><SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" /><input value={filters.query} onChange={(event) => update({ query: event.target.value })} placeholder="Search media by name, tag, resolution..." className="w-full rounded-lg border border-zinc-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></label>
      <select aria-label="Media type" value={filters.kind} onChange={(event) => update({ kind: event.target.value as AssetPickerFilters["kind"] })} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"><option value="all">All Types</option><option value="image">Image</option><option value="video">Video</option></select>
      <select aria-label="Status" value={filters.status} onChange={(event) => update({ status: event.target.value })} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm">{STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
      <select aria-label="Resolution" value={filters.resolution} onChange={(event) => update({ resolution: event.target.value })} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"><option value="all">Any Resolution</option>{resolutions.map((resolution) => <option key={resolution} value={resolution}>{resolution}</option>)}</select>
      <button type="button" onClick={() => document.getElementById("media-picker-filters")?.focus()} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">More Filters</button>
      <button type="button" onClick={onUpload} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Upload</button>
      <Link href="/media-workspace/assets" target="_blank" className="px-2 py-2 text-sm font-medium text-indigo-700">Media Library ↗</Link>
    </div>
    <div className="grid h-[min(42rem,calc(100vh-15rem))] min-h-[30rem] grid-cols-[11rem_minmax(0,1fr)_16rem] overflow-hidden border-b border-zinc-200">
      <aside id="media-picker-filters" tabIndex={-1} className="overflow-y-auto border-r border-zinc-200 px-3 py-4 focus:outline-none">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Filters</p>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Type</p>
        <FilterChoice label="All Types" checked={filters.kind === "all"} onClick={() => update({ kind: "all" })} />
        <FilterChoice label="Image" checked={filters.kind === "image"} onClick={() => update({ kind: "image" })} />
        <FilterChoice label="Video" checked={filters.kind === "video"} onClick={() => update({ kind: "video" })} />
        {['Audio', 'HTML', 'Document'].map((label) => <FilterChoice key={label} label={label} checked={false} disabled onClick={() => undefined} />)}
        <div className="my-3 border-t border-zinc-200" />
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Status</p>
        {STATUS_OPTIONS.map((option) => <FilterChoice key={option.value} label={option.label} checked={filters.status === option.value} onClick={() => update({ status: option.value })} />)}
        <div className="my-3 border-t border-zinc-200" />
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Duration</p>
        <div className="flex items-center gap-1"><input aria-label="Minimum duration" inputMode="numeric" value={filters.minDuration} onChange={(event) => update({ minDuration: event.target.value })} placeholder="Min" className="min-w-0 rounded border border-zinc-200 px-2 py-1.5 text-xs" /><span className="text-zinc-400">–</span><input aria-label="Maximum duration" inputMode="numeric" value={filters.maxDuration} onChange={(event) => update({ maxDuration: event.target.value })} placeholder="Max" className="min-w-0 rounded border border-zinc-200 px-2 py-1.5 text-xs" /></div>
        <p className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Tags</p>
        <select aria-label="Tag" value={filters.tagId ?? ""} onChange={(event) => update({ tagId: event.target.value || null })} className="w-full rounded-lg border border-zinc-200 px-2 py-2 text-xs"><option value="">Select or type tags</option>{tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</select>
      </aside>
      <section className="min-w-0 overflow-y-auto p-4">
        <div className="mb-3 flex items-center justify-between gap-3"><p className="text-xs font-medium text-zinc-700">{loading ? "Loading media…" : error ?? `${visible.length} items found`}</p><div className="flex items-center gap-2"><select aria-label="Sort media" value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-lg border border-zinc-200 px-2 py-1.5 text-xs"><option value="newest">Sort by: Newest</option><option value="oldest">Sort by: Oldest</option><option value="name">Sort by: Name</option></select><div className="flex rounded-lg border border-zinc-200 p-0.5"><button type="button" onClick={() => setView("grid")} aria-label="Grid view" className={`rounded p-1.5 ${view === "grid" ? "bg-indigo-50 text-indigo-600" : "text-zinc-400"}`}><GridIcon /></button><button type="button" onClick={() => setView("list")} aria-label="List view" className={`rounded p-1.5 ${view === "list" ? "bg-indigo-50 text-indigo-600" : "text-zinc-400"}`}><ListIcon /></button></div></div></div>
        {view === "grid" ? <div className="grid grid-cols-3 gap-3">{pageAssets.map((asset) => <AssetCard key={asset.id} kind="asset" asset={asset} aspect="video" previewUrl={previews.urls[asset.id]} thumbnailUrl={previews.thumbnailUrls[asset.id]} selected={stagedIds.includes(asset.id)} onSelect={() => toggle(asset)} disabled={!canSelectAsset(publicationType, asset)} />)}</div> : <div className="space-y-2">{pageAssets.map((asset) => <button key={asset.id} type="button" disabled={!canSelectAsset(publicationType, asset)} onClick={() => toggle(asset)} className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs ${stagedIds.includes(asset.id) ? "border-indigo-500 bg-indigo-50" : "border-zinc-200"} disabled:opacity-50`}><span className="truncate font-medium">{asset.file?.original_filename ?? asset.title ?? asset.id}</span><span className="ml-3 shrink-0 text-zinc-500">{assetKind(asset)} · {asset.width && asset.height ? `${asset.width} × ${asset.height}` : "—"}</span></button>)}</div>}
        {!loading && !error && !pageAssets.length && <p className="py-12 text-center text-sm text-zinc-500">No media matches these filters.</p>}
        <Pagination page={currentPage} totalPages={totalPages} perPage={perPage} perPageOptions={PER_PAGE_OPTIONS} totalItems={visible.length} rangeStart={visible.length ? (currentPage - 1) * perPage + 1 : 0} rangeEnd={Math.min(currentPage * perPage, visible.length)} itemLabel="media" onPageChange={setPage} onPerPageChange={(next) => { setPerPage(next); setPage(1); }} />
      </section>
      <aside className="overflow-y-auto border-l border-zinc-200"><p className="border-b border-zinc-200 px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Selected item</p><AssetDetail asset={detailAsset} previewUrl={detailAsset ? previews.urls[detailAsset.id] : undefined} thumbnailUrl={detailAsset ? previews.thumbnailUrls[detailAsset.id] : undefined} /></aside>
    </div>
  </Modal>;
}
