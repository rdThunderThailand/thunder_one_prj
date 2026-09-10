"use client";

import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import type { ChannelListItem } from "../../channels/types";
import type { MediaAsset } from "../types";
import { priorities, publicationTypes } from "../mock-data";
import { WEEKDAYS } from "../schedule";
import { isVideoPreview } from "../preview-kind";
import { usePlaylistPreview } from "../hooks/usePlaylistPreview";
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
}: {
  channels: ChannelListItem[];
  assets: MediaAsset[];
}) {
  const basicInfo = usePublicationDraftStore((s) => s.basicInfo);
  const assetItems = usePublicationDraftStore((s) => s.assetItems);
  const playlistId = usePublicationDraftStore((s) => s.playlistId);
  const channelIds = usePublicationDraftStore((s) => s.channelIds);
  const scheduleForm = usePublicationDraftStore((s) => s.scheduleForm);

  const isPlaylist = basicInfo.publicationType === "playlist";
  const { playlist, coverAssetId, durationLabel } = usePlaylistPreview(playlistId, isPlaylist);

  const selectedAsset = assets.find((a) => a.id === assetItems[0]?.media_asset_id);
  const previewAssetId = isPlaylist ? coverAssetId : selectedAsset?.id;
  const previews = usePreviewUrls(previewAssetId ? [previewAssetId] : []);
  const previewUrl = previewAssetId ? previews.urls[previewAssetId] : undefined;
  const previewPoster = previewAssetId ? previews.thumbnailUrls[previewAssetId] : undefined;
  const previewAsset = assets.find((a) => a.id === previewAssetId);
  const isVideo = isVideoPreview(previewAsset, previewUrl);

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
  const channelSummary =
    selectedChannelNames.length > 0
      ? selectedChannelNames.join(", ")
      : channelIds.length > 0
      ? `${channelIds.length} channel(s)`
      : "—";

  const contentLabel = isPlaylist
    ? playlist
      ? `${playlist.name}${durationLabel ? ` (${durationLabel})` : ""}`
      : "—"
    : selectedAsset
    ? selectedAsset.file?.original_filename ?? selectedAsset.title ?? selectedAsset.id
    : "—";

  const startLabel =
    scheduleForm.schedule_type === "now"
      ? "Publish now"
      : `${formatShortDate(scheduleForm.start_date)}${scheduleForm.start_time ? `, ${scheduleForm.start_time}` : ""}`;
  const endLabel = scheduleForm.end_date
    ? `${formatShortDate(scheduleForm.end_date)}${scheduleForm.end_time ? `, ${scheduleForm.end_time}` : ""}`
    : "No end date";
  const allDay = scheduleForm.daily_start === "00:00" && scheduleForm.daily_end === "23:59";
  const weekdayLabel =
    scheduleForm.schedule_type === "recurring" && scheduleForm.days.length > 0
      ? WEEKDAYS.filter((d) => scheduleForm.days.includes(d.value)).map((d) => d.label).join(", ")
      : null;

  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="text-base font-semibold text-zinc-900">Program Summary</h2>
      <p className="-mt-3 text-xs text-zinc-400">สรุปการตั้งค่าโปรแกรม</p>

      {previewUrl ? (
        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-zinc-100">
          {isVideo ? (
            <video src={previewUrl} poster={previewPoster} controls preload="metadata" className="h-full w-full object-contain" />
          ) : (
            <Image src={previewUrl} alt={contentLabel} fill sizes="(min-width: 1024px) 300px, 100vw" className="object-cover" />
          )}
        </div>
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 text-zinc-400">
          <p className="text-xs">ตัวอย่างคอนเทนต์จะแสดงที่นี่</p>
        </div>
      )}

      <Section title="Content">
        <Row label="Type">
          <span className="flex items-center gap-1.5">
            <span className="h-4 w-4 text-zinc-500">{type && publicationTypeIcons[type.id]}</span>
            {type?.label}
          </span>
        </Row>
        <Row label="Name">{basicInfo.name || "—"}</Row>
        <Row label="Content">{contentLabel}</Row>
        {isMismatch && (
          <p className="text-right text-[11px] text-amber-600">
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
        {scheduleForm.schedule_type === "recurring" && (
          <Row label="Daily">{allDay ? "All day" : `${scheduleForm.daily_start} – ${scheduleForm.daily_end}`}</Row>
        )}
        <Row label="Timezone">{scheduleForm.timezone}</Row>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-zinc-100 pt-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">{title}</p>
      <dl className="flex flex-col gap-2 text-sm">{children}</dl>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-zinc-500">{label}</dt>
      <dd className="text-right font-medium text-zinc-900">{children}</dd>
    </div>
  );
}
