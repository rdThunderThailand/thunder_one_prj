import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { onboardingRows, onboardingSummary } from "../mock-data";

const summaryItems: { key: keyof typeof onboardingSummary; label: string }[] = [
  { key: "total", label: "ทั้งหมด" },
  { key: "notStarted", label: "ยังไม่เริ่ม" },
  { key: "inProgress", label: "กำลังดำเนินการ" },
  { key: "dueSoon", label: "ใกล้ครบกำหนด" },
  { key: "completed", label: "เสร็จสิ้น" },
];

export function OnboardingStatusCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">สถานะ Onboarding</h2>
        <button type="button" className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          ดูทั้งหมด
        </button>
      </div>

      <dl className="mb-3 grid grid-cols-5 gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
        {summaryItems.map(({ key, label }) => (
          <div key={key}>
            <dt className="text-[11px] text-zinc-400">{label}</dt>
            <dd className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{onboardingSummary[key]}</dd>
          </div>
        ))}
      </dl>

      <ul className="flex flex-1 flex-col gap-3">
        {onboardingRows.map((row) => (
          <li key={row.id} className="flex items-center gap-3">
            <Avatar name={row.name} size={28} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{row.name}</p>
                <span className="shrink-0 text-xs text-zinc-400">{row.dueLabel}</span>
              </div>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {row.role} · {row.startDateLabel}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <ProgressBar value={row.progress} className="flex-1" />
                <span className="w-8 shrink-0 text-right text-xs text-zinc-400">{row.progress}%</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
