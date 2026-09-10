"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EditIcon } from "@/components/ui/icons";
import type { ChannelListItem } from "../../channels/types";
import type { MediaAsset, ScheduleConflict } from "../types";
import type { EligibilityCheck, EligibilityStatus } from "../publish-eligibility";
import { summarizeGeometryFit, toChannelItems } from "../channels-logic";
import { priorities, publicationTypes } from "../mock-data";
import { utcToZonedParts, WEEKDAYS } from "../schedule";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";
import { ProgramSummaryRail } from "./ProgramSummaryRail";
import { PublicationPlaybackPreviewButton } from "./PublicationPlaybackPreviewButton";
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
  const selectedChannels = toChannelItems(channels).filter((channel) => channelIds.includes(channel.id));
  const geometry = useMemo(() => summarizeGeometryFit(channels, channelIds, aspectRatio), [channels, channelIds, aspectRatio]);
  const geometryStatus: EligibilityStatus = fitCheckFailed || !aspectRatio || !channelIds.length || geometry.unprofiled.length ? "unknown" : geometry.unfitting.length ? "fail" : "pass";
  const now = utcToZonedParts(new Date().toISOString(), schedule.timezone);
  const startDate = schedule.schedule_type === "now" ? now.date : schedule.start_date;
  const startTime = schedule.schedule_type === "now" ? now.time : schedule.start_time;
  const selectedAsset = assets.find((asset) => asset.id === assetItems[0]?.media_asset_id);
  const contentLabel = basicInfo.publicationType === "playlist" ? (playlistId ? "Selected Playlist" : "—") : basicInfo.publicationType === "composition" ? (compositionId ? "Selected Layout" : "—") : selectedAsset?.file?.original_filename ?? selectedAsset?.title ?? "—";
  const type = publicationTypes.find((item) => item.id === basicInfo.publicationType)?.label ?? "—";
  const priority = priorities.find((item) => item.id === basicInfo.priorityId)?.label ?? "—";
  const days = schedule.schedule_type === "recurring" ? WEEKDAYS.filter((day) => schedule.days.includes(day.value)).map((day) => day.label).join(", ") : null;
  const resolutions = [...new Set(channels.filter((channel) => channelIds.includes(channel.id)).flatMap((channel) => channel.devices.map((device) => device.resolution).filter(Boolean)))];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div><h1 className="text-xl font-semibold text-zinc-900">Step 4 — Review</h1><p className="mt-0.5 text-sm text-zinc-500">ตรวจสอบก่อนเผยแพร่</p></div>
        <Button variant="secondary" onClick={onEditProgram}><EditIcon className="h-4 w-4" /> Edit Program</Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard index={1} title="Content" status={statusOf(eligibilityChecks, "content")}><Row label="Name" value={basicInfo.name || "—"} /><Row label="Type" value={type} /><Row label="Source" value={contentLabel} /></SummaryCard>
            <SummaryCard index={2} title="Where to Play" status={statusOf(eligibilityChecks, "targets")}><Row label="Channels" value={selectedChannels.map((channel) => channel.name).join(", ") || "—"} /><Row label="Resolution" value={resolutions.join(", ") || "Unknown"} /></SummaryCard>
            <SummaryCard index={3} title="When to Play" status={statusOf(eligibilityChecks, "schedule")}><Row label="Start" value={`${startDate || "—"} ${startTime || ""}`} /><Row label="End" value={schedule.end_date || "No end date"} />{days && <Row label="Days" value={days} />}<Row label="Daily" value={`${schedule.daily_start} – ${schedule.daily_end}`} /></SummaryCard>
            <SummaryCard index={4} title="How to Play" status="unknown"><Row label="Playback" value={basicInfo.publicationType === "playlist" ? "Playlist settings" : basicInfo.publicationType === "composition" ? "Layout zone settings" : "Play in order"} /><Row label="Priority" value={priority} /></SummaryCard>
          </div>

          <Card className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
            <div><div className="mb-3"><h2 className="text-sm font-semibold text-zinc-900">Preview on Screen</h2><p className="text-xs text-zinc-400">ตัวอย่างการแสดงผลบนหน้าจอ</p></div><PublicationPlaybackPreviewButton assets={assets} conflictCount={conflicts.length} deviceResolutions={resolutions} /></div>
            <div><h2 className="text-sm font-semibold text-zinc-900">Timeline</h2><p className="text-xs text-zinc-400">{startDate || "Schedule date"} · {schedule.timezone}</p><div className="mt-4 flex justify-between text-[10px] text-zinc-400"><span>00:00</span><span>23:59</span></div><div className="mt-1 rounded-lg bg-indigo-100 px-3 py-3 text-center text-xs font-medium text-indigo-800">{basicInfo.name || "Your content"} · {schedule.daily_start}–{schedule.daily_end}</div>{conflicts.map((conflict) => <div key={conflict.publication_id} className="mt-2 rounded-lg bg-zinc-100 px-3 py-2 text-center text-xs text-zinc-600">Other content · {conflict.name}</div>)}<div className="mt-3 flex gap-4 text-[10px] text-zinc-500"><span>■ Your content</span><span className="text-zinc-400">■ Other content</span></div></div>
          </Card>
        </div>

        <div className="flex flex-col gap-4"><ProgramSummaryRail channels={channels} assets={assets} title="Review Summary" subtitle="สรุปรายการ" /><ReviewChecklist checks={eligibilityChecks} conflicts={conflicts} checkingConflicts={checkingConflicts} conflictsError={conflictsError} geometry={geometry} geometryStatus={geometryStatus} offlineNames={selectedChannels.filter((channel) => channel.status === "offline").map((channel) => channel.name)} /></div>
      </div>
    </div>
  );
}

function statusOf(checks: EligibilityCheck[], id: EligibilityCheck["id"]): EligibilityStatus { return checks.find((check) => check.id === id)?.status ?? "unknown"; }

function SummaryCard({ index, title, status, children }: { index: number; title: string; status: EligibilityStatus; children: React.ReactNode }) {
  return <Card className="flex min-h-56 flex-col p-4"><div className="flex items-center gap-2 border-b border-zinc-100 pb-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">{index}</span><h2 className="text-sm font-semibold text-zinc-900">{title}</h2></div><dl className="mt-4 space-y-3">{children}</dl><p className={`mt-auto pt-4 text-xs font-medium ${status === "pass" ? "text-emerald-600" : status === "fail" ? "text-amber-600" : "text-zinc-400"}`}>{status === "pass" ? "Ready" : status === "fail" ? "Needs attention" : "Not measured"}</p></Card>;
}

function Row({ label, value }: { label: string; value: string }) { return <div><dt className="text-[10px] uppercase tracking-wide text-zinc-400">{label}</dt><dd className="mt-0.5 break-words text-xs font-medium text-zinc-800">{value}</dd></div>; }
