import { ClipboardIcon, PlusIcon, UploadIcon } from "@/components/ui/icons";

// Every action here is inert — no backend for reports/export, and no
// "create position" flow exists in Core (see mock-data.ts's header
// comment).
export function PositionsHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">ตำแหน่งงาน</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          จัดการโครงสร้างตำแหน่งงานและระบุรายละเอียดของตำแหน่ง
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <span
          title="ยังไม่เปิดใช้งาน"
          className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
        >
          <ClipboardIcon className="h-4 w-4" />
          รายงาน
        </span>
        <span
          title="ยังไม่เปิดใช้งาน"
          className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
        >
          <UploadIcon className="h-4 w-4" />
          Export
        </span>
        <span
          title="ยังไม่เปิดใช้งาน"
          className="flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-indigo-300 px-4 py-2.5 text-sm font-medium text-white dark:bg-indigo-500/40"
        >
          <PlusIcon className="h-4 w-4" />
          เพิ่มตำแหน่งงาน
        </span>
      </div>
    </div>
  );
}
