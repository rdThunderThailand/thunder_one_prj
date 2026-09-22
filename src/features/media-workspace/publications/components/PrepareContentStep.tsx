"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { ArrowRightIcon, EditIcon, ExpandIcon, ImageIcon, SettingsIcon } from "@/components/ui/icons";
import { PreviewStage } from "@/features/media-workspace/preview/PreviewStage";
import type { StagePreview } from "@/features/media-workspace/preview/composition-preview";
import { zoneSchedule } from "@/features/media-workspace/preview/preview-clock";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import type { MediaAsset, Tag } from "../types";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";
import { usePublicationStagePreview } from "../hooks/usePublicationStagePreview";
import { usePublicationPreviewHandoff } from "../hooks/usePublicationPreviewHandoff";
import { BasicInfoForm } from "./BasicInfoForm";
import { ContentInfoRail } from "./ContentInfoRail";

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
  const { preview, loading, error, hasContent, branch } = usePublicationStagePreview(assets);
  const [seekRequest, setSeekRequest] = useState<{ seconds: number; id: number } | null>(null);
  const { openFullPreview } = usePublicationPreviewHandoff(() =>
    preview ? { preview, assets, publicationId } : null,
  );

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_19rem]">
      {/* Left — Publication fields (every field here is the Publication's, never the Asset's) */}
      <div className="flex flex-col gap-6">
        <BasicInfoForm workspaceTags={tags} showErrors={showFieldErrors} />
        <QuickEditTools />
      </div>

      {/* Centre — per-branch preview */}
      <Card className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Preview</h2>
            <p className="mt-0.5 text-xs text-zinc-500">ตัวอย่างเนื้อหา</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setStep(1)} className="text-xs font-medium text-indigo-600 hover:text-indigo-500">เปลี่ยนคอนเทนต์</button>
            <button
              type="button"
              onClick={openFullPreview}
              disabled={!preview}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Full Screen ({preview?.aspectRatio ?? "16:9"}) <ExpandIcon className="h-3.5 w-3.5" />
            </button>
          </div>
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
            seekRequest={seekRequest}
            controlsPlacement="overlay"
            frameViewportHeight="36vh"
          />
        )}
        {preview && (
          <PreviewAssetStrip
            preview={preview}
            assets={assets}
            onSeek={(seconds) => setSeekRequest((current) => ({ seconds, id: (current?.id ?? 0) + 1 }))}
          />
        )}
      </Card>

      {/* Right — read-only Content Info */}
      <ContentInfoRail assets={assets} preview={preview} branch={branch} loading={loading} error={error} />
    </div>
  );
}

/** DISABLED, not built yet — precedent `ScheduleStep.tsx:400-467`. */
function QuickEditTools() {
  const tools = [
    { label: "Edit", description: "ตัดต่อ / ปรับแต่งวิดีโอ", icon: EditIcon },
    { label: "Overlay", description: "เพิ่มข้อความ / โลโก้ / กราฟิก", icon: ImageIcon },
    { label: "Advanced", description: "การตั้งค่าขั้นสูง", icon: SettingsIcon },
  ];
  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-zinc-900">Quick Edit Tools</h2>
      <p className="mt-1 text-xs text-zinc-500">เครื่องมือแก้ไขด่วน (ยังไม่เปิดใช้งาน)</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
        {tools.map(({ label, description, icon: Icon }) => (
          <button
            key={label}
            type="button"
            disabled
            title="ยังไม่เปิดใช้งาน"
            className="flex min-h-20 cursor-not-allowed items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 text-left opacity-50"
          >
            <Icon className="h-6 w-6 shrink-0 text-indigo-600" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-zinc-800">{label}</span>
              <span className="mt-1 block text-[10px] leading-4 text-zinc-500">{description}</span>
            </span>
            <ArrowRightIcon className="h-4 w-4 shrink-0 text-zinc-400" />
          </button>
        ))}
      </div>
    </Card>
  );
}

function PreviewAssetStrip({ preview, assets, onSeek }: { preview: StagePreview; assets: MediaAsset[]; onSeek: (seconds: number) => void }) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const items = useMemo(
    () =>
      preview.zones.flatMap((zone) => {
        const schedule = zoneSchedule(zone.items, zone.playback, zone.id);
        const starts = new Map(schedule.order.map((authoredIndex, position) => [authoredIndex, schedule.starts[position]]));
        return zone.items.map((item, index) => ({ ...item, key: `${zone.id}-${index}`, zoneName: zone.name, startSeconds: starts.get(index) ?? 0 }));
      }),
    [preview],
  );
  const ids = useMemo(() => [...new Set(items.map((item) => item.mediaAssetId))], [items]);
  const previews = usePreviewUrls(ids);
  const assetsById = useMemo(() => Object.fromEntries(assets.map((asset) => [asset.id, asset])), [assets]);

  return (
    <div className="flex gap-2 overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-2">
      {items.map((item, index) => {
        const asset = assetsById[item.mediaAssetId];
        const label = asset?.title ?? asset?.file?.original_filename ?? item.label ?? item.zoneName;
        const selected = selectedKey ? selectedKey === item.key : index === 0;
        return (
          <button
            type="button"
            key={item.key}
            onClick={() => { setSelectedKey(item.key); onSeek(item.startSeconds); }}
            className={`w-24 shrink-0 overflow-hidden rounded-lg border bg-white text-left ${selected ? "border-indigo-500 ring-1 ring-indigo-200" : "border-zinc-200"}`}
            title={`${label} · ${item.startSeconds.toFixed(1)}s`}
          >
            <MediaThumb
              url={previews.urls[item.mediaAssetId]}
              thumbnailUrl={previews.thumbnailUrls[item.mediaAssetId]}
              kind={asset?.kind}
              mimeType={asset?.file?.mime_type}
              alt={label}
              className="aspect-video w-full rounded-none"
            />
            <div className="px-2 py-1">
              <p className="truncate text-[10px] font-medium text-zinc-700">{label}</p>
              <p className="truncate text-[9px] text-zinc-400">{item.zoneName}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
