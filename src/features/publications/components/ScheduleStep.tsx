"use client";

import { useState, type ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { CalendarIcon, ChevronDownIcon, InfoIcon, LightningIcon, RepeatIcon } from "@/components/ui/icons";
import { scheduleStateToForm } from "../draft-mapping";
import { isScheduleFormValid } from "../schedule";
import type { Campaign, Screen } from "../types";
import {
  delayUnits,
  priorities,
  publicationTypes,
  scheduleTypes,
  timeZones,
  type ScheduleState,
  type ScheduleTypeId,
} from "../mock-data";
import { publicationTypeIcons } from "./publicationTypeIcons";
import { MiniCalendar } from "./MiniCalendar";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";

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
}

export function ScheduleStep({ campaigns = [], screens = [] }: ScheduleStepProps) {
  const basicInfo = usePublicationDraftStore((s) => s.basicInfo);
  const channelIds = usePublicationDraftStore((s) => s.channelIds);
  const scheduleState = usePublicationDraftStore((s) => s.scheduleState);
  const setScheduleState = usePublicationDraftStore((s) => s.setScheduleState);
  const [advancedOpen, setAdvancedOpen] = useState(true);

  const {
    scheduleType,
    publishDate,
    publishTime,
    timeZone,
    expirationEnabled,
    expirationDate,
    expirationTime,
    publishOrder,
    delayValue,
    delayUnit,
  } = scheduleState;

  const patch = (next: Partial<ScheduleState>) => setScheduleState({ ...scheduleState, ...next });

  const isValidSchedule = isScheduleFormValid(scheduleStateToForm(scheduleState));

  const selectedChannelsCount = screens.length > 0
    ? screens.filter((s) => channelIds.includes(s.id)).length
    : channelIds.length;
  const campaign = campaigns.find((c) => c.id === basicInfo.campaignId);
  const type = publicationTypes.find((t) => t.id === basicInfo.publicationType);
  const priority = priorities.find((p) => p.id === basicInfo.priorityId);

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
              const active = scheduleType === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={!option.enabled}
                  title={!option.enabled ? "Not built yet" : undefined}
                  onClick={() => {
                    patch({ scheduleType: option.id });
                  }}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors ${
                    !option.enabled
                      ? "cursor-not-allowed border-zinc-100 opacity-50"
                      : active
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
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">Publish Date &amp; Time</label>
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="date"
                value={publishDate}
                onChange={(e) => {
                  patch({ publishDate: e.target.value });
                }}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              />
              <input
                type="time"
                value={publishTime}
                onChange={(e) => {
                  patch({ publishTime: e.target.value });
                }}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
            {!isValidSchedule && (
              <p className="mt-1.5 text-xs text-amber-600">
                Please enter a valid start date, time, and expiration range.
              </p>
            )}
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">Time Zone</label>
            <div className="relative">
              <select
                value={timeZone}
                onChange={(e) => {
                  patch({ timeZone: e.target.value });
                }}
                className="w-full appearance-none rounded-lg border border-zinc-200 bg-white py-2 pl-3 pr-8 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              >
                {timeZones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-zinc-700">
              <input
                type="checkbox"
                checked={expirationEnabled}
                onChange={(e) => {
                  patch({ expirationEnabled: e.target.checked });
                }}
                className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
              />
              Expiration <span className="text-zinc-400">(Optional)</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="date"
                disabled={!expirationEnabled}
                value={expirationDate}
                onChange={(e) => {
                  patch({ expirationDate: e.target.value });
                }}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400"
              />
              <input
                type="time"
                disabled={!expirationEnabled}
                value={expirationTime}
                onChange={(e) => {
                  patch({ expirationTime: e.target.value });
                }}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400"
              />
            </div>
          </div>

          <div className="mt-4 border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              className="flex w-full items-center justify-between text-sm font-medium text-zinc-900"
            >
              Advanced Options
              <ChevronDownIcon className={`h-4 w-4 text-zinc-400 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
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
                    <label className="flex items-center gap-2 text-sm text-zinc-700">
                      <input
                        type="radio"
                        name="publishOrder"
                        checked={publishOrder === "same-time"}
                        onChange={() => {
                          patch({ publishOrder: "same-time" });
                        }}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      Publish to all channels at the same time
                    </label>
                    <label className="flex items-center gap-2 text-sm text-zinc-700">
                      <input
                        type="radio"
                        name="publishOrder"
                        checked={publishOrder === "sequence"}
                        onChange={() => {
                          patch({ publishOrder: "sequence" });
                        }}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      Publish to channels in sequence
                    </label>
                  </div>
                </div>
                <div className={publishOrder === "sequence" ? "" : "opacity-50"}>
                  <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-zinc-700">
                    Delay between channels
                    <span title="Wait time before each next channel goes live">
                      <InfoIcon className="h-3.5 w-3.5 text-zinc-400" />
                    </span>
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      disabled={publishOrder !== "sequence"}
                      value={delayValue}
                      onChange={(e) => {
                        patch({ delayValue: e.target.value });
                      }}
                      className="w-20 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400"
                    />
                    <div className="relative flex-1">
                      <select
                        disabled={publishOrder !== "sequence"}
                        value={delayUnit}
                        onChange={(e) => {
                          patch({ delayUnit: e.target.value });
                        }}
                        className="w-full appearance-none rounded-lg border border-zinc-200 bg-white py-2 pl-3 pr-8 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400"
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
            selectedIsoDate={publishDate}
            onSelect={(d) => {
              patch({ publishDate: d });
            }}
          />
          {publishDate && (
            <div className="mt-5 border-t border-zinc-100 pt-4">
              <p className="mb-2 text-sm font-semibold text-zinc-900">{formatLongDate(publishDate)}</p>
              <div className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3">
                <span className="shrink-0 text-sm font-semibold text-zinc-900">{publishTime}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">{basicInfo.name}</p>
                  <p className="text-xs text-zinc-400">{selectedChannelsCount} channels</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-zinc-900">Publication Summary</h2>
          <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 text-zinc-400">
            <p className="text-xs">Content preview will appear here</p>
          </div>
          <dl className="mt-5 space-y-3 border-t border-zinc-100 pt-4 text-sm">
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
              <dd className="font-medium text-zinc-900">{selectedChannelsCount} channels</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-zinc-500">Schedule</dt>
              <dd className="text-right font-medium text-zinc-900">
                {formatShortDate(publishDate)}, {publishTime}
                <span className="block text-xs font-normal text-zinc-400">{timeZone}</span>
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-zinc-500">Expiration</dt>
              <dd className="font-medium text-zinc-900">
                {expirationEnabled && expirationDate ? formatShortDate(expirationDate) : "Not set"}
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
  );
}
