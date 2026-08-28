import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CheckCircleIcon, UsersIcon, XIcon } from "@/components/ui/icons";
import type { NewHireRow, NewHireStatus } from "../mock-data";

const statusBadge: Record<NewHireStatus, { label: string; color: BadgeColor }> = {
  "in-progress": { label: "กำลังดำเนินการ", color: "blue" },
  pending: { label: "รอดำเนินการ", color: "yellow" },
  "not-started": { label: "รอการเริ่มงาน", color: "red" },
  completed: { label: "เสร็จสิ้น", color: "green" },
};

interface NewHireDetailPanelProps {
  rows: NewHireRow[];
  selectedId: string | null;
  onClose: () => void;
}

// The "เสร็จสิ้น X จาก 9 / อีก Y รายการ" line is computed from `steps` here
// rather than stored in mock-data.ts — the reference mockup's own text (6/9)
// didn't match its own itemized checklist (5 checked), so this derives the
// number from what's actually rendered instead of repeating that mismatch.
// Reads the hire from `rows` (passed by NewHiresPage) rather than importing
// newHireRows directly, so a hire added via AddEmployeeModal — client-local
// state that never touches mock-data.ts — is still found here.
export function NewHireDetailPanel({ rows, selectedId, onClose }: NewHireDetailPanelProps) {
  const hire = selectedId ? rows.find((row) => row.id === selectedId) : null;

  if (!hire) {
    return (
      <Card className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 p-8 text-center">
        <UsersIcon className="h-6 w-6 text-zinc-300" />
        <p className="text-sm text-zinc-400">เลือกพนักงานเพื่อดูรายละเอียด Onboarding</p>
      </Card>
    );
  }

  const doneCount = hire.steps.filter((step) => step.done).length;
  const remainingCount = hire.steps.length - doneCount;

  return (
    <Card className="flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">{hire.name}</p>
          <p className="truncate text-xs text-zinc-400">{hire.employeeCode}</p>
          <Badge variant="pill" color={statusBadge[hire.status].color} className="mt-1.5">
            {statusBadge[hire.status].label}
          </Badge>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
        เริ่มงาน {hire.startDateLabel} ({hire.daysLeftLabel})
      </p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {hire.position} | {hire.unit}
      </p>

      {hire.inviteUrl && (
        <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs dark:bg-amber-500/10">
          <p className="mb-1.5 font-medium text-amber-700 dark:text-amber-400">
            รอการตอบรับคำเชิญ — ยังไม่มีบัญชี Thunder One
          </p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={hire.inviteUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full truncate rounded-md border border-amber-200 bg-white px-2 py-1 text-zinc-600 outline-none dark:border-amber-500/30 dark:bg-zinc-900 dark:text-zinc-300"
            />
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(hire.inviteUrl ?? "")}
              className="shrink-0 rounded-md bg-amber-600 px-2.5 py-1 font-medium text-white hover:bg-amber-500"
            >
              คัดลอกลิงก์
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">ความคืบหน้าโดยรวม</h3>
        <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{hire.progress}%</p>
        <ProgressBar value={hire.progress} className="mt-2" />
        <div className="mt-1.5 flex items-center justify-between text-xs text-zinc-400">
          <span>
            เสร็จสิ้น {doneCount} จาก {hire.steps.length} รายการ
          </span>
          <span>อีก {remainingCount} รายการ</span>
        </div>
      </div>

      <div className="mt-4 flex-1 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">ขั้นตอน Onboarding</h3>
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {hire.steps.map((step, index) => (
            <li key={step.label} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span className="text-zinc-700 dark:text-zinc-200">
                {index + 1}. {step.label}
              </span>
              {step.done ? (
                <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  เสร็จสิ้น
                </span>
              ) : (
                <span className="shrink-0 text-xs font-medium text-amber-600 dark:text-amber-400">…{step.pendingLabel}</span>
              )}
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
    </Card>
  );
}
