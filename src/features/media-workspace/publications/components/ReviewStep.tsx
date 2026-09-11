"use client";

import { useMemo, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { CalendarIcon, EditIcon, ImageIcon, InfoIcon, MonitorIcon, PlayIcon } from "@/components/ui/icons";
import { formatBytes, formatResolution } from "@/features/media-workspace/assets/components/AssetCard";
import { decodeMetadata, formatDuration } from "@/features/media-workspace/playlists";
import { PreviewStage } from "@/features/media-workspace/preview/PreviewStage";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import type { ChannelListItem } from "../../channels/types";
import type { MediaAsset, ScheduleConflict } from "../types";
import type { EligibilityCheck, EligibilityStatus } from "../publish-eligibility";
import { summarizeGeometryFit, toChannelItems } from "../channels-logic";
import { priorities, publicationTypes } from "../mock-data";
import { utcToZonedParts, WEEKDAYS } from "../schedule";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";
import { usePlaylistPreview } from "../hooks/usePlaylistPreview";
import { usePublicationStagePreview } from "../hooks/usePublicationStagePreview";
import { ProgramSummaryRail } from "./ProgramSummaryRail";
import { ReviewChecklist } from "./ReviewChecklist";

export interface ReviewStepProps {
  channels: ChannelListItem[];
  assets: MediaAsset[];
  conflicts: ScheduleConflict[];
  checkingConflicts: boolean;
  conflictsError: string | null;
  eligibilityChecks: EligibilityCheck[];
  aspectRatio: string | null;
  fitCheckFailed: boolean;
  onEditProgram: () => void;
}

export function ReviewStep({ channels, assets, conflicts, checkingConflicts, conflictsError, eligibilityChecks, aspectRatio, fitCheckFailed, onEditProgram }: ReviewStepProps) {
  const basicInfo = usePublicationDraftStore((state) => state.basicInfo);
  const assetItems = usePublicationDraftStore((state) => state.assetItems);
  const playlistId = usePublicationDraftStore((state) => state.playlistId);
  const compositionId = usePublicationDraftStore((state) => state.compositionId);
  const channelIds = usePublicationDraftStore((state) => state.channelIds);
  const schedule = usePublicationDraftStore((state) => state.scheduleForm);
  const { preview, loading: previewLoading, branch } = usePublicationStagePreview(assets);
  const isPlaylist = basicInfo.publicationType === "playlist";
  const { playlist, coverAssetId, durationLabel } = usePlaylistPreview(playlistId, isPlaylist);
  const selectedChannels = toChannelItems(channels).filter((channel) => channelIds.includes(channel.id));
  const geometry = useMemo(() => summarizeGeometryFit(channels, channelIds, aspectRatio), [channels, channelIds, aspectRatio]);
  const geometryStatus: EligibilityStatus =
    fitCheckFailed || !aspectRatio || !channelIds.length || geometry.unprofiled.length ? "unknown" : geometry.unfitting.length ? "fail" : "pass";
  const now = utcToZonedParts(new Date().toISOString(), schedule.timezone);
  const startDate = schedule.schedule_type === "now" ? now.date : schedule.start_date;
  const startTime = schedule.schedule_type === "now" ? now.time : schedule.start_time;
  const selectedAsset = assets.find((asset) => asset.id === assetItems[0]?.media_asset_id);
  const thumbnailAssetId = isPlaylist ? coverAssetId : selectedAsset?.id ?? preview?.zones[0]?.items[0]?.mediaAssetId;
  const thumbnailIds = useMemo(() => (thumbnailAssetId ? [thumbnailAssetId] : []), [thumbnailAssetId]);
  const thumbnails = usePreviewUrls(thumbnailIds);
  const thumbnailAsset = assets.find((asset) => asset.id === thumbnailAssetId);
  const playback = playlist ? decodeMetadata(playlist.metadata).playback : null;
  const contentLabel =
    basicInfo.publicationType === "playlist"
      ? playlist?.name ?? (playlistId ? "Selected Playlist" : "—")
      : basicInfo.publicationType === "composition"
        ? compositionId ? "Selected Layout" : "—"
        : selectedAsset?.file?.original_filename ?? selectedAsset?.title ?? "—";
  const type = publicationTypes.find((item) => item.id === basicInfo.publicationType)?.label ?? "—";
  const priority = priorities.find((item) => item.id === basicInfo.priorityId)?.label ?? "—";
  const days =
    schedule.schedule_type === "recurring"
      ? WEEKDAYS.filter((day) => schedule.days.includes(day.value)).map((day) => day.label).join(", ")
      : null;
  const dailyStart = schedule.schedule_type === "now" ? "00:00" : schedule.daily_start;
  const dailyEnd = schedule.schedule_type === "now" ? "23:59" : schedule.daily_end;
  const resolutions = [
    ...new Set(channels.filter((channel) => channelIds.includes(channel.id)).flatMap((channel) => channel.devices.map((device) => device.resolution).filter(Boolean))),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Step 4 — Review</h1>
          <p className="mt-0.5 text-sm text-zinc-500">ตรวจสอบก่อนเผยแพร่</p>
        </div>
        <Button variant="secondary" onClick={onEditProgram}><EditIcon className="h-4 w-4" /> Edit Program</Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard index={1} title="Content" subtitle="เนื้อหาที่ใช้" status={statusOf(eligibilityChecks, "content")} bodyClassName="space-y-3">
              <MediaThumb
                url={thumbnailAssetId ? thumbnails.urls[thumbnailAssetId] : undefined}
                thumbnailUrl={thumbnailAssetId ? thumbnails.thumbnailUrls[thumbnailAssetId] : undefined}
                kind={thumbnailAsset?.kind}
                mimeType={thumbnailAsset?.file?.mime_type}
                alt={contentLabel}
                className="aspect-video w-full rounded-lg xl:h-44 xl:aspect-auto"
              />
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-semibold text-zinc-900" title={contentLabel}>{contentLabel}</p>
                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">{type}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                <Row label="Resolution" value={thumbnailAsset ? formatResolution(thumbnailAsset) : preview?.referenceResolution ?? "—"} />
                <Row label="Duration" value={durationLabel ?? (thumbnailAsset?.duration_seconds ? formatDuration(thumbnailAsset.duration_seconds) : "—")} />
                <Row label={isPlaylist ? "Items" : "Size"} value={isPlaylist ? String(playlist?.items.length ?? "—") : formatBytes(thumbnailAsset?.file?.file_size_bytes)} />
                <Row label="Uploaded by" value={thumbnailAsset?.created_by?.display_name ?? "—"} />
              </div>
            </SummaryCard>
            <SummaryCard index={2} title="Where to Play" subtitle="ตำแหน่งที่แสดง" status={statusOf(eligibilityChecks, "targets")} bodyClassName="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600"><MonitorIcon /></span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-zinc-900">{selectedChannels.map((channel) => channel.name).join(", ") || "No channel selected"}</p>
                  <p className="mt-1 text-[10px] text-zinc-500">{selectedChannels.length} channel{selectedChannels.length === 1 ? "" : "s"} selected</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                <Row label="Resolution" value={resolutions.join(", ") || "Unknown"} />
                <Row label="Status" value={selectedChannels.every((channel) => channel.status === "online") ? "Online" : "Device warning"} />
              </div>
            </SummaryCard>
            <SummaryCard index={3} title="When to Play" subtitle="ช่วงเวลาแสดงผล" status={statusOf(eligibilityChecks, "schedule")} bodyClassName="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-zinc-100 p-3">
                <CalendarIcon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                <div>
                  <p className="text-xs font-semibold text-zinc-900">{startDate || "—"}</p>
                  <p className="mt-1 text-[10px] text-zinc-500">{schedule.end_date || "No end date"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                <Row label="Time" value={`${dailyStart} – ${dailyEnd}`} />
                <Row label="Timezone" value={schedule.timezone} />
                {days && <Row label="Days" value={days} />}
                <Row label="Starts at" value={startTime || "—"} />
              </div>
            </SummaryCard>
            <SummaryCard index={4} title="How to Play" subtitle="วิธีการเล่น" status="unknown" bodyClassName="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-zinc-100 p-3">
                <PlayIcon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                <p className="text-xs font-semibold text-zinc-900">
                  {isPlaylist ? "Playlist settings" : basicInfo.publicationType === "composition" ? "Layout zone settings" : "Play in order"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                <Row label="Play Order" value={playback?.playMode === "shuffle" ? "Shuffle" : "Play in Order"} />
                <Row label="Repeat" value={playback?.repeat === "once" ? "Play Once" : "Repeat All"} />
                <Row label="Transition" value={`${playback?.defaultTransition ?? "Fade"} (${playback?.transitionDuration ?? 1} sec)`} />
                <Row label="Audio" value={`${playback?.audioEnabled === false ? "Off" : "On"} (${playback?.defaultVolume ?? 100}%)`} />
                <Row label="Priority" value={priority} />
              </div>
            </SummaryCard>
          </div>

          <Card className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-[18rem_minmax(0,1fr)] xl:min-h-[347px] xl:grid-cols-[28rem_minmax(0,1fr)]">
            <div className="xl:pr-4">
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-zinc-900">Preview on Screen</h2>
                <p className="text-xs text-zinc-400">ตัวอย่างการแสดงผลบนหน้าจอ</p>
              </div>
              {preview ? (
                <PreviewStage
                  zones={preview.zones}
                  assets={assets}
                  aspectRatio={preview.aspectRatio}
                  referenceResolution={preview.referenceResolution}
                  allowActualSize={branch !== "playlist"}
                  controlsPlacement="overlay"
                  frameViewportHeight="20vh"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 text-zinc-400">
                  <ImageIcon className="h-7 w-7" />
                  <span className="ml-2 text-xs">{previewLoading ? "กำลังโหลด preview…" : "ไม่มี preview"}</span>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Timeline <span className="font-normal text-zinc-400">(ตัวอย่างลำดับการเล่น)</span></h2>
              <p className="mt-0.5 text-xs text-zinc-400">{startDate || "Schedule date"} · {schedule.timezone}</p>
              <div className="mt-4 flex justify-between text-[10px] font-medium text-zinc-500">
                <span>00:00</span>
                <span>23:59</span>
              </div>
              <div className="mt-1 rounded-lg bg-indigo-100 px-3 py-3 text-center text-xs font-semibold text-indigo-800">
                {basicInfo.name || "Your content"} · {dailyStart}–{dailyEnd}
              </div>
              {conflicts.map((conflict) => (
                <div key={conflict.publication_id} className="mt-2 rounded-lg bg-zinc-100 px-3 py-2 text-center text-xs text-zinc-600">
                  Other content · {conflict.name}
                </div>
              ))}
              <div className="mt-3 flex gap-4 text-[10px] text-zinc-500">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-indigo-200" />Your content</span>
                <span className="flex items-center gap-1.5 text-zinc-400"><span className="h-2.5 w-2.5 rounded-sm bg-zinc-200" />Other content</span>
              </div>
              <p className="mt-4 flex items-start gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-[11px] leading-5 text-indigo-700">
                <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
                ตัวอย่างนี้อ้างอิงการตั้งค่าปัจจุบัน อาจเปลี่ยนแปลงเมื่อแก้ไขการจัดตาราง
              </p>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <ProgramSummaryRail channels={channels} assets={assets} title="Review Summary" subtitle="สรุปรายการ" variant="review" />
          <ReviewChecklist
            checks={eligibilityChecks}
            conflicts={conflicts}
            checkingConflicts={checkingConflicts}
            conflictsError={conflictsError}
            geometry={geometry}
            geometryStatus={geometryStatus}
            offlineNames={selectedChannels.filter((channel) => channel.status === "offline").map((channel) => channel.name)}
          />
        </div>
      </div>
    </div>
  );
}

function statusOf(checks: EligibilityCheck[], id: EligibilityCheck["id"]): EligibilityStatus {
  return checks.find((check) => check.id === id)?.status ?? "unknown";
}

function SummaryCard({
  index,
  title,
  subtitle,
  status,
  bodyClassName = "grid grid-cols-2 gap-x-3 gap-y-2.5",
  children,
}: {
  index: number;
  title: string;
  subtitle: string;
  status: EligibilityStatus;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <Card className="flex min-h-40 flex-col p-4 xl:min-h-[450px]">
      <div className="flex items-start gap-2 border-b border-zinc-100 pb-2.5">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${status === "pass" ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"}`}>
          {index}
        </span>
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
          <p className="mt-0.5 text-[10px] text-zinc-400">{subtitle}</p>
        </div>
      </div>
      <div className={`mt-3 ${bodyClassName}`}>{children}</div>
      <p className={`mt-auto pt-3 text-xs font-medium ${status === "pass" ? "text-emerald-600" : status === "fail" ? "text-amber-600" : "text-zinc-400"}`}>
        {status === "pass" ? "✓ Ready" : status === "fail" ? "Needs attention" : "Not measured"}
      </p>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-0.5 break-words text-xs font-medium text-zinc-800">{value}</p>
    </div>
  );
}
