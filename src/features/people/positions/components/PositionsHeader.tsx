import { ClipboardIcon, PlusIcon, UploadIcon } from "@/components/ui/icons";

// Every action here is inert — no backend for reports/export, and no
// "create position" flow exists in Core (see mock-data.ts's header
// comment).
export function PositionsHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">ตำแหน่งงาน</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          จัดการโครงสร้างตำแหน่งงานและระบุรายละเอียดของตำแหน่ง
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <span
          title="ยังไม่เปิดใช้งาน"
          className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground"
        >
          <ClipboardIcon className="h-4 w-4" />
          รายงาน
        </span>
        <span
          title="ยังไม่เปิดใช้งาน"
          className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground"
        >
          <UploadIcon className="h-4 w-4" />
          Export
        </span>
        <span
          title="ยังไม่เปิดใช้งาน"
          className="flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-t1-blue-300 px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <PlusIcon className="h-4 w-4" />
          เพิ่มตำแหน่งงาน
        </span>
      </div>
    </div>
  );
}
