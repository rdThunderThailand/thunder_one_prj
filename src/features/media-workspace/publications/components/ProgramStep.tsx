"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { ChevronDownIcon } from "@/components/ui/icons";
import type { MediaAsset, ScheduleConflict } from "../types";
import type { ChannelListItem } from "../../channels/types";
import { priorities } from "../mock-data";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";
import { HowToPlayPanel } from "./HowToPlayPanel";
import { ScheduleStep } from "./ScheduleStep";
import { WhereToPlayPanel } from "./WhereToPlayPanel";

// ponytail: the Program Summary rail lands in Task 6 — the grid widens to `…_19rem` then.

export interface ProgramStepProps {
  channels: ChannelListItem[];
  loadingChannels: boolean;
  channelsError: string | null;
  aspectRatio: string | null;
  fitCheckFailed: boolean;
  assets: MediaAsset[];
  conflicts: ScheduleConflict[];
  checkingConflicts: boolean;
  conflictsError: string | null;
  showFieldErrors: boolean;
}

export function ProgramStep({
  channels,
  loadingChannels,
  channelsError,
  aspectRatio,
  fitCheckFailed,
  assets,
  conflicts,
  checkingConflicts,
  conflictsError,
  showFieldErrors,
}: ProgramStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Step 3 — Program</h1>
          <p className="mt-0.5 text-sm text-zinc-500">กำหนดที่ / เวลา / วิธีเล่น</p>
        </div>
        <DisabledControl label="Load from Template" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ProgramColumn index={1} title="Where to Play" subtitle="เลือกช่องทาง / หน้าจอ">
          <WhereToPlayPanel
            channels={channels}
            loadingChannels={loadingChannels}
            channelsError={channelsError}
            aspectRatio={aspectRatio}
            fitCheckFailed={fitCheckFailed}
          />
        </ProgramColumn>

        <ProgramColumn index={2} title="When to Play" subtitle="กำหนดช่วงเวลา">
          <ScheduleStep
            conflicts={conflicts}
            checkingConflicts={checkingConflicts}
            conflictsError={conflictsError}
            showErrors={showFieldErrors}
          />
        </ProgramColumn>

        <ProgramColumn index={3} title="How to Play" subtitle="ตั้งค่าการเล่น">
          <HowToPlayPanel assets={assets} />
        </ProgramColumn>
      </div>

      <AdditionalSettings />
    </div>
  );
}

function ProgramColumn({
  index,
  title,
  subtitle,
  children,
}: {
  index: number;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-baseline gap-2 border-b border-zinc-100 pb-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600">
          {index}
        </span>
        <div>
          <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
          <p className="text-xs text-zinc-400">{subtitle}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}

/** Priority lived on step 2 (Frame 2) deliberately; ver02 moves it here. `basicInfo.priorityId`
 *  is unchanged — only the control's home moves. */
function AdditionalSettings() {
  const basicInfo = usePublicationDraftStore((s) => s.basicInfo);
  const setBasicInfo = usePublicationDraftStore((s) => s.setBasicInfo);
  const priorityId = basicInfo.priorityId;

  return (
    <Card className="p-5">
      <h2 className="text-base font-semibold text-zinc-900">
        Additional Settings <span className="text-sm font-normal text-zinc-400">(optional)</span>
      </h2>
      <p className="mt-0.5 text-xs text-zinc-400">ตั้งค่าเพิ่มเติม</p>

      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700">Priority</label>
          <p className="text-xs text-zinc-400">ตั้งลำดับความสำคัญของการเล่น (สำหรับกรณีเนื้อหาทับกัน)</p>
          <div className="relative">
            <span
              className={`pointer-events-none absolute left-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${
                priorities.find((p) => p.id === priorityId)?.color ?? "bg-emerald-500"
              }`}
            />
            <select
              value={priorityId}
              onChange={(e) => setBasicInfo({ ...basicInfo, priorityId: e.target.value })}
              className="w-full appearance-none rounded-lg border border-zinc-200 bg-white py-2.5 pl-7 pr-9 text-sm text-zinc-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            >
              {priorities.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 opacity-60">
          <label className="text-sm font-medium text-zinc-700">
            Playback Behaviour when offline
          </label>
          <p className="text-xs text-zinc-400">ยังไม่เปิดใช้งาน</p>
          <div className="mt-1 flex flex-col gap-2">
            {[
              ["Play last cached content", "เล่นเนื้อหาล่าสุดที่แคชไว้"],
              ["Show offline message", "แสดงข้อความเมื่อออฟไลน์"],
              ["Do nothing", "ไม่ทำอะไร"],
            ].map(([label, sublabel], i) => (
              <label
                key={label}
                title="ยังไม่เปิดใช้งาน"
                className="flex cursor-not-allowed items-start gap-2 text-sm text-zinc-400"
              >
                <input
                  type="radio"
                  name="offline-behaviour"
                  disabled
                  checked={i === 0}
                  readOnly
                  className="mt-0.5 h-4 w-4"
                />
                <span>
                  {label}
                  <span className="block text-xs text-zinc-300">{sublabel}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

/** DISABLED, not built yet — precedent `ScheduleStep.tsx` advanced-options block. */
function DisabledControl({ label }: { label: string }) {
  return (
    <button
      type="button"
      disabled
      title="ยังไม่เปิดใช้งาน"
      className="flex shrink-0 cursor-not-allowed items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-400"
    >
      {label}
      <ChevronDownIcon className="h-4 w-4" />
    </button>
  );
}
