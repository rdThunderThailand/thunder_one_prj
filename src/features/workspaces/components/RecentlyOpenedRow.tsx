"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChevronRightIcon, ClockIcon } from "@/components/ui/icons";
import { timeAgo } from "@/lib/time-ago";
import { useRecentWorkspaces } from "@/lib/workspace-prefs";
import { findWorkspace } from "../catalog";
import { workspaceIcon } from "./workspace-ui";

/**
 * Real per-browser history: the Sidebar records each App this viewer opens
 * (lib/workspace-prefs.ts). Shared by all three variants — `showCount`
 * swaps "2 hours ago" for "Opened 3 times". Empty until the viewer opens a
 * Workspace in this browser.
 */
export function RecentlyOpenedRow({ showCount = false }: { showCount?: boolean }) {
  const recents = useRecentWorkspaces()
    .map((recent) => ({ recent, workspace: findWorkspace(recent.id) }))
    .filter((entry) => entry.workspace?.href);
  const now = new Date();

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Recently Opened</h2>
      {recents.length === 0 ? (
        <Card>
          <EmptyState
            icon={ClockIcon}
            title="Nothing opened yet"
            detail="Workspaces you open in this browser will show here."
            compact
          />
        </Card>
      ) : (
        <div className="flex flex-wrap gap-3">
          {recents.slice(0, 5).map(({ recent, workspace }) =>
            workspace?.href ? (
              <Link
                key={recent.id}
                href={workspace.href}
                className="min-w-52 flex-1 sm:flex-none"
              >
                <Card className="flex items-center gap-2.5 p-3 transition-colors hover:border-indigo-200 dark:hover:border-indigo-800">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${workspace.tone}`}>
                    {workspaceIcon(workspace.icon, "h-4 w-4")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{workspace.name}</p>
                    <p className="truncate text-xs text-zinc-400">
                      {showCount
                        ? `Opened ${recent.openCount} time${recent.openCount === 1 ? "" : "s"}`
                        : timeAgo(recent.lastOpenedAt, now)}
                    </p>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-zinc-300" />
                </Card>
              </Link>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
