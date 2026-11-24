"use client";

import Link from "next/link";
import { usePinnedWorkspaces } from "@/lib/workspace-prefs";
import type { WorkspaceEntry } from "../catalog";
import { workspaceIcon } from "./workspace-ui";

// The viewer's own pins (star on a directory tile), stored per browser —
// looked up in `workspaces`, so a pin the tenant can no longer see drops out.
export function PinnedWorkspacesRow({ workspaces }: { workspaces: WorkspaceEntry[] }) {
  const pinned = usePinnedWorkspaces()
    .map((id) => workspaces.find((w) => w.id === id))
    .filter((w) => w?.href);

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-foreground">Pinned Workspaces</h2>
      {pinned.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-2.5 text-xs text-t1-gray-400">
          Nothing pinned yet — tap the star on a workspace above to pin it here.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {pinned.map((workspace) =>
            workspace?.href ? (
              <Link
                key={workspace.id}
                href={workspace.href}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-t1-blue-200"
              >
                <span className="text-primary">{workspaceIcon(workspace.icon, "h-3.5 w-3.5")}</span>
                {workspace.name}
              </Link>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
