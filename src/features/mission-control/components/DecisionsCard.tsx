import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ChevronRightIcon, CheckCircleIcon, MegaphoneIcon, UsersIcon } from "@/components/ui/icons";
import { decisionItems, type DecisionItemData } from "../mock-data";

const iconFor: Record<DecisionItemData["icon"], React.ReactNode> = {
  clipboard: <CheckCircleIcon />,
  user: <UsersIcon />,
  megaphone: <MegaphoneIcon />,
};

const iconTone: Record<DecisionItemData["icon"], string> = {
  clipboard: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
  user: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  megaphone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
};

// CEO-03: decisions with evidence, all reviewed on the one real Approvals
// queue (CEO-04) — same "list page with inline Approve/Reject" pattern used
// everywhere else this sprint.
export function DecisionsCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center gap-2">
        <CheckCircleIcon className="h-4 w-4 text-indigo-500" />
        <h2 className="flex-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Decisions Waiting for You
        </h2>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
          {decisionItems.length}
        </span>
      </div>
      <ul className="flex flex-1 flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {decisionItems.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconTone[item.icon]}`}
            >
              {iconFor[item.icon]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.title}</p>
              <p className="truncate text-xs text-zinc-400">{item.meta}</p>
            </div>
            <Link
              href="/mission-control/approvals"
              className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              Review
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/mission-control/approvals"
        className="mt-3 flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
      >
        View all decisions
        <ChevronRightIcon className="h-3.5 w-3.5" />
      </Link>
    </Card>
  );
}
