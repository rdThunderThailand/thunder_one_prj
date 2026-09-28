import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon } from "@/components/ui/icons";
import { WORKSPACES, type WorkspaceEntry } from "../catalog";
import type { WorkspaceStats } from "../services/workspace-stats-api";
import { WorkspaceStatusLine, workspaceIcon } from "./workspace-ui";

function WorkspaceCard({ workspace, stats }: { workspace: WorkspaceEntry; stats: WorkspaceStats }) {
  const body = (
    <>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${workspace.tone}`}>
        {workspaceIcon(workspace.icon)}
      </span>
      <div className="mt-3 flex-1">
        <p className="font-semibold text-zinc-900 dark:text-zinc-50">{workspace.name}</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{workspace.description}</p>
      </div>
      <div className="mt-4">
        <WorkspaceStatusLine
          workspace={workspace}
          stat={stats[workspace.id]}
        />
      </div>
      <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <span
          className={`flex items-center gap-1 text-sm font-medium ${
            workspace.href ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-300 dark:text-zinc-700"
          }`}
        >
          {workspace.href ? "Open Workspace" : "Coming soon"}
          {workspace.href && <ArrowRightIcon className="h-3.5 w-3.5 -rotate-45" />}
        </span>
      </div>
    </>
  );

  if (workspace.href) {
    return (
      <Link
        href={workspace.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Card className="flex h-full flex-col p-4 transition-colors hover:border-indigo-200 dark:hover:border-indigo-800">
          {body}
        </Card>
      </Link>
    );
  }
  return <Card className="flex h-full flex-col p-4 opacity-75">{body}</Card>;
}

// "Your Workspaces" — every entry in `../catalog.ts`, each with its real
// status line (live stat / sample data / coming soon).
export function WorkspaceGrid({ stats }: { stats: WorkspaceStats }) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Your Workspaces</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {WORKSPACES.map((workspace) => (
          <WorkspaceCard
            key={workspace.id}
            workspace={workspace}
            stats={stats}
          />
        ))}
      </div>
    </div>
  );
}
