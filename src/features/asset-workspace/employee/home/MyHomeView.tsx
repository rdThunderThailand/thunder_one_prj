// Home (EMP-01): overview and next actions for the employee's three use cases (persona map §3–§5): UC-002 my assets,
// UC-007 my inventory tasks, UC-011 scan. Links only; no admin action or count (M4, persona map §2).
import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatTile } from "@/components/ui/StatTile";
import { CheckSquareIcon, MyAssetsIcon, ScanIcon, ToolIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { AssetThumbnail } from "../../components/AssetThumbnail";
import { StatusValue } from "../../components/asset-profile/ProfileParts";
import type { ListData } from "../../components/list-page/AssetWorkspaceListPage";
import { bangkokToday, dueHint } from "../../domain/inventory";
import type { SessionRow } from "../../services/asset-reports-api";
import type { AssetListRow } from "../../services/assets-list-types";
import { myTaskHref } from "../my-tasks/my-tasks";

const BASE = "/asset-workspace";
const TASKS_HREF = `${BASE}/my-tasks?status=${encodeURIComponent("In Progress")}`;
const count = (value: number | null | undefined) => (value == null ? "—" : value.toLocaleString());
const LOAD_FAILED = "Refresh the page to try again.";

function Section({ title, href, children }: { title: string; href: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <Link
          href={href}
          className="text-sm font-medium text-primary hover:underline"
        >
          View all
        </Link>
      </div>
      {children}
    </Card>
  );
}

function TileLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="block rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {children}
    </Link>
  );
}

function TaskList({ tasks }: { tasks: ListData<SessionRow> | null }) {
  if (!tasks) {
    return (
      <ErrorState
        compact
        title="Couldn't load your tasks"
        description={LOAD_FAILED}
      />
    );
  }
  if (tasks.rows.length === 0) {
    return (
      <EmptyState
        compact
        icon={CheckSquareIcon}
        title="Nothing to do right now"
        detail="Inventory checks assigned to you will appear here."
      />
    );
  }
  const today = bangkokToday();
  return (
    <ul className="divide-y divide-border">
      {tasks.rows.map((task) => {
        const hint = dueHint(task.dueDate ?? null, today);
        return (
          <li
            key={task.id}
            className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="min-w-0 flex-1">
              <Link
                href={myTaskHref(task.id)}
                className="font-medium text-primary wrap-anywhere hover:underline"
              >
                {task.name}
              </Link>
              <p className="text-xs text-muted-foreground">{task.scopeLabel}</p>
            </div>
            <div className="flex items-center gap-2 sm:w-44">
              <span className="text-xs whitespace-nowrap tabular-nums">
                {(task.verifiedCount ?? 0).toLocaleString()} / {(task.expectedCount ?? 0).toLocaleString()} checked
              </span>
              <ProgressBar
                value={task.progressPct}
                color={task.progressPct >= 100 ? "emerald" : "indigo"}
                aria-label={`${task.name} progress`}
              />
            </div>
            {hint && (
              <p className={`text-xs whitespace-nowrap sm:w-28 sm:text-right ${hint.overdue ? "font-medium text-error" : "text-muted-foreground"}`}>
                {hint.text}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function LatestAssets({ latest }: { latest: ListData<AssetListRow> | null }) {
  if (!latest) {
    return (
      <ErrorState
        compact
        title="Couldn't load your assets"
        description={LOAD_FAILED}
      />
    );
  }
  if (latest.rows.length === 0) {
    return (
      <EmptyState
        compact
        icon={MyAssetsIcon}
        title="No assets yet"
        detail="Assets assigned to you will appear here."
      />
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {latest.rows.map((asset) => (
        <li key={asset.id}>
          <Link
            href={`${BASE}/my-assets/${encodeURIComponent(asset.id)}`}
            className="group/asset flex h-full flex-col gap-2 rounded-lg border border-border p-3 transition-colors hover:border-foreground/20 hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <AssetThumbnail
              src={asset.thumbnail_url}
              className="aspect-4/3 h-auto w-full object-contain! p-1"
              iconClassName="size-8"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground group-hover/asset:text-primary">{asset.name}</p>
              <p className="text-xs text-muted-foreground">{asset.asset_code}</p>
            </div>
            <span className="self-start">
              <StatusValue status={asset.status} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function MyHomeView({
  firstName,
  latest,
  inMaintenance,
  tasks,
}: {
  firstName: string;
  /** The 4 assets whose status changed last; `null` = the read failed. */
  latest: ListData<AssetListRow> | null;
  inMaintenance: number | null;
  /** The first 5 In Progress tasks; `null` = the read failed. */
  tasks: ListData<SessionRow> | null;
}) {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title={firstName ? `Hello, ${firstName}` : "Hello"}
        subtitle="Your assets and tasks in Asset Workspace."
        actions={
          <Button asChild>
            <Link href={`${BASE}/scan-asset`}>
              <ScanIcon className="size-4" />
              Scan Asset
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <TileLink href={`${BASE}/my-assets`}>
          <StatTile
            label="My Assets"
            value={count(latest?.total)}
            color="indigo"
            icon={<MyAssetsIcon />}
            trend="View all"
          />
        </TileLink>
        <TileLink href={TASKS_HREF}>
          <StatTile
            label="Tasks to do"
            value={count(tasks?.total)}
            color="blue"
            icon={<CheckSquareIcon />}
            trend="View all"
          />
        </TileLink>
        <TileLink href={`${BASE}/my-assets?tab=in-maintenance`}>
          <StatTile
            label="In Maintenance"
            value={count(inMaintenance)}
            color="amber"
            icon={<ToolIcon />}
            trend="View all"
          />
        </TileLink>
      </div>
      <div className="space-y-4">
        <Section
          title="Tasks to do"
          href={TASKS_HREF}
        >
          <TaskList tasks={tasks} />
        </Section>
        <Section
          title="My latest assets"
          href={`${BASE}/my-assets`}
        >
          <LatestAssets latest={latest} />
        </Section>
      </div>
    </div>
  );
}
