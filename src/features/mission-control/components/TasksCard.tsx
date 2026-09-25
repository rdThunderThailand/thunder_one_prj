import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ArrowRightIcon, ClipboardIcon } from "@/components/ui/icons";

// "งานที่ต้องดำเนินการ" — no cross-App task/approval-aggregation source
// exists in Core yet, so this renders an empty state instead of placeholder
// tasks (the old `actionItems` mock was removed 2026-09-25). "ดูทั้งหมด" still
// goes to /my-work, which is a real route.
export function TasksCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">งานที่ต้องดำเนินการ</h2>
        <Link
          href="/my-work"
          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          ดูทั้งหมด
          <ArrowRightIcon className="h-3 w-3" />
        </Link>
      </div>
      <EmptyState
        icon={ClipboardIcon}
        title="ยังไม่มีข้อมูลงานที่ต้องดำเนินการ"
        detail="งานจาก Workspace ต่าง ๆ จะแสดงที่นี่เมื่อระบบพร้อม"
        compact
      />
    </Card>
  );
}
