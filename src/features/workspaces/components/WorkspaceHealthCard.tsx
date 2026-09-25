import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { WORKSPACES } from "../catalog";
import type { WorkspaceStats } from "../services/workspace-stats-api";
import { workspaceIcon } from "./workspace-ui";

// One row per live Workspace with its real stat. The chip is the stat's own
// alert (e.g. "6 offline") — shown only when there is one; otherwise "OK".
// No invented "Healthy" judgement for Apps whose read failed.
export function WorkspaceHealthCard({ stats }: { stats: WorkspaceStats }) {
  const live = WORKSPACES.filter((w) => w.dataStatus === "live" && w.href);

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Workspace Health</h2>
      <ul className="flex flex-col gap-3">
        {live.map((workspace) => {
          const stat = stats[workspace.id];
          return (
            <li key={workspace.id}>
              <Link
                href={workspace.href ?? "#"}
                className="flex items-center gap-2.5"
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${workspace.tone}`}>
                  {workspaceIcon(workspace.icon, "h-4 w-4")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-zinc-700 dark:text-zinc-200">{workspace.name}</span>
                  <span className="block truncate text-xs text-zinc-400">{stat ? stat.summary : "Not available"}</span>
                </span>
                {stat && (
                  <span
                    className={`flex shrink-0 items-center gap-1.5 text-xs font-medium ${
                      stat.alert ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${stat.alert ? "bg-amber-500" : "bg-emerald-500"}`} />
                    {stat.alert ?? "OK"}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
