import Link from "next/link";
import { BoxIcon, ChartIcon, ImageIcon, MegaphoneIcon, PlusIcon, UsersIcon } from "@/components/ui/icons";
import { pinnedWorkspaces, type ManagerWorkspaceIcon, type PinnedWorkspaceData } from "../mock-data";

const iconFor: Record<ManagerWorkspaceIcon, React.ReactNode> = {
  megaphone: <MegaphoneIcon className="h-3.5 w-3.5" />,
  image: <ImageIcon className="h-3.5 w-3.5" />,
  users: <UsersIcon className="h-3.5 w-3.5" />,
  clipboard: <BoxIcon className="h-3.5 w-3.5" />,
  settings: <BoxIcon className="h-3.5 w-3.5" />,
  chart: <ChartIcon className="h-3.5 w-3.5" />,
  box: <BoxIcon className="h-3.5 w-3.5" />,
  grid: <BoxIcon className="h-3.5 w-3.5" />,
};

function PinChip({ pin }: { pin: PinnedWorkspaceData }) {
  const classes =
    "flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200";
  const content = (
    <>
      <span className="text-indigo-500">{iconFor[pin.icon]}</span>
      {pin.label}
    </>
  );
  return pin.href ? (
    <Link href={pin.href} className={`${classes} hover:border-indigo-200`}>
      {content}
    </Link>
  ) : (
    <span className={`${classes} cursor-not-allowed opacity-60`} title="Not built yet">
      {content}
    </span>
  );
}

export function PinnedWorkspacesRow() {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Pinned Workspaces</h2>
        <span
          title="Not built yet"
          className="cursor-not-allowed text-xs font-medium text-indigo-600 dark:text-indigo-400"
        >
          Manage Pinned
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {pinnedWorkspaces.map((pin) => (
          <PinChip key={pin.id} pin={pin} />
        ))}
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center gap-1.5 rounded-full border border-dashed border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-400 dark:border-zinc-700"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Add Workspace
        </span>
      </div>
    </div>
  );
}
