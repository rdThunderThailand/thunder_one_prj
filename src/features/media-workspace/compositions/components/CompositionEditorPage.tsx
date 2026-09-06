"use client";

// The merged editor (ADR 0052, ADR 0063). This file is the composition root only: it owns the
// draft and wires the pieces together. Ticket 25 moved everything else out —
//   loading        → hooks/useCompositionEditorData
//   preview shapes → hooks/useCompositionPreview
//   the write path → save-composition.ts   (ticket 28's territory)
//   the canvas     → CompositionCanvasPane (ticket 26's)
//   the panel      → LayoutPropertiesPanel
//   the Zone panel → ZonePropertiesPanel   (ticket 27's — wraps ZoneContentPicker)
//   the header     → CompositionEditorHeader (ticket 28's too)
//   what is shown  → hooks/useEditorLayout
//   Zone edit gate → hooks/useZoneEditGuard (ticket 26 — undo/redo + shared-Template confirm)
// so that tickets 26, 27 and 28 edit three different files instead of three copies of this one.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { fetchLayout, setLayoutKind } from "@/features/media-workspace/layouts/services/layouts-api";
import type { LayoutZone } from "@/features/media-workspace/layouts/types";
import { UnsavedLeaveConfirm } from "@/features/media-workspace/playlists/components/UnsavedLeaveConfirm";
import { PlaybackPreviewModal } from "@/features/media-workspace/preview/PlaybackPreviewModal";
import { editorGeometryOptions } from "@/features/media-workspace/preview/preview-geometry";
import { setCompositionStatus } from "../services/compositions-api";
import { forkLayoutForComposition, type LayoutSettingsDraft } from "../save-composition";
import { draftSnapshot, loadCompositionDraft, resolveCreateSeed } from "../load-composition-draft";
import type { CompositionStatus } from "../types";
import { applyPlaybackToAll, type ZoneBindingDraft, type ZonePlayback } from "../zone-bindings";
import { useCompositionEditorData } from "../hooks/useCompositionEditorData";
import { useCompositionPreview } from "../hooks/useCompositionPreview";
import { useCompositionSave } from "../hooks/useCompositionSave";
import { useEditorLayout } from "../hooks/useEditorLayout";
import { useZoneEditGuard } from "../hooks/useZoneEditGuard";
import { CompositionCanvasPane } from "./CompositionCanvasPane";
import { CompositionEditorHeader } from "./CompositionEditorHeader";
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
  /** ADR 0063 §2: `Unsaved` until the first write, `Last saved HH:MM` after — never
   *  "Saved just now" on a canvas nothing has ever been written for. */
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const [previewOpen, setPreviewOpen] = useState(initialPreview);
  const [loading, setLoading] = useState(!!compositionId);
  const [loadError, setLoadError] = useState<ClassifiedError | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const view = useEditorLayout({
    layouts: data.layouts, layoutId, name, blankZones, editedZones, layoutSettings, bindings,
  });
  const { layout, settings, sharedTemplateUsage } = view;

  // ADR 0063 §2: the Template Picker seeds the choice as client state and navigates here.
  useEffect(() => {
    if (compositionId) return;
    let alive = true;
    void resolveCreateSeed().then((seed) => {
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
    return () => {
      alive = false;
    };
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
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compositionId]);

  const preview = useCompositionPreview({ compositionId: id, layout, bindings, ...data });

  const isDirty = draftSnapshot({ name, layoutId, bindings, folderId, tags }) !== initialSnapshot;

  const setBinding = (next: ZoneBindingDraft) => {
    if (next.playlistId && !data.playlistPreviewAssetIds[next.playlistId]) data.hydratePlaylist(next.playlistId);
    setBindings((prev) => prev.some((b) => b.layoutZoneId === next.layoutZoneId)
      ? prev.map((b) => (b.layoutZoneId === next.layoutZoneId ? next : b)) : [...prev, next]);
  };

  // Every Zone edit — canvas or ticket 27's Layout tab — goes through this one gate.
  const { confirmGeometryChange, beginZoneEdit, resetApproval, undo, redo, canUndo, canRedo } =
    useZoneEditGuard(layout?.zones ?? [], sharedTemplateUsage, setEditedZones);

  const applyPlaybackToAllZones = (playback: ZonePlayback) =>
    setBindings((prev) => applyPlaybackToAll(view.layoutZoneIds, prev, playback));

  const { save, run, saving, saveError } = useCompositionSave(
    () => ({
      compositionId: id, name, revision, layoutId, layout, layoutSettings,
      savedZoneIds: new Set((data.layouts.find((c) => c.id === layoutId)?.zones ?? []).flatMap((z) => (z.id ? [z.id] : []))),
      editedZones, blankZones, layoutZoneIds: view.layoutZoneIds, bindings, folderId, tags,
    }),
    (result) => {
      setId(result.compositionId);
      setRevision(result.revision);
      setLayoutId(result.layoutId);
      setBindings(result.bindings);
      setEditedZones(null);
      setBlankZones(null);
      setLayoutSettings(null);
      setSavedAt(new Date());
      const refreshed = result.refreshedLayout;
      if (refreshed) data.setLayouts((current) => [...current.filter((c) => c.id !== refreshed.id), refreshed]);
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
        canActivate={status !== "active"}
        hasLayout={!!layout}
        isComplete={view.complete}
        unboundZoneNames={view.unboundZoneNames}
        onCancel={() => (isDirty ? setConfirmLeave(true) : router.push(LIST_PATH))}
        onPreview={() => setPreviewOpen(true)}
        onFullPreview={() => preview.openFullPreview(isDirty)}
        onSaveDraft={() => void save(() => router.push(LIST_PATH), "บันทึก Composition ไม่สำเร็จ")}
        onSaveAsTemplate={() => void save(async (result) => {
          await setLayoutKind(result.layoutId, "template");
          router.push("/media-workspace/layouts/templates");
        }, "บันทึกเป็น Template ไม่สำเร็จ")}
        onActivate={() => void save(async (result) => {
          await setCompositionStatus(result.compositionId, "active");
          router.push(LIST_PATH);
        }, "เปิดใช้งาน Composition ไม่สำเร็จ")}
      />

      {confirmLeave && <UnsavedLeaveConfirm onStay={() => setConfirmLeave(false)} onLeave={() => router.push(LIST_PATH)} />}

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

      {saveError && (
        <Card className="border-red-200 p-4 dark:border-red-900">
          <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
        </Card>
      )}

      {sharedTemplateUsage > 1 && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-amber-200 p-4 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            This Template is used by {sharedTemplateUsage} Layouts. Changing the Zones affects all of them.
          </p>
          <Button variant="secondary" disabled={saving} onClick={handleForkLayout}>Make this Layout its own copy</Button>
        </Card>
      )}

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
