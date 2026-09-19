"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { classifyApiError } from "@/lib/api/api-error";
import type { ContentFolder } from "@/types/domain";
import { writeCreateSeed, type CreateSeed } from "../create-seed";
import { fetchLayouts } from "../services/layouts-api";
import {
  DEFAULT_PICKER_FILTERS,
  allUseCases,
  filterEntries,
  groupEntries,
  toPickerEntries,
  type PickerEntry,
} from "../template-picker";
import type { LayoutListItem } from "../types";
import { CreateLayoutStartStep, type StartChoice, type StartDetails } from "./create-layout-start-step";
import { LayoutWireframe } from "./LayoutWireframe";

const GROUPS = [
  { key: "recommended", label: "Recommended" },
  { key: "all", label: "All Templates" },
  { key: "myTemplates", label: "My Templates" },
  { key: "recentlyUsed", label: "Recently Used" },
] as const;
type GroupKey = (typeof GROUPS)[number]["key"];

const INITIAL_DETAILS: StartDetails = {
  name: "",
  folderId: "",
  tags: "",
  width: "1920",
  height: "1080",
  background: "#0a0e14",
};

const selectClasses =
  "rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

function splitTags(value: string): string[] {
  return [...new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean))];
}

function TemplateCard({ entry, selected, onSelect }: { entry: PickerEntry; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`relative flex flex-col gap-2 rounded-xl border bg-card p-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 ${
        selected
          ? "border-primary ring-1 ring-primary"
          : "border-border hover:border-primary/30"
      }`}
    >
      {selected && (
        <span className="absolute right-1.5 top-1.5 z-10 grid h-5 w-5 place-items-center rounded-full bg-primary text-xs text-white" aria-hidden="true">✓</span>
      )}
      <span className="flex h-32 w-full items-center justify-center rounded-lg bg-program p-2">
        <LayoutWireframe
          zones={entry.zones}
          background="var(--program)"
          aspectRatio={entry.aspectRatio}
          programStyle
          className="h-full max-w-full rounded-lg border border-border"
        />
      </span>
      <span className="truncate text-sm font-semibold text-foreground">{entry.name}</span>
      <span className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{entry.referenceResolution?.replace("x", "×") ?? "Not set"} · {entry.aspectRatio}</span>
        <span>{entry.zoneCount} {entry.zoneCount === 1 ? "Zone" : "Zones"}</span>
      </span>
    </button>
  );
}

export function LayoutTemplatePicker({
  open,
  folders,
  tagNames,
  onClose,
  onStarted,
  hasUnsavedChanges = false,
}: {
  open: boolean;
  folders: ContentFolder[];
  tagNames: string[];
  onClose: () => void;
  /** Same-route callers can reload after the seed is written instead of pushing to themselves. */
  onStarted?: () => void;
  hasUnsavedChanges?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"start" | "templates">("start");
  const [choice, setChoice] = useState<StartChoice>("blank");
  const [details, setDetails] = useState<StartDetails>(INITIAL_DETAILS);
  const [templates, setTemplates] = useState<LayoutListItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [group, setGroup] = useState<GroupKey>("recommended");
  const [filters, setFilters] = useState(DEFAULT_PICKER_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pickedTemplate, setPickedTemplate] = useState<PickerEntry | null>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    fetchLayouts("template")
      .then((rows) => {
        if (!alive) return;
        setTemplates(rows);
        setLoadError(null);
      })
      .catch((error) => alive && setLoadError(classifyApiError(error, "โหลด Templates ไม่สำเร็จ").message));
    return () => { alive = false; };
  }, [open]);

  const entries = useMemo(() => toPickerEntries(templates), [templates]);
  const useCases = useMemo(() => allUseCases(entries), [entries]);
  const visible = useMemo(() => groupEntries(filterEntries(entries, filters))[group], [entries, filters, group]);
  const selected = visible.find((entry) => entry.id === selectedId) ?? visible[0] ?? null;
  const canCreate = details.name.trim().length > 0
    && (choice === "template" || (Number(details.width) >= 100 && Number(details.height) >= 100));

  const resetAndClose = () => {
    setStep("start");
    setChoice("blank");
    setDetails(INITIAL_DETAILS);
    setGroup("recommended");
    setFilters(DEFAULT_PICKER_FILTERS);
    setSelectedId(null);
    setPickedTemplate(null);
    onClose();
  };

  const start = (seed: CreateSeed) => {
    writeCreateSeed(seed);
    resetAndClose();
    if (onStarted) onStarted();
    else router.push("/media-workspace/layouts/create");
  };

  const createLayout = () => {
    const seedDetails = {
      name: details.name.trim(),
      folderId: details.folderId || null,
      tags: splitTags(details.tags),
      referenceResolution: details.width && details.height ? `${details.width}x${details.height}` : null,
      background: details.background,
    };
    if (choice === "blank") {
      start({ kind: "scratch", details: seedDetails });
      return;
    }
    if (!pickedTemplate) return;
    start(pickedTemplate.source === "preset"
      ? { kind: "preset", presetKey: pickedTemplate.id, aspectRatio: pickedTemplate.aspectRatio, referenceResolution: pickedTemplate.referenceResolution!, details: seedDetails }
      : { kind: "template", layoutId: pickedTemplate.id, details: seedDetails });
  };

  const useSelected = () => {
    if (!selected) return;
    const [width = "", height = ""] = selected.referenceResolution?.split("x") ?? [];
    setPickedTemplate(selected);
    setDetails((current) => ({ ...current, width, height, background: selected.background }));
    setStep("start");
  };

  const createTemplate = () => {
    if (hasUnsavedChanges && !window.confirm("You have unsaved Layout changes. Leave and create a Template?")) return;
    resetAndClose();
    router.push("/media-workspace/layouts/templates/create");
  };

  const footer = step === "start" ? (
    <>
      <Button variant="secondary" onClick={resetAndClose}>Cancel</Button>
      <Button
        onClick={() => choice === "template" && !pickedTemplate ? setStep("templates") : createLayout()}
        disabled={(choice === "blank" || !!pickedTemplate) && !canCreate}
      >
        {choice === "template" && !pickedTemplate ? "Next" : "Create Layout"} <span aria-hidden="true">→</span>
      </Button>
    </>
  ) : (
    <>
      <Button variant="secondary" onClick={() => setStep("start")}>Back</Button>
      <Button onClick={useSelected} disabled={!selected}>Use This Template <span aria-hidden="true">→</span></Button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      size={step === "start" ? "lg" : "xl"}
      title={step === "start" ? "New Layout" : "Template Picker"}
      showCloseButton
      footer={footer}
    >
      <p className="-mt-1 mb-3 text-sm text-muted-foreground">
        {step === "start"
          ? "Create a new layout from scratch or using a template."
          : "Choose a template to start your new layout."}
      </p>

      {step === "start" ? (
        <CreateLayoutStartStep
          choice={choice}
          details={details}
          folders={folders}
          tagNames={tagNames}
          selectedTemplate={pickedTemplate}
          resolutionLocked={choice === "template" && !!pickedTemplate}
          onTemplateChange={() => setStep("templates")}
          onChoiceChange={setChoice}
          onDetailsChange={setDetails}
        />
      ) : (
        <div className="grid min-h-[560px] overflow-hidden rounded-lg border border-border lg:grid-cols-[180px_minmax(0,1fr)_260px]">
          <aside className="flex flex-col border-b border-border bg-muted p-3 lg:border-b-0 lg:border-r">
            <nav aria-label="Template groups" className="space-y-1">
              {GROUPS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => { setGroup(item.key); setSelectedId(null); }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium ${
                    group === item.key
                      ? "bg-primary-soft text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="mt-auto border-t border-border pt-3">
              <Button type="button" variant="secondary" className="w-full" onClick={createTemplate}>+ Create Template</Button>
            </div>
          </aside>

          <section className="min-w-0 p-4">
            <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(180px,1fr)_auto_auto_auto]">
              <input
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Search templates…"
                aria-label="Search templates"
                className={selectClasses}
              />
              <select aria-label="Orientation" value={filters.orientation} onChange={(event) => setFilters((current) => ({ ...current, orientation: event.target.value as typeof current.orientation }))} className={selectClasses}>
                <option value="all">All Orientations</option><option value="landscape">Landscape</option><option value="portrait">Portrait</option>
              </select>
              <select aria-label="Zones" value={filters.zoneCount} onChange={(event) => setFilters((current) => ({ ...current, zoneCount: event.target.value as typeof current.zoneCount }))} className={selectClasses}>
                <option value="all">All Zone Counts</option><option value="1">1 Zone</option><option value="2">2 Zones</option><option value="3">3 Zones</option><option value="4+">4+ Zones</option>
              </select>
              <select aria-label="Use case" value={filters.useCase} onChange={(event) => setFilters((current) => ({ ...current, useCase: event.target.value }))} className={selectClasses}>
                <option value="all">All Use Cases</option>{useCases.map((useCase) => <option key={useCase} value={useCase}>{useCase}</option>)}
              </select>
            </div>
            {loadError && <p role="alert" className="mb-3 text-sm text-danger">{loadError}</p>}
            <p className="mb-3 text-sm font-semibold text-foreground">{GROUPS.find((item) => item.key === group)?.label}</p>
            <div className="grid max-h-[470px] grid-cols-1 gap-3 overflow-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((entry) => <TemplateCard key={`${entry.source}:${entry.id}`} entry={entry} selected={selected?.id === entry.id && selected.source === entry.source} onSelect={() => setSelectedId(entry.id)} />)}
              {visible.length === 0 && <p className="col-span-full py-16 text-center text-sm text-muted-foreground">No templates match these filters.</p>}
            </div>
          </section>

          <aside className="flex flex-col border-t border-border bg-muted p-4 lg:border-l lg:border-t-0">
            <p className="mb-3 text-sm font-semibold text-foreground">Template Details</p>
            <div className="min-h-0 flex-1">{selected ? (
              <div className="space-y-3">
                <LayoutWireframe zones={selected.zones} background="var(--program)" aspectRatio={selected.aspectRatio} programStyle className="w-full rounded-lg border border-border" />
                <div><p className="font-semibold text-foreground">{selected.name}</p><p className="mt-1 text-xs text-muted-foreground">{selected.zoneCount} Zones · {selected.orientation}</p></div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs"><dt className="text-muted-foreground">Resolution</dt><dd>{selected.referenceResolution ?? "Not set"}</dd><dt className="text-muted-foreground">Aspect ratio</dt><dd>{selected.aspectRatio}</dd><dt className="text-muted-foreground">On use</dt><dd>{selected.behaviour === "copied" ? "Copied" : "Shared"}</dd></dl>
                {selected.useCases.length > 0 && <div className="flex flex-wrap gap-1">{selected.useCases.map((useCase) => <span key={useCase} className="rounded-full bg-primary-soft px-2 py-1 text-[11px] text-primary">{useCase}</span>)}</div>}
                {selected.description && <p className="text-xs leading-5 text-muted-foreground">{selected.description}</p>}
              </div>
            ) : <p className="text-sm text-muted-foreground">Select a template to see its details.</p>}</div>
          </aside>
        </div>
      )}
    </Modal>
  );
}
