"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
// Reused rather than re-written — see docs/layouts/plan-layout-execution.md Task 7 Step 5.
import { UnsavedLeaveConfirm } from "../../playlists/components/UnsavedLeaveConfirm";
import { validateZones } from "../geometry";
import { splitZone } from "../split-zone";
import { fetchLayout, upsertLayout } from "../services/layouts-api";
import { describeSaveError } from "../status-display";
import { DEFAULT_ASPECT_RATIO, DEFAULT_BACKGROUND, type LayoutDraft, type LayoutZone } from "../types";
import { LayoutCanvas } from "./LayoutCanvas";
import { LayoutSettingsStep } from "./LayoutSettingsStep";
import { TemplateRail } from "./TemplateRail";
import { ZoneProperties } from "./ZoneProperties";

const BLANK_ZONES: LayoutZone[] = [{ position: 0, name: "Main", x: 0, y: 0, width: 100, height: 100 }];

function emptyDraft(): LayoutDraft {
  return {
    id: null,
    name: "",
    aspectRatio: DEFAULT_ASPECT_RATIO,
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
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState(0);

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
    return <p className="p-6 text-sm text-zinc-400">กำลังโหลด...</p>;
  }

  if (loadError) {
    return (
      <Card className="p-6">
        <p className="text-sm text-red-500">{loadError.message}</p>
        <Button className="mt-4" variant="secondary" onClick={() => router.push("/media-workspace/layouts/templates")}>
          กลับไป Templates
        </Button>
      </Card>
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={draft.id ? "Edit Layout" : "New Layout"}
        subtitle={step === 1 ? "Choose a template and arrange the Zones." : "Name, aspect ratio, background and status."}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={goBack}>
              Cancel
            </Button>
            {step === 1 ? (
              <Button
                onClick={() => setStep(2)}
                disabled={geometryErrors.length > 0}
                title={geometryErrors.length > 0 ? saveDisabledReason ?? undefined : undefined}
              >
                Next
              </Button>
            ) : (
              <>
                <Button variant="secondary" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={handleSave} disabled={saving || !!saveDisabledReason} title={saveDisabledReason ?? undefined}>
                  {saving ? "กำลังบันทึก..." : "Save"}
                </Button>
              </>
            )}
          </div>
        }
      />

      {confirmLeave && (
        <UnsavedLeaveConfirm
          onStay={() => setConfirmLeave(false)}
          onLeave={() => router.push("/media-workspace/layouts/templates")}
        />
      )}

      {saveError && (
        <Card className="border-red-200 p-4 dark:border-red-900">
          <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
        </Card>
      )}

      {usageCount > 1 && (
        <Card className="border-amber-200 p-4 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-200">Change-all mode: this Template is used by {usageCount} Layouts.</p>
        </Card>
      )}

      {step === 1 ? (
        <div className="flex flex-col gap-4">
          <Card className="p-4">
            <TemplateRail
              background={draft.background}
              onSelect={(zones) => {
                setDraft((d) => ({ ...d, zones: reindex(zones) }));
                setSelectedIndex(null);
              }}
            />
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
            <Card className="p-4">
              <LayoutCanvas
                zones={draft.zones}
                background={draft.background}
                aspectRatio={draft.aspectRatio}
                selectedIndex={selectedIndex}
                onSelectIndex={setSelectedIndex}
                onChange={(zones) => setDraft((d) => ({ ...d, zones }))}
              />
            </Card>

            <ZoneProperties
              zone={selectedZone}
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
            {selectedIndex !== null && (
              <Button
                variant="secondary"
                disabled={draft.zones.length >= 4}
                onClick={() => {
                  const next = splitZone(draft.zones, selectedIndex);
                  if (!next) return;
                  setDraft((draft) => ({ ...draft, zones: next }));
                  setSelectedIndex(selectedIndex + 1);
                }}
              >
                Split Zone
              </Button>
            )}
          </div>
        </div>
      ) : (
        <LayoutSettingsStep
          name={draft.name}
          aspectRatio={draft.aspectRatio}
          background={draft.background}
          status={draft.status}
          onChange={(next) => setDraft((d) => ({ ...d, ...next }))}
        />
      )}
    </div>
  );
}
