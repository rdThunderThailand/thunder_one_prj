"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { fetchMediaAssets, fetchPreviewUrls } from "@/lib/api/media-api";
import { fetchLayout, fetchLayouts, setLayoutKind, upsertLayout } from "@/features/media-workspace/layouts/services/layouts-api";
import { LayoutCanvas } from "@/features/media-workspace/layouts/components/LayoutCanvas";
import type { LayoutListItem, LayoutZone } from "@/features/media-workspace/layouts/types";
import { splitZone } from "@/features/media-workspace/layouts/split-zone";
import { decodeMetadata, fetchPlaylists, fetchPlaylist } from "@/features/media-workspace/playlists";
import type { PlaylistListItem } from "@/features/media-workspace/playlists";
import { setPlaylistItems, upsertPlaylist } from "@/features/media-workspace/playlists/services/playlists-api";
import { UnsavedLeaveConfirm } from "@/features/media-workspace/playlists/components/UnsavedLeaveConfirm";
import { PlaybackPreviewModal, type PlaybackPreviewZone } from "@/features/media-workspace/preview/PlaybackPreviewModal";
import { editorGeometryOptions } from "@/features/media-workspace/preview/preview-geometry";
import type { CompositionPreview } from "@/features/media-workspace/preview/composition-preview";
import type { MediaAsset, PlaylistItem } from "@/types/domain";
import {
  fetchComposition,
  forkCompositionLayout,
  setCompositionZones,
  setCompositionStatus,
  upsertComposition,
} from "../services/compositions-api";
import { describeActivateError } from "../status-display";
import { firstPlaylistAssetId } from "../content-preview";
import type { CompositionStatus } from "../types";
import {
  bindingsFromCompositionZones,
  findUnboundZoneIds,
  isComplete,
  toSetZonesPayload,
  type ZoneBindingDraft,
} from "../zone-bindings";
import { ZoneContentPicker, defaultBinding } from "./ZoneContentPicker";
import { TemplateReferenceRail } from "./TemplateReferenceRail";

export function CompositionEditorPage({ compositionId, initialPreview = false }: { compositionId?: string | null; initialPreview?: boolean }) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(compositionId ?? null);
  const [name, setName] = useState("");
  const [layoutId, setLayoutId] = useState<string | null>(null);
  const [blankZones, setBlankZones] = useState<LayoutZone[] | null>(null);
  const [editedZones, setEditedZones] = useState<LayoutZone[] | null>(null);
  const [sharedGeometryApproved, setSharedGeometryApproved] = useState(false);
  const [status, setStatus] = useState<CompositionStatus>("draft");
  const [revision, setRevision] = useState<number | null>(null);
  const [bindings, setBindings] = useState<ZoneBindingDraft[]>([]);
  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  const [layouts, setLayouts] = useState<LayoutListItem[]>([]);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistListItem[]>([]);
  const [playlistDurations, setPlaylistDurations] = useState<Record<string, number | undefined>>({});
  const [previews, setPreviews] = useState<Record<string, string | undefined>>({});
  const [previewThumbnails, setPreviewThumbnails] = useState<Record<string, string | undefined>>({});
  const [playlistPreviewAssetIds, setPlaylistPreviewAssetIds] = useState<Record<string, string>>({});
  const [playlistItemsById, setPlaylistItemsById] = useState<Record<string, PlaylistItem[]>>({});
  const [previewOpen, setPreviewOpen] = useState(initialPreview);

  const [loading, setLoading] = useState(!!compositionId);
  const [loadError, setLoadError] = useState<ClassifiedError | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const fullPreviewChannel = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([fetchLayouts(), fetchMediaAssets().catch(() => []), fetchPlaylists()])
      .then(([allLayouts, allAssets, allPlaylists]) => {
        if (!alive) return;
        setLayouts(allLayouts.filter((l) => l.status === "active"));
        setAssets(allAssets);
        setPlaylists(allPlaylists);
        const durationEntries = allPlaylists.map((p) => [p.id, p.total_duration_seconds] as const);
        setPlaylistDurations(Object.fromEntries(durationEntries));
        const explicitCoverIds = Object.fromEntries(
          allPlaylists.flatMap((playlist) => {
            const assetId = playlist.cover_asset_id ?? decodeMetadata(playlist.metadata).info.coverAssetId;
            return assetId ? [[playlist.id, assetId]] : [];
          }),
        );
        setPlaylistPreviewAssetIds((current) => ({ ...current, ...explicitCoverIds }));
        void Promise.all(
          allPlaylists.map(async (playlist) => {
            try {
              const detail = await fetchPlaylist(playlist.id);
              const assetId = firstPlaylistAssetId(detail.items);
              return { playlistId: playlist.id, assetId, items: detail.items };
            } catch {
              return null;
            }
          }),
        ).then((entries) => {
          if (!alive) return;
          setPlaylistPreviewAssetIds((current) => ({
            ...current,
            ...Object.fromEntries(entries.flatMap((entry) => entry?.assetId ? [[entry.playlistId, entry.assetId]] : [])),
          }));
          setPlaylistItemsById((current) => ({
            ...current,
            ...Object.fromEntries(entries.flatMap((entry) => entry ? [[entry.playlistId, entry.items]] : [])),
          }));
        });
      })
      .catch((err) => alive && setLoadError(classifyApiError(err, "โหลดข้อมูลไม่สำเร็จ")));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!compositionId) return;
    let alive = true;
    fetchComposition(compositionId)
      .then(async (detail) => {
        if (!alive) return;
        setId(detail.id);
        setName(detail.name);
        setLayoutId(detail.layout_id);
        setStatus(detail.status);
        setRevision(detail.revision);
        fetchLayout(detail.layout_id)
          .then((loadedLayout) => alive && setLayouts((current) => [...current.filter((candidate) => candidate.id !== loadedLayout.id), loadedLayout]))
          .catch(() => undefined);
        const loadedBindings = bindingsFromCompositionZones(detail.zones);

        // media_playlists_list excludes kind='inline', and media_composition_get carries no
        // playlist_name — a Zone bound to an implicit inline Playlist needs its own fetch to
        // show anything better than a bare id.
        const named = await Promise.all(
          loadedBindings.map(async (binding) => {
            if (!binding.playlistId) return { binding };
            try {
              const playlistDetail = await fetchPlaylist(binding.playlistId);
              return {
                binding: { ...binding, playlistName: playlistDetail.name },
                firstAssetId: firstPlaylistAssetId(playlistDetail.items),
                items: playlistDetail.items,
              };
            } catch {
              return { binding };
            }
          }),
        );
        if (!alive) return;
        const namedBindings = named.map((entry) => entry.binding);
        setBindings(namedBindings);
        setPlaylistPreviewAssetIds((current) => ({
          ...current,
          ...Object.fromEntries(named.flatMap((entry) => (
            entry.binding.playlistId && entry.firstAssetId ? [[entry.binding.playlistId, entry.firstAssetId]] : []
          ))),
        }));
        setPlaylistItemsById((current) => ({
          ...current,
          ...Object.fromEntries(named.flatMap((entry) => entry.binding.playlistId && entry.items ? [[entry.binding.playlistId, entry.items]] : [])),
        }));
        setInitialSnapshot(JSON.stringify({ name: detail.name, layoutId: detail.layout_id, bindings: namedBindings }));
      })
      .catch((err) => alive && setLoadError(classifyApiError(err, "โหลด Layout ไม่สำเร็จ")))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [compositionId]);

  const layout = useMemo(() => {
    if (!layoutId && blankZones) {
      return { id: "", name: "Blank Layout", aspect_ratio: "16:9", background: "#000000", status: "active" as const, zone_count: blankZones.length, zones: blankZones };
    }
    const selected = layouts.find((l) => l.id === layoutId) ?? null;
    return selected && editedZones ? { ...selected, zones: editedZones, zone_count: editedZones.length } : selected;
  }, [blankZones, editedZones, layoutId, layouts]);
  const layoutZoneIds = useMemo(() => layout?.zones.flatMap((z) => (z.id ? [z.id] : [])) ?? [], [layout]);
  const activeZoneId = selectedZoneId && layoutZoneIds.includes(selectedZoneId) ? selectedZoneId : (layoutZoneIds[0] ?? null);
  const activeZone = layout?.zones.find((z) => z.id === activeZoneId);
  const binding = activeZoneId ? (bindings.find((b) => b.layoutZoneId === activeZoneId) ?? defaultBinding(activeZoneId)) : null;
  const unboundZoneIds = findUnboundZoneIds(layoutZoneIds, bindings);
  const unboundZoneNames = layout?.zones.filter((z) => z.id && unboundZoneIds.includes(z.id)).map((z) => z.name) ?? [];
  const complete = isComplete(layoutZoneIds, bindings);

  const previewIds = useMemo(() => assets.map((a) => a.id), [assets]);
  useEffect(() => {
    if (previewIds.length === 0) return;
    let alive = true;
    fetchPreviewUrls(previewIds).then((map) => {
      if (alive) {
        setPreviews((prev) => ({ ...prev, ...map.urls }));
        setPreviewThumbnails((prev) => ({ ...prev, ...map.thumbnailUrls }));
      }
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewIds.join(",")]);

  const setBinding = (next: ZoneBindingDraft) => {
    if (next.playlistId && !playlistPreviewAssetIds[next.playlistId]) {
      void fetchPlaylist(next.playlistId)
        .then((detail) => {
          const firstAssetId = firstPlaylistAssetId(detail.items);
          if (firstAssetId) {
            setPlaylistPreviewAssetIds((current) => ({ ...current, [next.playlistId as string]: firstAssetId }));
          }
          setPlaylistItemsById((current) => ({ ...current, [next.playlistId as string]: detail.items }));
        })
        .catch(() => undefined);
    }
    setBindings((prev) => {
      const exists = prev.some((b) => b.layoutZoneId === next.layoutZoneId);
      return exists ? prev.map((b) => (b.layoutZoneId === next.layoutZoneId ? next : b)) : [...prev, next];
    });
  };

  const zonePreviews = useMemo<Record<string, { url: string; thumbnailUrl?: string; kind?: string; mimeType?: string }>>(() => {
    const assetsById = Object.fromEntries(assets.map((asset) => [asset.id, asset]));
    const next: Record<string, { url: string; thumbnailUrl?: string; kind?: string; mimeType?: string }> = {};
    for (const zoneBinding of bindings) {
      const assetId = zoneBinding.source === "assets"
        ? zoneBinding.assetItems[0]?.media_asset_id
        : zoneBinding.playlistId ? playlistPreviewAssetIds[zoneBinding.playlistId] : undefined;
      const url = assetId ? previews[assetId] : undefined;
      if (!assetId || !url) continue;
      const asset = assetsById[assetId];
      next[zoneBinding.layoutZoneId] = {
        url,
        thumbnailUrl: previewThumbnails[assetId],
        kind: asset?.kind,
        mimeType: asset?.file?.mime_type,
      };
    }
    return next;
  }, [assets, bindings, playlistPreviewAssetIds, previews, previewThumbnails]);
  const playlistPreviews = useMemo(
    () => Object.fromEntries(playlists.flatMap((playlist) => {
      const assetId = playlistPreviewAssetIds[playlist.id];
      const url = assetId ? previews[assetId] : undefined;
      return url ? [[playlist.id, { url, thumbnailUrl: previewThumbnails[assetId] }]] : [];
    })),
    [playlistPreviewAssetIds, playlists, previews, previewThumbnails],
  );
  const playbackPreviewZones = useMemo<PlaybackPreviewZone[]>(() => {
    if (!layout) return [];
    const assetsById = Object.fromEntries(assets.map((asset) => [asset.id, asset]));
    return layout.zones.map((zone) => {
      const zoneBinding = zone.id ? bindings.find((candidate) => candidate.layoutZoneId === zone.id) : undefined;
      const items = zoneBinding?.source === "assets"
        ? zoneBinding.assetItems
        : zoneBinding?.playlistId ? playlistItemsById[zoneBinding.playlistId] ?? [] : [];
      return {
        id: zone.id ?? `zone-${zone.position}`,
        name: zone.name,
        x: zone.x,
        y: zone.y,
        width: zone.width,
        height: zone.height,
        playback: zoneBinding?.playback,
        items: items.map((item) => {
          const asset = assetsById[item.media_asset_id];
          return {
            mediaAssetId: item.media_asset_id,
            label: asset?.title ?? asset?.file?.original_filename,
            durationSeconds: item.duration_seconds ?? asset?.duration_seconds,
            transition: item.transition,
          };
        }),
      };
    });
  }, [assets, bindings, layout, playlistItemsById]);
  const previewHandoff = useMemo<CompositionPreview & { compositionId: string; assets: MediaAsset[] } | null>(() => {
    if (!id || !layout) return null;
    const assetIds = new Set(playbackPreviewZones.flatMap((zone) => zone.items.map((item) => item.mediaAssetId)));
    return {
      compositionId: id,
      zones: playbackPreviewZones,
      assets: assets.filter((asset) => assetIds.has(asset.id)),
      aspectRatio: layout.aspect_ratio,
      referenceResolution: layout.reference_resolution ?? null,
    };
  }, [assets, id, layout, playbackPreviewZones]);
  const previewHandoffRef = useRef(previewHandoff);

  useEffect(() => {
    previewHandoffRef.current = previewHandoff;
  }, [previewHandoff]);

  useEffect(() => {
    const closePreviewSession = () => {
      fullPreviewChannel.current?.postMessage({ type: "close" });
      fullPreviewChannel.current?.close();
    };
    window.addEventListener("beforeunload", closePreviewSession);
    return () => {
      window.removeEventListener("beforeunload", closePreviewSession);
      closePreviewSession();
    };
  }, []);

  const chooseLayout = (nextLayoutId: string) => {
    const nextLayout = layouts.find((l) => l.id === nextLayoutId);
    if (!nextLayout) return;
    if (layoutId && layoutId !== nextLayout.id && bindings.length > 0) {
      if (!window.confirm("เปลี่ยน Layout จะล้างการผูก Content ของทุก Zone ทันที ต้องการดำเนินการต่อหรือไม่?")) return;
    }
    setLayoutId(nextLayout.id);
    setBlankZones(null);
    setEditedZones(null);
    setSharedGeometryApproved(false);
    setBindings([]);
    setSelectedZoneId(nextLayout.zones[0]?.id ?? null);
  };

  const isDirty = JSON.stringify({ name, layoutId, bindings }) !== initialSnapshot;

  const goBack = () => {
    if (isDirty) {
      setConfirmLeave(true);
      return;
    }
    router.push("/media-workspace/layouts");
  };

  const openFullPreview = () => {
    if (!id) return;
    const path = `/media-workspace/preview/composition/${encodeURIComponent(id)}`;
    if (!isDirty || !previewHandoff) {
      window.open(path, "_blank", "noopener");
      return;
    }
    fullPreviewChannel.current?.close();
    const channelName = `thunder-one-preview:${crypto.randomUUID()}`;
    const channel = new BroadcastChannel(channelName);
    channel.onmessage = ({ data }: MessageEvent<{ type?: string }>) => {
      if (data?.type !== "connect" && data?.type !== "heartbeat") return;
      const current = previewHandoffRef.current;
      if (!current) return;
      channel.postMessage({ type: "handoff", handoff: current });
      channel.postMessage({ type: "heartbeat-reply" });
    };
    fullPreviewChannel.current = channel;
    // The random channel id is a transient rendezvous handle, not draft data. Keeping it in the
    // URL lets a refresh reconnect while the editor is open without exposing the draft itself.
    window.open(`${path}?previewSession=${encodeURIComponent(channelName)}`, "_blank", "noopener");
  };

  /** Resolves every "assets" Zone into a saved inline Playlist (creating or updating it),
   *  then upserts the Composition and replaces its whole binding set (ADR 0049 §3, §6). */
  const persist = async (): Promise<{ compositionId: string; revision: number } | null> => {
    let persistedLayoutId = layoutId;
    let persistedZoneIds = layoutZoneIds;
    let workingBindings = bindings;
    const remapZoneBindings = (sourceZones: LayoutZone[], targetZones: LayoutZone[]) => {
      const idsBySourceId = new Map<string, string>();
      sourceZones.forEach((zone, index) => {
        const targetId = targetZones[index]?.id;
        if (zone.id && targetId) idsBySourceId.set(zone.id, targetId);
      });
      workingBindings = workingBindings.map((binding) => ({
        ...binding,
        layoutZoneId: idsBySourceId.get(binding.layoutZoneId) ?? binding.layoutZoneId,
      }));
    };
    if (persistedLayoutId && editedZones && layout) {
      const savedZoneIds = new Set(
        (layouts.find((candidate) => candidate.id === persistedLayoutId)?.zones ?? [])
          .flatMap((zone) => (zone.id ? [zone.id] : [])),
      );
      await upsertLayout({
        layoutId: persistedLayoutId,
        name: layout.name,
        aspectRatio: layout.aspect_ratio,
        referenceResolution: layout.reference_resolution ?? null,
        background: layout.background,
        status: layout.status,
        zones: editedZones.map((zone) => ({
          ...(zone.id && savedZoneIds.has(zone.id) ? { id: zone.id } : {}),
          name: zone.name,
          x: zone.x ?? 0,
          y: zone.y ?? 0,
          width: zone.width ?? 0,
          height: zone.height ?? 0,
        })),
      });
      const updatedLayout = await fetchLayout(persistedLayoutId);
      remapZoneBindings(editedZones, updatedLayout.zones);
      persistedZoneIds = updatedLayout.zones.flatMap((zone) => zone.id ? [zone.id] : []);
      setLayouts((current) => [...current.filter((candidate) => candidate.id !== updatedLayout.id), updatedLayout]);
      setEditedZones(null);
    }
    if (!persistedLayoutId && blankZones) {
      const created = await upsertLayout({
        name: name.trim() || "Untitled Layout",
        aspectRatio: "16:9",
        // ponytail: blank inline Layouts have no LayoutSettingsStep to pick a resolution
        // from, so they stay legacy (no pixel ruler) — set one later via the Layout editor.
        referenceResolution: null,
        background: "#000000",
        status: "active",
        zones: blankZones.map(({ name: zoneName, x, y, width, height }) => ({ name: zoneName, x, y, width, height })),
      });
      persistedLayoutId = created.layout_id;
      await setLayoutKind(persistedLayoutId, "inline");
      const privateLayout = await fetchLayout(persistedLayoutId);
      remapZoneBindings(blankZones, privateLayout.zones);
      persistedZoneIds = privateLayout.zones.flatMap((zone) => zone.id ? [zone.id] : []);
      setLayouts((current) => [...current, privateLayout]);
      setLayoutId(persistedLayoutId);
      setBlankZones(null);
    }
    if (!persistedLayoutId) throw new Error("Invalid input: layout is required");
    const upserted = await upsertComposition({ compositionId: id, name, layoutId: persistedLayoutId, expectedRevision: revision });
    setId(upserted.composition_id);

    const resolved: ZoneBindingDraft[] = [];
    for (const b of workingBindings) {
      if (b.source === "playlist" || b.assetItems.length === 0) {
        resolved.push(b);
        continue;
      }
      let playlistId = b.playlistId;
      const zoneName = layout?.zones.find((z) => z.id === b.layoutZoneId)?.name ?? "Zone";
      if (!playlistId) {
        const created = await upsertPlaylist({
          name: `${name.trim() || "Composition"} · ${zoneName}`,
          kind: "inline",
          idempotencyKey: crypto.randomUUID(),
        });
        playlistId = created.playlist_id;
      }
      await setPlaylistItems(
        playlistId,
        b.assetItems.map((item, index) => ({
          media_asset_id: item.media_asset_id,
          position: index,
          ...(item.duration_seconds != null ? { duration_seconds: item.duration_seconds } : {}),
          transition: item.transition ?? "cut",
        })),
      );
      resolved.push({ ...b, playlistId });
    }
    setBindings(resolved);

    const zonesResult = await setCompositionZones(upserted.composition_id, toSetZonesPayload(persistedZoneIds, resolved), upserted.revision);
    setRevision(zonesResult.revision);
    return { compositionId: upserted.composition_id, revision: zonesResult.revision };
  };

  const handleSaveDraft = async () => {
    setSaveError(null);
    setSaving(true);
    try {
      await persist();
      router.push("/media-workspace/layouts");
    } catch (err) {
      // set_zones raises the same "zone(s) ... are unbound" wording as activation when the
      // Composition is already active (ADR 0049 §10) — describeActivateError covers both.
      const message = err instanceof Error ? err.message : "";
      setSaveError(message.startsWith("Invalid input:") || message.startsWith("Already") ? describeActivateError(message) : classifyApiError(err, "บันทึก Composition ไม่สำเร็จ").message);
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    setSaveError(null);
    setSaving(true);
    try {
      const result = await persist();
      if (result) await setCompositionStatus(result.compositionId, "active");
      router.push("/media-workspace/layouts");
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setSaveError(message.startsWith("Invalid input:") || message.startsWith("Already") ? describeActivateError(message) : classifyApiError(err, "เปิดใช้งาน Composition ไม่สำเร็จ").message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    setSaveError(null);
    setSaving(true);
    try {
      const result = await persist();
      if (!result || !layoutId) return;
      await setLayoutKind(layoutId, "template");
      router.push("/media-workspace/layouts/templates");
    } catch (err) {
      setSaveError(classifyApiError(err, "บันทึกเป็น Template ไม่สำเร็จ").message);
    } finally {
      setSaving(false);
    }
  };

  const handleForkLayout = async () => {
    if (!id || !layout || !window.confirm(`This Template is used by ${layout.usage_count} Layouts. Make this Layout its own copy?`)) return;
    setSaveError(null);
    setSaving(true);
    try {
      const forked = await forkCompositionLayout(id, revision);
      const [detail, privateLayout] = await Promise.all([fetchComposition(id), fetchLayout(forked.layout_id)]);
      setLayoutId(privateLayout.id);
      setRevision(forked.revision);
      setBindings(bindingsFromCompositionZones(detail.zones));
      setLayouts((current) => [...current.filter((candidate) => candidate.id !== privateLayout.id), privateLayout]);
      setSelectedZoneId(privateLayout.zones[0]?.id ?? null);
      setEditedZones(null);
      setSharedGeometryApproved(false);
    } catch (err) {
      setSaveError(classifyApiError(err, "สร้าง Layout ส่วนตัวไม่สำเร็จ").message);
    } finally {
      setSaving(false);
    }
  };

  const handleGeometryChange = (zones: LayoutZone[]) => {
    if (layout?.kind === "template" && (layout.usage_count ?? 0) > 1 && !sharedGeometryApproved) {
      if (!window.confirm(`This Template is used by ${layout.usage_count} Layouts. Changing the Zones affects all of them.`)) return;
      setSharedGeometryApproved(true);
    }
    setEditedZones(zones);
  };

  if (loading) return <p className="p-6 text-sm text-zinc-400">กำลังโหลด...</p>;

  if (loadError) {
    return (
      <Card className="p-6">
        <p className="text-sm text-red-500">{loadError.message}</p>
        <Button className="mt-4" variant="secondary" onClick={() => router.push("/media-workspace/layouts")}>
          กลับไป Layouts
        </Button>
      </Card>
    );
  }

  const saveDisabledReason = !name.trim() ? "กรุณากรอกชื่อ Layout" : !layout ? "กรุณาเลือก Template หรือ Start blank" : null;
  const activateDisabledReason = saveDisabledReason ?? (!complete ? `ยังไม่ได้ผูก Content ให้ Zone: ${unboundZoneNames.join(", ")}` : null);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={id ? "Edit Layout" : "New Layout"}
        subtitle="Choose a Template, arrange Zones, then bind content."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={goBack}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={() => setPreviewOpen(true)} disabled={!layout}>
              Preview
            </Button>
            <Button variant="secondary" onClick={openFullPreview} disabled={!id || !layout} title={!id ? "บันทึก Draft ก่อนเปิด preview เต็มจอ" : undefined}>
              Open full preview
            </Button>
            <Button variant="secondary" onClick={handleSaveDraft} disabled={saving || !!saveDisabledReason} title={saveDisabledReason ?? undefined}>
              {saving ? "กำลังบันทึก..." : "Save draft"}
            </Button>
            {layout?.kind === "inline" && (
              <Button variant="secondary" onClick={handleSaveAsTemplate} disabled={saving || !!saveDisabledReason} title={saveDisabledReason ?? undefined}>
                Save as Template
              </Button>
            )}
            {status !== "active" && (
              <Button onClick={handleActivate} disabled={saving || !!activateDisabledReason} title={activateDisabledReason ?? undefined}>
                Activate
              </Button>
            )}
          </div>
        }
      />

      {confirmLeave && (
        <UnsavedLeaveConfirm onStay={() => setConfirmLeave(false)} onLeave={() => router.push("/media-workspace/layouts")} />
      )}

      <PlaybackPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        zones={playbackPreviewZones}
        assets={assets}
        aspectRatio={layout?.aspect_ratio}
        previewUrls={previews}
        geometryOptions={editorGeometryOptions(layout?.reference_resolution)}
        referenceResolution={layout?.reference_resolution ?? null}
      />

      {saveError && (
        <Card className="border-red-200 p-4 dark:border-red-900">
          <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
        </Card>
      )}

      {layout?.kind === "template" && (layout.usage_count ?? 0) > 1 && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-amber-200 p-4 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            This Template is used by {layout.usage_count} Layouts. Changing the Zones affects all of them.
          </p>
          <Button variant="secondary" disabled={saving} onClick={handleForkLayout}>
            Make this Layout its own copy
          </Button>
        </Card>
      )}

      <Card className="grid gap-4 p-4 lg:grid-cols-[280px_1fr]">
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <div>
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Template</p>
            <p className="mt-1 text-xs text-zinc-500">Selecting a Template references its geometry.</p>
          </div>
          <TemplateReferenceRail
            templates={layouts}
            selectedId={layoutId}
            onSelect={chooseLayout}
            onStartBlank={() => {
              setLayoutId(null);
              setBlankZones([{ id: crypto.randomUUID(), position: 0, name: "Main", x: 0, y: 0, width: 100, height: 100 }]);
              setEditedZones(null);
              setBindings([]);
              setSelectedZoneId(null);
            }}
          />

          {layout && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Zone Overview</p>
              {layout.zones.map((zone) => {
                const isUnbound = !zone.id || unboundZoneIds.includes(zone.id);
                const zoneBinding = zone.id ? bindings.find((candidate) => candidate.layoutZoneId === zone.id) : undefined;
                return (
                  <button
                    key={zone.id ?? zone.position}
                    type="button"
                    onClick={() => zone.id && setSelectedZoneId(zone.id)}
                    className={`flex items-center justify-between rounded-md px-2 py-1.5 text-left text-xs ${zone.id === activeZoneId ? "bg-indigo-50 text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-300" : "bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"}`}
                  >
                    <span>
                      <span className="block font-medium">{zone.name}</span>
                      <span className="block text-[11px] text-zinc-500">{zone.width}×{zone.height}% · {zoneBinding?.source === "assets" ? "Assets" : zoneBinding?.playlistName ?? "Playlist"}</span>
                    </span>
                    <span className={isUnbound ? "font-medium text-amber-700 dark:text-amber-400" : "font-medium text-emerald-700 dark:text-emerald-400"}>
                      {isUnbound ? "Unbound" : "Bound"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {layout ? (
          <div className="flex flex-col gap-2">
            <LayoutCanvas
              zones={layout.zones}
              background={layout.background}
              aspectRatio={layout.aspect_ratio}
              zonePreviews={zonePreviews}
              selectedIndex={layout.zones.findIndex((zone) => zone.id === activeZoneId)}
              onSelectIndex={(index) => setSelectedZoneId(index === null ? null : (layout.zones[index]?.id ?? null))}
              onChange={handleGeometryChange}
            />
            {activeZoneId && (
              <Button
                variant="secondary"
                onClick={() => {
                  const next = splitZone(layout.zones, layout.zones.findIndex((zone) => zone.id === activeZoneId));
                  if (next) {
                    const splitSource = layout.zones.findIndex((zone) => zone.id === activeZoneId);
                    const newZoneIndex = splitSource + 1;
                    if (next[newZoneIndex] && !next[newZoneIndex].id) next[newZoneIndex] = { ...next[newZoneIndex], id: crypto.randomUUID() };
                    handleGeometryChange(next);
                  }
                }}
              >
                Split Zone
              </Button>
            )}
          </div>
        ) : (
          <div className="flex min-h-40 items-center justify-center rounded-lg bg-zinc-100 text-sm text-zinc-400 dark:bg-zinc-800">
            Select a Layout to see its Zones
          </div>
        )}
      </Card>

      {binding && activeZone && (
        <ZoneContentPicker
          zoneName={activeZone.name}
          binding={binding}
          onChange={setBinding}
          assets={assets}
              playlists={playlists}
              previews={previews}
              playlistPreviews={playlistPreviews}
              playlistDurations={playlistDurations}
        />
      )}
    </div>
  );
}
