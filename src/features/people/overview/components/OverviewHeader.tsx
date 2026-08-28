import { Button } from "@/components/ui/Button";
import { ClipboardIcon, PlusIcon, UploadIcon } from "@/components/ui/icons";

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
        <Button variant="primary">
          <PlusIcon className="h-4 w-4" />
          เพิ่มคน / เชิญคน
        </Button>
      </div>
    </div>
  );
}
