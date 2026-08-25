import { Card } from "@/components/ui/Card";
import { MegaphoneIcon, ShieldIcon } from "@/components/ui/icons";
import { thingsToKnowToday, type ThingsToKnowItem } from "../mock-data";

const iconFor: Record<ThingsToKnowItem["icon"], React.ReactNode> = {
  announcement: <MegaphoneIcon className="h-3.5 w-3.5" />,
  policy: <ShieldIcon className="h-3.5 w-3.5" />,
};

const toneFor: Record<ThingsToKnowItem["icon"], string> = {
  announcement: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
  policy: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
};

export function ThingsToKnowCard() {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Things to Know Today</h2>
      <ul className="flex flex-col gap-3">
        {thingsToKnowToday.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${toneFor[item.icon]}`}>
              {iconFor[item.icon]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-zinc-400">{item.tag}</p>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.title}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
