"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { fetchMediaAssets, fetchPreviewUrls } from "@/lib/api/media-api";
import { fetchLayouts } from "@/features/media-workspace/layouts/services/layouts-api";
import { LayoutWireframe } from "@/features/media-workspace/layouts/components/LayoutWireframe";
import type { LayoutListItem } from "@/features/media-workspace/layouts/types";
import { fetchPlaylists, fetchPlaylist } from "@/features/media-workspace/playlists";
import type { PlaylistListItem } from "@/features/media-workspace/playlists";
import { setPlaylistItems, upsertPlaylist } from "@/features/media-workspace/playlists/services/playlists-api";
import { UnsavedLeaveConfirm } from "@/features/media-workspace/playlists/components/UnsavedLeaveConfirm";
import type { MediaAsset } from "@/types/domain";
import {
  fetchComposition,
  setCompositionZones,
  setCompositionStatus,
  upsertComposition,
} from "../services/compositions-api";
import { describeActivateError } from "../status-display";
import type { CompositionStatus } from "../types";
import {
  bindingsFromCompositionZones,
  findUnboundZoneIds,
  isComplete,
  toSetZonesPayload,
  type ZoneBindingDraft,
} from "../zone-bindings";
import { ZoneContentPicker, defaultBinding } from "./ZoneContentPicker";

export function CompositionEditorPage({ compositionId }: { compositionId?: string | null }) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(compositionId ?? null);
  const [name, setName] = useState("");
  const [layoutId, setLayoutId] = useState<string | null>(null);
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

  const [loading, setLoading] = useState(!!compositionId);
  const [loadError, setLoadError] = useState<ClassifiedError | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

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
        const loadedBindings = bindingsFromCompositionZones(detail.zones);

        // media_playlists_list excludes kind='inline', and media_composition_get carries no
        // playlist_name — a Zone bound to an implicit inline Playlist needs its own fetch to
        // show anything better than a bare id.
        const named = await Promise.all(
          loadedBindings.map(async (binding) => {
            if (!binding.playlistId) return binding;
            try {
              const playlistDetail = await fetchPlaylist(binding.playlistId);
              return { ...binding, playlistName: playlistDetail.name };
            } catch {
              return binding;
            }
          }),
        );
        if (!alive) return;
        setBindings(named);
        setInitialSnapshot(JSON.stringify({ name: detail.name, layoutId: detail.layout_id, bindings: named }));
      })
      .catch((err) => alive && setLoadError(classifyApiError(err, "โหลด Composition ไม่สำเร็จ")))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [compositionId]);

  const layout = useMemo(() => layouts.find((l) => l.id === layoutId) ?? null, [layoutId, layouts]);
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
      if (alive) setPreviews((prev) => ({ ...prev, ...map.urls }));
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewIds.join(",")]);

  const setBinding = (next: ZoneBindingDraft) => {
    setBindings((prev) => {
      const exists = prev.some((b) => b.layoutZoneId === next.layoutZoneId);
      return exists ? prev.map((b) => (b.layoutZoneId === next.layoutZoneId ? next : b)) : [...prev, next];
    });
  };

  const chooseLayout = (nextLayoutId: string) => {
    const nextLayout = layouts.find((l) => l.id === nextLayoutId);
    if (!nextLayout) return;
    if (layoutId && layoutId !== nextLayout.id && bindings.length > 0) {
      if (!window.confirm("เปลี่ยน Layout จะล้างการผูก Content ของทุก Zone ทันที ต้องการดำเนินการต่อหรือไม่?")) return;
    }
    setLayoutId(nextLayout.id);
    setBindings([]);
    setSelectedZoneId(nextLayout.zones[0]?.id ?? null);
  };

  const isDirty = JSON.stringify({ name, layoutId, bindings }) !== initialSnapshot;

  const goBack = () => {
    if (isDirty) {
      setConfirmLeave(true);
      return;
    }
    router.push("/media-workspace/compositions");
  };

  /** Resolves every "assets" Zone into a saved inline Playlist (creating or updating it),
   *  then upserts the Composition and replaces its whole binding set (ADR 0049 §3, §6). */
  const persist = async (): Promise<{ compositionId: string; revision: number } | null> => {
    const upserted = await upsertComposition({ compositionId: id, name, layoutId: layoutId as string, expectedRevision: revision });
    setId(upserted.composition_id);

    const resolved: ZoneBindingDraft[] = [];
    for (const b of bindings) {
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

    const zonesResult = await setCompositionZones(upserted.composition_id, toSetZonesPayload(layoutZoneIds, resolved), upserted.revision);
    setRevision(zonesResult.revision);
    return { compositionId: upserted.composition_id, revision: zonesResult.revision };
  };

  const handleSaveDraft = async () => {
    setSaveError(null);
    setSaving(true);
    try {
      await persist();
      router.push("/media-workspace/compositions");
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
      router.push("/media-workspace/compositions");
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setSaveError(message.startsWith("Invalid input:") || message.startsWith("Already") ? describeActivateError(message) : classifyApiError(err, "เปิดใช้งาน Composition ไม่สำเร็จ").message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-6 text-sm text-zinc-400">กำลังโหลด...</p>;

  if (loadError) {
    return (
      <Card className="p-6">
        <p className="text-sm text-red-500">{loadError.message}</p>
        <Button className="mt-4" variant="secondary" onClick={() => router.push("/media-workspace/compositions")}>
          กลับไป Compositions
        </Button>
      </Card>
    );
  }

  const saveDisabledReason = !name.trim() ? "กรุณากรอกชื่อ Composition" : !layoutId ? "กรุณาเลือก Layout" : null;
  const activateDisabledReason = saveDisabledReason ?? (!complete ? `ยังไม่ได้ผูก Content ให้ Zone: ${unboundZoneNames.join(", ")}` : null);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={id ? "Edit Composition" : "New Composition"}
        subtitle="Pick a Layout, then bind content to each Zone."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={goBack}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={handleSaveDraft} disabled={saving || !!saveDisabledReason} title={saveDisabledReason ?? undefined}>
              {saving ? "กำลังบันทึก..." : "Save draft"}
            </Button>
            {status !== "active" && (
              <Button onClick={handleActivate} disabled={saving || !!activateDisabledReason} title={activateDisabledReason ?? undefined}>
                Activate
              </Button>
            )}
          </div>
        }
      />

      {confirmLeave && (
        <UnsavedLeaveConfirm onStay={() => setConfirmLeave(false)} onLeave={() => router.push("/media-workspace/compositions")} />
      )}

      {saveError && (
        <Card className="border-red-200 p-4 dark:border-red-900">
          <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
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
          <label className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Layout
            <select
              value={layoutId ?? ""}
              onChange={(e) => chooseLayout(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">Select active Layout</option>
              {layouts.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>

          {layout && (
            <div className="flex flex-col gap-1.5">
              {layout.zones.map((zone) => {
                const isUnbound = !zone.id || unboundZoneIds.includes(zone.id);
                return (
                  <button
                    key={zone.id ?? zone.position}
                    type="button"
                    onClick={() => zone.id && setSelectedZoneId(zone.id)}
                    className={`flex items-center justify-between rounded-md px-2 py-1.5 text-left text-xs ${zone.id === activeZoneId ? "bg-indigo-50 text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-300" : "bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"}`}
                  >
                    <span>{zone.name}</span>
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
          <LayoutWireframe
            zones={layout.zones}
            background={layout.background}
            aspectRatio={layout.aspect_ratio}
            selectedZoneId={activeZoneId}
            onZoneSelect={setSelectedZoneId}
            shouldShowLabels
            className="w-full rounded-lg"
          />
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
          playlistDurations={playlistDurations}
        />
      )}
    </div>
  );
}
