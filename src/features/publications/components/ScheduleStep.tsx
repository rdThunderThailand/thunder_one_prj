"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { CalendarIcon, ChevronDownIcon, InfoIcon, LightningIcon, RepeatIcon } from "@/components/ui/icons";
import { CARD_BY_SCHEDULE_TYPE, SCHEDULE_TYPE_BY_CARD } from "../draft-mapping";
import {
  TIMEZONES,
  WEEKDAYS,
  isScheduleFormValid,
  utcToZonedParts,
} from "../schedule";
import type { Campaign, MediaAsset, ScheduleConflict, Screen } from "../types";
import {
  delayUnits,
  priorities,
  publicationTypes,
  scheduleTypes,
  type ScheduleTypeId,
} from "../mock-data";
import { publicationTypeIcons } from "./publicationTypeIcons";
import { MiniCalendar } from "./MiniCalendar";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { usePlaylistPreview } from "../hooks/usePlaylistPreview";

const scheduleTypeIcon: Record<ScheduleTypeId, ReactNode> = {
  "publish-now": <LightningIcon />,
  "schedule-later": <CalendarIcon />,
  recurring: <RepeatIcon />,
  "custom-range": <CalendarIcon />,
};

function formatLongDate(iso: string) {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(iso: string) {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export interface ScheduleStepProps {
  campaigns?: Campaign[];
  screens?: Screen[];
  assets?: MediaAsset[];
  conflicts?: ScheduleConflict[];
  checkingConflicts?: boolean;
  conflictsError?: string | null;
}

export function ScheduleStep({
  campaigns = [],
  screens = [],
  assets = [],
  conflicts = [],
  checkingConflicts = false,
  conflictsError = null,
}: ScheduleStepProps) {
  const basicInfo = usePublicationDraftStore((s) => s.basicInfo);
  const assetItems = usePublicationDraftStore((s) => s.assetItems);
  const playlistId = usePublicationDraftStore((s) => s.playlistId);
  const channelIds = usePublicationDraftStore((s) => s.channelIds);
  const scheduleForm = usePublicationDraftStore((s) => s.scheduleForm);
  const setScheduleForm = usePublicationDraftStore((s) => s.setScheduleForm);
  const [advancedOpen, setAdvancedOpen] = useState(true);

  const patch = (next: Partial<typeof scheduleForm>) =>
    setScheduleForm({ ...scheduleForm, ...next });

  const isValidSchedule = isScheduleFormValid(scheduleForm);
  const nowZoned = utcToZonedParts(new Date().toISOString(), scheduleForm.timezone);

  const isPlaylist = basicInfo.publicationType === "playlist";
  const { playlist, coverAssetId: playlistCoverId, durationLabel: playlistDuration } =
    usePlaylistPreview(playlistId, isPlaylist);

  const selectedAsset = assets.find((a) => a.id === assetItems[0]?.media_asset_id);
  const previewAssetId = isPlaylist ? playlistCoverId : selectedAsset?.id;
  const previews = usePreviewUrls(previewAssetId ? [previewAssetId] : []);
  const previewUrl = previewAssetId ? previews.urls[previewAssetId] : undefined;

  const isVideo =
    !isPlaylist &&
    (selectedAsset?.kind === "video" ||
      selectedAsset?.file?.mime_type?.startsWith("video/"));

  const isMismatch =
    selectedAsset &&
    ((basicInfo.publicationType === "image" && isVideo) ||
      (basicInfo.publicationType === "video" && selectedAsset.kind === "image"));

  const selectedChannelsCount =
    screens.length > 0
      ? screens.filter((s) => channelIds.includes(s.id)).length
      : channelIds.length;
  const campaign = campaigns.find((c) => c.id === basicInfo.campaignId);
  const type = publicationTypes.find((t) => t.id === basicInfo.publicationType);
  const priority = priorities.find((p) => p.id === basicInfo.priorityId);

  const hasExpiration = Boolean(scheduleForm.end_date);

  const toggleDay = (val: number) => {
    const next = scheduleForm.days.includes(val)
      ? scheduleForm.days.filter((d) => d !== val)
      : [...scheduleForm.days, val].sort((a, b) => a - b);
    patch({ days: next });
  };

  const handleExpirationToggle = (checked: boolean) => {
    if (checked) {
      patch({
        end_date: scheduleForm.end_date || nowZoned.date,
        end_time: scheduleForm.end_time || "23:59",
      });
    } else {
      patch({ end_date: "", end_time: "" });
    }
  };

  const activeCardId = CARD_BY_SCHEDULE_TYPE[scheduleForm.schedule_type];

  // Helper values for displaying date/time in summary
  const displayStartDate =
    scheduleForm.schedule_type === "now" ? nowZoned.date : scheduleForm.start_date;
  const displayStartTime =
    scheduleForm.schedule_type === "now" ? nowZoned.time : scheduleForm.start_time;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Schedule Settings</h1>
        <p className="mt-0.5 text-sm text-zinc-500">ตั้งกำหนดการเผยแพร่</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5">
          <p className="mb-2 text-sm font-medium text-zinc-700">Schedule Type</p>
          <div className="grid grid-cols-2 gap-2.5">
            {scheduleTypes.map((option) => {
              const active = activeCardId === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    patch({ schedule_type: SCHEDULE_TYPE_BY_CARD[option.id] });
                  }}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors ${
                    active
                      ? "border-indigo-400 bg-indigo-50 ring-1 ring-indigo-400"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <span className={`h-5 w-5 ${active ? "text-indigo-600" : "text-zinc-400"}`}>
                    {scheduleTypeIcon[option.id]}
                  </span>
                  <span className="text-xs font-semibold text-zinc-900">{option.label}</span>
                  <span className="text-[11px] text-zinc-400">{option.sublabel}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              Publish Date &amp; Time
            </label>
            {scheduleForm.schedule_type === "now" ? (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="date"
                    disabled
                    value={nowZoned.date}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-400 outline-none cursor-not-allowed"
                  />
                  <input
                    type="time"
                    disabled
                    value={nowZoned.time}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-400 outline-none cursor-not-allowed"
                  />
                </div>
                <p className="mt-1.5 text-xs text-zinc-500">Publishes immediately once activated.</p>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="date"
                  value={scheduleForm.start_date}
                  onChange={(e) => patch({ start_date: e.target.value })}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                />
                <input
                  type="time"
                  value={scheduleForm.start_time}
                  onChange={(e) => patch({ start_time: e.target.value })}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            )}
            {!isValidSchedule && (
              <p className="mt-1.5 text-xs text-amber-600">
                Please enter a valid start date, time, and expiration range.
              </p>
            )}
          </div>

          {scheduleForm.schedule_type === "range" && (
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                End Date &amp; Time
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="date"
                  value={scheduleForm.end_date}
                  onChange={(e) => patch({ end_date: e.target.value })}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                />
                <input
                  type="time"
                  value={scheduleForm.end_time}
                  onChange={(e) => patch({ end_time: e.target.value })}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>
          )}

          {scheduleForm.schedule_type === "recurring" && (
            <>
              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  End Date &amp; Time
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="date"
                    value={scheduleForm.end_date}
                    onChange={(e) => patch({ end_date: e.target.value })}
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <input
                    type="time"
                    value={scheduleForm.end_time}
                    onChange={(e) => patch({ end_time: e.target.value })}
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">Repeat On</label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((w) => {
                    const isSelected = scheduleForm.days.includes(w.value);
                    return (
                      <button
                        key={w.value}
                        type="button"
                        onClick={() => toggleDay(w.value)}
                        className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                            : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                        }`}
                      >
                        {w.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">Daily Window</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="time"
                    value={scheduleForm.daily_start}
                    onChange={(e) => patch({ daily_start: e.target.value })}
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <input
                    type="time"
                    value={scheduleForm.daily_end}
                    onChange={(e) => patch({ daily_end: e.target.value })}
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
                <p className="mt-1.5 text-xs text-zinc-500">
                  Plays on the selected weekdays, within this daily time window, across the date range above.
                </p>
              </div>
            </>
          )}

          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">Time Zone</label>
            <div className="relative">
              <select
                value={scheduleForm.timezone}
                onChange={(e) => patch({ timezone: e.target.value })}
                className="w-full appearance-none rounded-lg border border-zinc-200 bg-white py-2 pl-3 pr-8 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.id} value={tz.id}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            </div>
          </div>

          {(scheduleForm.schedule_type === "now" || scheduleForm.schedule_type === "later") && (
            <div className="mt-4">
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-zinc-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasExpiration}
                  onChange={(e) => handleExpirationToggle(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                Expiration <span className="text-zinc-400">(Optional)</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="date"
                  disabled={!hasExpiration}
                  value={scheduleForm.end_date}
                  onChange={(e) => patch({ end_date: e.target.value })}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400"
                />
                <input
                  type="time"
                  disabled={!hasExpiration}
                  value={scheduleForm.end_time}
                  onChange={(e) => patch({ end_time: e.target.value })}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400"
                />
              </div>
            </div>
          )}

          <div className="mt-4 border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              className="flex w-full items-center justify-between text-sm font-medium text-zinc-900"
            >
              Advanced Options
              <ChevronDownIcon
                className={`h-4 w-4 text-zinc-400 transition-transform ${advancedOpen ? "rotate-180" : ""}`}
              />
            </button>
            {advancedOpen && (
              <div className="mt-3 flex flex-col gap-4">
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-zinc-700">
                    Publish Order
                    <span title="Choose whether channels go live together or one after another">
                      <InfoIcon className="h-3.5 w-3.5 text-zinc-400" />
                    </span>
                  </p>
                  <div className="flex flex-col gap-2">
                    <label
                      title="Not built yet"
                      className="flex items-center gap-2 text-sm text-zinc-400 cursor-not-allowed"
                    >
                      <input
                        type="radio"
                        disabled
                        checked
                        title="Not built yet"
                        readOnly
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      Publish to all channels at the same time
                    </label>
                    <label
                      title="Not built yet"
                      className="flex items-center gap-2 text-sm text-zinc-400 cursor-not-allowed"
                    >
                      <input
                        type="radio"
                        disabled
                        checked={false}
                        title="Not built yet"
                        readOnly
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      Publish to channels in sequence
                    </label>
                  </div>
                </div>
                <div className="opacity-50">
                  <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-zinc-700">
                    Delay between channels
                    <span title="Wait time before each next channel goes live">
                      <InfoIcon className="h-3.5 w-3.5 text-zinc-400" />
                    </span>
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      disabled
                      title="Not built yet"
                      defaultValue={10}
                      className="w-20 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none cursor-not-allowed bg-zinc-50"
                    />
                    <div className="relative flex-1">
                      <select
                        disabled
                        title="Not built yet"
                        defaultValue="seconds"
                        className="w-full appearance-none rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-3 pr-8 text-sm text-zinc-900 outline-none cursor-not-allowed"
                      >
                        {delayUnits.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                      <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-lg bg-indigo-50 p-3 text-xs text-indigo-700">
            <InfoIcon className="h-4 w-4 shrink-0" />
            Your publication will be scheduled to all selected channels as shown in the preview.
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-1 text-base font-semibold text-zinc-900">Schedule Preview</h2>
          <p className="mb-4 text-sm text-zinc-500">ตัวอย่างกำหนดการ</p>
          <MiniCalendar
            form={scheduleForm}
            conflicts={conflicts}
            onSelectDate={
              scheduleForm.schedule_type !== "now"
                ? (ymd) => patch({ start_date: ymd })
                : undefined
            }
          />
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
                  <p className="text-xs text-zinc-400">{selectedChannelsCount} channels</p>
                </div>
              </div>
            </div>
          )}

          {checkingConflicts && (
            <p className="mt-4 text-xs text-zinc-400">กำลังตรวจสอบความขัดแย้งของตารางเผยแพร่…</p>
          )}

          {!checkingConflicts && conflictsError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
              <h4 className="text-sm font-semibold text-red-800">⚠ Unable to verify schedule conflicts</h4>
              <p className="mt-0.5 text-[11px] text-red-700">{conflictsError} — Publish is blocked until this resolves.</p>
            </div>
          )}

          {conflicts.length > 0 && (() => {
            const suppressedCount = conflicts.filter((c) => c.would_be_suppressed).length;
            return (
              <div
                className={`mt-4 rounded-xl border p-4 ${
                  suppressedCount > 0
                    ? "border-red-200 bg-red-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <h4 className={`text-sm font-semibold ${suppressedCount > 0 ? "text-red-800" : "text-amber-800"}`}>
                  {suppressedCount > 0
                    ? `⛔ Will not air — ${suppressedCount} higher-priority publication(s) overlap`
                    : `⚠ Schedule conflict — ${conflicts.length} publication(s) overlap`}
                </h4>
                <p className={`mt-0.5 text-[11px] ${suppressedCount > 0 ? "text-red-700" : "text-amber-700"}`}>
                  {suppressedCount > 0
                    ? "During the overlap this publication won't play at all (priority override) — publishing is still allowed"
                    : "Warning only (publishing is still allowed)"}
                </p>
                <div className={`mt-3 space-y-2 text-xs ${suppressedCount > 0 ? "text-red-900" : "text-amber-900"}`}>
                  {conflicts.map((c) => {
                    const startStr = new Date(c.starts_at).toLocaleString();
                    const endStr = c.ends_at ? new Date(c.ends_at).toLocaleString() : "no end";
                    return (
                      <div
                        key={c.publication_id}
                        className={`border-t pt-2 first:border-0 first:pt-0 ${
                          suppressedCount > 0 ? "border-red-200/60" : "border-amber-200/60"
                        }`}
                      >
                        <div className="font-medium">
                          {c.name}
                          <span className="ml-1.5 font-normal opacity-70">({c.priority})</span>
                        </div>
                        {c.would_be_suppressed && (
                          <div className="text-[11px] font-medium">This publication is suppressed during the overlap</div>
                        )}
                        {c.would_suppress && (
                          <div className="text-[11px] font-medium opacity-90">This publication suppresses {c.name} during the overlap</div>
                        )}
                        <div className="text-[11px] opacity-90">
                          Window: {startStr} – {endStr}
                        </div>
                        {c.screens.length > 0 && (
                          <div className="text-[11px] opacity-80">
                            Screens: {c.screens.join(", ")}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-zinc-900">Publication Summary</h2>
          {(selectedAsset || isPlaylist) && previewUrl ? (
            <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-zinc-100">
              {isVideo ? (
                <video
                  src={previewUrl}
                  controls
                  preload="metadata"
                  className="h-full w-full object-contain"
                />
              ) : (
                <Image
                  src={previewUrl}
                  alt={selectedAsset?.title ?? playlist?.name ?? "Preview"}
                  fill
                  sizes="(min-width: 1024px) 480px, 100vw"
                  className="object-cover"
                />
              )}
            </div>
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 text-zinc-400">
              <p className="text-xs">Content preview will appear here</p>
            </div>
          )}

          <dl className="mt-5 space-y-3 border-t border-zinc-100 pt-4 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-zinc-500">Campaign</dt>
              <dd className="font-medium text-zinc-900">{campaign?.name ?? "—"}</dd>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500">Publication Type</dt>
                <dd className="flex items-center gap-1.5 font-medium text-zinc-900">
                  <span className="h-4 w-4 text-zinc-500">
                    {type && publicationTypeIcons[type.id]}
                  </span>
                  {type?.label}
                </dd>
              </div>
              {isMismatch && (
                <p className="mt-1 text-xs text-amber-600 text-right">
                  Selected asset is a {selectedAsset?.kind} while publication type is {basicInfo.publicationType}.
                </p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-zinc-500">Content</dt>
              <dd className="max-w-[180px] truncate font-medium text-zinc-900 text-right" title={isPlaylist ? playlist?.name : selectedAsset?.file?.original_filename ?? selectedAsset?.title ?? selectedAsset?.id}>
                {isPlaylist
                  ? playlist
                    ? `${playlist.name}${playlistDuration ? ` (${playlistDuration})` : ""}`
                    : "—"
                  : selectedAsset
                  ? selectedAsset.file?.original_filename ?? selectedAsset.title ?? selectedAsset.id
                  : "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-zinc-500">Channels</dt>
              <dd className="font-medium text-zinc-900">{selectedChannelsCount} channels</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-zinc-500">Schedule</dt>
              <dd className="text-right font-medium text-zinc-900">
                {formatShortDate(displayStartDate)}, {displayStartTime}
                <span className="block text-xs font-normal text-zinc-400">
                  {scheduleForm.timezone}
                </span>
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-zinc-500">Expiration</dt>
              <dd className="font-medium text-zinc-900">
                {scheduleForm.end_date ? formatShortDate(scheduleForm.end_date) : "Not set"}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-zinc-500 font-medium">Conflicts</dt>
              <dd className="text-right font-medium">
                {conflictsError ? (
                  <span className="text-red-600">Unknown/Error</span>
                ) : conflicts.length === 0 ? (
                  <span className="text-zinc-900">None</span>
                ) : (
                  <div>
                    <span className="text-amber-600">{conflicts.length} publication(s)</span>
                    <span className="block text-xs font-normal text-amber-700 truncate max-w-[180px]">
                      {conflicts.map((c) => c.name).join(", ")}
                    </span>
                  </div>
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
  );
}
