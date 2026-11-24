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
  "pre-boarding": "bg-muted text-muted-foreground",
  onboarding: "bg-info-muted text-t1-blue-700",
  "ready-to-work": "bg-accent text-primary",
  active: "bg-success-muted text-t1-green-700",
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
      <h2 className="mb-3 text-sm font-semibold text-foreground">ภาพรวมขั้นตอนการเข้าใหม่ทั้งหมด</h2>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        {STAGES.map((stage, i) => {
          const count = rows.filter((row) => row.status === stage.id).length;
          return (
            <div key={stage.id} className="flex flex-1 items-center gap-3">
              <div className="flex flex-1 items-center gap-3 rounded-xl border border-border p-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneFor[stage.id]}`}>
                  {iconFor[stage.id]}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{stage.label}</p>
                  <p className="text-lg font-semibold text-foreground">
                    {count} <span className="text-xs font-normal text-t1-gray-400">คน</span>
                  </p>
                  <p className="truncate text-xs text-t1-gray-400">{stage.sublabel}</p>
                  <span title="ยังไม่เปิดใช้งาน" className="mt-0.5 inline-block cursor-not-allowed text-xs font-medium text-primary">
                    ดูรายละเอียด
                  </span>
                </div>
              </div>
              {i < STAGES.length - 1 && (
                <ArrowRightIcon className="hidden h-4 w-4 shrink-0 text-t1-gray-400 sm:block" />
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
