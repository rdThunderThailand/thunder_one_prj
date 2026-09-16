import { Card } from "@/components/ui/Card";
import { BoxIcon, ChartIcon, ChevronRightIcon, ImageIcon, MegaphoneIcon, UsersIcon } from "@/components/ui/icons";
import { recentlyOpened, type WorkspaceIcon } from "../mock-data";

const iconFor: Record<WorkspaceIcon, React.ReactNode> = {
  megaphone: <MegaphoneIcon className="h-4 w-4" />,
  image: <ImageIcon className="h-4 w-4" />,
  box: <BoxIcon className="h-4 w-4" />,
  users: <UsersIcon className="h-4 w-4" />,
  headset: <UsersIcon className="h-4 w-4" />,
  clipboard: <ChartIcon className="h-4 w-4" />,
  chart: <ChartIcon className="h-4 w-4" />,
};

export function RecentlyOpenedRow() {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Recently Opened</h2>
      <div className="flex flex-wrap gap-3">
        {recentlyOpened.map((item) => (
          <Card
            key={item.id}
            className="flex min-w-52 flex-1 items-center gap-2.5 p-3 sm:flex-none"
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.iconTone}`}>
              {iconFor[item.icon]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.name}</p>
              <p className="truncate text-xs text-zinc-400">{item.timeAgo}</p>
            </div>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-zinc-300" />
          </Card>
        ))}
      </div>
    </div>
  );
}
