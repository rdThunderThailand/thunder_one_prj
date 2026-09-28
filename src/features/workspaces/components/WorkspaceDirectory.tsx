"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { GridIcon, ListIcon, SearchIcon, StarIcon } from "@/components/ui/icons";
import { togglePinnedWorkspace, usePinnedWorkspaces } from "@/lib/workspace-prefs";
import { WORKSPACE_CATEGORIES, WORKSPACES, type WorkspaceCategory, type WorkspaceEntry } from "../catalog";
import type { WorkspaceStats } from "../services/workspace-stats-api";
import { WorkspaceStatusLine, workspaceIcon } from "./workspace-ui";

function PinButton({ id, pinned }: { id: string; pinned: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={pinned}
      aria-label={pinned ? "Unpin workspace" : "Pin workspace"}
      title={pinned ? "Unpin" : "Pin"}
      onClick={() => togglePinnedWorkspace(id)}
      className={`rounded-md p-1 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
        pinned ? "text-amber-500" : "text-zinc-300 hover:text-zinc-500"
      }`}
    >
      <StarIcon
        className="h-4 w-4"
        filled={pinned}
      />
    </button>
  );
}

function WorkspaceTile({
  workspace,
  stats,
  pinned,
  pinnable,
}: {
  workspace: WorkspaceEntry;
  stats: WorkspaceStats;
  pinned: boolean;
  pinnable: boolean;
}) {
  // Stretched link: the <Link> covers the card, the pin button sits above it
  // (z-10) — a button can't be nested inside an anchor.
  return (
    <Card
      className={`relative flex h-full flex-col p-4 ${workspace.href ? "transition-colors hover:border-indigo-200 dark:hover:border-indigo-800" : "opacity-75"}`}
    >
      {workspace.href && (
        <Link
          href={workspace.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${workspace.name}`}
          className="absolute inset-0 rounded-[inherit]"
        />
      )}
      <div className="flex items-start justify-between">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${workspace.tone}`}>
          {workspaceIcon(workspace.icon)}
        </span>
        {pinnable && workspace.href && (
          <span className="relative z-10">
            <PinButton
              id={workspace.id}
              pinned={pinned}
            />
          </span>
        )}
      </div>
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
    </Card>
  );
}

/**
 * The manager/employee directory (previously two near-identical copies over
 * two mock lists). Search and categories filter `../catalog.ts` client-side;
 * `pinnable` adds a per-browser pin toggle (lib/workspace-prefs.ts) that
 * feeds `PinnedWorkspacesRow`.
 */
export function WorkspaceDirectory({ stats, pinnable = false }: { stats: WorkspaceStats; pinnable?: boolean }) {
  const [category, setCategory] = useState<WorkspaceCategory | "All">("All");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const pins = usePinnedWorkspaces();

  const query = search.trim().toLowerCase();
  const visible = WORKSPACES.filter(
    (w) =>
      (category === "All" || w.category === category) &&
      (!query || w.name.toLowerCase().includes(query) || w.description.toLowerCase().includes(query))
  );
  const categories = ["All", ...WORKSPACE_CATEGORIES.filter((c) => WORKSPACES.some((w) => w.category === c))] as const;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex flex-1 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
          <SearchIcon className="h-4 w-4 shrink-0 text-zinc-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search workspaces..."
            className="min-w-0 flex-1 bg-transparent text-zinc-700 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200"
          />
        </label>
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 p-1 dark:border-zinc-700">
          {(["grid", "list"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={view === mode}
              onClick={() => setView(mode)}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium capitalize ${
                view === mode
                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {mode === "grid" ? <GridIcon className="h-3.5 w-3.5" /> : <ListIcon className="h-3.5 w-3.5" />}
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            aria-pressed={category === cat}
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

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={SearchIcon}
            title="No workspaces found"
            detail="Try a different name or category."
          />
        </Card>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((workspace) => (
            <WorkspaceTile
              key={workspace.id}
              workspace={workspace}
              stats={stats}
              pinned={pins.includes(workspace.id)}
              pinnable={pinnable}
            />
          ))}
        </div>
      ) : (
        <Card className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {visible.map((workspace) => (
            <div
              key={workspace.id}
              className={`relative flex items-center gap-3 p-3 ${workspace.href ? "hover:bg-zinc-50 dark:hover:bg-zinc-800/50" : "opacity-75"}`}
            >
              {workspace.href && (
                <Link
                  href={workspace.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${workspace.name}`}
                  className="absolute inset-0"
                />
              )}
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${workspace.tone}`}>
                {workspaceIcon(workspace.icon, "h-4 w-4")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{workspace.name}</p>
                <WorkspaceStatusLine
                  workspace={workspace}
                  stat={stats[workspace.id]}
                />
              </div>
              {pinnable && workspace.href && (
                <span className="relative z-10">
                  <PinButton
                    id={workspace.id}
                    pinned={pins.includes(workspace.id)}
                  />
                </span>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
