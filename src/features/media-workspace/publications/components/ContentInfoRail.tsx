"use client";

import { useMemo, type ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CheckCircleIcon, ExternalLinkIcon, InfoIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { formatBytes, formatResolution } from "@/features/media-workspace/assets/components/AssetCard";
import { formatDuration } from "@/features/media-workspace/playlists";
import type { StagePreview } from "@/features/media-workspace/preview/composition-preview";
import type { MediaAsset } from "@/types/domain";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";
import { DEFAULT_IMAGE_DURATION_SECONDS, isImageAsset } from "../draft-mapping";
import { compositionZoneDurations, playlistFacts } from "../content-info";
import type { PreviewBranch } from "../hooks/usePublicationStagePreview";

const formatDateTime = (value?: string) =>
  value && !Number.isNaN(new Date(value).getTime())
    ? new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

const aspectRatio = (width?: number, height?: number) => {
  if (!width || !height) return "—";
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
};

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
  const checks = preview
    ? [
        { label: "เลือก Content แล้ว", pass: preview.zones.some((zone) => zone.items.length > 0) },
        { label: "โหลดข้อมูล Preview แล้ว", pass: true },
        { label: "พบไฟล์ที่ใช้งานครบ", pass: preview.zones.every((zone) => zone.items.every((item) => Boolean(assetsById[item.mediaAssetId]))) },
        {
          label: "กำหนดระยะเวลาครบ",
          pass: preview.zones.every((zone) => zone.items.every((item) => (item.durationSeconds ?? assetsById[item.mediaAssetId]?.duration_seconds ?? 0) > 0)),
        },
        ...(branch === "composition" ? [{ label: "ทุก Zone มี Content", pass: preview.zones.every((zone) => zone.items.length > 0) }] : []),
      ]
    : [];

  return (
    <div className="flex h-fit flex-col gap-4">
      <Card className="flex flex-col gap-4 p-5">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Content Info</h2>
          <p className="mt-0.5 text-xs text-zinc-500">ข้อมูลเนื้อหา</p>
        </div>
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
      <Card className="p-5">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Checklist</h2>
          <p className="mt-0.5 text-xs text-zinc-500">ตรวจสอบความพร้อม</p>
        </div>
        <ul className="mt-4 space-y-2.5">
          {checks.map((check) => (
            <li key={check.label} className="flex items-start gap-2 text-xs text-zinc-600">
              {check.pass ? <CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-500" /> : <WarningTriangleIcon className="h-4 w-4 shrink-0 text-amber-500" />}
              {check.label}
            </li>
          ))}
        </ul>
      </Card>
      <Card className="border-indigo-100 bg-indigo-50/70 p-5">
        <div className="flex items-start gap-3">
          <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
          <div>
            <h2 className="text-sm font-semibold text-indigo-900">Need Help?</h2>
            <p className="mt-1 text-xs leading-5 text-indigo-700">ดูคู่มือการใช้งานหรือขอคำแนะนำ</p>
          </div>
        </div>
        <a href="#" className="mt-4 flex items-center justify-between rounded-lg border border-indigo-100 bg-white px-3 py-2 text-xs font-semibold text-indigo-700">
          View Guide <ExternalLinkIcon className="h-3.5 w-3.5" />
        </a>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-xs">
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
            <Row label="ประเภทไฟล์" value={asset.file?.mime_type?.split("/")[1]?.toUpperCase() ?? (isImage ? "IMAGE" : "VIDEO")} />
            <Row label="ขนาดไฟล์" value={formatBytes(asset.file?.file_size_bytes)} />
            <Row label="ความละเอียด" value={formatResolution(asset)} />
            {isImage ? (
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-zinc-500">ระยะเวลา</span>
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
              <Row label="ระยะเวลา" value={asset.duration_seconds ? formatDuration(asset.duration_seconds) : "—"} />
            )}
            <Row label="อัตราส่วนภาพ" value={aspectRatio(asset.width, asset.height)} />
            <Row label="อัปโหลดเมื่อ" value={formatDateTime(asset.created_at)} />
            <Row label="อัปโหลดโดย" value={asset.created_by?.display_name ?? "—"} />
            <Row label="สถานะ" value={<Badge color={asset.status === "ready" ? "green" : "zinc"} variant="dot">{asset.status === "ready" ? "พร้อมใช้งาน" : asset.status ?? "—"}</Badge>} />
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
      <Row label="ประเภท" value={<Badge color="blue" variant="pill">Playlist</Badge>} />
      <Row label="รายการ" value={`${totals.fileCount} items`} />
      <Row label="ระยะเวลารวม" value={totals.durationLabel} />
      <Row label="ขนาดรวม" value={totals.sizeLabel} />
      <Row label="อัตราส่วนภาพ" value={preview.aspectRatio} />
      <Row label="สถานะ" value={<Badge color="green" variant="dot">พร้อมแสดงตัวอย่าง</Badge>} />
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
      <Row label="ประเภท" value={<Badge color="indigo" variant="pill">Layout</Badge>} />
      <Row label="ความละเอียดอ้างอิง" value={preview.referenceResolution ?? "—"} />
      <Row label="อัตราส่วนภาพ" value={preview.aspectRatio} />
      <Row label="Zones" value={String(zones.length)} />
      <Row label="สถานะ" value={<Badge color="green" variant="dot">พร้อมแสดงตัวอย่าง</Badge>} />
      <div className="mt-1 flex flex-col gap-1.5 border-t border-zinc-100 pt-3">
        {zones.map((zone) => (
          <Row key={zone.id} label={zone.name} value={zone.seconds > 0 ? formatDuration(zone.seconds) : "ยังไม่มีสื่อ"} />
        ))}
      </div>
    </dl>
  );
}
