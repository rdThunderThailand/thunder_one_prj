"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ExpandIcon, ImageIcon } from "@/components/ui/icons";
import { PreviewStage } from "@/features/media-workspace/preview/PreviewStage";
import type { MediaAsset, Tag } from "../types";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";
import { usePublicationStagePreview } from "../hooks/usePublicationStagePreview";
import { usePublicationPreviewHandoff } from "../hooks/usePublicationPreviewHandoff";
import { BasicInfoForm } from "./BasicInfoForm";
import { ContentInfoRail } from "./ContentInfoRail";
import { PublicationPlaybackPreviewButton } from "./PublicationPlaybackPreviewButton";

export function PrepareContentStep({
  assets,
  tags,
  showFieldErrors,
}: {
  assets: MediaAsset[];
  tags: Tag[];
  showFieldErrors: boolean;
}) {
  const setStep = usePublicationDraftStore((s) => s.setStep);
  const publicationId = usePublicationDraftStore((s) => s.publicationId);
  const { preview, loading, error, hasContent, branch } = usePublicationStagePreview();
  const { openFullPreview } = usePublicationPreviewHandoff(() =>
    preview ? { preview, assets, publicationId } : null,
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_19rem]">
      {/* Left — Publication fields (every field here is the Publication's, never the Asset's) */}
      <div className="flex flex-col gap-6">
        <BasicInfoForm workspaceTags={tags} showErrors={showFieldErrors} />
        <QuickEditTools />
      </div>

      {/* Centre — per-branch preview */}
      <Card className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900">Preview</h2>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
          >
            เปลี่ยนคอนเทนต์
          </button>
        </div>

        {!hasContent ? (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 text-zinc-400">
            <ImageIcon className="h-8 w-8" />
            <p className="text-xs">เลือกคอนเทนต์ในขั้นตอนที่ 1 เพื่อดูตัวอย่าง</p>
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">โหลด preview ไม่สำเร็จ</p>
        ) : loading || !preview ? (
          <p className="py-10 text-center text-sm text-zinc-400">กำลังโหลด preview…</p>
        ) : (
          <PreviewStage
            zones={preview.zones}
            assets={assets}
            aspectRatio={preview.aspectRatio}
            referenceResolution={preview.referenceResolution}
            allowActualSize={branch !== "playlist"}
            frameViewportHeight="44vh"
          />
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3">
          <PublicationPlaybackPreviewButton assets={assets} preview={preview} />
          <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={openFullPreview} disabled={!preview}>
            <ExpandIcon className="h-3.5 w-3.5" /> เปิด preview เต็มจอ
          </Button>
        </div>
      </Card>

      {/* Right — read-only Content Info */}
      <ContentInfoRail assets={assets} preview={preview} branch={branch} loading={loading} error={error} />
    </div>
  );
}

/** DISABLED, not built yet — precedent `ScheduleStep.tsx:400-467`. */
function QuickEditTools() {
  return (
    <Card className="p-5 opacity-60">
      <h2 className="text-base font-semibold text-zinc-900">Quick Edit Tools</h2>
      <p className="mt-1 text-xs text-zinc-400">ยังไม่เปิดใช้งาน</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {["Edit", "Overlay", "Advanced"].map((label) => (
          <button
            key={label}
            type="button"
            disabled
            title="ยังไม่เปิดใช้งาน"
            className="cursor-not-allowed rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-400"
          >
            {label}
          </button>
        ))}
      </div>
    </Card>
  );
}
