import { Card } from "@/components/ui/Card";
import { ChevronRightIcon, ClipboardIcon, MegaphoneIcon } from "@/components/ui/icons";
import { importantForYou, type ImportantForYouItem } from "../mock-data";

const iconFor: Record<ImportantForYouItem["icon"], React.ReactNode> = {
  announcement: <MegaphoneIcon />,
  policy: <ClipboardIcon />,
};

const tone: Record<ImportantForYouItem["icon"], string> = {
  announcement: "bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400",
  policy: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400",
};

const tagTone: Record<ImportantForYouItem["icon"], string> = {
  announcement: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  policy: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
};

export function ImportantForYouCard() {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Important for You</h2>
      <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {importantForYou.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5 py-3 first:pt-0 last:pb-0">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone[item.icon]}`}>
              {iconFor[item.icon]}
            </span>
            <div className="min-w-0 flex-1">
              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${tagTone[item.icon]}`}>
                {item.tag}
              </span>
              <p className="mt-1 truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.title}</p>
              <p className="truncate text-xs text-zinc-400">{item.detail}</p>
            </div>
            <ChevronRightIcon className="mt-1 h-4 w-4 shrink-0 text-zinc-300" />
          </li>
        ))}
      </ul>
    </Card>
  );
}
