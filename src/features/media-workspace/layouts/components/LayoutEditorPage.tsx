"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/lovable/button";
import { LayoutInformationCard } from "@/features/media-workspace/compositions/components/LayoutInformationCard";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
// Reused rather than re-written — see docs/layouts/plan-layout-execution.md Task 7 Step 5.
import { UnsavedLeaveConfirm } from "../../playlists/components/UnsavedLeaveConfirm";
import { deriveAspectRatio, parseResolution, sameRatio, validateZones } from "../geometry";
import { fetchLayout, upsertLayout } from "../services/layouts-api";
import { describeSaveError } from "../status-display";
import { DEFAULT_ASPECT_RATIO, DEFAULT_BACKGROUND, DEFAULT_RESOLUTION, type LayoutDraft, type LayoutZone } from "../types";
import { LayoutCanvas } from "./LayoutCanvas";
import { LayoutEditorHeader, LayoutEditorToolbar, LayoutZoneOverview } from "./LayoutEditorChrome";
import { LayoutSettingsPanel } from "./LayoutSettingsPanel";
import { TemplateRail } from "./TemplateRail";
import { ZoneProperties } from "./ZoneProperties";

const BLANK_ZONES: LayoutZone[] = [{ position: 0, name: "Main", x: 0, y: 0, width: 100, height: 100 }];

function emptyDraft(): LayoutDraft {
  return {
    id: null,
    name: "",
    aspectRatio: DEFAULT_ASPECT_RATIO,
    referenceResolution: DEFAULT_RESOLUTION,
    background: DEFAULT_BACKGROUND,
    status: "active",
    zones: BLANK_ZONES,
  };
}

/** position must stay 0-based and dense — every write to `zones` in this page goes
 *  through here so the RPC never sees a gap. */
function reindex(zones: LayoutZone[]): LayoutZone[] {
  return zones.map((z, index) => ({ ...z, position: index }));
}

export function LayoutEditorPage({ layoutId }: { layoutId?: string | null }) {
  const router = useRouter();
  const [draft, setDraft] = useState<LayoutDraft>(emptyDraft);
  const [initial, setInitial] = useState<LayoutDraft>(emptyDraft);
  const [loading, setLoading] = useState(!!layoutId);
  const [loadError, setLoadError] = useState<ClassifiedError | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  // Remounting the canvas resets its zoom — the same "Fit to Screen" the Composition editor uses.
  const [fitSignal, setFitSignal] = useState(0);

  useEffect(() => {
    if (!layoutId) return;
    let alive = true;
    fetchLayout(layoutId)
      .then((detail) => {
        if (!alive) return;
        const loaded: LayoutDraft = {
          id: detail.id,
          name: detail.name,
          aspectRatio: detail.aspect_ratio,
          referenceResolution: detail.reference_resolution ?? null,
          background: detail.background,
          status: detail.status,
          zones: detail.zones,
        };
        setDraft(loaded);
        setInitial(loaded);
        setUsageCount(detail.usage_count ?? 0);
      })
      .catch((err) => alive && setLoadError(classifyApiError(err, "โหลด Layout ไม่สำเร็จ")))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [layoutId]);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const geometryErrors = validateZones(draft.zones);
  const selectedZone = selectedIndex !== null ? (draft.zones[selectedIndex] ?? null) : null;

  /** Item 6: a same-ratio resolution change (e.g. 1920x1080 → 3840x2160) applies silently.
   *  A ratio-changing one asks once, naming the Composition count for a Template — Zones are
   *  never rewritten either way, only the stored resolution and its derived aspect ratio. */
  const handleSettingsChange = (next: {
    name: string;
    aspectRatio: string;
    referenceResolution: string | null;
    background: string;
    status: LayoutDraft["status"];
  }) => {
    if (next.referenceResolution !== draft.referenceResolution) {
      const nextRes = next.referenceResolution ? parseResolution(next.referenceResolution) : null;
      const prevRes = draft.referenceResolution ? parseResolution(draft.referenceResolution) : null;
      if (nextRes) {
        const nextAspectRatio = deriveAspectRatio(nextRes[0], nextRes[1]);
        const ratioChanged = !!prevRes && !sameRatio(prevRes, nextRes);
        const confirmMessage =
          usageCount > 0
            ? `This changes the aspect ratio and will affect ${usageCount} Composition(s) using this Template. Zone percentages are kept as-is.`
            : "This changes the aspect ratio. Zone percentages are kept as-is.";
        if (ratioChanged && draft.zones.length > 0 && !window.confirm(confirmMessage)) {
          return;
        }
        setDraft((d) => ({ ...d, ...next, aspectRatio: nextAspectRatio }));
        return;
      }
    }
    setDraft((d) => ({ ...d, ...next }));
  };

  const goBack = () => {
    if (isDirty) {
      setConfirmLeave(true);
      return;
    }
    router.push("/media-workspace/layouts/templates");
  };

  const handleSave = async () => {
    if (usageCount > 1 && !window.confirm(`This Template is used by ${usageCount} Layouts. Changing the Zones affects all of them.`)) return;
    setSaveError(null);
    setSaving(true);
    try {
      await upsertLayout({
        layoutId: draft.id,
        name: draft.name,
        aspectRatio: draft.aspectRatio,
        referenceResolution: draft.referenceResolution,
        background: draft.background,
        status: draft.status,
        zones: draft.zones,
      });
      router.push("/media-workspace/layouts/templates");
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setSaveError(message.startsWith("Invalid input:") ? describeSaveError(message) : classifyApiError(err, "บันทึก Layout ไม่สำเร็จ").message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-6 text-sm text-muted-foreground">กำลังโหลด...</p>;
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-danger">{loadError.message}</p>
        <Button className="mt-4" variant="outline" onClick={() => router.push("/media-workspace/layouts/templates")}>
          กลับไป Templates
        </Button>
      </div>
    );
  }

  const saveDisabledReason =
    geometryErrors.length > 0
      ? geometryErrors.some((e) => e.kind === "overlap")
        ? "แก้ Zone ที่ซ้อนทับกันก่อนบันทึก"
        : "ตรวจสอบ Zone ให้ถูกต้องก่อนบันทึก"
      : !draft.name.trim()
        ? "กรุณากรอกชื่อ Layout"
        : null;

  // Full-bleed like the Lovable reference (ADR 0077 focus shell): the negative margin cancels
  // the dashboard <main> padding so header, toolbar and columns run edge to edge.
  return (
    <div className="-m-6 flex h-dvh flex-col overflow-hidden bg-background">
      <div className="shrink-0 border-b border-border bg-card px-4">
      <LayoutEditorHeader
        isExisting={!!draft.id}
        name={draft.name}
        status={draft.status}
        referenceResolution={draft.referenceResolution}
        aspectRatio={draft.aspectRatio}
        zoneCount={draft.zones.length}
        isDirty={isDirty}
        saving={saving}
        saveDisabledReason={saveDisabledReason}
        onBack={goBack}
        onSave={handleSave}
      />
      </div>

      {confirmLeave && (
        <UnsavedLeaveConfirm
          onStay={() => setConfirmLeave(false)}
          onLeave={() => router.push("/media-workspace/layouts/templates")}
        />
      )}

      {saveError && (
        <div className="shrink-0 border-b border-danger/30 bg-danger-soft px-4 py-2">
          <p className="text-sm text-danger">{saveError}</p>
        </div>
      )}

      {usageCount > 1 && (
        <div className="shrink-0 border-b border-warning/30 bg-warning-soft px-4 py-2">
          <p className="text-sm text-warning">Change-all mode: this Template is used by {usageCount} Layouts.</p>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-x-auto">
        <div className="flex h-full min-w-[1060px] flex-col">
          <LayoutEditorToolbar
            zones={draft.zones}
            selectedIndex={selectedIndex}
            onSelectIndex={setSelectedIndex}
            onChange={(zones) => setDraft((d) => ({ ...d, zones: reindex(zones) }))}
            onFit={() => setFitSignal((value) => value + 1)}
          />
          <div className="grid min-h-0 flex-1 grid-cols-[230px_minmax(560px,1fr)_270px] items-stretch">
            <aside className="min-h-0 overflow-y-auto border-r border-border bg-card p-3">
              <TemplateRail
                background={draft.background}
                onSelect={(zones) => {
                  setDraft((d) => ({ ...d, zones: reindex(zones) }));
                  setSelectedIndex(null);
                }}
              />
            </aside>

            <main className="flex min-h-0 flex-col gap-3 overflow-y-auto bg-muted/40 p-3">
              <LayoutCanvas
                key={fitSignal}
                zones={draft.zones}
                background={draft.background}
                aspectRatio={draft.aspectRatio}
                referenceResolution={draft.referenceResolution}
                fillAvailable
                selectedIndex={selectedIndex}
                onSelectIndex={setSelectedIndex}
                onChange={(zones) => setDraft((d) => ({ ...d, zones }))}
              />
              <div className="grid shrink-0 grid-cols-2 gap-3">
                <LayoutInformationCard
                  name={draft.name}
                  resolution={draft.referenceResolution}
                  aspectRatio={draft.aspectRatio}
                  zoneCount={draft.zones.length}
                  status={draft.status}
                />
                <LayoutZoneOverview
                  zones={draft.zones}
                  selectedIndex={selectedIndex}
                  referenceResolution={draft.referenceResolution}
                  onSelectIndex={setSelectedIndex}
                />
              </div>
            </main>

            <aside className="min-h-0 overflow-y-auto border-l border-border bg-card p-3">
              {selectedZone && selectedIndex !== null ? (
                <ZoneProperties
                  zone={selectedZone}
                  zoneIndex={selectedIndex}
                  referenceResolution={draft.referenceResolution}
                  canRemove={draft.zones.length > 1}
                  onChange={(next) =>
                    setDraft((d) => ({
                      ...d,
                      zones: d.zones.map((z, i) => (i === selectedIndex ? next : z)),
                    }))
                  }
                  onRemove={() => {
                    setDraft((d) => ({ ...d, zones: reindex(d.zones.filter((_, i) => i !== selectedIndex)) }));
                    setSelectedIndex(null);
                  }}
                />
              ) : (
                <LayoutSettingsPanel
                  name={draft.name}
                  aspectRatio={draft.aspectRatio}
                  referenceResolution={draft.referenceResolution}
                  background={draft.background}
                  status={draft.status}
                  onChange={handleSettingsChange}
                />
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
