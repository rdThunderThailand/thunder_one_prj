"use client";

import Link from "next/link";
import { usePinnedWorkspaces } from "@/lib/workspace-prefs";
import { findWorkspace } from "../catalog";
import { workspaceIcon } from "./workspace-ui";

// The viewer's own pins (star on a directory tile), stored per browser.
export function PinnedWorkspacesRow() {
  const pinned = usePinnedWorkspaces()
    .map((id) => findWorkspace(id))
    .filter((w) => w?.href);

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Pinned Workspaces</h2>
      {pinned.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-2.5 text-xs text-zinc-400 dark:border-zinc-700">
          Nothing pinned yet — tap the star on a workspace above to pin it here.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {pinned.map((workspace) =>
            workspace?.href ? (
              <Link
                key={workspace.id}
                href={workspace.href}
                className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-indigo-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                <span className="text-indigo-500">{workspaceIcon(workspace.icon, "h-3.5 w-3.5")}</span>
                {workspace.name}
              </Link>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
