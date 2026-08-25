import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ChevronRightIcon, PhoneIcon, UsersIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { attentionItems, type AttentionItemData } from "../mock-data";

const iconFor: Record<AttentionItemData["icon"], React.ReactNode> = {
  warning: <WarningTriangleIcon />,
  users: <UsersIcon />,
  phone: <PhoneIcon />,
};

const iconTone: Record<AttentionItemData["icon"], string> = {
  warning: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
  users: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
  phone: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
};

const severityTone: Record<AttentionItemData["severity"], string> = {
  High: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  Medium: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  Low: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

// Operational status pings — distinct from DecisionsCard, which needs an
// explicit approve/reject rather than just visibility.
export function NeedsAttentionCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center gap-2">
        <WarningTriangleIcon className="h-4 w-4 text-red-500" />
        <h2 className="flex-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Needs Your Attention</h2>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
          {attentionItems.length}
        </span>
      </div>
      <ul className="flex flex-1 flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {attentionItems.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconTone[item.icon]}`}
            >
              {iconFor[item.icon]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.title}</p>
              <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">{item.description}</p>
              <p className="mt-0.5 text-xs text-zinc-400">
                Owner: {item.owner} • Due {item.due}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${severityTone[item.severity]}`}
            >
              {item.severity}
            </span>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-zinc-300" />
          </li>
        ))}
      </ul>
      <Link
        href="/mission-control/insights"
        className="mt-3 flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
      >
        View all attention items
        <ChevronRightIcon className="h-3.5 w-3.5" />
      </Link>
    </Card>
  );
}
