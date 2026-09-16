import Link from "next/link";
import { Button, buttonClasses } from "@/components/ui/Button";
import { ClipboardIcon, PlusIcon, UploadIcon } from "@/components/ui/icons";

// "เพิ่มคน / เชิญคน" is real, linking to people/add-person's type-picker
// page (/people/add) — the entry point the FigJam board's own breadcrumb
// starts from. รายงาน/Export stay inert (no backend).
export function OverviewHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">สวัสดีตอนเช้า 👋</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">ภาพรวมงานบุคลากรและความสำคัญของวันนี้</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="secondary">
          <ClipboardIcon className="h-4 w-4" />
          รายงาน
        </Button>
        <Button variant="secondary">
          <UploadIcon className="h-4 w-4" />
          Export
        </Button>
        <Link href="/people/add" className={buttonClasses("primary")}>
          <PlusIcon className="h-4 w-4" />
          เพิ่มคน / เชิญคน
        </Link>
      </div>
    </div>
  );
}
