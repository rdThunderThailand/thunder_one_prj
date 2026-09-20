"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { fetchLayout, upsertLayout } from "@/features/media-workspace/layouts/services/layouts-api";
import { seedCanvasSettings, takeCreateSeed } from "@/features/media-workspace/layouts/create-seed";
import { LayoutTemplatePicker } from "@/features/media-workspace/layouts/components/LayoutTemplatePicker";
import { deriveAspectRatio, parseResolution } from "@/features/media-workspace/layouts/geometry";
import type { LayoutListItem, LayoutZone } from "@/features/media-workspace/layouts/types";
import { PlaybackPreviewDialog } from "@/features/media-workspace/preview/PlaybackPreviewDialog";
import { editorGeometryOptions } from "@/features/media-workspace/preview/preview-geometry";
import { setCompositionStatus } from "../services/compositions-api";
import { forkLayoutForComposition, type LayoutSettingsDraft } from "../save-composition";
import { draftSnapshot, loadCompositionDraft, resolveCreateSeed } from "../load-composition-draft";
import type { CompositionStatus } from "../types";
import { applyPlaybackToAll, upsertBinding, type ZoneBindingDraft, type ZonePlayback } from "../zone-bindings";
import { useCompositionEditorData } from "../hooks/useCompositionEditorData";
import { useCompositionPreview } from "../hooks/useCompositionPreview";
import { useCompositionSave } from "../hooks/useCompositionSave";
import { useEditorLayout } from "../hooks/useEditorLayout";
import { useZoneEditGuard } from "../hooks/useZoneEditGuard";
import { CompositionCanvasPane, ZoneOverview } from "./CompositionCanvasPane";
import { CompositionContentBrowser } from "./CompositionContentBrowser";
import { CompositionEditorHeader } from "./CompositionEditorHeader";
import { CompositionEditorToolbar } from "./CompositionEditorToolbar";
import { CompositionEditorOverlays } from "./CompositionEditorOverlays";
import { LayoutInformationCard } from "./LayoutInformationCard";
import { LayoutPropertiesPanel } from "./LayoutPropertiesPanel";
import { ZonePropertiesPanel } from "./ZonePropertiesPanel";
const LIST_PATH = "/media-workspace/layouts";
export function CompositionEditorPage({
  compositionId,
  initialPreview = false,
}: {
  compositionId?: string | null;
  initialPreview?: boolean;
}) {
  const router = useRouter();
  const data = useCompositionEditorData();
  const [id, setId] = useState<string | null>(compositionId ?? null);
  const [name, setName] = useState("");
  const [layoutId, setLayoutId] = useState<string | null>(null);
  const [blankZones, setBlankZones] = useState<LayoutZone[] | null>(null);
  const [editedZones, setEditedZones] = useState<LayoutZone[] | null>(null);
  const [layoutSettings, setLayoutSettings] = useState<LayoutSettingsDraft | null>(null);
  const [folderId, setFolderId] = useState<string | null | undefined>(undefined);
  const [tags, setTags] = useState<string[] | undefined>(undefined);
  const [status, setStatus] = useState<CompositionStatus>("draft");
  const [revision, setRevision] = useState<number | null>(null);
  const [bindings, setBindings] = useState<ZoneBindingDraft[]>([]);
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [previewOpen, setPreviewOpen] = useState(initialPreview);
  const [loading, setLoading] = useState(!!compositionId);
  const [loadError, setLoadError] = useState<ClassifiedError | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [namingTemplate, setNamingTemplate] = useState(false);
  const [templateSavedName, setTemplateSavedName] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [lockedZoneIds, setLockedZoneIds] = useState<Set<string>>(() => new Set());
  const [hiddenZoneIds, setHiddenZoneIds] = useState<Set<string>>(() => new Set());
  const [fitSignal, setFitSignal] = useState(0);
  const view = useEditorLayout({
    layouts: data.layouts, layoutId, name, blankZones, editedZones, layoutSettings, bindings,
  });
  const { layout, settings, sharedTemplateUsage } = view;
  const [createSeed] = useState(() => (compositionId ? null : takeCreateSeed()));
  useEffect(() => {
    if (compositionId) return;
    let alive = true;
    void resolveCreateSeed(createSeed).then((seed) => {
      if (!alive || !seed) return;
      const seededSettings = seedCanvasSettings(createSeed); if (seededSettings) setLayoutSettings(seededSettings);
      if (createSeed?.details) {
        const resolution = createSeed.details.referenceResolution
          ? parseResolution(createSeed.details.referenceResolution)
          : null;
        setName(createSeed.details.name);
        setFolderId(createSeed.details.folderId);
        setTags(createSeed.details.tags);
        if (createSeed.kind === "scratch") {
          setLayoutSettings({
            aspectRatio: resolution ? deriveAspectRatio(resolution[0], resolution[1]) : "16:9",
            referenceResolution: createSeed.details.referenceResolution,
            background: createSeed.details.background,
          });
        }
      }
      if (seed.kind === "zones") {
        setBlankZones(seed.zones);
        return;
      }
      const { layout: seeded } = seed;
      if (createSeed?.details) {
        setLayoutSettings({
          aspectRatio: seeded.aspect_ratio,
          referenceResolution: createSeed.details.referenceResolution,
          background: createSeed.details.background,
        });
      }
      data.setLayouts((current) => [...current.filter((candidate) => candidate.id !== seeded.id), seeded]);
      setLayoutId(seeded.id);
      view.setSelectedZoneId(seeded.zones[0]?.id ?? null);
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compositionId]);
  useEffect(() => {
    if (!compositionId) return;
    let alive = true;
    loadCompositionDraft(compositionId)
      .then((draft) => {
        if (!alive) return;
        setId(draft.detail.id);
        setName(draft.detail.name);
        setLayoutId(draft.detail.layout_id);
        setStatus(draft.detail.status);
        setRevision(draft.detail.revision);
        setFolderId(draft.folderId);
        setTags(draft.tags);
        setBindings(draft.bindings);
        setSavedAt(draft.detail.updated_at ? new Date(draft.detail.updated_at) : null);
        setInitialSnapshot(draft.snapshot);
        data.absorbPlaylistDetails(draft.slices);
        void fetchLayout(draft.detail.layout_id)
          .then((loaded) => alive && data.setLayouts((current) => [...current.filter((candidate) => candidate.id !== loaded.id), loaded]))
          .catch(() => undefined);
      })
      .catch((err) => alive && setLoadError(classifyApiError(err, "โหลด Layout ไม่สำเร็จ")))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compositionId]);
  const preview = useCompositionPreview({ compositionId: id, layout, bindings, ...data });
  const isDirty = editedZones !== null || layoutSettings !== null || draftSnapshot({ name, layoutId, bindings, folderId, tags }) !== initialSnapshot;
  const setBinding = (next: ZoneBindingDraft) => {
    if (next.playlistId && !Object.hasOwn(data.playlistItemsById, next.playlistId)) {
      data.hydratePlaylist(next.playlistId);
    }
    setBindings((prev) => upsertBinding(prev, next));
  };
  const { confirmGeometryChange, beginZoneEdit, resetApproval, undo, redo, canUndo, canRedo } =
    useZoneEditGuard(layout?.zones ?? [], sharedTemplateUsage, setEditedZones);
  const applyPlaybackToAllZones = (playback: ZonePlayback) =>
    setBindings((prev) => applyPlaybackToAll(view.layoutZoneIds, prev, playback));
  const absorbLayout = (saved: LayoutListItem | null, savedId = saved?.id) => {
    if (saved) data.setLayouts((current) => [...current.filter((c) => c.id !== saved.id), saved]);
    if (savedId) setLayoutId(savedId);
    setBlankZones(null); setEditedZones(null); setLayoutSettings(null);
  };
  const { save, run, saving, saveError } = useCompositionSave(
    () => ({
      compositionId: id, name, revision, layoutId, layout, layoutSettings,
      savedZoneIds: new Set((data.layouts.find((c) => c.id === layoutId)?.zones ?? []).flatMap((z) => (z.id ? [z.id] : []))),
      editedZones, blankZones, layoutZoneIds: view.layoutZoneIds, bindings, folderId, tags,
      onLayoutCreated: setLayoutId, onCompositionCreated: setId, onBindingsChanged: setBindings, onLayoutSaved: absorbLayout,
    }),
    (result) => {
      setId(result.compositionId);
      setRevision(result.revision);
      setBindings(result.bindings);
      setSavedAt(new Date());
      absorbLayout(result.refreshedLayout, result.layoutId);
    },
  );
  const handleForkLayout = () => {
    if (!id || !window.confirm(`This Template is used by ${sharedTemplateUsage} Layouts. Make this Layout its own copy?`)) return;
    void run(async () => {
      const forked = await forkLayoutForComposition(id, revision);
      setLayoutId(forked.layout.id);
      setRevision(forked.revision);
      setBindings(forked.bindings);
      data.setLayouts((current) => [...current.filter((c) => c.id !== forked.layout.id), forked.layout]);
      view.setSelectedZoneId(forked.layout.zones[0]?.id ?? null);
      setEditedZones(null);
      setLayoutSettings(null);
      resetApproval();
    }, "สร้าง Layout ส่วนตัวไม่สำเร็จ");
  };
  const saveAsTemplate = (templateName: string) => {
    setNamingTemplate(false);
    if (!layout) return;
    void run(async () => {
      const { layout_id } = await upsertLayout({ name: templateName, aspectRatio: settings.aspectRatio, referenceResolution: settings.referenceResolution,
        background: settings.background, status: "active", zones: layout.zones.map(({ name, x, y, width, height }) => ({ name, x, y, width, height })) });
      const created = await fetchLayout(layout_id);
      data.setLayouts((current) => [...current.filter((c) => c.id !== created.id), created]);
      setTemplateSavedName(templateName);
    }, "บันทึกเป็น Template ไม่สำเร็จ");
  };
  if (loading) return <p className="p-6 text-sm text-muted-foreground">กำลังโหลด...</p>;
  const fatal = loadError ?? data.loadError;
  if (fatal) return (
    <Card className="p-6">
      <p className="text-sm text-danger">{fatal.message}</p>
      <Button className="mt-4" variant="secondary" onClick={() => router.push(LIST_PATH)}>กลับไป Layouts</Button>
    </Card>
  );
  return (
    <div className="flex flex-col gap-4">
      <CompositionEditorHeader
        isExisting={!!id}
        name={name}
        onNameChange={setName}
        savedAt={savedAt}
        saving={saving}
        canPreview={!!layout}
        status={status}
        referenceResolution={settings.referenceResolution} aspectRatio={settings.aspectRatio}
        zoneCount={layout?.zones.length ?? 0}
        hasLayout={!!layout}
        isComplete={view.complete}
        unboundZoneNames={view.unboundZoneNames}
        onBack={() => (isDirty ? setConfirmLeave(true) : router.push(LIST_PATH))}
        onPreview={() => setPreviewOpen(true)}
        canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo}
        hasUnsavedChanges={isDirty}
        onPublish={() => router.push(`/media-workspace/publications/create?compositionId=${id}`)}
        onSaveDraft={() => void save(() => router.push(LIST_PATH), "บันทึก Composition ไม่สำเร็จ")}
        onSaveAsTemplate={() => { setTemplateSavedName(null); setNamingTemplate(true); }}
        onActivate={() => void save(async (result) => {
          await setCompositionStatus(result.compositionId, "active");
          router.push(LIST_PATH);
        }, "เปิดใช้งาน Composition ไม่สำเร็จ")}
      />
      <CompositionEditorOverlays
        confirmLeave={confirmLeave}
        onStay={() => setConfirmLeave(false)}
        onLeave={() => router.push(LIST_PATH)}
        namingTemplate={namingTemplate} templateDefaultName={name}
        takenTemplateNames={data.layouts.flatMap((c) => (c.kind === "template" ? [c.name] : [])).concat(templateSavedName ?? [])}
        onCloseNaming={() => setNamingTemplate(false)}
        onConfirmTemplate={saveAsTemplate}
        templateSavedName={templateSavedName}
        saveError={saveError} sharedTemplateUsage={sharedTemplateUsage} saving={saving}
        onForkLayout={handleForkLayout}
      />
      <PlaybackPreviewDialog
        open={previewOpen} onClose={() => setPreviewOpen(false)}
        zones={preview.playbackPreviewZones} assets={data.assets}
        aspectRatio={layout?.aspect_ratio} previewUrls={data.previews}
        geometryOptions={editorGeometryOptions(layout?.reference_resolution)}
        referenceResolution={layout?.reference_resolution ?? null}
        layoutName={name}
        canOpenFullPreview={!!id && !!layout}
        onOpenFullPreview={() => preview.openFullPreview(isDirty)}
      />
      <LayoutTemplatePicker open={pickerOpen} folders={data.folders} tagNames={tags ?? []} hasUnsavedChanges={isDirty} onClose={() => setPickerOpen(false)} onStarted={() => window.location.reload()} />
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-panel">
      <div className="flex h-[50rem] min-w-[1060px] flex-col">
        {layout && (
          <CompositionEditorToolbar
            zones={layout.zones}
            activeZoneId={view.selectedZoneId}
            lockedZoneIds={lockedZoneIds}
            hiddenZoneIds={hiddenZoneIds}
            onLockedZoneIds={setLockedZoneIds}
            onHiddenZoneIds={setHiddenZoneIds}
            onSelectZone={view.setSelectedZoneId}
            onChangeStart={beginZoneEdit}
            onChange={setEditedZones}
            onDelete={() => { if (layout.zones.length <= 1 || !beginZoneEdit()) return; const index = layout.zones.findIndex((zone) => zone.id === view.activeZone?.id); const zones = layout.zones.filter((zone) => zone.id !== view.activeZone?.id).map((zone, position) => ({ ...zone, position })); setEditedZones(zones); view.setSelectedZoneId(zones[Math.min(index, zones.length - 1)]?.id ?? null); }}
            onFit={() => setFitSignal((value) => value + 1)}
          />
        )}
      <div className="grid min-h-0 flex-1 grid-cols-[230px_minmax(560px,1fr)_270px] items-stretch">
        <CompositionContentBrowser
          binding={view.binding ?? null}
          assets={data.assets}
          playlists={data.playlists}
          previews={data.previews}
          playlistPreviews={preview.playlistPreviews}
          onChange={setBinding}
        />
        {layout ? (
          <main className="flex min-h-0 flex-col gap-3 p-3">
            <CompositionCanvasPane
              zones={layout.zones} background={settings.background} aspectRatio={settings.aspectRatio}
              referenceResolution={settings.referenceResolution} zonePreviews={preview.zonePreviews}
              activeZoneId={view.selectedZoneId} onSelectZone={view.setSelectedZoneId}
              onChangeStart={beginZoneEdit} onChange={setEditedZones}
              lockedZoneIds={lockedZoneIds}
              hiddenZoneIds={hiddenZoneIds}
              fitSignal={fitSignal}
            />
            <div className="grid shrink-0 grid-cols-2 gap-3">
              <LayoutInformationCard name={name} resolution={settings.referenceResolution} aspectRatio={settings.aspectRatio} zoneCount={layout.zones.length} status={status} />
              <section className="rounded-lg border border-border bg-card p-3 shadow-panel"><ZoneOverview zones={layout.zones} bindings={bindings} unboundZoneIds={view.unboundZoneIds} activeZoneId={view.selectedZoneId} referenceResolution={settings.referenceResolution} onSelectZone={view.setSelectedZoneId} /></section>
            </div>
          </main>
        ) : (
          <main className="flex min-h-40 flex-col items-center justify-center gap-3 bg-muted text-sm text-muted-foreground">
            <p>Start from the Template Picker to see Zones here</p>
            <Button onClick={() => setPickerOpen(true)}>+ New Layout</Button>
          </main>
        )}
        <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto border-l border-border p-3">
          {view.binding && view.activeZone ? <>
            <p className="text-sm font-semibold text-foreground">Zone Properties</p>
            <ZonePropertiesPanel
              zone={view.activeZone} referenceResolution={layout?.reference_resolution ?? null} binding={view.binding}
              onZoneChange={(next) => beginZoneEdit() && setEditedZones((layout?.zones ?? []).map((zone) => (zone.id === next.id ? next : zone)))} onBindingChange={setBinding}
              onApplyPlaybackToAllZones={applyPlaybackToAllZones} assets={data.assets} playlistDurations={data.playlistDurations}
            />
          </> : layout ? (
            <LayoutPropertiesPanel
              compact name={name} onNameChange={setName} folders={data.folders}
              folderId={folderId ?? null} onFolderChange={setFolderId}
              tags={tags ?? []} onTagsChange={setTags} settings={settings}
              onSettingsChange={(next) => confirmGeometryChange() && setLayoutSettings(next)}
              sharedTemplateUsage={sharedTemplateUsage} disabled={saving}
            />
          ) : <p className="text-sm text-muted-foreground">Select a Zone to edit its properties.</p>}
        </aside>
      </div>
      </div>
      </div>
    </div>
  );
}
