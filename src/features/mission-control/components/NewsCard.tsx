import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ArrowRightIcon, MegaphoneIcon } from "@/components/ui/icons";

// "ข่าวสารและอัปเดต" — no announcements/CMS source exists in Core, so this
// renders an empty state instead of placeholder news (the old `newsItems`
// mock was removed 2026-09-25). "ดูทั้งหมด" is inert — there's no news page to
// link to.
export function NewsCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">ข่าวสารและอัปเดต</h2>
        <button
          type="button"
          disabled
          title="ยังไม่มีหน้ารายการข่าวสารทั้งหมด"
          className="flex items-center gap-1 text-xs font-medium text-zinc-300 dark:text-zinc-600"
        >
          ดูทั้งหมด
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>
      <EmptyState
        icon={MegaphoneIcon}
        title="ยังไม่มีข่าวสาร"
        detail="ประกาศและอัปเดตจากองค์กรจะแสดงที่นี่"
        compact
      />
    </Card>
  );
}
