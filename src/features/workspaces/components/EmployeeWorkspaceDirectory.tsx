"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  ArrowRightIcon,
  BoxIcon,
  ChartIcon,
  ChevronDownIcon,
  GridIcon,
  ImageIcon,
  ListIcon,
  MegaphoneIcon,
  MoreIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
} from "@/components/ui/icons";
import {
  employeeMoreWorkspacesTile,
  employeeWorkspaceCategories,
  employeeWorkspaceTiles,
  type EmployeeWorkspaceTileData,
  type ManagerWorkspaceIcon,
  type ManagerWorkspaceRole,
} from "../mock-data";

const iconFor: Record<ManagerWorkspaceIcon, React.ReactNode> = {
  megaphone: <MegaphoneIcon />,
  image: <ImageIcon />,
  users: <UsersIcon />,
  clipboard: <ListIcon />,
  settings: <SettingsIcon />,
  chart: <ChartIcon />,
  box: <BoxIcon />,
  grid: <GridIcon />,
};

const roleBadge: Record<ManagerWorkspaceRole, "indigo" | "zinc" | "blue" | "yellow" | "green"> = {
  Editor: "indigo",
  User: "zinc",
  Member: "blue",
  Viewer: "yellow",
  Admin: "green",
};

function AvatarStack({ names, overflow }: { names: string[]; overflow: number }) {
  return (
    <div className="flex items-center -space-x-2">
      {names.map((name) => (
        <Avatar key={name} name={name} size={22} className="ring-2 ring-white dark:ring-zinc-900" />
      ))}
      <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-500 ring-2 ring-white dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-900">
        +{overflow}
      </span>
    </div>
  );
}

function WorkspaceTile({ tile }: { tile: EmployeeWorkspaceTileData }) {
  const body = (
    <>
      <div className="flex items-start justify-between">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tile.iconTone}`}>
          {iconFor[tile.icon]}
        </span>
        <MoreIcon className="h-4 w-4 text-zinc-300" />
      </div>
      <div className="mt-3 flex-1">
        <p className="font-semibold text-zinc-900 dark:text-zinc-50">{tile.name}</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{tile.description}</p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <AvatarStack names={tile.members} overflow={tile.membersOverflow} />
        <Badge color={roleBadge[tile.roleLabel]} variant="pill">
          {tile.roleLabel}
        </Badge>
      </div>
      <div className="mt-4">
        {tile.href ? (
          <span className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white">
            Open Workspace ↗
          </span>
        ) : (
          <span
            title="Not built yet"
            className="flex cursor-not-allowed items-center justify-center gap-1.5 rounded-lg bg-zinc-100 py-2 text-sm font-semibold text-zinc-400 dark:bg-zinc-800"
          >
            Open Workspace ↗
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

function MoreWorkspacesTile() {
  return (
    <Card className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${employeeMoreWorkspacesTile.iconTone}`}>
        {iconFor[employeeMoreWorkspacesTile.icon]}
      </span>
      <div>
        <p className="font-semibold text-zinc-900 dark:text-zinc-50">{employeeMoreWorkspacesTile.name}</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{employeeMoreWorkspacesTile.description}</p>
      </div>
      <span
        title="Not built yet"
        className="flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-zinc-200 py-2 text-sm font-semibold text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
      >
        View All
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </span>
    </Card>
  );
}

export function EmployeeWorkspaceDirectory() {
  const [category, setCategory] = useState<(typeof employeeWorkspaceCategories)[number]>("All");
  const [view, setView] = useState<"grid" | "list">("grid");

  const tiles =
    category === "All" ? employeeWorkspaceTiles : employeeWorkspaceTiles.filter((t) => t.category === category);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">
          <SearchIcon className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate" title="Not built yet">
            Search workspaces...
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 p-1 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${
              view === "grid"
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            <GridIcon className="h-3.5 w-3.5" />
            Grid
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${
              view === "list"
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            <ListIcon className="h-3.5 w-3.5" />
            List
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {employeeWorkspaceCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
                category === cat
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
        >
          All Access
          <ChevronDownIcon className="h-3 w-3" />
        </span>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((tile) => (
            <WorkspaceTile key={tile.id} tile={tile} />
          ))}
          <MoreWorkspacesTile />
        </div>
      ) : (
        <Card className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {tiles.map((tile) => (
            <div key={tile.id} className="flex items-center gap-3 p-3">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tile.iconTone}`}>
                {iconFor[tile.icon]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{tile.name}</p>
                <p className="truncate text-xs text-zinc-400">{tile.description}</p>
              </div>
              <Badge color={roleBadge[tile.roleLabel]} variant="pill" className="shrink-0">
                {tile.roleLabel}
              </Badge>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
