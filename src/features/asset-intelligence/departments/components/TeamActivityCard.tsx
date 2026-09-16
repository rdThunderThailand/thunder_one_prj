import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { teamActivity } from "../mock-data";

export function TeamActivityCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Team Activity</h2>
        <button className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          View all
        </button>
      </div>
      <ul className="flex flex-1 flex-col gap-3">
        {teamActivity.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5">
            <Avatar name={item.name} size={26} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-zinc-700 dark:text-zinc-200">
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{item.name}</span> {item.action}{" "}
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{item.target}</span>
              </p>
            </div>
            <span className="shrink-0 text-xs text-zinc-400">{item.timeAgo}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
