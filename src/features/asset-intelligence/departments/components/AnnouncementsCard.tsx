import { Card } from "@/components/ui/Card";
import { MegaphoneIcon, StarIcon } from "@/components/ui/icons";
import { managerAnnouncements } from "../mock-data";

export function AnnouncementsCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Announcements</h2>
        <button className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          View all
        </button>
      </div>
      <ul className="flex flex-1 flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {managerAnnouncements.map((item, index) => (
          <li key={item.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400">
              {index === managerAnnouncements.length - 1 ? <StarIcon className="h-4 w-4" /> : <MegaphoneIcon />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.title}</p>
              <p className="truncate text-xs text-zinc-400">{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
