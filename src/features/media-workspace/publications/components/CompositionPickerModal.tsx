"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { ClockIcon, ExternalLinkIcon, GridIcon, InfoIcon, LayoutIcon, ListIcon, MonitorIcon, SearchIcon, UsersIcon } from "@/components/ui/icons";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import type { PreviewUrls } from "@/lib/api/media-api";
import { CompositionLibraryPreview } from "@/features/media-workspace/compositions/components/CompositionLibraryPreview";
import { fetchComposition, fetchCompositionLibrary } from "@/features/media-workspace/compositions/services/compositions-api";
import type { CompositionDetail, CompositionLibraryItem } from "@/features/media-workspace/compositions/types";
import { statusBadge } from "../../compositions/status-display";
import {
  compositionLayoutDisplayName,
  compositionLayoutTemplate,
  compositionOrientation,
  defaultCompositionPickerFilters,
  filterCompositionPickerItems,
  publishableCompositions,
  type CompositionPickerFilters,
} from "../composition-picker-filter";
import { PickerDetailPanel, PickerFilterChoice, PickerFilterPanel, PickerFilterSection, type PickerDetailField } from "./PickerPanels";

const PER_PAGE = 9;

const formatDate = (value?: string) =>
  value && !Number.isNaN(new Date(value).getTime())
    ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—";

const formatDateTime = (value?: string) =>
  value && !Number.isNaN(new Date(value).getTime())
    ? new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

const aspectRatioLabel = (resolution: string) => {
  const match = /^(\d+)x(\d+)$/.exec(resolution);
  if (!match) return resolution;
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  const divisor = gcd(Number(match[1]), Number(match[2]));
  return `${Number(match[1]) / divisor}:${Number(match[2]) / divisor}`;
};

const zoneAssetIds = (item: CompositionLibraryItem) =>
  (item.previewZones ?? []).map((zone) => zone.firstAssetId).filter((id): id is string => !!id);

export function CompositionPickerModal({ selectedId, onClose, onSelect }: { selectedId: string | null; onClose: () => void; onSelect: (id: string) => void }) {
  const [items, setItems] = useState<CompositionLibraryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(defaultCompositionPickerFilters);
  const [stagedId, setStagedId] = useState(selectedId);
  const [detailResult, setDetailResult] = useState<{ id: string; detail: CompositionDetail } | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"newest" | "oldest" | "name">("newest");
  const [view, setView] = useState<"grid" | "list">("list");
  const [zonesExpanded, setZonesExpanded] = useState(false);

  useEffect(() => {
    let alive = true;
    // ponytail: the endpoint's maximum page covers today's picker; page through it above 50 Layouts.
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
  const selected = items?.find((item) => item.id === stagedId);
  const detail = detailResult?.id === stagedId ? detailResult.detail : null;
  const covers = useMemo(() => [...new Set([...visible, ...(selected ? [selected] : [])].flatMap(zoneAssetIds))], [visible, selected]);
  const previews = usePreviewUrls(covers);
  const aspectRatios = useMemo(
    () => [...new Set((items ?? []).map((item) => item.referenceResolution).filter((value): value is string => !!value))].sort(),
    [items],
  );
  const update = (next: Partial<CompositionPickerFilters>) => { setFilters((current) => ({ ...current, ...next })); setPage(1); };
  const selectItem = (id: string) => { setStagedId(id); setZonesExpanded(false); };

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
    <Modal open onClose={onClose} title="Layout Picker" size="preview" showCloseButton footer={footer}>
      <p className="-mt-2 text-xs text-zinc-500">เลือก Layout ที่ต้องการใช้งาน</p>
      <div className="mt-1 flex items-center gap-2 border-y border-zinc-200 py-3">
        <label className="relative min-w-64 flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={filters.query}
            onChange={(event) => update({ query: event.target.value })}
            placeholder="Search layouts by name, layout, or tag..."
            className="w-full rounded-lg border border-zinc-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>
        <Link href="/media-workspace/layouts" target="_blank" className="inline-flex items-center gap-1 px-2 py-2 text-sm font-medium text-indigo-700">
          Layout Library <ExternalLinkIcon />
        </Link>
      </div>
      <div className="grid h-[min(42rem,calc(100vh-15rem))] min-h-[30rem] grid-cols-[11rem_minmax(0,1fr)_16rem] overflow-hidden border-b border-zinc-200">
        <PickerFilterPanel onClear={() => { setFilters(defaultCompositionPickerFilters); setPage(1); }}>
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
                checked={filters.status === "inactive"}
                label="Inactive"
                marker={<span className="h-2 w-2 rounded-full bg-zinc-400" />}
                onClick={() => update({ status: "inactive" })}
              />
            </div>
          </PickerFilterSection>
          <PickerFilterSection label="Orientation" divided>
            <div role="radiogroup" aria-label="Orientation">
              <PickerFilterChoice checked={filters.orientation === "all"} label="All Orientation" onClick={() => update({ orientation: "all" })} />
              <PickerFilterChoice
                checked={filters.orientation === "landscape"}
                label="Landscape"
                marker={<MonitorIcon className="h-3.5 w-3.5 text-zinc-400" />}
                onClick={() => update({ orientation: "landscape" })}
              />
              <PickerFilterChoice
                checked={filters.orientation === "portrait"}
                label="Portrait"
                marker={<MonitorIcon className="h-3.5 w-3.5 rotate-90 text-zinc-400" />}
                onClick={() => update({ orientation: "portrait" })}
              />
            </div>
          </PickerFilterSection>
          <PickerFilterSection label="Aspect ratio" divided>
            <div role="radiogroup" aria-label="Aspect ratio">
              <PickerFilterChoice checked={filters.aspectRatio === "all"} label="All Ratios" onClick={() => update({ aspectRatio: "all" })} />
              {aspectRatios.map((resolution) => (
                <PickerFilterChoice
                  key={resolution}
                  checked={filters.aspectRatio === resolution}
                  label={aspectRatioLabel(resolution)}
                  onClick={() => update({ aspectRatio: resolution })}
                />
              ))}
            </div>
          </PickerFilterSection>
        </PickerFilterPanel>
        <section className="flex min-w-0 flex-col overflow-hidden p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-700">{items === null ? "Loading layouts…" : error ?? `${sorted.length} layouts found`}</p>
            <div className="flex items-center gap-2">
              <select
                aria-label="Sort layouts"
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
            {items === null && !error ? (
              <div className="space-y-2">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-[4.5rem] rounded-xl" />)}</div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-3 gap-3">
                {visible.map((item) => (
                  <LayoutGridCard key={item.id} item={item} selected={stagedId === item.id} previews={previews} onSelect={() => selectItem(item.id)} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {visible.map((item) => (
                  <LayoutRow key={item.id} item={item} selected={stagedId === item.id} previews={previews} onSelect={() => selectItem(item.id)} />
                ))}
              </div>
            )}
            {items !== null && !error && !visible.length && <p className="py-12 text-center text-sm text-zinc-500">No layouts match these filters.</p>}
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
              itemLabel="layouts"
              onPageChange={setPage}
              onPerPageChange={() => undefined}
            />
          </div>
        </section>
        <aside className="overflow-y-auto border-l border-zinc-200">
          {selected ? (
            <LayoutDetail item={selected} detail={detail} previews={previews} expanded={zonesExpanded} onToggle={() => setZonesExpanded((value) => !value)} />
          ) : (
            <p className="p-5 text-sm text-zinc-500">เลือก Layout เพื่อดูรายละเอียด</p>
          )}
        </aside>
      </div>
    </Modal>
  );
}

function LayoutDetail({ item, detail, previews, expanded, onToggle }: { item: CompositionLibraryItem; detail: CompositionDetail | null; previews: PreviewUrls; expanded: boolean; onToggle: () => void }) {
  const template = compositionLayoutTemplate(item);
  const badge = statusBadge(item.status);
  const resolution = item.referenceResolution ?? "—";
  const description = typeof detail?.metadata?.description === "string" ? detail.metadata.description : template?.description ?? "—";
  const tags = detail?.tags ?? item.tags ?? [];
  const fields: PickerDetailField[] = [
    { icon: <LayoutIcon />, label: "Layout Name", value: compositionLayoutDisplayName(item) },
    { icon: <MonitorIcon />, label: "Aspect Ratio", value: resolution === "—" ? resolution : `${template?.aspectRatio ?? aspectRatioLabel(resolution)} (${resolution.replace("x", " × ")})` },
    { icon: <MonitorIcon className="h-4 w-4 rotate-90" />, label: "Orientation", value: compositionOrientation(item.referenceResolution) ?? "—" },
    { icon: <GridIcon />, label: "Zones", value: `${item.zone_count} Zones` },
    { icon: <UsersIcon />, label: "Created by", value: item.createdBy?.displayName ?? "—" },
    { icon: <ClockIcon />, label: "Updated", value: formatDateTime(item.updated_at ?? item.created_at) },
    { icon: <InfoIcon />, label: "Status", value: <Badge color={badge.color} variant="pill">{badge.label}</Badge> },
  ];

  return (
    <PickerDetailPanel
      preview={<CompositionLibraryPreview zones={item.previewZones} referenceResolution={item.referenceResolution} previews={previews} className="w-full rounded-lg" />}
      fields={fields}
      tags={tags}
      description={description}
      detailLabel={`ดูรายละเอียด Zones (${item.zone_count})`}
      expanded={expanded}
      onToggle={onToggle}
    >
      {detail ? (
        <ul className="mt-2 space-y-1 rounded-lg bg-zinc-50 p-3">
          {detail.zones.map((zone) => (
            <li key={zone.layout_zone_id} className="flex justify-between gap-3 text-xs">
              <span className="truncate text-zinc-700">{zone.position + 1}. {zone.name}</span>
              <span className="shrink-0 text-zinc-400">{zone.playlist_id ? "Bound" : "Unbound"}</span>
            </li>
          ))}
        </ul>
      ) : (
        <Skeleton className="mt-2 h-20 w-full" />
      )}
    </PickerDetailPanel>
  );
}

type CardProps = { item: CompositionLibraryItem; selected: boolean; previews: PreviewUrls; onSelect: () => void };

function LayoutGridCard({ item, selected, previews, onSelect }: CardProps) {
  const badge = statusBadge(item.status);
  return (
    <button type="button" onClick={onSelect} className={`overflow-hidden rounded-xl border text-left ${selected ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-zinc-200"}`}>
      <CompositionLibraryPreview zones={item.previewZones} referenceResolution={item.referenceResolution} previews={previews} className="w-full" />
      <div className="space-y-1 p-2">
        <p className="truncate text-xs font-semibold text-zinc-900">{item.name}</p>
        <p className="text-[10px] text-zinc-500">{compositionLayoutDisplayName(item)} · {item.zone_count} zones</p>
        <Badge color={badge.color} variant="pill">{badge.label}</Badge>
      </div>
    </button>
  );
}

function LayoutRow({ item, selected, previews, onSelect }: CardProps) {
  const badge = statusBadge(item.status);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`grid w-full grid-cols-[1.5rem_5rem_minmax(0,1fr)_7rem] items-center gap-3 rounded-xl border p-2 text-left transition-colors ${selected ? "border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-100" : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"}`}
    >
      <span className={`grid h-5 w-5 place-items-center rounded-full border text-[10px] ${selected ? "border-indigo-600 bg-indigo-600 text-white" : "border-zinc-300 bg-white"}`}>
        {selected ? "✓" : ""}
      </span>
      <CompositionLibraryPreview zones={item.previewZones} referenceResolution={item.referenceResolution} previews={previews} className="h-12 w-20 rounded-lg" />
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-zinc-900">{item.name}</span>
          {item.tags?.[0] && <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600">{item.tags[0].name}</span>}
        </span>
        <span className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-zinc-500">
          <span>{compositionLayoutDisplayName(item)}</span>
          <span>{item.zone_count} zones</span>
          <span>{item.referenceResolution ?? "No resolution"}</span>
          <span>Updated {formatDate(item.updated_at ?? item.created_at)}</span>
        </span>
      </span>
      <span className="text-right">
        <Badge color={badge.color} variant="pill">{badge.label}</Badge>
        <span className="mt-1 block truncate text-[10px] text-zinc-500">{item.createdBy?.displayName ?? "—"}</span>
      </span>
    </button>
  );
}
