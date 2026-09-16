import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { OverviewOnboardingRow, OverviewStats } from "../core-mapper";

const summaryItems: { key: keyof OverviewStats["onboardingSummary"]; label: string }[] = [
  { key: "total", label: "ทั้งหมด" },
  { key: "notStarted", label: "ยังไม่เริ่ม" },
  { key: "inProgress", label: "กำลังดำเนินการ" },
  { key: "completed", label: "เสร็จสิ้น" },
];

interface OnboardingStatusCardProps {
  /** Real since 2026-09-15 — from the same onboarding-roster fetch
   *  people/new-hires uses. "ใกล้ครบกำหนด" (dueSoon) dropped from the
   *  summary row entirely rather than shown as an always-wrong 0: Core's
   *  onboarding steps have no due-date concept at all, only `completed_at`
   *  once a step is actually done — see core-mapper.ts's own comment. Each
   *  person row's dueLabel is dropped for the same reason. */
  summary: OverviewStats["onboardingSummary"];
  rows: OverviewOnboardingRow[];
}

export function OnboardingStatusCard({ summary, rows }: OnboardingStatusCardProps) {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">สถานะ Onboarding</h2>
        <button type="button" className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          ดูทั้งหมด
        </button>
      </div>

      <dl className="mb-3 grid grid-cols-4 gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
        {summaryItems.map(({ key, label }) => (
          <div key={key}>
            <dt className="text-[11px] text-zinc-400">{label}</dt>
            <dd className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{summary[key]}</dd>
          </div>
        ))}
      </dl>

      {rows.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-center text-xs text-zinc-400">
          ไม่มีใครกำลัง Onboarding อยู่
        </p>
      ) : (
        <ul className="flex flex-1 flex-col gap-3">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center gap-3">
              <Avatar name={row.name} size={28} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{row.name}</p>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {row.role} · เริ่ม {row.startDateLabel}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <ProgressBar value={row.progress} className="flex-1" />
                  <span className="w-8 shrink-0 text-right text-xs text-zinc-400">{row.progress}%</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
