import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, LightbulbIcon, StarIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { aiSuggestedForYou, type AiSuggestedData } from "../mock-data";

const iconFor: Record<AiSuggestedData["icon"], React.ReactNode> = {
  star: <StarIcon className="h-4 w-4" />,
  warning: <WarningTriangleIcon />,
  bulb: <LightbulbIcon />,
};

const iconTone: Record<AiSuggestedData["icon"], string> = {
  star: "bg-accent text-primary",
  warning: "bg-error-muted text-error",
  bulb: "bg-warning-muted text-warning",
};

export function AiSuggestedCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">AI Suggested for You</h2>
        <button className="text-xs font-medium text-primary hover:text-accent-foreground">
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
              <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
              <p className="truncate text-xs text-t1-gray-400">{item.detail}</p>
            </div>
            <button className="shrink-0 text-xs font-medium text-primary hover:text-accent-foreground">
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
