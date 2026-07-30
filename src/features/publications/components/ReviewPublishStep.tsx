"use client";

import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { CheckCircleIcon, WarningTriangleIcon } from "@/components/ui/icons";
import {
  assetLibrary,
  campaigns,
  channels,
  createdByMeta,
  priorities,
  prePublishChecklist,
  publicationTypes,
  scheduleTypes,
} from "../mock-data";
import { publicationTypeIcons } from "./publicationTypeIcons";
import { categoryBadgeColor, categoryIcon } from "./ChannelCard";
import { MiniCalendar } from "./MiniCalendar";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";

function formatShortDate(iso: string) {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
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

export function ReviewPublishStep() {
  const basicInfo = usePublicationDraftStore((s) => s.basicInfo);
  const channelIds = usePublicationDraftStore((s) => s.channelIds);
  const scheduleState = usePublicationDraftStore((s) => s.scheduleState);
  const assetId = usePublicationDraftStore((s) => s.assetId);

  const selectedChannels = channels.filter((c) => channelIds.includes(c.id));
  const selectedAsset = assetLibrary.find((a) => a.id === assetId);
  const campaign = campaigns.find((c) => c.id === basicInfo.campaignId);
  const type = publicationTypes.find((t) => t.id === basicInfo.publicationType);
  const priority = priorities.find((p) => p.id === basicInfo.priorityId);
  const scheduleType = scheduleTypes.find((s) => s.id === scheduleState.scheduleType);
  const offlineChannels = selectedChannels.filter((c) => c.status === "offline");

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
              <div
                className={`flex aspect-square w-32 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${
                  selectedAsset?.accent ?? "from-zinc-100 to-zinc-200"
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                  {basicInfo.name}
                  <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">v.1</span>
                </p>
                <dl className="mt-2 space-y-1.5 text-xs">
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 text-zinc-400">Campaign</dt>
                    <dd className="text-zinc-700">{campaign?.name}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 text-zinc-400">Content Type</dt>
                    <dd className="flex items-center gap-1 text-zinc-700">
                      <span className="h-3.5 w-3.5">{type && publicationTypeIcons[type.id]}</span>
                      {type?.label}
                    </dd>
                  </div>
                  {selectedAsset && (
                    <>
                      <div className="flex gap-2">
                        <dt className="w-20 shrink-0 text-zinc-400">File</dt>
                        <dd className="text-zinc-700">
                          {selectedAsset.filename}
                          <span className="block text-zinc-400">
                            {selectedAsset.dimensions}
                            {selectedAsset.durationLabel ? ` · ${selectedAsset.durationLabel}` : ""}
                          </span>
                        </dd>
                      </div>
                    </>
                  )}
                </dl>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Avatar name={createdByMeta.name} size={20} />
                Created by {createdByMeta.name} · {createdByMeta.createdAt}
              </span>
              <span>Last updated {createdByMeta.updatedAt}</span>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">
              Device Preview ({selectedChannels.length} {selectedChannels.length === 1 ? "Device" : "Devices"})
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
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                  Passed All Checks
                </span>
              </div>
              <ul className="flex flex-col gap-2">
                {prePublishChecklist.map((item) => (
                  <li key={item} className="flex items-center justify-between gap-2 text-xs text-zinc-600">
                    <span>{item}</span>
                    <CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-500" />
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-zinc-900">Conflicts &amp; Warnings</h2>
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-2">
                  <CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-500" />
                  <div>
                    <p className="text-xs font-medium text-zinc-900">No Schedule Conflicts</p>
                    <p className="text-[11px] text-zinc-400">ไม่มีความขัดแย้งของตารางเวลา</p>
                  </div>
                </div>
                {offlineChannels.length > 0 ? (
                  <div className="flex items-start gap-2">
                    <WarningTriangleIcon className="h-4 w-4 shrink-0 text-amber-500" />
                    <div>
                      <p className="text-xs font-medium text-zinc-900">Device Offline ({offlineChannels.length})</p>
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
                  {formatShortDate(scheduleState.publishDate)}, {scheduleState.publishTime}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-400">End</dt>
                <dd className="font-medium text-zinc-700">
                  {scheduleState.expirationEnabled && scheduleState.expirationDate
                    ? `${formatShortDate(scheduleState.expirationDate)}, ${scheduleState.expirationTime}`
                    : "Not set"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-400">Time Zone</dt>
                <dd className="font-medium text-zinc-700">{scheduleState.timeZone}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-400">Schedule Type</dt>
                <dd className="font-medium text-zinc-700">{scheduleType?.label}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-400">Publish Order</dt>
                <dd className="font-medium text-zinc-700">
                  {scheduleState.publishOrder === "same-time"
                    ? "All channels together"
                    : `Sequential, ${scheduleState.delayValue}${scheduleState.delayUnit.charAt(0)} apart`}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900">Schedule Preview</h2>
            <MiniCalendar selectedIsoDate={scheduleState.publishDate} onSelect={() => {}} />
            {scheduleState.publishDate && (
              <div className="mt-5 border-t border-zinc-100 pt-4">
                <p className="mb-2 text-sm font-semibold text-zinc-900">{formatLongDate(scheduleState.publishDate)}</p>
                <div className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3">
                  <span className="shrink-0 text-sm font-semibold text-zinc-900">{scheduleState.publishTime}</span>
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
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${categoryBadgeColor[channel.category]}`}>
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
                <dd className="font-medium text-zinc-900">{campaign?.name}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500">Publication Type</dt>
                <dd className="flex items-center gap-1.5 font-medium text-zinc-900">
                  <span className="h-4 w-4 text-zinc-500">{type && publicationTypeIcons[type.id]}</span>
                  {type?.label}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500">Channels</dt>
                <dd className="font-medium text-zinc-900">{selectedChannels.length} channels</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500">Schedule</dt>
                <dd className="text-right font-medium text-zinc-900">
                  {formatShortDate(scheduleState.publishDate)}, {scheduleState.publishTime}
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
                <dd className="text-right font-medium text-zinc-900">{basicInfo.tags.join(", ") || "—"}</dd>
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
