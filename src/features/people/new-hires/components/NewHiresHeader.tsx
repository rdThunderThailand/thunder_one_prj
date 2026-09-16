import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { PlusIcon, UploadIcon } from "@/components/ui/icons";

// คู่มือการใช้งาน/Export stay inert (no backend/no guide content yet) —
// "เพิ่มพนักงานใหม่" is real, linking to people/add-person's full-page
// wizard (/people/add/employee).
export function NewHiresHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">เข้าใหม่ / Onboarding</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          ติดตามความคืบหน้าพนักงานเข้าใหม่ในทุกขั้นตอน
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <span
          title="ยังไม่เปิดใช้งาน"
          className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
        >
          คู่มือการใช้งาน
        </span>
        <span
          title="ยังไม่เปิดใช้งาน"
          className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
        >
          <UploadIcon className="h-4 w-4 rotate-180" />
          ส่งออก
        </span>
        <Link href="/people/add/employee" className={buttonClasses("primary")}>
          <PlusIcon className="h-4 w-4" />
          เพิ่มพนักงานใหม่
        </Link>
      </div>
    </div>
  );
}
