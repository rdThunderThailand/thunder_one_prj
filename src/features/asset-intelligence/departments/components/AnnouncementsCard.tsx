import { Card } from "@/components/ui/Card";
import { MegaphoneIcon, StarIcon } from "@/components/ui/icons";
import { managerAnnouncements } from "../mock-data";

export function AnnouncementsCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Announcements</h2>
        <button className="text-xs font-medium text-primary hover:text-accent-foreground">
          View all
        </button>
      </div>
      <ul className="flex flex-1 flex-col divide-y divide-border">
        {managerAnnouncements.map((item, index) => (
          <li key={item.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-info-muted text-info">
              {index === managerAnnouncements.length - 1 ? <StarIcon className="h-4 w-4" /> : <MegaphoneIcon />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
              <p className="truncate text-xs text-t1-gray-400">{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
