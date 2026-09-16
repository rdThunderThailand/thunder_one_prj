import { Card } from "@/components/ui/Card";
import { CalendarIcon, ChartIcon, ChevronRightIcon, ClipboardIcon } from "@/components/ui/icons";
import { governanceQuickLinks, type GovernanceQuickLinkData } from "../mock-data";

const iconFor: Record<GovernanceQuickLinkData["icon"], React.ReactNode> = {
  document: <ClipboardIcon />,
  forms: <ClipboardIcon />,
  calendar: <CalendarIcon />,
  reporting: <ChartIcon />,
};

// Decorative — no policy library / forms / calendar / reporting destination exists yet.
export function QuickLinksCard() {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Quick Links</h2>
      <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {governanceQuickLinks.map((link) => (
          <li key={link.id}>
            <div
              title="Not built yet"
              className="flex cursor-not-allowed items-center gap-2.5 py-2.5 text-sm text-zinc-600 dark:text-zinc-300"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
                {iconFor[link.icon]}
              </span>
              <span className="flex-1">{link.label}</span>
              <ChevronRightIcon className="h-3.5 w-3.5 text-zinc-300" />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
