import Link from "next/link";
import { buttonClasses, Button } from "@/components/ui/Button";
import { CheckCircleIcon } from "@/components/ui/icons";
// Deep import — see AddEmployeeWizardPage's identical comment (avoids a
// barrel-file import cycle between add-person and new-hires).
import type { NewHireRow } from "@/features/people/new-hires/mock-data";

interface AddEmployeeStepSuccessProps {
  createdRow: NewHireRow;
  employmentType: string;
  onAddNext: () => void;
}

/** Success sub-state of step 3 (after a real submit) — presentational only,
 *  same convention as the other extracted steps. Extracted 2026-09-17
 *  (readability audit), no behavior change. */
export function AddEmployeeStepSuccess({ createdRow, employmentType, onAddNext }: AddEmployeeStepSuccessProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col items-center gap-2 py-2 text-center">
        <CheckCircleIcon className="h-9 w-9 text-emerald-500" />
        {createdRow.inviteUrl ? (
          <>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">ส่งคำเชิญไปที่ {createdRow.name} แล้ว</p>
            <p className="max-w-sm text-xs text-zinc-400">
              อีเมลนี้ยังไม่มีบัญชี Thunder One — รอการตอบรับคำเชิญก่อนจึงจะเริ่มกระบวนการ Onboarding ได้
            </p>
          </>
        ) : (
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{createdRow.name} พร้อมเริ่มกระบวนการ Onboarding</p>
        )}
        <p className="text-xs text-zinc-400">
          {createdRow.employeeCode} · {createdRow.position} · {employmentType}
        </p>
      </div>

      {createdRow.inviteUrl && (
        <div className="mx-auto flex w-full max-w-md items-center gap-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
          <input
            readOnly
            value={createdRow.inviteUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full truncate bg-transparent text-xs text-zinc-600 outline-none dark:text-zinc-300"
          />
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(createdRow.inviteUrl ?? "")}
            className="shrink-0 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-indigo-600 shadow-sm dark:bg-zinc-900 dark:text-indigo-400"
          >
            คัดลอกลิงก์
          </button>
        </div>
      )}

      <div className="mx-auto w-full max-w-md rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
        <div className="mb-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>ความคืบหน้า</span>
          <span>{createdRow.progress}%</span>
        </div>
        <ul className="flex flex-col gap-1">
          {createdRow.steps.map((step) => (
            <li key={step.label} className="flex items-center justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-300">{step.label}</span>
              {step.done ? (
                <span className="font-medium text-emerald-600 dark:text-emerald-400">เสร็จสิ้น</span>
              ) : (
                <span className="font-medium text-amber-600 dark:text-amber-400">{step.pendingLabel}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-auto flex items-center gap-2">
        <Button variant="secondary" onClick={onAddNext}>
          เพิ่มพนักงานคนถัดไป
        </Button>
        <Link href="/people/new-hires" className={buttonClasses("primary")}>
          ไปที่หน้าเข้าใหม่
        </Link>
      </div>
    </div>
  );
}
