"use client";

// The merged editor (ADR 0052, ADR 0063). Composition root only: it owns the draft and wires
// the pieces together — the hooks (useComposition*), the write path (save-composition.ts), and
// the canvas/panels/header/overlays each in a file of their own. The 300-line ceiling keeps it so.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { fetchLayout, promoteLayoutToTemplate } from "@/features/media-workspace/layouts/services/layouts-api";
import { takeCreateSeed } from "@/features/media-workspace/layouts/create-seed";
import type { LayoutListItem, LayoutZone } from "@/features/media-workspace/layouts/types";
import { PlaybackPreviewModal } from "@/features/media-workspace/preview/PlaybackPreviewModal";
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
import { CompositionCanvasPane } from "./CompositionCanvasPane";
import { CompositionEditorHeader } from "./CompositionEditorHeader";
import { CompositionEditorOverlays } from "./CompositionEditorOverlays";
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
  // `undefined` = untouched and unknown, so persist leaves filing alone (see PersistInput).
  const [folderId, setFolderId] = useState<string | null | undefined>(undefined);
  const [tags, setTags] = useState<string[] | undefined>(undefined);
  const [status, setStatus] = useState<CompositionStatus>("draft");
  const [revision, setRevision] = useState<number | null>(null);
  const [bindings, setBindings] = useState<ZoneBindingDraft[]>([]);
  const [initialSnapshot, setInitialSnapshot] = useState("");
  // ADR 0063 §2: `Unsaved` until the first write, `Last saved HH:MM` after — never "Saved just now".
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const [previewOpen, setPreviewOpen] = useState(initialPreview);
  const [loading, setLoading] = useState(!!compositionId);
  const [loadError, setLoadError] = useState<ClassifiedError | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [namingTemplate, setNamingTemplate] = useState(false);

  const view = useEditorLayout({
    layouts: data.layouts, layoutId, name, blankZones, editedZones, layoutSettings, bindings,
  });
  const { layout, settings, sharedTemplateUsage } = view;

  // ADR 0063 §2: Template Picker seeds the choice in sessionStorage; read once into state so
  // Strict Mode's second effect pass can't find it already cleared.
  const [createSeed] = useState(() => (compositionId ? null : takeCreateSeed()));
  useEffect(() => {
    if (compositionId) return;
    let alive = true;
    void resolveCreateSeed(createSeed).then((seed) => {
      if (!alive || !seed) return;
      if (seed.kind === "zones") {
        setBlankZones(seed.zones);
        return;
      }
      const { layout: seeded } = seed;
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

  const isDirty = draftSnapshot({ name, layoutId, bindings, folderId, tags }) !== initialSnapshot;

  const setBinding = (next: ZoneBindingDraft) => {
    if (next.playlistId && !data.playlistPreviewAssetIds[next.playlistId]) data.hydratePlaylist(next.playlistId);
    setBindings((prev) => upsertBinding(prev, next));
  };

  // Every Zone edit — canvas or the Layout tab — goes through this one gate.
  const { confirmGeometryChange, beginZoneEdit, resetApproval, undo, redo, canUndo, canRedo } =
    useZoneEditGuard(layout?.zones ?? [], sharedTemplateUsage, setEditedZones);

  const applyPlaybackToAllZones = (playback: ZonePlayback) =>
    setBindings((prev) => applyPlaybackToAll(view.layoutZoneIds, prev, playback));

  /** Swap RPC-confirmed geometry in for the draft's client-minted Zone ids. Called mid-save as
   *  well as after, so a save that dies later resumes on real ids. `saved` null = no geometry
   *  written this round. */
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
      // Ticket 28's recovery seams — banked into the draft mid-save so a failure keeps them.
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

  /** ADR 0052 §3's escape hatch, offered next to the shared-Template warning. */
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

  // Dialog closed before the save runs: a failure must reach the header slot a modal would hide.
  const saveAsTemplate = (templateName: string) => {
    setNamingTemplate(false);
    void save(async (result) => {
      await promoteLayoutToTemplate(result.layoutId, templateName);
      router.push("/media-workspace/layouts/templates");
    }, "บันทึกเป็น Template ไม่สำเร็จ");
  };

  if (loading) return <p className="p-6 text-sm text-zinc-400">กำลังโหลด...</p>;

  const fatal = loadError ?? data.loadError;
  if (fatal) return (
    <Card className="p-6">
      <p className="text-sm text-red-500">{fatal.message}</p>
      <Button className="mt-4" variant="secondary" onClick={() => router.push(LIST_PATH)}>กลับไป Layouts</Button>
    </Card>
  );

  return (
    <div className="flex flex-col gap-6">
      <CompositionEditorHeader
        isExisting={!!id}
        name={name}
        onNameChange={setName}
        savedAt={savedAt}
        saving={saving}
        canPreview={!!layout}
        canFullPreview={!!id && !!layout}
        canSaveAsTemplate={!!layoutId && layout?.kind === "inline"}
        status={status}
        hasLayout={!!layout}
        isComplete={view.complete}
        unboundZoneNames={view.unboundZoneNames}
        onCancel={() => (isDirty ? setConfirmLeave(true) : router.push(LIST_PATH))}
        onPreview={() => setPreviewOpen(true)}
        onFullPreview={() => preview.openFullPreview(isDirty)}
        onUseInProgram={() => router.push(`/media-workspace/publications/create?compositionId=${id}`)}
        onSaveDraft={() => void save(() => router.push(LIST_PATH), "บันทึก Composition ไม่สำเร็จ")}
        onSaveAsTemplate={() => setNamingTemplate(true)}
        onActivate={() => void save(async (result) => {
          await setCompositionStatus(result.compositionId, "active");
          router.push(LIST_PATH);
        }, "เปิดใช้งาน Composition ไม่สำเร็จ")}
      />

      <CompositionEditorOverlays
        confirmLeave={confirmLeave}
        onStay={() => setConfirmLeave(false)}
        onLeave={() => router.push(LIST_PATH)}
        namingTemplate={namingTemplate}
        templateDefaultName={name}
        takenTemplateNames={data.layouts.flatMap((c) => (c.kind === "template" ? [c.name] : []))}
        onCloseNaming={() => setNamingTemplate(false)}
        onConfirmTemplate={saveAsTemplate}
        saveError={saveError}
        sharedTemplateUsage={sharedTemplateUsage}
        saving={saving}
        onForkLayout={handleForkLayout}
      />

      <PlaybackPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        zones={preview.playbackPreviewZones}
        assets={data.assets}
        aspectRatio={layout?.aspect_ratio}
        previewUrls={data.previews}
        geometryOptions={editorGeometryOptions(layout?.reference_resolution)}
        referenceResolution={layout?.reference_resolution ?? null}
      />

      <Card className="grid gap-6 p-4 lg:grid-cols-[1fr_260px]">
        {layout ? (
          <CompositionCanvasPane
            zones={layout.zones}
            background={settings.background}
            aspectRatio={settings.aspectRatio}
            zonePreviews={preview.zonePreviews}
            bindings={bindings}
            unboundZoneIds={view.unboundZoneIds}
            activeZoneId={view.selectedZoneId}
            onSelectZone={view.setSelectedZoneId}
            onChangeStart={beginZoneEdit}
            onChange={setEditedZones}
            canUndo={canUndo} canRedo={canRedo}
            onUndo={undo} onRedo={redo}
          />
        ) : (
          <div className="flex min-h-40 items-center justify-center rounded-lg bg-zinc-100 text-sm text-zinc-400 dark:bg-zinc-800">
            Start from the Template Picker to see Zones here
          </div>
        )}

        <LayoutPropertiesPanel
          name={name}
          onNameChange={setName}
          folders={data.folders}
          folderId={folderId ?? null}
          onFolderChange={setFolderId}
          tags={tags ?? []}
          onTagsChange={setTags}
          settings={settings}
          onSettingsChange={(next) => confirmGeometryChange() && setLayoutSettings(next)}
          sharedTemplateUsage={sharedTemplateUsage}
          disabled={saving}
        />
      </Card>

      {view.binding && view.activeZone && (
        <ZonePropertiesPanel
          zone={view.activeZone} referenceResolution={layout?.reference_resolution ?? null}
          onZoneChange={(next) => beginZoneEdit() && setEditedZones((layout?.zones ?? []).map((zone) => (zone.id === next.id ? next : zone)))}
          binding={view.binding} onBindingChange={setBinding}
          onApplyPlaybackToAllZones={applyPlaybackToAllZones}
          assets={data.assets} playlists={data.playlists}
          previews={data.previews} playlistPreviews={preview.playlistPreviews}
          playlistDurations={data.playlistDurations}
        />
      )}
    </div>
  );
}
