"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CheckCircleIcon, UsersIcon, XIcon } from "@/components/ui/icons";
import { departureRows, type OffboardingStep } from "../mock-data";
import { departureStatusBadge } from "./DepartureTable";

const DETAIL_TABS = ["ภาพรวม", "ขั้นตอน", "รายละเอียด", "เอกสาร"] as const;

interface DepartureDetailPanelProps {
  selectedId: string | null;
  onClose: () => void;
}

function StepMarker({ state }: { state: OffboardingStep["state"] }) {
  if (state === "done") return <CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-500" />;
  if (state === "current") {
    return <span className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-blue-500" />;
  }
  return <span className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-zinc-300 dark:border-zinc-700" />;
}

// The "เสร็จสิ้น X จาก 10" line is computed from `steps` here rather than
// stored in mock-data.ts — same fix as people/new-hires's NewHireDetailPanel,
// since the mockup's own summary text (6/10) didn't match its own itemized
// checklist (3 checked + 1 current).
export function DepartureDetailPanel({ selectedId, onClose }: DepartureDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<(typeof DETAIL_TABS)[number]>(DETAIL_TABS[0]);
  const departure = selectedId ? departureRows.find((row) => row.id === selectedId) : null;

  if (!departure) {
    return (
      <Card className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 p-8 text-center">
        <UsersIcon className="h-6 w-6 text-zinc-300" />
        <p className="text-sm text-zinc-400">เลือกพนักงานเพื่อดูรายละเอียดการออกจากองค์กร</p>
      </Card>
    );
  }

  const doneCount = departure.steps.filter((step) => step.state === "done").length;
  const remainingCount = departure.steps.length - doneCount;
  const badge = departureStatusBadge[departure.status];

  return (
    <Card className="flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={departure.name} size={40} />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">{departure.name}</p>
            <p className="truncate text-xs text-zinc-400">{departure.employeeCode}</p>
            <Badge variant="pill" color={badge.color} className="mt-1.5">
              {badge.label}
            </Badge>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
        {departure.position} | {departure.unit}
      </p>
      {departure.exitDateLabel && (
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          วันที่ออก: {departure.exitDateLabel} ({departure.daysLeftLabel})
        </p>
      )}
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        สาเหตุ: {departure.exitTypeLabel} ({departure.exitTypeSubLabel})
      </p>

      <div className="mt-4 flex items-center gap-3 overflow-x-auto border-b border-zinc-100 text-sm dark:border-zinc-800">
        {DETAIL_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 border-b-2 px-0.5 pb-2 font-medium transition-colors ${
              activeTab === tab
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab !== DETAIL_TABS[0] ? (
        <div className="flex flex-1 items-center justify-center py-10 text-center text-sm text-zinc-400">
          ยังไม่มีข้อมูลสำหรับแท็บนี้
        </div>
      ) : (
        <>
          <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">ความคืบหน้ารวม</h3>
            <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{departure.progress ?? 0}%</p>
            <ProgressBar value={departure.progress ?? 0} className="mt-2" />
            <div className="mt-1.5 flex items-center justify-between text-xs text-zinc-400">
              <span>
                เสร็จสิ้น {doneCount} จาก {departure.steps.length} ขั้นตอน
              </span>
              <span>อีก {remainingCount} ขั้นตอน</span>
            </div>
          </div>

          <div className="mt-4 flex-1 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">ขั้นตอน Offboarding</h3>
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {departure.steps.map((step, index) => (
                <li key={step.label} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-zinc-700 dark:text-zinc-200">
                    <StepMarker state={step.state} />
                    <span className="truncate">
                      {index + 1}. {step.label}
                    </span>
                  </span>
                  {step.dateLabel && <span className="shrink-0 text-xs text-zinc-400">{step.dateLabel}</span>}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <span
              title="Not built yet"
              className="flex cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-zinc-200 py-2 text-sm font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
            >
              ดูรายละเอียดทั้งหมด
            </span>
            <span
              title="Not built yet"
              className="flex cursor-not-allowed items-center justify-center gap-1.5 rounded-lg bg-indigo-300 py-2 text-sm font-medium text-white dark:bg-indigo-500/40"
            >
              ดำเนินการขั้นตอนถัดไป
            </span>
          </div>
        </>
      )}
    </Card>
  );
}
