import { Card } from "@/components/ui/Card";
import { ChevronRightIcon, ClipboardIcon, HelpIcon, PlayIcon, ShieldIcon } from "@/components/ui/icons";
import { knowledgeQuickAccess, type QuickAccessLinkData } from "../mock-data";

const iconFor: Record<QuickAccessLinkData["icon"], React.ReactNode> = {
  book: <ClipboardIcon />,
  shield: <ShieldIcon />,
  clipboard: <ClipboardIcon />,
  play: <PlayIcon />,
  help: <HelpIcon />,
};

export function KnowledgeQuickAccessCard() {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">การเข้าถึงด่วน</h2>
      <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {knowledgeQuickAccess.map((link) => (
          <li key={link.id}>
            <div
              title="Not built yet"
              className="flex cursor-not-allowed items-center gap-2.5 py-2.5 text-sm text-zinc-600 dark:text-zinc-300"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
                {iconFor[link.icon]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">{link.title}</p>
                <p className="truncate text-xs text-zinc-400">{link.subtitle}</p>
              </div>
              <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-zinc-300" />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
