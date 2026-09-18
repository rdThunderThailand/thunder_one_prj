"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLinkIcon, GridIcon, ImageIcon, ListIcon, PlayIcon, SearchIcon } from "@/components/ui/icons";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { formatBytes } from "@/features/media-workspace/playlists/totals";
import type { MediaAsset, Tag } from "@/types/domain";
import { assetKind, defaultAssetPickerFilters, filterAssets, type AssetPickerFilters } from "../asset-filter";
import { AssetCard } from "./AssetCard";

const PER_PAGE_OPTIONS = [9, 18, 36];
const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "ready", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
  { value: "expired", label: "Expired" },
];

function FilterChoice({ checked, disabled = false, icon, label, onClick }: { checked: boolean; disabled?: boolean; icon?: ReactNode; label: string; onClick: () => void }) {
  return <button type="button" role="checkbox" aria-checked={checked} disabled={disabled} onClick={onClick} className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-xs text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-40"><span className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded border text-[9px] ${checked ? "border-primary bg-primary text-white" : "border-border bg-card"}`}>{checked ? "✓" : ""}</span>{icon}{label}</button>;
}

function AssetDetail({ asset, previewUrl, thumbnailUrl }: { asset?: MediaAsset; previewUrl?: string; thumbnailUrl?: string }) {
  if (!asset) return <p className="p-5 text-sm text-muted-foreground">เลือกไฟล์เพื่อดูรายละเอียด</p>;
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
    <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">{imageUrl && <Image src={imageUrl} alt={filename} fill sizes="260px" className="object-cover" />}</div>
    <div className="flex items-start justify-between gap-2"><h3 className="min-w-0 break-words text-sm font-semibold text-foreground">{filename}</h3><span className="rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-medium text-success">{asset.status === "ready" ? "Active" : asset.status ?? "—"}</span></div>
    <dl className="space-y-2 text-xs">{fields.map(([label, value]) => <div key={label} className="flex justify-between gap-3"><dt className="text-muted-foreground">{label}</dt><dd className="text-right text-foreground">{value}</dd></div>)}</dl>
    <div><p className="text-xs text-muted-foreground">Tags</p><div className="mt-1 flex flex-wrap gap-1">{asset.tags?.length ? asset.tags.map((tag) => <span key={tag.id} className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] text-primary">{tag.name}</span>) : <span className="text-xs text-muted-foreground">—</span>}</div></div>
    <div><p className="text-xs text-muted-foreground">Description</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{asset.title ?? "—"}</p></div>
  </div>;
}

export function MediaPickerModal({ assets, tags, selectedIds, loading, error, onClose, onSelect }: { assets: MediaAsset[]; tags: Tag[]; selectedIds: string[]; loading: boolean; error: string | null; onClose: () => void; onSelect: (ids: string[]) => void }) {
  // ponytail: keep this wizard-local until #80/#81 prove a common picker contract.
  const [filters, setFilters] = useState<AssetPickerFilters>(defaultAssetPickerFilters);
  const [stagedIds, setStagedIds] = useState(selectedIds);
  const [detailId, setDetailId] = useState(selectedIds[0] ?? null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(PER_PAGE_OPTIONS[0]);
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState<"grid" | "list">("list");

  const filtered = useMemo(() => filterAssets(assets, filters), [assets, filters]);
  const visible = useMemo(() => [...filtered].sort((a, b) => sort === "oldest" ? (a.created_at ?? "").localeCompare(b.created_at ?? "") : sort === "name" ? (a.title ?? a.file?.original_filename ?? "").localeCompare(b.title ?? b.file?.original_filename ?? "") : (b.created_at ?? "").localeCompare(a.created_at ?? "")), [filtered, sort]);
  const totalPages = Math.max(1, Math.ceil(visible.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const pageAssets = visible.slice((currentPage - 1) * perPage, currentPage * perPage);
  const previewIds = useMemo(() => [...new Set([...pageAssets.map((asset) => asset.id), ...stagedIds])], [pageAssets, stagedIds]);
  const previews = usePreviewUrls(previewIds);
  const detailAsset = assets.find((asset) => asset.id === detailId);
  const stagedAssets = stagedIds.flatMap((id) => assets.find((asset) => asset.id === id) ?? []);
  // The first staged asset locks the picker to its kind — a publication holds images or videos,
  // never both (ADR 0049 §5). "Clear all" in the footer unlocks it.
  const lockedKind = stagedAssets.length ? assetKind(stagedAssets[0]) : null;
  const canStage = (asset: MediaAsset) => lockedKind === null || assetKind(asset) === lockedKind;
  const resolutions = useMemo(() => [...new Set(assets.flatMap((asset) => asset.width && asset.height ? [`${asset.width}x${asset.height}`] : []))], [assets]);

  const update = (next: Partial<AssetPickerFilters>) => { setFilters((current) => ({ ...current, ...next })); setPage(1); };
  const toggle = (asset: MediaAsset) => {
    if (!canStage(asset)) return;
    setDetailId(asset.id);
    setStagedIds((ids) => ids.includes(asset.id) ? ids.filter((id) => id !== asset.id) : [...ids, asset.id]);
  };

  const footer = <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
    <div className="flex min-w-0 items-center gap-3"><span className="shrink-0 text-xs font-medium text-muted-foreground">{stagedIds.length} item{stagedIds.length === 1 ? "" : "s"} selected</span>{stagedIds.length > 0 && <button type="button" onClick={() => setStagedIds([])} className="shrink-0 text-xs font-medium text-primary hover:text-primary">Clear all</button>}<div className="flex min-w-0 gap-2 overflow-x-auto">{stagedAssets.map((asset) => <span key={asset.id} className="inline-flex max-w-48 shrink-0 items-center gap-2 rounded-lg border border-primary/30 bg-primary-soft px-2 py-1 text-xs text-muted-foreground"><span className="truncate">{asset.file?.original_filename ?? asset.title ?? asset.id}</span><button type="button" onClick={() => setStagedIds((ids) => ids.filter((id) => id !== asset.id))} aria-label={`Remove ${asset.title ?? asset.id}`} className="text-muted-foreground hover:text-foreground">×</button></span>)}</div></div>
    <div className="flex shrink-0 gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30">Cancel</button><button type="button" disabled={!stagedIds.length} onClick={() => onSelect(stagedIds)} className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30">Select →</button></div>
  </div>;

  return <Modal open onClose={onClose} title="Media Picker" size="preview" showCloseButton footer={footer}>
    <p className="-mt-2 text-xs text-muted-foreground">เลือกสื่อที่ต้องการใช้งาน</p>
    <div className="mt-1 flex flex-wrap items-center gap-2 border-y border-border py-3">
      <label className="relative min-w-64 flex-1"><SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={filters.query} onChange={(event) => update({ query: event.target.value })} placeholder="Search media by name, tag, resolution..." className="w-full rounded-lg border border-border py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" /></label>
      <select aria-label="Media type" value={filters.kind} onChange={(event) => update({ kind: event.target.value as AssetPickerFilters["kind"] })} className="rounded-lg border border-border px-3 py-2 text-sm"><option value="all">All Types</option><option value="image">Image</option><option value="video">Video</option></select>
      <select aria-label="Status" value={filters.status} onChange={(event) => update({ status: event.target.value })} className="rounded-lg border border-border px-3 py-2 text-sm">{STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
      <select aria-label="Resolution" value={filters.resolution} onChange={(event) => update({ resolution: event.target.value })} className="rounded-lg border border-border px-3 py-2 text-sm"><option value="all">Any Resolution</option>{resolutions.map((resolution) => <option key={resolution} value={resolution}>{resolution}</option>)}</select>
      <Link href="/media-workspace/assets" target="_blank" className="inline-flex items-center gap-1 px-2 py-2 text-sm font-medium text-primary">Media Library <ExternalLinkIcon /></Link>
    </div>
    <div className="grid h-[min(42rem,calc(100vh-15rem))] min-h-[30rem] grid-cols-[11rem_minmax(0,1fr)_16rem] overflow-hidden border-b border-border">
      <aside id="media-picker-filters" tabIndex={-1} className="overflow-y-auto border-r border-border px-3 py-4 focus:outline-none">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Filters</p>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Type</p>
        <FilterChoice icon={<GridIcon className="h-3.5 w-3.5 text-primary" />} label="All Types" checked={filters.kind === "all"} onClick={() => update({ kind: "all" })} />
        <FilterChoice icon={<ImageIcon className="h-3.5 w-3.5 text-success" />} label="Image" checked={filters.kind === "image"} onClick={() => update({ kind: "image" })} />
        <FilterChoice icon={<PlayIcon className="h-3.5 w-3.5 text-blue-500" />} label="Video" checked={filters.kind === "video"} onClick={() => update({ kind: "video" })} />
        {['Audio', 'HTML', 'Document'].map((label) => <FilterChoice key={label} icon={<span className="h-2 w-2 rounded-full bg-border" />} label={label} checked={false} disabled onClick={() => undefined} />)}
        <div className="my-3 border-t border-border" />
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</p>
        {STATUS_OPTIONS.map((option, index) => <FilterChoice key={option.value} icon={<span className={`h-2 w-2 rounded-full ${["bg-primary", "bg-success", "bg-warning", "bg-border", "bg-danger"][index]}`} />} label={option.label} checked={filters.status === option.value} onClick={() => update({ status: option.value })} />)}
        <div className="my-3 border-t border-border" />
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Duration</p>
        <div className="flex items-center gap-1"><input aria-label="Minimum duration" inputMode="numeric" value={filters.minDuration} onChange={(event) => update({ minDuration: event.target.value })} placeholder="Min" className="min-w-0 rounded border border-border px-2 py-1.5 text-xs" /><span className="text-muted-foreground">–</span><input aria-label="Maximum duration" inputMode="numeric" value={filters.maxDuration} onChange={(event) => update({ maxDuration: event.target.value })} placeholder="Max" className="min-w-0 rounded border border-border px-2 py-1.5 text-xs" /></div>
        <p className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tags</p>
        <select aria-label="Tag" value={filters.tagId ?? ""} onChange={(event) => update({ tagId: event.target.value || null })} className="w-full rounded-lg border border-border px-2 py-2 text-xs"><option value="">Select or type tags</option>{tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</select>
      </aside>
      <section className="flex min-w-0 flex-col overflow-hidden p-4">
        <div className="mb-3 flex items-center justify-between gap-3"><p className="text-xs font-medium text-muted-foreground">{loading ? "Loading media…" : error ?? `${visible.length} items found`}{lockedKind && <span className="ml-2 font-normal text-muted-foreground">· {lockedKind === "video" ? "วิดีโอ" : "รูปภาพ"}เท่านั้น — กด Clear all เพื่อสลับชนิด</span>}</p><div className="flex items-center gap-2"><select aria-label="Sort media" value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-lg border border-border px-2 py-1.5 text-xs"><option value="newest">Sort by: Newest</option><option value="oldest">Sort by: Oldest</option><option value="name">Sort by: Name</option></select><div className="flex rounded-lg border border-border p-0.5"><button type="button" onClick={() => setView("grid")} aria-label="Grid view" className={`rounded p-1.5 ${view === "grid" ? "bg-primary-soft text-primary" : "text-muted-foreground"}`}><GridIcon /></button><button type="button" onClick={() => setView("list")} aria-label="List view" className={`rounded p-1.5 ${view === "list" ? "bg-primary-soft text-primary" : "text-muted-foreground"}`}><ListIcon /></button></div></div></div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {view === "grid" ? (
            <div className="grid grid-cols-3 gap-3">
              {pageAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  kind="asset"
                  asset={asset}
                  aspect="video"
                  previewUrl={previews.urls[asset.id]}
                  thumbnailUrl={previews.thumbnailUrls[asset.id]}
                  selected={stagedIds.includes(asset.id)}
                  onSelect={() => toggle(asset)}
                  disabled={!canStage(asset)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {pageAssets.map((asset) => {
                const isSelected = stagedIds.includes(asset.id);
                const label = asset.title ?? asset.file?.original_filename ?? asset.id;
                const status = asset.status === "ready" ? "Active" : asset.status ?? "—";
                return (
                  <button
                    key={asset.id}
                    type="button"
                    disabled={!canStage(asset)}
                    onClick={() => toggle(asset)}
                    className={`grid w-full grid-cols-[1.5rem_5rem_minmax(0,1fr)_7rem] items-center gap-3 rounded-xl border p-2 text-left transition-colors ${isSelected ? "border-primary bg-primary-soft ring-1 ring-primary/30" : "border-border hover:border-border hover:bg-muted"} disabled:opacity-50`}
                  >
                    <span className={`grid h-5 w-5 place-items-center rounded-full border text-[10px] ${isSelected ? "border-primary bg-primary text-white" : "border-border bg-card"}`}>
                      {isSelected ? "✓" : ""}
                    </span>
                    <MediaThumb
                      url={previews.urls[asset.id]}
                      thumbnailUrl={previews.thumbnailUrls[asset.id]}
                      kind={asset.kind}
                      mimeType={asset.file?.mime_type}
                      alt={label}
                      className="aspect-video h-12 w-20 rounded-lg"
                    />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-foreground">{label}</span>
                        {asset.tags?.[0] && <span className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-medium text-primary">{asset.tags[0].name}</span>}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span>{assetKind(asset)}</span>
                        <span>{asset.width && asset.height ? `${asset.width} × ${asset.height}` : "No resolution"}</span>
                        <span>{asset.duration_seconds ? `${Math.round(asset.duration_seconds)}s` : "Still image"}</span>
                        <span>
                          {asset.updated_at || asset.created_at
                            ? `Updated ${new Date(asset.updated_at ?? asset.created_at!).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                            : ""}
                        </span>
                      </span>
                    </span>
                    <span className="text-right">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${status === "Active" ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}>{status}</span>
                      <span className="mt-1 block truncate text-[10px] text-muted-foreground">{asset.created_by?.display_name ?? "—"}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {!loading && !error && !pageAssets.length && <p className="py-12 text-center text-sm text-muted-foreground">No media matches these filters.</p>}
        </div>
        <div className="shrink-0 border-t border-border bg-card"><Pagination page={currentPage} totalPages={totalPages} perPage={perPage} perPageOptions={PER_PAGE_OPTIONS} totalItems={visible.length} rangeStart={visible.length ? (currentPage - 1) * perPage + 1 : 0} rangeEnd={Math.min(currentPage * perPage, visible.length)} itemLabel="media" onPageChange={setPage} onPerPageChange={(next) => { setPerPage(next); setPage(1); }} /></div>
      </section>
      <aside className="overflow-y-auto border-l border-border"><p className="border-b border-border px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Selected item</p><AssetDetail asset={detailAsset} previewUrl={detailAsset ? previews.urls[detailAsset.id] : undefined} thumbnailUrl={detailAsset ? previews.thumbnailUrls[detailAsset.id] : undefined} /></aside>
    </div>
  </Modal>;
}
