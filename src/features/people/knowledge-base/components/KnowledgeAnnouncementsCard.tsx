import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, MegaphoneIcon } from "@/components/ui/icons";
import { knowledgeAnnouncements } from "../mock-data";

export function KnowledgeAnnouncementsCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">ประกาศล่าสุด</h2>
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center gap-1 text-xs font-medium text-primary"
        >
          ดูทั้งหมด
          <ArrowRightIcon className="h-3 w-3" />
        </span>
      </div>
      <ul className="flex flex-col divide-y divide-border">
        {knowledgeAnnouncements.map((announcement) => (
          <li key={announcement.id} className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
              <MegaphoneIcon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{announcement.title}</p>
              <p className="truncate text-xs text-muted-foreground">{announcement.subtitle}</p>
              <p className="text-xs text-t1-gray-400">{announcement.postedLabel}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
