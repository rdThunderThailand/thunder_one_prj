import type { ReactNode } from "react";
import {
  BoxIcon,
  ChartIcon,
  CheckCircleIcon,
  ClipboardIcon,
  GridIcon,
  HeadsetIcon,
  MegaphoneIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { DATA_STATUS_LABEL, type WorkspaceEntry, type WorkspaceIcon } from "../catalog";
import type { WorkspaceStat } from "../services/workspace-stats-api";

// Shared by every Workspaces variant so a tile's icon and status line look
// the same on the CEO grid, the directory and the pinned/recent rows.

export function workspaceIcon(icon: WorkspaceIcon, className = "h-5 w-5"): ReactNode {
  switch (icon) {
    case "megaphone":
      return <MegaphoneIcon className={className} />;
    case "box":
      return <BoxIcon className={className} />;
    case "users":
      return <UsersIcon className={className} />;
    case "headset":
      return <HeadsetIcon className={className} />;
    case "clipboard":
      return <ClipboardIcon className={className} />;
    case "chart":
      return <ChartIcon className={className} />;
    case "check":
      return <CheckCircleIcon className={className} />;
    case "grid":
      return <GridIcon className={className} />;
  }
}

/**
 * The tile's one status line: a live App's real stat (or "Couldn't load" if
 * its read failed or this user can't read it — e.g. Lead Approval's 403
 * for non-reviewers, which coreGet can't tell apart from a failure),
 * otherwise the App's data status ("Sample data" /
 * "Coming soon"). `stat === undefined` means no stat is fetched for this
 * App at all.
 */
export function WorkspaceStatusLine({ workspace, stat }: { workspace: WorkspaceEntry; stat: WorkspaceStat | null | undefined }) {
  if (workspace.dataStatus === "live" && stat !== undefined) {
    if (stat === null) {
      return <span className="text-xs text-zinc-400">Not available</span>;
    }
    return (
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {stat.summary}
        </span>
        {stat.alert && (
          <span className="rounded-full bg-amber-50 px-1.5 py-0.5 font-medium text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
            {stat.alert}
          </span>
        )}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
      <span
        className={`h-1.5 w-1.5 rounded-full ${workspace.dataStatus === "coming-soon" ? "bg-zinc-300 dark:bg-zinc-600" : "bg-amber-400"}`}
      />
      {DATA_STATUS_LABEL[workspace.dataStatus]}
    </span>
  );
}
