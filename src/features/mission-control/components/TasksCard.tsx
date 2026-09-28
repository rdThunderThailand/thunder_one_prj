import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ArrowRightIcon, CheckCircleIcon, WarningTriangleIcon } from "@/components/ui/icons";
import type { MyWork } from "@/features/my-work";

const MAX_ROWS = 4;

// "งานที่ต้องดำเนินการ" — the same items as My Work and the Topbar bell
// (features/my-work/load-my-work.ts), passed in by the route as an
// un-awaited promise and streamed behind `TasksCardSkeleton`. Items arrive
// most-urgent first. Approvals get the red dot (they block someone else);
// everything else is blue.
export async function TasksCard({ work: workPromise }: { work: Promise<MyWork> }) {
  const work = await workPromise;
  const unavailable = !Object.values(work.available).some(Boolean);

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          งานที่ต้องดำเนินการ
          {work.items.length > 0 && <span className="ml-1.5 text-xs font-medium text-zinc-400">{work.items.length}</span>}
        </h2>
        <Link
          href="/my-work"
          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          ดูทั้งหมด
          <ArrowRightIcon className="h-3 w-3" />
        </Link>
      </div>
      {unavailable ? (
        <EmptyState
          icon={WarningTriangleIcon}
          title="ไม่สามารถโหลดงานได้"
          detail="ลองรีเฟรชหน้านี้อีกครั้งในภายหลัง"
          compact
        />
      ) : work.items.length === 0 ? (
        <EmptyState
          icon={CheckCircleIcon}
          title="ไม่มีงานค้าง"
          detail="ตอนนี้ไม่มีงานที่รอคุณดำเนินการ"
          compact
        />
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
          {work.items.slice(0, MAX_ROWS).map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-start gap-2.5 py-2.5 hover:text-indigo-600"
              >
                <span
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${item.kind === "approval" ? "bg-red-500" : "bg-blue-500"}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-zinc-900 dark:text-zinc-50">{item.title}</span>
                  <span className="block truncate text-xs text-zinc-400">{item.dateNote}</span>
                </span>
                <span className="shrink-0 whitespace-nowrap text-xs text-zinc-400">{item.source}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
