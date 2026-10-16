import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { WorkspaceEntry } from "../catalog";
import type { WorkspaceStats } from "../services/workspace-stats-api";
import { workspaceIcon } from "./workspace-ui";

// One row per live Workspace with its real stat. The chip is the stat's own
// alert (e.g. "6 offline") — shown only when there is one; otherwise "OK".
// No invented "Healthy" judgement for Apps whose read failed.
export function WorkspaceHealthCard({ workspaces, stats }: { workspaces: WorkspaceEntry[]; stats: WorkspaceStats }) {
  const live = workspaces.filter((w) => w.dataStatus === "live" && w.href);

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Workspace Health</h2>
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
                  <span className="block truncate text-sm text-foreground">{workspace.name}</span>
                  <span className="block truncate text-xs text-t1-gray-400">{stat ? stat.summary : "Not available"}</span>
                </span>
                {stat && (
                  <span
                    className={`flex shrink-0 items-center gap-1.5 text-xs font-medium ${
                      stat.alert ? "text-t1-amber-700" : "text-t1-green-700"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${stat.alert ? "bg-warning" : "bg-success"}`} />
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
