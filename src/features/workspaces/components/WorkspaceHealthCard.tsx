import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, BoxIcon, HeadsetIcon, ImageIcon, MegaphoneIcon, UsersIcon } from "@/components/ui/icons";
import { workspaceHealth, type WorkspaceIcon } from "../mock-data";

const iconFor: Record<WorkspaceIcon, React.ReactNode> = {
  megaphone: <MegaphoneIcon className="h-4 w-4" />,
  image: <ImageIcon className="h-4 w-4" />,
  box: <BoxIcon className="h-4 w-4" />,
  users: <UsersIcon className="h-4 w-4" />,
  headset: <HeadsetIcon className="h-4 w-4" />,
  clipboard: <BoxIcon className="h-4 w-4" />,
  chart: <BoxIcon className="h-4 w-4" />,
};

export function WorkspaceHealthCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Workspace Health</h2>
        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">View all</span>
      </div>
      <ul className="flex flex-col gap-3">
        {workspaceHealth.map((row) => (
          <li key={row.id} className="flex items-center gap-2.5">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${row.iconTone}`}>
              {iconFor[row.icon]}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-zinc-700 dark:text-zinc-200">{row.name}</span>
            <span
              className={`flex shrink-0 items-center gap-1.5 text-xs font-medium ${
                row.status === "Healthy" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${row.status === "Healthy" ? "bg-emerald-500" : "bg-amber-500"}`}
              />
              {row.status}
            </span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="mt-3 flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
      >
        View details
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}
