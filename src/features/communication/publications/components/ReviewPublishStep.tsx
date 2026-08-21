"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { CheckCircleIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { playlistDisplayStatus, statusBadge } from "@/features/communication/playlists";
import { usePlaylistPreview } from "../hooks/usePlaylistPreview";
import { fetchPublication } from "../services/publications-api";
import { utcToZonedParts } from "../schedule";
import type { Campaign, MediaAsset, ScheduleConflict } from "../types";
import type { ChannelListItem } from "../../channels/types";
import { toChannelItems } from "../channels-logic";
import {
  priorities,
  prePublishChecklist,
  publicationTypes,
  scheduleTypes,
} from "../mock-data";
import { publicationTypeIcons } from "./publicationTypeIcons";
import { categoryBadgeColor, categoryIcon } from "./ChannelCard";
import { MiniCalendar } from "./MiniCalendar";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";

import { type EligibilityCheck, isAllGatingPassed } from "../publish-eligibility";

function formatShortDate(iso: string) {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(iso: string | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLongDate(iso: string) {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export interface ReviewPublishStepProps {
  campaigns?: Campaign[];
  channels?: ChannelListItem[];
  assets?: MediaAsset[];
  conflicts?: ScheduleConflict[];
  eligibilityChecks?: EligibilityCheck[];
}

export function ReviewPublishStep({
  campaigns = [],
  channels = [],
  assets = [],
  conflicts = [],
  eligibilityChecks = [],
}: ReviewPublishStepProps) {
  const basicInfo = usePublicationDraftStore((s) => s.basicInfo);
  const assetItems = usePublicationDraftStore((s) => s.assetItems);
  const playlistId = usePublicationDraftStore((s) => s.playlistId);
  const publicationId = usePublicationDraftStore((s) => s.publicationId);
  const channelIds = usePublicationDraftStore((s) => s.channelIds);
  const scheduleForm = usePublicationDraftStore((s) => s.scheduleForm);

  const isPlaylist = basicInfo.publicationType === "playlist";
  const { playlist, failed: playlistFailed, coverAssetId: playlistCoverId, durationLabel: playlistDuration } =
    usePlaylistPreview(playlistId, isPlaylist);

  // Step 5 is only reachable once Step 1's Next has saved the draft, so a
  // publicationId always exists here — but keyed by id anyway, same reason as
  // usePlaylistPreview: a stale response must never render under a switched draft.
  const [metaResult, setMetaResult] = useState<{ id: string; createdBy?: string; createdAt?: string } | null>(
    null
  );
  useEffect(() => {
    if (!publicationId) return;
    let alive = true;
    fetchPublication(publicationId)
      .then(
        (detail) =>
          alive &&
          setMetaResult({ id: publicationId, createdBy: detail.created_by?.display_name, createdAt: detail.created_at })
      )
      .catch(() => alive && setMetaResult({ id: publicationId }));
    return () => {
      alive = false;
    };
  }, [publicationId]);
  const meta = metaResult?.id === publicationId ? metaResult : null;

  const selectedChannels = toChannelItems(channels).filter((c) => channelIds.includes(c.id));

  const selectedAsset = assets.find((a) => a.id === assetItems[0]?.media_asset_id);
  const previewAssetId = isPlaylist ? playlistCoverId : selectedAsset?.id;
  const previews = usePreviewUrls(previewAssetId ? [previewAssetId] : []);
  const previewUrl = previewAssetId ? previews.urls[previewAssetId] : undefined;
  const thumbnailUrl = previewAssetId ? previews.thumbnailUrls[previewAssetId] : undefined;

  const campaign = campaigns.find((c) => c.id === basicInfo.campaignId);
  const type = publicationTypes.find((t) => t.id === basicInfo.publicationType);
  const priority = priorities.find((p) => p.id === basicInfo.priorityId);
  const scheduleType = scheduleTypes.find(
    (s) => s.id === (scheduleForm.schedule_type === "now"
      ? "publish-now"
      : scheduleForm.schedule_type === "later"
      ? "schedule-later"
      : scheduleForm.schedule_type === "recurring"
      ? "recurring"
      : "custom-range")
  );
  const offlineChannels = selectedChannels.filter((c) => c.status === "offline");

  const assetFilename = selectedAsset?.file?.original_filename ?? selectedAsset?.title;
  const assetDimensions =
    selectedAsset?.width && selectedAsset?.height
      ? `${selectedAsset.width} x ${selectedAsset.height}`
      : undefined;
  const assetDurationLabel =
    selectedAsset?.kind === "video" && selectedAsset.duration_seconds != null
      ? `${Math.round(selectedAsset.duration_seconds)}s`
      : selectedAsset?.kind === "image"
      ? "10s"
      : undefined;

  const nowZoned = utcToZonedParts(new Date().toISOString(), scheduleForm.timezone);

  const displayStartDate =
    scheduleForm.schedule_type === "now" ? nowZoned.date : scheduleForm.start_date;
  const displayStartTime =
    scheduleForm.schedule_type === "now" ? nowZoned.time : scheduleForm.start_time;

  const allPassed = isAllGatingPassed(eligibilityChecks);
  const badge = playlist ? statusBadge(playlistDisplayStatus(playlist)) : null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Review &amp; Publish</h1>
        <p className="mt-0.5 text-sm text-zinc-500">ตรวจสอบรายละเอียดก่อนเผยแพร่สื่อ</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">Content Preview</h2>
            <div className="flex gap-4">
              <div className="flex aspect-square w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-100">
                <MediaThumb
                  url={previewUrl}
                  thumbnailUrl={thumbnailUrl}
                  kind={isPlaylist ? undefined : selectedAsset?.kind}
                  mimeType={isPlaylist ? undefined : selectedAsset?.file?.mime_type}
                  alt={isPlaylist ? playlist?.name ?? basicInfo.name : assetFilename ?? basicInfo.name}
                  className="h-full w-full"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                  {basicInfo.name}
                  <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                    v.1
                  </span>
                </p>
                <dl className="mt-2 space-y-1.5 text-xs">
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 text-zinc-400">Campaign</dt>
                    <dd className="text-zinc-700">{campaign?.name ?? "—"}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 text-zinc-400">Content Type</dt>
                    <dd className="flex items-center gap-1 text-zinc-700">
                      <span className="h-3.5 w-3.5">{type && publicationTypeIcons[type.id]}</span>
                      {type?.label}
                    </dd>
                  </div>
                  {isPlaylist ? (
                    <div className="flex gap-2">
                      <dt className="w-20 shrink-0 text-zinc-400">Playlist</dt>
                      <dd className="text-zinc-700">
                        {playlist ? (
                          <Link
                            href={`/playlists/${playlist.id}`}
                            target="_blank"
                            className="font-medium text-indigo-600 hover:underline"
                          >
                            {playlist.name}
                          </Link>
                        ) : playlistFailed ? (
                          "โหลด playlist ไม่สำเร็จ"
                        ) : (
                          "กำลังโหลด..."
                        )}
                        {playlist && badge && (
                          <span className="mt-0.5 flex items-center gap-1.5 text-zinc-400">
                            <Badge color={badge.color} variant="pill">
                              {badge.label}
                            </Badge>
                            {playlist.items.length} items · {playlistDuration}
                          </span>
                        )}
                      </dd>
                    </div>
                  ) : (
                    selectedAsset && (
                      <div className="flex gap-2">
                        <dt className="w-20 shrink-0 text-zinc-400">File</dt>
                        <dd className="text-zinc-700">
                          {assetFilename ?? "—"}{assetItems.length > 1 ? ` +${assetItems.length - 1} more` : ""}
                          <span className="block text-zinc-400">
                            {assetDimensions ?? "—"}
                            {assetDurationLabel ? ` · ${assetDurationLabel}` : ""}
                          </span>
                        </dd>
                      </div>
                    )
                  )}
                </dl>
              </div>
            </div>
            <div className="mt-4 flex items-center border-t border-zinc-100 pt-3 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Avatar name={meta?.createdBy ?? "—"} size={20} />
                Created by {meta?.createdBy ?? "—"} · {formatDateTime(meta?.createdAt)}
              </span>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">
              Device Preview ({selectedChannels.length}{" "}
              {selectedChannels.length === 1 ? "Device" : "Devices"})
            </h2>
            {selectedChannels.length === 0 ? (
              <p className="text-xs text-zinc-400">No channels selected yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {selectedChannels.map((channel) => (
                  <div key={channel.id} className="flex flex-col gap-1.5">
                    <div
                      className={`flex aspect-square items-center justify-center rounded-lg ${categoryBadgeColor[channel.category]}`}
                    >
                      <span className="h-6 w-6">{categoryIcon[channel.category]}</span>
                    </div>
                    <p className="truncate text-xs font-medium text-zinc-900">{channel.name}</p>
                    <p className="truncate text-[11px] text-zinc-400">{channel.subLabel}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-900">Pre-Publish Checklist</h2>
                {allPassed ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                    Passed All Checks
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                    Check Required
                  </span>
                )}
              </div>
              <ul className="flex flex-col gap-2">
                {prePublishChecklist.map((item, idx) => {
                  const status = eligibilityChecks[idx]?.status ?? "unknown";
                  return (
                    <li key={item} className="flex items-center justify-between gap-2 text-xs text-zinc-600">
                      <span>
                        {item}
                        {idx === 4 && conflicts.length > 0 ? ` (${conflicts.length})` : ""}
                      </span>
                      {status === "unknown" ? (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full bg-zinc-300"
                          title="ตรวจสอบด้วยตนเอง"
                        />
                      ) : status === "pass" ? (
                        <CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-500" />
                      ) : (
                        <WarningTriangleIcon className="h-4 w-4 shrink-0 text-amber-500" />
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>

            <Card className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-zinc-900">Conflicts &amp; Warnings</h2>
              <div className="flex flex-col gap-3">
                {conflicts.length > 0 ? (
                  <div className="flex items-start gap-2">
                    <WarningTriangleIcon className="h-4 w-4 shrink-0 text-amber-500" />
                    <div>
                      <p className="text-xs font-medium text-zinc-900">
                        Schedule Conflict ({conflicts.length})
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        มีความขัดแย้งของตารางเวลา {conflicts.length} รายการ
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-500" />
                    <div>
                      <p className="text-xs font-medium text-zinc-900">No Schedule Conflicts</p>
                      <p className="text-[11px] text-zinc-400">ไม่มีความขัดแย้งของตารางเวลา</p>
                    </div>
                  </div>
                )}
                {offlineChannels.length > 0 ? (
                  <div className="flex items-start gap-2">
                    <WarningTriangleIcon className="h-4 w-4 shrink-0 text-amber-500" />
                    <div>
                      <p className="text-xs font-medium text-zinc-900">
                        Device Offline ({offlineChannels.length})
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        กรุณาตรวจสอบ: {offlineChannels.map((c) => c.name).join(", ")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-500" />
                    <div>
                      <p className="text-xs font-medium text-zinc-900">No Device Issues</p>
                      <p className="text-[11px] text-zinc-400">อุปกรณ์ทั้งหมดพร้อมใช้งาน</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">กำหนดการเผยแพร่</h2>
            <dl className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-zinc-400">Start</dt>
                <dd className="font-medium text-zinc-700">
                  {formatShortDate(displayStartDate)}, {displayStartTime}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-400">End</dt>
                <dd className="font-medium text-zinc-700">
                  {scheduleForm.end_date
                    ? `${formatShortDate(scheduleForm.end_date)}, ${scheduleForm.end_time}`
                    : "Not set"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-400">Time Zone</dt>
                <dd className="font-medium text-zinc-700">{scheduleForm.timezone}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-400">Schedule Type</dt>
                <dd className="font-medium text-zinc-700">{scheduleType?.label}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-400">Publish Order</dt>
                <dd className="font-medium text-zinc-700">
                  Publish to all channels at the same time
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900">Schedule Preview</h2>
            <MiniCalendar form={scheduleForm} conflicts={conflicts} />
            {displayStartDate && (
              <div className="mt-5 border-t border-zinc-100 pt-4">
                <p className="mb-2 text-sm font-semibold text-zinc-900">
                  {formatLongDate(displayStartDate)}
                </p>
                <div className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3">
                  <span className="shrink-0 text-sm font-semibold text-zinc-900">
                    {displayStartTime}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900">{basicInfo.name}</p>
                    <p className="text-xs text-zinc-400">{selectedChannels.length} channels</p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">Channels &amp; Devices</h2>
            {selectedChannels.length === 0 ? (
              <p className="text-xs text-zinc-400">No channels selected yet.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {selectedChannels.map((channel) => (
                  <li key={channel.id} className="flex items-center gap-2.5">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${categoryBadgeColor[channel.category]}`}
                    >
                      <span className="h-4 w-4">{categoryIcon[channel.category]}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900">{channel.name}</p>
                      <p className="truncate text-xs text-zinc-400">{channel.subLabel}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900">Publication Summary</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500">Campaign</dt>
                <dd className="font-medium text-zinc-900">{campaign?.name ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500">Publication Type</dt>
                <dd className="flex items-center gap-1.5 font-medium text-zinc-900">
                  <span className="h-4 w-4 text-zinc-500">
                    {type && publicationTypeIcons[type.id]}
                  </span>
                  {type?.label}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500">Content</dt>
                <dd className="max-w-[180px] truncate font-medium text-zinc-900 text-right" title={selectedAsset?.file?.original_filename ?? selectedAsset?.title ?? selectedAsset?.id}>
                  {selectedAsset ? selectedAsset.file?.original_filename ?? selectedAsset.title ?? selectedAsset.id : "—"}{assetItems.length > 1 ? ` +${assetItems.length - 1} more` : ""}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500">Channels</dt>
                <dd className="font-medium text-zinc-900">{selectedChannels.length} channels</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500">Schedule</dt>
                <dd className="text-right font-medium text-zinc-900">
                  {formatShortDate(displayStartDate)}, {displayStartTime}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500 font-medium">Conflicts</dt>
                <dd className="text-right font-medium">
                  {conflicts.length === 0 ? (
                    <span className="text-zinc-900">None</span>
                  ) : (
                    <span className="text-amber-600">{conflicts.length} publication(s)</span>
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500">Priority</dt>
                <dd className="flex items-center gap-1.5 font-medium text-zinc-900">
                  <span className={`h-2 w-2 rounded-full ${priority?.color}`} />
                  {priority?.label}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="shrink-0 text-zinc-500">Tags</dt>
                <dd className="text-right font-medium text-zinc-900">
                  {basicInfo.tags.join(", ") || "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500">Language</dt>
                <dd className="font-medium text-zinc-900">{basicInfo.language}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
