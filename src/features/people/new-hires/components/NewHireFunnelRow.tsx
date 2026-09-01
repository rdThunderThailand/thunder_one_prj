import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, CheckCircleIcon, ClipboardIcon, HourglassIcon, UsersIcon } from "@/components/ui/icons";
import { newHireFunnelStats, type NewHireStatus } from "../mock-data";

const iconFor: Record<NewHireStatus, ReactNode> = {
  "pre-boarding": <ClipboardIcon className="h-5 w-5" />,
  onboarding: <HourglassIcon className="h-5 w-5" />,
  "ready-to-work": <CheckCircleIcon className="h-5 w-5" />,
  active: <UsersIcon className="h-5 w-5" />,
};

const toneFor: Record<NewHireStatus, string> = {
  "pre-boarding": "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  onboarding: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  "ready-to-work": "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
  active: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
};

// "ภาพรวมขั้นตอนการเข้าใหม่ทั้งหมด" — the 4-stage funnel header strip.
// Counts are the mockup's own static header numbers (see mock-data.ts's
// header comment) — same "not derived from rows" discipline as every other
// people/* stat row.
export function NewHireFunnelRow() {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">ภาพรวมขั้นตอนการเข้าใหม่ทั้งหมด</h2>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        {newHireFunnelStats.map((stat, i) => (
          <div key={stat.id} className="flex flex-1 items-center gap-3">
            <div className="flex flex-1 items-center gap-3 rounded-xl border border-zinc-100 p-3 dark:border-zinc-800">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneFor[stat.id]}`}>
                {iconFor[stat.id]}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{stat.label}</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {stat.count} <span className="text-xs font-normal text-zinc-400">คน</span>
                </p>
                <p className="truncate text-xs text-zinc-400">{stat.sublabel}</p>
                <span title="ยังไม่เปิดใช้งาน" className="mt-0.5 inline-block cursor-not-allowed text-xs font-medium text-indigo-400">
                  ดูรายละเอียด
                </span>
              </div>
            </div>
            {i < newHireFunnelStats.length - 1 && (
              <ArrowRightIcon className="hidden h-4 w-4 shrink-0 text-zinc-300 sm:block dark:text-zinc-700" />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
