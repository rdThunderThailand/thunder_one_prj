import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, CheckCircleIcon, ClipboardIcon, HourglassIcon, UsersIcon } from "@/components/ui/icons";
import type { NewHireRow, NewHireStatus } from "../mock-data";

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

const STAGES: { id: NewHireStatus; label: string; sublabel: string }[] = [
  { id: "pre-boarding", label: "Pre-boarding", sublabel: "รอเริ่มงาน / เอกสาร" },
  { id: "onboarding", label: "Onboarding", sublabel: "กำลังดำเนินการ" },
  { id: "ready-to-work", label: "Ready to Work", sublabel: "ให้พร้อมเริ่มงาน" },
  { id: "active", label: "Active", sublabel: "เริ่มงานแล้ว" },
];

interface NewHireFunnelRowProps {
  /** Real since 2026-09-15 — counts computed from the same fetched roster
   *  NewHireKanbanBoard renders, not a separate mock header number anymore
   *  (previously 32/6/3/18, static, never matching `newHireRows`' own
   *  sample size). */
  rows: NewHireRow[];
}

// "ภาพรวมขั้นตอนการเข้าใหม่ทั้งหมด" — the 4-stage funnel header strip.
export function NewHireFunnelRow({ rows }: NewHireFunnelRowProps) {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">ภาพรวมขั้นตอนการเข้าใหม่ทั้งหมด</h2>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        {STAGES.map((stage, i) => {
          const count = rows.filter((row) => row.status === stage.id).length;
          return (
            <div key={stage.id} className="flex flex-1 items-center gap-3">
              <div className="flex flex-1 items-center gap-3 rounded-xl border border-zinc-100 p-3 dark:border-zinc-800">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneFor[stage.id]}`}>
                  {iconFor[stage.id]}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{stage.label}</p>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {count} <span className="text-xs font-normal text-zinc-400">คน</span>
                  </p>
                  <p className="truncate text-xs text-zinc-400">{stage.sublabel}</p>
                  <span title="ยังไม่เปิดใช้งาน" className="mt-0.5 inline-block cursor-not-allowed text-xs font-medium text-indigo-400">
                    ดูรายละเอียด
                  </span>
                </div>
              </div>
              {i < STAGES.length - 1 && (
                <ArrowRightIcon className="hidden h-4 w-4 shrink-0 text-zinc-300 sm:block dark:text-zinc-700" />
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
