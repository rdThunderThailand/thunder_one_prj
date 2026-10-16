import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { teamActivity } from "../mock-data";

export function TeamActivityCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Team Activity</h2>
        <button className="text-xs font-medium text-primary hover:text-primary">
          View all
        </button>
      </div>
      <ul className="flex flex-1 flex-col gap-3">
        {teamActivity.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5">
            <Avatar name={item.name} size={26} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-foreground">
                <span className="font-medium text-foreground">{item.name}</span> {item.action}{" "}
                <span className="font-medium text-foreground">{item.target}</span>
              </p>
            </div>
            <span className="shrink-0 text-xs text-t1-gray-400">{item.timeAgo}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
