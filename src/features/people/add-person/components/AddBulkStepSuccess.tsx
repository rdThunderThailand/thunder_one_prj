import Link from "next/link";
import { buttonClasses, Button } from "@/components/ui/Button";
import { CheckCircleIcon } from "@/components/ui/icons";
import type { BulkSubmitResult } from "./AddBulkWizardPage";

interface AddBulkStepSuccessProps {
  submitResults: BulkSubmitResult[] | null;
  onImportNext: () => void;
}

/** Success sub-state of step 3 (after a real confirm) of AddBulkWizardPage
 *  — presentational only, same convention as the other extracted steps.
 *  Extracted 2026-09-17 (readability audit), no behavior change. */
export function AddBulkStepSuccess({ submitResults, onImportNext }: AddBulkStepSuccessProps) {
  const results = submitResults ?? [];
  const failedResults = results.filter((r) => r.outcome === "failed");
  const successCount = results.length - failedResults.length;
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <CheckCircleIcon className="h-9 w-9 text-emerald-500" />
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
        สร้างสำเร็จ {successCount} จาก {results.length} คน
      </p>
      <p className="max-w-sm text-xs text-zinc-400">
        แต่ละคนจะได้รับอีเมลพร้อมลิงก์ยืนยันเข้าใช้งาน สามารถติดตามสถานะได้ที่หน้า &quot;เข้าใหม่&quot;
      </p>
      {failedResults.length > 0 && (
        <div className="w-full max-w-md rounded-xl border border-red-100 bg-red-50/60 p-3 text-left text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          <p className="mb-1 font-semibold">{failedResults.length} รายการล้มเหลว:</p>
          <ul className="list-inside list-disc space-y-0.5">
            {failedResults.map((r) => (
              <li key={r.row.email}>
                {r.name} ({r.row.email}) — {r.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-1 flex items-center gap-2">
        <Button variant="secondary" onClick={onImportNext}>
          นำเข้าไฟล์ถัดไป
        </Button>
        <Link href="/people/new-hires" className={buttonClasses("primary")}>
          ไปที่หน้าเข้าใหม่
        </Link>
      </div>
    </div>
  );
}
