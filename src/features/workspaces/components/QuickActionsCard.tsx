import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { ChevronRightIcon, HeadsetIcon, SettingsIcon, ShieldIcon, UsersIcon } from "@/components/ui/icons";

// Shortcuts to the real pages behind each action; the two without a page
// yet stay inert ("Not built yet").
const ACTIONS: { id: string; label: string; icon: ReactNode; href: string | null }[] = [
  { id: "add-person", label: "Add a person", icon: <UsersIcon className="h-4 w-4" />, href: "/people/add" },
  { id: "manage-people", label: "Manage people & roles", icon: <ShieldIcon className="h-4 w-4" />, href: "/people/personnel" },
  { id: "request-workspace", label: "Request new workspace", icon: <HeadsetIcon className="h-4 w-4" />, href: null },
  { id: "workspace-settings", label: "Workspace settings", icon: <SettingsIcon className="h-4 w-4" />, href: null },
];

export function QuickActionsCard() {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Quick Actions</h2>
      <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {ACTIONS.map((action) => (
          <li key={action.id}>
            {action.href ? (
              <Link
                href={action.href}
                className="flex items-center gap-2.5 py-2.5 text-sm text-zinc-700 hover:text-indigo-600 dark:text-zinc-200"
              >
                <span className="text-zinc-400">{action.icon}</span>
                <span className="flex-1">{action.label}</span>
                <ChevronRightIcon className="h-3.5 w-3.5 text-zinc-300" />
              </Link>
            ) : (
              <div
                title="Not built yet"
                className="flex cursor-not-allowed items-center gap-2.5 py-2.5 text-sm text-zinc-400"
              >
                <span>{action.icon}</span>
                <span className="flex-1">{action.label}</span>
                <ChevronRightIcon className="h-3.5 w-3.5 text-zinc-300" />
              </div>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
