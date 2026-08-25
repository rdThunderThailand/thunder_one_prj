import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, BoxIcon, ClipboardIcon, HeadsetIcon, ImageIcon, MegaphoneIcon, MoreIcon, UsersIcon, ChartIcon } from "@/components/ui/icons";
import { workspaceTiles, type WorkspaceIcon, type WorkspaceTileData } from "../mock-data";

const iconFor: Record<WorkspaceIcon, React.ReactNode> = {
  megaphone: <MegaphoneIcon className="h-5 w-5" />,
  image: <ImageIcon className="h-5 w-5" />,
  box: <BoxIcon className="h-5 w-5" />,
  users: <UsersIcon className="h-5 w-5" />,
  headset: <HeadsetIcon className="h-5 w-5" />,
  clipboard: <ClipboardIcon className="h-5 w-5" />,
  chart: <ChartIcon className="h-5 w-5" />,
};

function AvatarStack({ names, overflow }: { names: string[]; overflow?: number }) {
  return (
    <div className="flex items-center -space-x-2">
      {names.map((name) => (
        <Avatar key={name} name={name} size={22} className="ring-2 ring-white dark:ring-zinc-900" />
      ))}
      {overflow && overflow > 0 && (
        <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-500 ring-2 ring-white dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-900">
          +{overflow}
        </span>
      )}
    </div>
  );
}

function WorkspaceCard({ tile }: { tile: WorkspaceTileData }) {
  const body = (
    <>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tile.iconTone}`}>
        {iconFor[tile.icon]}
      </span>
      <div className="mt-3">
        <p className="font-semibold text-zinc-900 dark:text-zinc-50">{tile.name}</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{tile.description}</p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <span
            className={`h-1.5 w-1.5 rounded-full ${tile.status.kind === "active" ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"}`}
          />
          {tile.status.label}
        </span>
        {tile.collaborators && tile.collaborators.length > 0 && (
          <AvatarStack names={tile.collaborators} overflow={tile.collaboratorsOverflow} />
        )}
      </div>
      <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        {tile.href ? (
          <span className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">
            Open Workspace
            <ArrowRightIcon className="h-3.5 w-3.5 -rotate-45" />
          </span>
        ) : (
          <span
            className="flex cursor-not-allowed items-center gap-1 text-sm font-medium text-zinc-300 dark:text-zinc-700"
            title="Not built yet"
          >
            Open Workspace
            <ArrowRightIcon className="h-3.5 w-3.5 -rotate-45" />
          </span>
        )}
      </div>
    </>
  );

  if (tile.href) {
    return (
      <Link href={tile.href}>
        <Card className="flex h-full flex-col p-4 transition-colors hover:border-indigo-200 dark:hover:border-indigo-800">
          {body}
        </Card>
      </Link>
    );
  }

  return <Card className="flex h-full flex-col p-4">{body}</Card>;
}

export function WorkspaceGrid() {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Your Workspaces</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {workspaceTiles.map((tile) => (
          <WorkspaceCard key={tile.id} tile={tile} />
        ))}

        <Card className="flex h-full flex-col p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            <MoreIcon className="h-5 w-5" />
          </span>
          <div className="mt-3 flex-1">
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">More Workspaces</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Discover and access more workspaces and tools.
            </p>
          </div>
          <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <span
              className="flex cursor-not-allowed items-center gap-1 text-sm font-medium text-zinc-300 dark:text-zinc-700"
              title="Not built yet"
            >
              Explore All
              <ArrowRightIcon className="h-3.5 w-3.5 -rotate-45" />
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
