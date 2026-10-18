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
      <h2 className="mb-3 text-sm font-semibold text-foreground">การเข้าถึงด่วน</h2>
      <ul className="flex flex-col divide-y divide-border">
        {knowledgeQuickAccess.map((link) => (
          <li key={link.id}>
            <div
              title="Not built yet"
              className="flex cursor-not-allowed items-center gap-2.5 py-2.5 text-sm text-muted-foreground"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                {iconFor[link.icon]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{link.title}</p>
                <p className="truncate text-xs text-t1-gray-400">{link.subtitle}</p>
              </div>
              <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-t1-gray-400" />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
