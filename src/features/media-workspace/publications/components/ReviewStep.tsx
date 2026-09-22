"use client";

import { useMemo, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { CalendarIcon, EditIcon, ImageIcon, InfoIcon, PlayIcon } from "@/components/ui/icons";
import { formatBytes, formatResolution } from "@/features/media-workspace/assets/components/AssetCard";
import { decodeMetadata, formatDuration } from "@/features/media-workspace/playlists";
import { PreviewStage } from "@/features/media-workspace/preview/PreviewStage";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import type { ChannelListItem } from "../../channels/types";
import type { MediaAsset, ScheduleConflict } from "../types";
import type { EligibilityCheck, EligibilityStatus } from "../publish-eligibility";
import { summarizeGeometryFit, toChannelItems } from "../channels-logic";
import { priorities, publicationTypes } from "../mock-data";
import { formatReviewTimeRange, getDayTimelinePlacement, utcToZonedParts, WEEKDAYS } from "../schedule";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";
import { usePlaylistPreview } from "../hooks/usePlaylistPreview";
import { usePublicationStagePreview } from "../hooks/usePublicationStagePreview";
import { ProgramSummaryRail } from "./ProgramSummaryRail";
import { ReviewChecklist } from "./ReviewChecklist";
import { ReviewTargets } from "./ReviewTargets";

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
  const groupIds = usePublicationDraftStore((state) => state.groupIds);
  const groupNamesById = usePublicationDraftStore((state) => state.groupNamesById);
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
  const reviewTimeRange = formatReviewTimeRange(schedule, now.time);
  const scheduleMode = {
    now: "Publish now",
    later: "Schedule later",
    range: "Date range",
    recurring: "Recurring",
  }[schedule.schedule_type];
  const endTime = schedule.end_date ? schedule.end_time || "23:59" : "No end time";
  const timelineStartTime = schedule.schedule_type === "recurring" ? schedule.daily_start : startTime;
  const timelineEndTime = schedule.schedule_type === "recurring"
    ? schedule.daily_end
    : schedule.end_date === startDate
      ? schedule.end_time || "23:59"
      : "24:00";
  const timelinePlacement = getDayTimelinePlacement(timelineStartTime, timelineEndTime);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">Step 4 — Review</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">ตรวจสอบก่อนเผยแพร่</p>
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
                <p className="truncate text-xs font-semibold text-foreground" title={contentLabel}>{contentLabel}</p>
                <span className="shrink-0 rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-medium text-success">{type}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                <Row label="Resolution" value={thumbnailAsset ? formatResolution(thumbnailAsset) : preview?.referenceResolution ?? "—"} />
                <Row label="Duration" value={durationLabel ?? (thumbnailAsset?.duration_seconds ? formatDuration(thumbnailAsset.duration_seconds) : "—")} />
                <Row label={isPlaylist ? "Items" : "Size"} value={isPlaylist ? String(playlist?.items.length ?? "—") : formatBytes(thumbnailAsset?.file?.file_size_bytes)} />
                <Row label="Uploaded by" value={thumbnailAsset?.created_by?.display_name ?? "—"} />
              </div>
            </SummaryCard>
            <SummaryCard index={2} title="Where to Play" subtitle="ตำแหน่งที่แสดง" status={statusOf(eligibilityChecks, "targets")} bodyClassName="space-y-3">
              <ReviewTargets
                channels={channels}
                channelIds={channelIds}
                groupIds={groupIds}
                groupNamesById={groupNamesById}
              />
            </SummaryCard>
            <SummaryCard index={3} title="When to Play" subtitle="ช่วงเวลาแสดงผล" status={statusOf(eligibilityChecks, "schedule")} bodyClassName="space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-primary">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary-soft">
                  <CalendarIcon className="h-4 w-4" />
                </span>
                {scheduleMode}
              </div>
              <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-muted">
                <div className="border-r border-border p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">Start</p>
                  <p className="mt-1 text-xs font-semibold text-foreground">{startDate || "—"}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{startTime || "At activation"}</p>
                </div>
                <div className="p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">End</p>
                  <p className="mt-1 text-xs font-semibold text-foreground">{schedule.end_date || "No end date"}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{endTime}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                <Row label="Play window" value={reviewTimeRange} />
                <Row label="Timezone" value={schedule.timezone} />
                {days && <Row label="Active days" value={days} />}
              </div>
            </SummaryCard>
            <SummaryCard index={4} title="How to Play" subtitle="วิธีการเล่น" status="unknown" bodyClassName="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-border p-3">
                <PlayIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-xs font-semibold text-foreground">
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

          <Card className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] xl:min-h-[430px]">
            <div className="lg:pr-2">
              <div className="mb-3">
                <h2 className="text-[11px] font-bold text-foreground">Preview on Screen</h2>
                <p className="text-xs text-muted-foreground">ตัวอย่างการแสดงผลบนหน้าจอ</p>
              </div>
              {preview ? (
                <PreviewStage
                  zones={preview.zones}
                  assets={assets}
                  aspectRatio={preview.aspectRatio}
                  referenceResolution={preview.referenceResolution}
                  allowActualSize={branch !== "playlist"}
                  controlsPlacement="overlay"
                  frameViewportHeight="36vh"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-border bg-muted text-muted-foreground">
                  <ImageIcon className="h-7 w-7" />
                  <span className="ml-2 text-xs">{previewLoading ? "กำลังโหลด preview…" : "ไม่มี preview"}</span>
                </div>
              )}
            </div>
            <div className="flex min-h-full flex-col">
              <h2 className="text-[11px] font-bold text-foreground">Timeline <span className="font-normal text-muted-foreground">(ตัวอย่างลำดับการเล่น)</span></h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{startDate || "Schedule date"} · {schedule.timezone}</p>
              <div className="mt-4 flex flex-1 flex-col rounded-xl border border-border bg-muted p-4">
                <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                  <span>00:00</span>
                  <span>23:59</span>
                </div>
                <div className="relative mt-2 h-12 overflow-hidden rounded-lg bg-muted">
                  <div
                    title={`${basicInfo.name || "Your content"} · ${reviewTimeRange}`}
                    className="absolute inset-y-0 flex min-w-0 items-center justify-center overflow-hidden rounded-md bg-primary-soft px-2 text-[10px] font-semibold text-primary ring-1 ring-inset ring-primary/30"
                    style={{
                      left: `${timelinePlacement.leftPercent}%`,
                      width: `${timelinePlacement.widthPercent}%`,
                    }}
                  >
                    <span className="truncate">{basicInfo.name || "Your content"}</span>
                  </div>
                </div>
                <p className="mt-2 text-xs font-medium text-muted-foreground">{basicInfo.name || "Your content"} · {reviewTimeRange}</p>
                {conflicts.map((conflict) => (
                  <div key={conflict.publication_id} className="mt-2 rounded-lg bg-muted px-3 py-3 text-center text-xs text-muted-foreground">
                    Other content · {conflict.name}
                  </div>
                ))}
                <div className="mt-4 flex gap-4 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary-soft" />Your content</span>
                  <span className="flex items-center gap-1.5 text-muted-foreground"><span className="h-2.5 w-2.5 rounded-sm bg-muted" />Other content</span>
                </div>
                <p className="mt-auto flex items-start gap-2 rounded-lg bg-primary-soft px-3 py-2 text-[11px] leading-5 text-primary">
                  <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  ตัวอย่างนี้อ้างอิงการตั้งค่าปัจจุบัน อาจเปลี่ยนแปลงเมื่อแก้ไขการจัดตาราง
                </p>
              </div>
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
      <div className="flex items-start gap-2 border-b border-border pb-2.5">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${status === "pass" ? "bg-success-soft text-success" : "bg-primary-soft text-primary"}`}>
          {index}
        </span>
        <div>
          <h2 className="text-[11px] font-bold text-foreground">{title}</h2>
          <p className="mt-0.5 text-[10px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className={`mt-3 ${bodyClassName}`}>{children}</div>
      <p className={`mt-auto pt-3 text-xs font-medium ${status === "pass" ? "text-success" : status === "fail" ? "text-warning" : "text-muted-foreground"}`}>
        {status === "pass" ? "✓ Ready" : status === "fail" ? "Needs attention" : "Not measured"}
      </p>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 break-words text-xs font-medium text-foreground">{value}</p>
    </div>
  );
}
