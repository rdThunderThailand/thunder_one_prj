import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, MegaphoneIcon } from "@/components/ui/icons";
import { knowledgeAnnouncements } from "../mock-data";

export function KnowledgeAnnouncementsCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">ประกาศล่าสุด</h2>
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400"
        >
          ดูทั้งหมด
          <ArrowRightIcon className="h-3 w-3" />
        </span>
      </div>
      <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {knowledgeAnnouncements.map((announcement) => (
          <li key={announcement.id} className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
              <MegaphoneIcon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{announcement.title}</p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{announcement.subtitle}</p>
              <p className="text-xs text-zinc-400">{announcement.postedLabel}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
