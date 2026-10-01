"use client";

import { Card } from "@/components/ui/Card";
import { CalendarIcon, MonitorIcon, PlayIcon } from "@/components/ui/icons";
import { PreviewStage } from "@/features/media-workspace/preview/PreviewStage";
import type { ChannelListItem } from "../../channels/types";
import type { MediaAsset } from "../types";
import { priorities, publicationTypes } from "../mock-data";
import { WEEKDAYS } from "../schedule";
import { describeSchedule, scheduleEdges } from "../schedule-describe";
import { draftToSchedule, isDraftValid } from "../schedule-preset";
import { isVideoPreview } from "../preview-kind";
import { usePlaylistPreview } from "../hooks/usePlaylistPreview";
import { usePublicationStagePreview } from "../hooks/usePublicationStagePreview";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";
import { publicationTypeIcons } from "./publicationTypeIcons";

function formatShortDate(iso: string) {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Frame 3 Program Summary rail — the read-only running total of the draft as the
 *  operator fills the three columns. Adapted from ScheduleStep's former Publication
 *  Summary card. */
export function ProgramSummaryRail({
  channels,
  assets,
  title = "Program Summary",
  subtitle = "สรุปการตั้งค่าโปรแกรม",
  variant = "default",
  refreshKey,
}: {
  channels: ChannelListItem[];
  assets: MediaAsset[];
  title?: string;
  subtitle?: string;
  variant?: "default" | "review";
  /** Bumped by the parent after the content's Playlist changed on the same page. */
  refreshKey?: number;
}) {
  const basicInfo = usePublicationDraftStore((s) => s.basicInfo);
  const assetItems = usePublicationDraftStore((s) => s.assetItems);
  const playlistId = usePublicationDraftStore((s) => s.playlistId);
  const channelIds = usePublicationDraftStore((s) => s.channelIds);
  const groupIds = usePublicationDraftStore((s) => s.groupIds);
  const groupNamesById = usePublicationDraftStore((s) => s.groupNamesById);
  const schedule = usePublicationDraftStore((s) => s.schedule);

  const isPlaylist = basicInfo.publicationType === "playlist";
  const { playlist, durationLabel } = usePlaylistPreview(playlistId, isPlaylist);
  // Same projection as Prepare Content's stage, so every content type previews here too (#199).
  // Loaded in the review variant as well — it is where a Layout's name comes from.
  const { preview, branch, loading } = usePublicationStagePreview(assets, true, refreshKey);

  const selectedAsset = assets.find((a) => a.id === assetItems[0]?.media_asset_id);
  const isVideo = isVideoPreview(selectedAsset, undefined);

  const isMismatch =
    selectedAsset &&
    ((basicInfo.publicationType === "image" && isVideo) ||
      (basicInfo.publicationType === "video" && selectedAsset.kind === "image"));

  const type = publicationTypes.find((t) => t.id === basicInfo.publicationType);
  const priority = priorities.find((p) => p.id === basicInfo.priorityId);

  const selectedChannelNames =
    channels.length > 0
      ? channels.filter((c) => channelIds.includes(c.id)).map((c) => c.name)
      : [];
  const selectedGroupNames = groupIds.map((id) => groupNamesById[id] ?? id);
  const selectedNames = [...selectedChannelNames, ...selectedGroupNames];
  const channelSummary =
    selectedNames.length > 0
      ? selectedNames.join(", ")
      : channelIds.length > 0 || groupIds.length > 0
      ? [
          channelIds.length > 0 ? `${channelIds.length} channel(s)` : null,
          groupIds.length > 0 ? `${groupIds.length} group(s)` : null,
        ]
          .filter(Boolean)
          .join(", ")
      : "—";

  const contentLabel = isPlaylist
    ? playlist
      ? `${playlist.name}${durationLabel ? ` (${durationLabel})` : ""}`
      : "—"
    : basicInfo.publicationType === "composition"
    ? preview?.contentName ?? "—"
    : selectedAsset
    ? selectedAsset.file?.original_filename ?? selectedAsset.title ?? selectedAsset.id
    : "—";

  const stored = isDraftValid(schedule) ? draftToSchedule(schedule) : null;
  const summary = stored ? describeSchedule(stored) : null;
  const edges = stored ? scheduleEdges(stored) : null;
  const startLabel = edges ? `${formatShortDate(edges.startDate)}, ${edges.startTime}` : "—";
  const endLabel = edges?.endDate ? `${formatShortDate(edges.endDate)}${edges.endTime ? `, ${edges.endTime}` : ""}` : "No end date";
  const weekdayLabel = summary?.days.length
    ? WEEKDAYS.filter((d) => summary.days.includes(d.value)).map((d) => d.label).join(", ")
    : schedule.mode === "monthly" || schedule.mode === "dates"
      ? summary?.title ?? null
      : null;

  if (variant === "review") {
    const scheduleLabel = summary ? [summary.title, summary.hours, summary.range].filter(Boolean).join(" · ") : "—";
    const playbackLabel = isPlaylist
      ? "ตามการตั้งค่าของ Playlist"
      : basicInfo.publicationType === "composition"
        ? "ตามการตั้งค่าของ Layout"
        : "Play in Order · Repeat All";

    return (
      <Card className="p-5">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        <dl className="mt-4 grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs">
          <dt className="text-muted-foreground">Program Name</dt><dd className="font-medium text-foreground">{basicInfo.name || "—"}</dd>
          <dt className="text-muted-foreground">Content Type</dt><dd className="font-medium text-foreground">{type?.label ?? "—"}</dd>
          <dt className="text-muted-foreground">Priority</dt><dd className="font-medium text-foreground">{priority?.label ?? "—"}</dd>
        </dl>
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <ReviewFact icon={<span className="h-4 w-4">{type && publicationTypeIcons[type.id]}</span>} label="Content" value={contentLabel} />
          <ReviewFact icon={<MonitorIcon />} label="Where to Play" value={channelSummary} />
          <ReviewFact icon={<CalendarIcon />} label="When to Play" value={scheduleLabel} />
          <ReviewFact icon={<PlayIcon />} label="How to Play" value={playbackLabel} />
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="-mt-3 text-xs text-muted-foreground">{subtitle}</p>

      {preview ? (
        <PreviewStage
          zones={preview.zones}
          assets={assets}
          aspectRatio={preview.aspectRatio}
          referenceResolution={preview.referenceResolution}
          allowActualSize={branch !== "playlist"}
          controlsPlacement="overlay"
          fillWidth
        />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted text-muted-foreground">
          <p className="text-xs">{loading ? "กำลังโหลดตัวอย่าง…" : "ตัวอย่างคอนเทนต์จะแสดงที่นี่"}</p>
        </div>
      )}

      <Section title="Content">
        <Row label="Type">
          <span className="flex items-center gap-1.5">
            <span className="h-4 w-4 text-muted-foreground">{type && publicationTypeIcons[type.id]}</span>
            {type?.label}
          </span>
        </Row>
        <Row label="Name">{basicInfo.name || "—"}</Row>
        <Row label="Content">{contentLabel}</Row>
        {isMismatch && (
          <p className="text-right text-[11px] text-warning">
            Selected asset is a {selectedAsset?.kind} while publication type is {basicInfo.publicationType}.
          </p>
        )}
      </Section>

      <Section title="Where to Play">
        <Row label="Channels">{channelSummary}</Row>
      </Section>

      <Section title="When to Play">
        <Row label="Start">{startLabel}</Row>
        <Row label="End">{endLabel}</Row>
        {weekdayLabel && <Row label="Days">{weekdayLabel}</Row>}
        {summary?.hours && <Row label="Daily">{summary.hours}</Row>}
        <Row label="Timezone">{schedule.timezone}</Row>
      </Section>

      <Section title="How to Play">
        {isPlaylist || basicInfo.publicationType === "composition" ? (
          <Row label="Playback">ตามการตั้งค่าของ {isPlaylist ? "Playlist" : "Layout"}</Row>
        ) : (
          <>
            <Row label="Play Order">Play in Order</Row>
            <Row label="Repeat">Repeat All</Row>
          </>
        )}
      </Section>

      <Section title="Other">
        <Row label="Priority">
          <span className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${priority?.color}`} />
            {priority?.label}
          </span>
        </Row>
        <Row label="Tags">{basicInfo.tags.join(", ") || "—"}</Row>
      </Section>
    </Card>
  );
}

function ReviewFact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="grid grid-cols-[2rem_5.75rem_minmax(0,1fr)] items-start gap-2 text-xs">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">{icon}</span>
      <span className="pt-2 font-medium text-muted-foreground">{label}</span>
      <span className="pt-2 text-right font-medium leading-4 text-foreground">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border pt-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
      <dl className="flex flex-col gap-2 text-sm">{children}</dl>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  const tooltip = typeof children === "string" ? children : undefined;

  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd title={tooltip} className="min-w-0 max-w-[65%] truncate text-right font-medium text-foreground">{children}</dd>
    </div>
  );
}
