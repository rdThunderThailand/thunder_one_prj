import { Card } from "@/components/ui/Card";
import { ClipboardIcon, MegaphoneIcon, SettingsIcon } from "@/components/ui/icons";
import { workspaceAnnouncements, type WorkspaceAnnouncementData } from "../mock-data";

const iconFor: Record<WorkspaceAnnouncementData["icon"], React.ReactNode> = {
  megaphone: <MegaphoneIcon className="h-3.5 w-3.5" />,
  policy: <ClipboardIcon className="h-3.5 w-3.5" />,
  system: <SettingsIcon className="h-3.5 w-3.5" />,
};

export function AnnouncementsCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Announcements</h2>
        <button className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">View all</button>
      </div>
      <ul className="flex flex-col gap-3">
        {workspaceAnnouncements.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.iconTone}`}>
              {iconFor[item.icon]}
            </span>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-medium ${item.tagTone}`}>{item.tag}</p>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.title}</p>
              <p className="text-xs text-zinc-400">{item.timeLabel}</p>
            </div>
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden="true" />
          </li>
        ))}
      </ul>
    </Card>
  );
}
