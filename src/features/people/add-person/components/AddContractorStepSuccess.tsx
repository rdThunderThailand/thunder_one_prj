import Link from "next/link";
import { buttonClasses, Button } from "@/components/ui/Button";
import { CheckCircleIcon } from "@/components/ui/icons";
// Deep import — see AddEmployeeWizardPage's identical comment (avoids a
// barrel-file import cycle between add-person and new-hires).
import type { NewHireRow } from "@/features/people/new-hires/mock-data";

interface AddContractorStepSuccessProps {
  createdRow: NewHireRow;
  onAddNext: () => void;
}

/** Success sub-state of step 3 (after a real submit) of
 *  AddContractorWizardPage — presentational only, same convention as the
 *  other extracted steps. Extracted 2026-09-17 (readability audit), no
 *  behavior change. */
export function AddContractorStepSuccess({ createdRow, onAddNext }: AddContractorStepSuccessProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-8 shadow-sm">
      <div className="flex flex-col items-center gap-2 py-2 text-center">
        <CheckCircleIcon className="h-9 w-9 text-success" />
        {createdRow.inviteUrl ? (
          <>
            <p className="text-sm font-medium text-foreground">ส่งคำเชิญไปที่ {createdRow.name} แล้ว</p>
            <p className="max-w-sm text-xs text-t1-gray-400">
              อีเมลนี้ยังไม่มีบัญชี Thunder One — รอการตอบรับคำเชิญก่อนจึงจะเริ่มกระบวนการ Onboarding ได้
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-foreground">
              สร้างผู้รับเหมา {createdRow.name} เรียบร้อยแล้ว
            </p>
            <span className="mt-1 inline-flex w-fit items-center rounded-full bg-success-muted px-2.5 py-1 text-xs font-medium text-t1-green-700">
              Pre-boarding
            </span>
            <p className="max-w-sm text-xs text-t1-gray-400">
              บันทึกสำเร็จแล้ว สามารถเริ่มกระบวนการ Onboarding ได้จากเมนู &quot;เข้าใหม่&quot;
            </p>
          </>
        )}
        <p className="text-xs text-t1-gray-400">
          {createdRow.employeeCode} · {createdRow.position}
        </p>
      </div>

      {createdRow.inviteUrl && (
        <div className="mx-auto flex w-full max-w-md items-center gap-2 rounded-lg bg-t1-gray-50 p-3">
          <input
            readOnly
            value={createdRow.inviteUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full truncate bg-transparent text-xs text-muted-foreground outline-none"
          />
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(createdRow.inviteUrl ?? "")}
            className="shrink-0 rounded-md bg-card px-2.5 py-1 text-xs font-medium text-primary shadow-sm"
          >
            คัดลอกลิงก์
          </button>
        </div>
      )}

      <div className="mx-auto flex items-center gap-2">
        <Button variant="secondary" onClick={onAddNext}>
          เพิ่มผู้รับเหมาคนถัดไป
        </Button>
        <Link href="/people/new-hires" className={buttonClasses("primary")}>
          ไปที่หน้าเข้าใหม่
        </Link>
      </div>
    </div>
  );
}
