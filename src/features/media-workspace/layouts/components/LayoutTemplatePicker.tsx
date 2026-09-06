"use client";

// ADR 0063 §2–§3: `New Layout` opens this one modal. It offers the system presets and the
// tenant's own Templates, collects no name, writes nothing, and hands the choice to the
// editor as client state (see create-seed.ts). `Create from Scratch` lives inside it.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { classifyApiError } from "@/lib/api/api-error";
import { fetchLayouts } from "../services/layouts-api";
import type { LayoutListItem } from "../types";
import {
  DEFAULT_PICKER_FILTERS,
  allUseCases,
  filterEntries,
  groupEntries,
  toPickerEntries,
  type PickerEntry,
} from "../template-picker";
import { writeCreateSeed } from "../create-seed";
import { LayoutWireframe } from "./LayoutWireframe";

const GROUPS = [
  { key: "recommended", label: "Recommended" },
  { key: "myTemplates", label: "My Templates" },
  { key: "all", label: "All" },
  { key: "recentlyUsed", label: "Recently Used" },
] as const;
type GroupKey = (typeof GROUPS)[number]["key"];

const selectClasses =
  "rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900";

function BehaviourBadge({ entry }: { entry: PickerEntry }) {
  const copied = entry.behaviour === "copied";
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
        copied
          ? "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
          : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
      }`}
      title={
        copied
          ? "A copy — later Zone edits stay on this Layout"
          : "Shared — later Zone edits affect every Layout using this Template"
      }
    >
      {copied ? "Copied" : "Shared"}
    </span>
  );
}

export function LayoutTemplatePicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [templates, setTemplates] = useState<LayoutListItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [group, setGroup] = useState<GroupKey>("recommended");
  const [filters, setFilters] = useState(DEFAULT_PICKER_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    fetchLayouts("template")
      .then((rows) => {
        if (!alive) return;
        setTemplates(rows);
        setLoadError(null);
      })
      .catch((err) => alive && setLoadError(classifyApiError(err, "โหลด Templates ไม่สำเร็จ").message));
    return () => {
      alive = false;
    };
  }, [open]);

  const entries = useMemo(() => toPickerEntries(templates), [templates]);
  const useCases = useMemo(() => allUseCases(entries), [entries]);
  const visible = useMemo(() => {
    const grouped = groupEntries(filterEntries(entries, filters));
    return grouped[group];
  }, [entries, filters, group]);
  const selected = visible.find((e) => e.id === selectedId) ?? visible[0] ?? null;

  const start = (seed: Parameters<typeof writeCreateSeed>[0]) => {
    writeCreateSeed(seed);
    onClose();
    router.push("/media-workspace/layouts/create");
  };

  const useSelected = () => {
    if (!selected) return;
    start(
      selected.source === "preset"
        ? { kind: "preset", presetKey: selected.id }
        : { kind: "template", layoutId: selected.id },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Choose a starting point"
      footer={
        <>
          <Button variant="secondary" onClick={() => start({ kind: "scratch" })}>
            Create from Scratch
          </Button>
          <span className="flex-1" />
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={useSelected} disabled={!selected}>
            Use this {selected?.source === "template" ? "Template" : "layout"}
          </Button>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        {GROUPS.map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => {
              setGroup(g.key);
              setSelectedId(null);
            }}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              group === g.key
                ? "bg-indigo-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          placeholder="Search name or description…"
          className="min-w-48 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <select
          aria-label="Orientation"
          value={filters.orientation}
          onChange={(e) => setFilters((f) => ({ ...f, orientation: e.target.value as typeof f.orientation }))}
          className={selectClasses}
        >
          <option value="all">Any orientation</option>
          <option value="landscape">Landscape</option>
          <option value="portrait">Portrait</option>
        </select>
        <select
          aria-label="Zones"
          value={filters.zoneCount}
          onChange={(e) => setFilters((f) => ({ ...f, zoneCount: e.target.value as typeof f.zoneCount }))}
          className={selectClasses}
        >
          <option value="all">Any zones</option>
          <option value="1">1 zone</option>
          <option value="2">2 zones</option>
          <option value="3">3 zones</option>
          <option value="4+">4+ zones</option>
        </select>
        <select
          aria-label="Use case"
          value={filters.useCase}
          onChange={(e) => setFilters((f) => ({ ...f, useCase: e.target.value }))}
          className={selectClasses}
        >
          <option value="all">Any use case</option>
          {useCases.map((uc) => (
            <option key={uc} value={uc}>
              {uc}
            </option>
          ))}
        </select>
      </div>

      {loadError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{loadError}</p>}

      <div className="mt-3 grid gap-4 md:grid-cols-[1fr_260px]">
        <div className="grid max-h-[52vh] grid-cols-2 gap-3 overflow-auto pr-1 sm:grid-cols-3">
          {visible.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-zinc-500">No matches.</p>
          )}
          {visible.map((entry) => (
            <button
              key={`${entry.source}:${entry.id}`}
              type="button"
              onClick={() => setSelectedId(entry.id)}
              className={`flex flex-col gap-2 rounded-lg border p-2 text-left ${
                selected?.id === entry.id && selected.source === entry.source
                  ? "border-indigo-500 ring-2 ring-indigo-500/30"
                  : "border-zinc-200 hover:border-indigo-400 dark:border-zinc-700"
              }`}
            >
              <LayoutWireframe
                zones={entry.zones}
                background="#0b0b0b"
                aspectRatio={entry.aspectRatio}
                className="w-full rounded border border-zinc-200 dark:border-zinc-700"
              />
              <span className="flex items-center justify-between gap-1">
                <span className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-200">
                  {entry.name}
                </span>
                <BehaviourBadge entry={entry} />
              </span>
            </button>
          ))}
        </div>

        {selected && (
          <aside className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
            <LayoutWireframe
              zones={selected.zones}
              background="#0b0b0b"
              aspectRatio={selected.aspectRatio}
              shouldShowLabels
              className="w-full rounded border border-zinc-200 dark:border-zinc-700"
            />
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{selected.name}</p>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-zinc-500">
              <dt>Aspect ratio</dt>
              <dd className="text-zinc-700 dark:text-zinc-300">{selected.aspectRatio}</dd>
              <dt>Orientation</dt>
              <dd className="capitalize text-zinc-700 dark:text-zinc-300">{selected.orientation}</dd>
              <dt>Zones</dt>
              <dd className="text-zinc-700 dark:text-zinc-300">{selected.zoneCount}</dd>
              <dt>On use</dt>
              <dd className="text-zinc-700 dark:text-zinc-300">
                {selected.behaviour === "copied" ? "Copied to this Layout" : "Shared reference"}
              </dd>
            </dl>
            {selected.useCases.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selected.useCases.map((uc) => (
                  <span
                    key={uc}
                    className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {uc}
                  </span>
                ))}
              </div>
            )}
            {selected.description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{selected.description}</p>
            )}
          </aside>
        )}
      </div>
    </Modal>
  );
}
