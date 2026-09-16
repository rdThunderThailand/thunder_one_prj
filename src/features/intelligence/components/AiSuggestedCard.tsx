import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, LightbulbIcon, StarIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { aiSuggestedForYou, type AiSuggestedData } from "../mock-data";

const iconFor: Record<AiSuggestedData["icon"], React.ReactNode> = {
  star: <StarIcon className="h-4 w-4" />,
  warning: <WarningTriangleIcon />,
  bulb: <LightbulbIcon />,
};

const iconTone: Record<AiSuggestedData["icon"], string> = {
  star: "bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400",
  warning: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
  bulb: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
};

export function AiSuggestedCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">AI Suggested for You</h2>
        <button className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          View all
        </button>
      </div>
      <ul className="flex flex-col gap-3">
        {aiSuggestedForYou.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconTone[item.icon]}`}>
              {iconFor[item.icon]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.title}</p>
              <p className="truncate text-xs text-zinc-400">{item.detail}</p>
            </div>
            <button className="shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
