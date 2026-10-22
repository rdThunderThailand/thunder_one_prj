"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { GridIcon, ListIcon, SearchIcon, StarIcon } from "@/components/ui/icons";
import { togglePinnedWorkspace, usePinnedWorkspaces } from "@/lib/workspace-prefs";
import { WORKSPACE_CATEGORIES, type WorkspaceCategory, type WorkspaceEntry } from "../catalog";
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
      className={`rounded-md p-1 transition-colors hover:bg-muted ${
        pinned ? "text-warning" : "text-t1-gray-400 hover:text-muted-foreground"
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
      className={`relative flex h-full flex-col p-4 ${workspace.href ? "transition-colors hover:border-t1-blue-200" : "opacity-75"}`}
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
        <p className="font-semibold text-foreground">{workspace.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">{workspace.description}</p>
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
export function WorkspaceDirectory({
  workspaces,
  stats,
  pinnable = false,
}: {
  workspaces: WorkspaceEntry[];
  stats: WorkspaceStats;
  pinnable?: boolean;
}) {
  const [category, setCategory] = useState<WorkspaceCategory | "All">("All");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const pins = usePinnedWorkspaces();

  const query = search.trim().toLowerCase();
  const visible = workspaces.filter(
    (w) =>
      (category === "All" || w.category === category) &&
      (!query || w.name.toLowerCase().includes(query) || w.description.toLowerCase().includes(query))
  );
  const categories = ["All", ...WORKSPACE_CATEGORIES.filter((c) => workspaces.some((w) => w.category === c))] as const;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <SearchIcon className="h-4 w-4 shrink-0 text-t1-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search workspaces..."
            className="min-w-0 flex-1 bg-transparent text-foreground placeholder:text-t1-gray-400 focus:outline-none"
          />
        </label>
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          {(["grid", "list"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={view === mode}
              onClick={() => setView(mode)}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium capitalize ${
                view === mode
                  ? "bg-accent text-primary"
                  : "text-muted-foreground"
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
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
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
        <Card className="divide-y divide-border">
          {visible.map((workspace) => (
            <div
              key={workspace.id}
              className={`relative flex items-center gap-3 p-3 ${workspace.href ? "hover:bg-t1-gray-50" : "opacity-75"}`}
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
                <p className="truncate text-sm font-medium text-foreground">{workspace.name}</p>
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
