import { APPS } from "@/config/apps";
import { env } from "@/config/env";
import { canOpenApp } from "@/config/tenant-access";

/**
 * Every Workspace the launcher shows, in one list shared by all three page
 * variants (replaces three hand-copied mock tile lists). `href` is taken
 * from `config/apps.tsx` so a tile can only link to a registered App.
 *
 * `dataStatus` is a fact about the App, not a mock metric:
 * - `live` — the App reads Thunder_Core (a live stat from
 *   `services/workspace-stats-api.ts` is shown on its tile).
 * - `sample` — the App exists but still runs on sample data (no Core
 *   integration yet).
 * - `coming-soon` — no App yet; the tile is inert.
 */
export type WorkspaceDataStatus = "live" | "sample" | "coming-soon";
export type WorkspaceIcon = "megaphone" | "box" | "users" | "headset" | "clipboard" | "chart" | "grid" | "check";
export const WORKSPACE_CATEGORIES = ["Communication", "Customer", "Operations", "Project", "Tools"] as const;
export type WorkspaceCategory = (typeof WORKSPACE_CATEGORIES)[number];

export interface WorkspaceEntry {
  id: string;
  name: string;
  description: string;
  category: WorkspaceCategory;
  icon: WorkspaceIcon;
  tone: string;
  href: string | null;
  dataStatus: WorkspaceDataStatus;
}

function appHref(appId: string): string {
  const app = APPS.find((a) => a.id === appId);
  if (!app) throw new Error(`workspaces/catalog: no App registered for id "${appId}"`);
  return app.basePath;
}

export const WORKSPACES: WorkspaceEntry[] = [
  {
    id: "media-workspace",
    name: "Media Workspace",
    description: "Plan, create, approve and publish media across every channel.",
    category: "Communication",
    icon: "megaphone",
    tone: "bg-info-muted text-t1-blue-700",
    href: appHref("media-workspace"),
    dataStatus: "live",
  },
  {
    id: "asset-intelligence",
    name: "Asset Intelligence",
    description: "Track assets, lifecycle, maintenance and compliance in real time.",
    category: "Operations",
    icon: "box",
    tone: "bg-success-muted text-t1-green-700",
    href: appHref("asset-intelligence"),
    dataStatus: "live",
  },
  // ADR 0097: behind the flag until release.
  ...(env.assetWorkspaceMvp
    ? [
        {
          id: "asset-workspace",
          name: "Asset Workspace",
          description: "Register, assign and count assets across every location.",
          category: "Operations",
          icon: "box",
          tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
          href: appHref("asset-workspace"),
          dataStatus: "sample",
        } satisfies WorkspaceEntry,
      ]
    : []),
  {
    id: "people",
    name: "People Workspace",
    description: "Headcount, onboarding, org changes and departures at a glance.",
    category: "Operations",
    icon: "users",
    tone: "bg-accent text-primary",
    href: appHref("people"),
    dataStatus: "live",
  },
  {
    // Temporary Ops tool (2026-09-23) — one page, slated to be wiped later.
    id: "lead-approval",
    name: "Lead Approval",
    description: "Review and approve incoming partner applications.",
    category: "Operations",
    icon: "check",
    tone: "bg-success-muted text-t1-green-700",
    href: appHref("lead-approval"),
    dataStatus: "live",
  },
  {
    id: "customer-workspace",
    name: "Customer Workspace",
    description: "Manage customers, contracts, and renewals in one place.",
    category: "Customer",
    icon: "users",
    tone: "bg-warning-muted text-t1-amber-700",
    href: appHref("customer-workspace"),
    dataStatus: "sample",
  },
  {
    id: "thunder-care",
    name: "Thunder Care",
    description: "IT support, service requests and device management.",
    category: "Operations",
    icon: "headset",
    tone: "bg-success-muted text-t1-green-700",
    href: appHref("thunder-care"),
    dataStatus: "sample",
  },
  {
    id: "projects",
    name: "Projects",
    description: "Plan, track and deliver projects with milestones and tasks.",
    category: "Project",
    icon: "clipboard",
    tone: "bg-error-muted text-t1-red-700",
    href: null,
    dataStatus: "coming-soon",
  },
  {
    id: "analytics",
    name: "Analytics",
    description: "Dashboards, reports, and in-depth analysis.",
    category: "Tools",
    icon: "chart",
    tone: "bg-info-muted text-t1-blue-700",
    href: null,
    dataStatus: "coming-soon",
  },
  {
    id: "documents",
    name: "Document Workspace",
    description: "Store documents, templates, and route document approvals.",
    category: "Tools",
    icon: "box",
    tone: "bg-muted text-muted-foreground",
    href: null,
    dataStatus: "coming-soon",
  },
];

export const DATA_STATUS_LABEL: Record<WorkspaceDataStatus, string> = {
  live: "Live data",
  sample: "Sample data",
  "coming-soon": "Coming soon",
};

export function findWorkspace(id: string): WorkspaceEntry | undefined {
  return WORKSPACES.find((w) => w.id === id);
}

/** The catalog a tenant sees (config/tenant-access.ts): all of it when
 *  `allowedAppIds` is null, otherwise only the allowed Apps (so no
 *  coming-soon tiles either). */
export function visibleWorkspaces(allowedAppIds: ReadonlySet<string> | null): WorkspaceEntry[] {
  return allowedAppIds === null ? WORKSPACES : WORKSPACES.filter((w) => canOpenApp(allowedAppIds, w.id));
}
