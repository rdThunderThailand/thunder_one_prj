import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import {
  ChartIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  PlusIcon,
  RepeatIcon,
  UserMinusIcon,
} from "@/components/ui/icons";
import { quickActions, type QuickActionId } from "../mock-data";

const actionIcon: Record<QuickActionId, ReactNode> = {
  "add-employee": <PlusIcon className="h-4 w-4" />,
  "invite-person": <EnvelopeIcon className="h-4 w-4" />,
  "transfer-employee": <RepeatIcon className="h-4 w-4" />,
  "change-manager": <CheckCircleIcon className="h-4 w-4" />,
  "start-offboarding": <UserMinusIcon className="h-4 w-4" />,
  "create-report": <ChartIcon className="h-4 w-4" />,
};

// Every action here is inert (no page built yet this sprint) — same
// "cursor-not-allowed + title" convention as WorkspacesRow's PLACEHOLDER_TILES.
export function QuickActionsRow() {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">ทางลัด (Quick Actions)</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {quickActions.map((action) => (
          <button
            key={action.id}
            type="button"
            title="Not built yet"
            className="flex cursor-not-allowed items-center gap-2.5 rounded-xl border border-border p-3 text-left opacity-70"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
              {actionIcon[action.id]}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">
                {action.label}
              </span>
              <span className="block truncate text-[11px] text-t1-gray-400">{action.sublabel}</span>
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}
