import { Card } from "@/components/ui/Card";
import { MegaphoneIcon, ShieldIcon } from "@/components/ui/icons";
import { thingsToKnowToday, type ThingsToKnowItem } from "../mock-data";

const iconFor: Record<ThingsToKnowItem["icon"], React.ReactNode> = {
  announcement: <MegaphoneIcon className="h-3.5 w-3.5" />,
  policy: <ShieldIcon className="h-3.5 w-3.5" />,
};

const toneFor: Record<ThingsToKnowItem["icon"], string> = {
  announcement: "bg-info-muted text-info",
  policy: "bg-warning-muted text-warning",
};

export function ThingsToKnowCard() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <h2 className="text-sm font-semibold text-foreground">Things to Know Today</h2>
      <ul className="flex flex-col gap-3">
        {thingsToKnowToday.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${toneFor[item.icon]}`}>
              {iconFor[item.icon]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-t1-gray-400">{item.tag}</p>
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
