import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, MegaphoneIcon } from "@/components/ui/icons";
import { newsItems } from "../mock-data";

// "ข่าวสารและอัปเดต" — static placeholder; no announcements/CMS backend
// exists anywhere in this app yet.
export function NewsCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">ข่าวสารและอัปเดต</h2>
        <Link
          href="/mission-control"
          title="ยังไม่มีหน้ารายการข่าวสารทั้งหมด"
          className="flex items-center gap-1 text-xs font-medium text-zinc-300 dark:text-zinc-600"
        >
          ดูทั้งหมด
          <ArrowRightIcon className="h-3 w-3" />
        </Link>
      </div>
      <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {newsItems.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              <MegaphoneIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.title}</p>
              <p className="truncate text-xs text-zinc-400">{item.description}</p>
            </div>
            <span className="shrink-0 whitespace-nowrap text-xs text-zinc-400">{item.dateLabel}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
