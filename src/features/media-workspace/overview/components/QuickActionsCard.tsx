import Link from "next/link";
import { Card } from "@/components/ui/Card";
import {
  BroadcastIcon,
  CalendarIcon,
  GridIcon,
  LayoutIcon,
  MegaphoneIcon,
  UploadIcon,
} from "@/components/ui/icons";
import { quickActions, type QuickActionData, type QuickActionIcon } from "../mock-data";

const iconFor: Record<QuickActionIcon, React.ReactNode> = {
  publication: <BroadcastIcon />,
  playlist: <LayoutIcon />,
  upload: <UploadIcon />,
  campaign: <MegaphoneIcon />,
  schedule: <CalendarIcon />,
  channel: <GridIcon />,
};

const iconColor: Record<QuickActionData["color"], string> = {
  indigo: "text-indigo-500",
  blue: "text-blue-500",
  emerald: "text-emerald-500",
  amber: "text-amber-500",
  violet: "text-violet-500",
  teal: "text-teal-500",
};

export function QuickActionsCard() {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {quickActions.map((action) => {
          const content = (
            <>
              <span className={iconColor[action.color]}>{iconFor[action.icon]}</span>
              {action.label}
            </>
          );
          const className =
            "flex min-h-12 items-center gap-2 rounded-lg border border-zinc-200 p-3 text-left text-xs font-medium text-zinc-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-45";

          return action.href ? (
            <Link key={action.label} href={action.href} className={className}>
              {content}
            </Link>
          ) : (
            <button key={action.label} className={className} title="Not built yet" disabled>
              {content}
            </button>
          );
        })}
      </div>
    </Card>

  );
}
