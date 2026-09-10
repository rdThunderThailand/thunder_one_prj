"use client";

import { useMemo, type ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatBytes, formatResolution } from "@/features/media-workspace/assets/components/AssetCard";
import { formatDuration } from "@/features/media-workspace/playlists";
import type { StagePreview } from "@/features/media-workspace/preview/composition-preview";
import type { MediaAsset } from "@/types/domain";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";
import { DEFAULT_IMAGE_DURATION_SECONDS, isImageAsset } from "../draft-mapping";
import { compositionZoneDurations, playlistFacts } from "../content-info";
import type { PreviewBranch } from "../hooks/usePublicationStagePreview";

/** Read-only facts about the chosen content (ADR 0072 §4/§9). Branch-specific: the fields a
 *  Media asset can state are not the fields a Playlist or a Composition can. The only editable
 *  value here is an image's seconds-on-screen — a Publication field, not an Asset field. */
export function ContentInfoRail({
  assets,
  preview,
  branch,
  loading,
  error,
}: {
  assets: MediaAsset[];
  preview: StagePreview | null;
  branch: PreviewBranch;
  loading: boolean;
  error: boolean;
}) {
  const assetsById = useMemo(() => Object.fromEntries(assets.map((a) => [a.id, a])), [assets]);

  return (
    <Card className="flex h-fit flex-col gap-4 p-5">
      <h2 className="text-base font-semibold text-zinc-900">Content Info</h2>
      {error ? (
        <p className="text-sm text-red-600">โหลดข้อมูลคอนเทนต์ไม่สำเร็จ</p>
      ) : loading || !preview ? (
        <p className="text-sm text-zinc-400">กำลังโหลด…</p>
      ) : branch === "media" ? (
        <MediaFacts assetsById={assetsById} />
      ) : branch === "playlist" ? (
        <PlaylistFacts preview={preview} assetsById={assetsById} />
      ) : (
        <CompositionFacts preview={preview} assetsById={assetsById} />
      )}
    </Card>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <dt className="shrink-0 text-zinc-500">{label}</dt>
      <dd className="text-right font-medium text-zinc-900">{value}</dd>
    </div>
  );
}

function MediaFacts({ assetsById }: { assetsById: Record<string, MediaAsset | undefined> }) {
  const assetItems = usePublicationDraftStore((s) => s.assetItems);
  const setAssetDuration = usePublicationDraftStore((s) => s.setAssetDuration);

  if (assetItems.length === 0) return <p className="text-sm text-zinc-400">ยังไม่ได้เลือกไฟล์</p>;

  return (
    <div className="flex flex-col gap-4">
      {assetItems.map((item) => {
        const asset = assetsById[item.media_asset_id];
        if (!asset) return null;
        const isImage = isImageAsset(asset);
        const filename = asset.file?.original_filename ?? asset.title ?? asset.id;
        return (
          <dl key={item.media_asset_id} className="flex flex-col gap-2 border-b border-zinc-100 pb-4 last:border-0 last:pb-0">
            <p className="truncate text-sm font-medium text-zinc-900" title={filename}>{filename}</p>
            <Row label="Type" value={<Badge color={isImage ? "green" : "blue"} variant="pill">{isImage ? "Image" : "Video"}</Badge>} />
            <Row label="Resolution" value={formatResolution(asset)} />
            <Row label="Size" value={formatBytes(asset.file?.file_size_bytes)} />
            {isImage ? (
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-zinc-500">Duration</span>
                <span className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    step={1}
                    defaultValue={item.duration_seconds ?? DEFAULT_IMAGE_DURATION_SECONDS}
                    onBlur={(e) => {
                      const parsed = parseInt(e.target.value, 10);
                      const secs = Number.isNaN(parsed) || parsed < 1 ? DEFAULT_IMAGE_DURATION_SECONDS : parsed;
                      e.target.value = String(secs);
                      setAssetDuration(item.media_asset_id, secs);
                    }}
                    aria-label={`Seconds on screen for ${filename}`}
                    className="w-16 rounded-lg border border-zinc-200 px-2 py-1 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <span className="text-xs text-zinc-400">วิ</span>
                </span>
              </div>
            ) : (
              <Row label="Duration" value={asset.duration_seconds ? formatDuration(asset.duration_seconds) : "—"} />
            )}
          </dl>
        );
      })}
    </div>
  );
}

function PlaylistFacts({ preview, assetsById }: { preview: StagePreview; assetsById: Record<string, MediaAsset | undefined> }) {
  const totals = playlistFacts(preview, assetsById);
  return (
    <dl className="flex flex-col gap-2">
      <Row label="Items" value={String(totals.fileCount)} />
      <Row label="Total duration" value={totals.durationLabel} />
      <Row label="Total size" value={totals.sizeLabel} />
      <p className="pt-1 text-xs text-zinc-400">
        แต่ละไฟล์ใน Playlist อาจมีความละเอียดต่างกัน
        {totals.isPartial ? " · บางไฟล์อ่านขนาดไม่ได้ ตัวเลขจึงน้อยกว่าจริง" : ""}
      </p>
    </dl>
  );
}

function CompositionFacts({ preview, assetsById }: { preview: StagePreview; assetsById: Record<string, MediaAsset | undefined> }) {
  const zones = compositionZoneDurations(preview, assetsById);
  return (
    <dl className="flex flex-col gap-2">
      <Row label="Reference resolution" value={preview.referenceResolution ?? "—"} />
      <Row label="Aspect ratio" value={preview.aspectRatio} />
      <Row label="Zones" value={String(zones.length)} />
      <div className="mt-1 flex flex-col gap-1.5 border-t border-zinc-100 pt-3">
        {zones.map((zone) => (
          <Row key={zone.id} label={zone.name} value={zone.seconds > 0 ? formatDuration(zone.seconds) : "ยังไม่มีสื่อ"} />
        ))}
      </div>
    </dl>
  );
}
