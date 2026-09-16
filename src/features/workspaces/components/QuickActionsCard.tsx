import { Card } from "@/components/ui/Card";
import { ChevronRightIcon, HeadsetIcon, SettingsIcon, ShieldIcon, UsersIcon } from "@/components/ui/icons";
import { quickActions, type QuickActionData } from "../mock-data";

const iconFor: Record<QuickActionData["icon"], React.ReactNode> = {
  headset: <HeadsetIcon className="h-4 w-4" />,
  users: <UsersIcon className="h-4 w-4" />,
  shield: <ShieldIcon className="h-4 w-4" />,
  settings: <SettingsIcon className="h-4 w-4" />,
};

// Decorative — no admin/access-management backend exists yet.
export function QuickActionsCard() {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Quick Actions</h2>
      <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {quickActions.map((action) => (
          <li key={action.id}>
            <div
              title="Not built yet"
              className="flex cursor-not-allowed items-center gap-2.5 py-2.5 text-sm text-zinc-600 dark:text-zinc-300"
            >
              <span className="text-zinc-400">{iconFor[action.icon]}</span>
              <span className="flex-1">{action.label}</span>
              <ChevronRightIcon className="h-3.5 w-3.5 text-zinc-300" />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
