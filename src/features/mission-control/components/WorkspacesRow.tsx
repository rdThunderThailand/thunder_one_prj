import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { GridIcon, MoreIcon, SettingsIcon, UsersIcon } from "@/components/ui/icons";
import { APPS } from "@/config/apps";

interface PlaceholderTile {
  label: string;
  icon: React.ReactNode;
}

// Apps not built yet — rendered inert (no href), same convention as an
// unbuilt NavItem elsewhere in the sidebar.
const PLACEHOLDER_TILES: PlaceholderTile[] = [
  { label: "CRM", icon: <UsersIcon /> },
  { label: "People", icon: <UsersIcon /> },
];

export function WorkspacesRow() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GridIcon className="h-4 w-4 text-indigo-500" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Workspaces</h2>
            <p className="text-xs text-zinc-400">Open specialized apps in a new tab (SSO)</p>
          </div>
        </div>
        <Link
          href="/work-space"
          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          Manage Workspace Access
          <SettingsIcon className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {APPS.map((app) => (
          <Link
            key={app.id}
            href={app.basePath}
            className="flex flex-col items-center gap-2 rounded-xl border border-zinc-100 p-4 text-center transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-zinc-800 dark:hover:border-indigo-800 dark:hover:bg-indigo-500/5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              {app.icon}
            </span>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{app.label}</span>
            <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
              Go to Workspace ↗
            </span>
          </Link>
        ))}

        {PLACEHOLDER_TILES.map((tile) => (
          <div
            key={tile.label}
            title="Not built yet"
            className="flex cursor-not-allowed flex-col items-center gap-2 rounded-xl border border-zinc-100 p-4 text-center opacity-50 dark:border-zinc-800"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
              {tile.icon}
            </span>
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{tile.label}</span>
            <span className="text-[11px] font-medium text-zinc-300 dark:text-zinc-600">Coming soon</span>
          </div>
        ))}

        <Link
          href="/work-space"
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-200 p-4 text-center text-zinc-400 transition-colors hover:border-indigo-300 hover:text-indigo-500 dark:border-zinc-700"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <MoreIcon className="h-4 w-4" />
          </span>
          <span className="text-sm font-medium">More</span>
          <span className="text-[11px] font-medium">View all ↗</span>
        </Link>
      </div>
    </Card>
  );
}
