// Real Thunder_Core stats for the Workspaces launcher — one headline number
// per `live` App, server-only, token passed in explicitly, every read fails
// open to `null` (coreGet's contract), so a tile shows "Couldn't load"
// rather than a number it doesn't have. Minimal local reads rather than
// importing each App's internal service files — same "each feature owns its
// own services/*-api.ts" convention as the rest of the app.
import { coreGet } from "@/lib/core/core-get";

export interface WorkspaceStat {
  /** Plain fact shown under the tile name, e.g. "6 channels · 0 online". */
  summary: string;
  /** Set only when something concrete needs attention. */
  alert: string | null;
}

export type WorkspaceStats = Record<string, WorkspaceStat | null>;

export interface CoreRecentLog {
  id: string;
  created_at: string;
  action: string;
  description: string;
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

async function mediaStat(token: string): Promise<WorkspaceStat | null> {
  const data = await coreGet<unknown>("/media/channels", token);
  const channels = Array.isArray(data)
    ? data
    : data !== null && typeof data === "object" && Array.isArray((data as { channels?: unknown }).channels)
      ? (data as { channels: unknown[] }).channels
      : null;
  if (channels === null) return null;
  const online = channels.filter((c) => (c as { health?: string })?.health === "online").length;
  const offline = channels.filter((c) => (c as { health?: string })?.health === "offline").length;
  return {
    summary: `${plural(channels.length, "channel")} · ${online} online`,
    alert: offline > 0 ? `${offline} offline` : null,
  };
}

async function assetStat(token: string, tenantId: string): Promise<WorkspaceStat | null> {
  const data = await coreGet<{ total: number; byStatus: { status: string; count: number }[] }>(
    `/tenants/${tenantId}/assets/summary`,
    token
  );
  if (!data) return null;
  const needCare = data.byStatus.find((s) => s.status === "In Progress")?.count ?? 0;
  return { summary: plural(data.total, "asset"), alert: needCare > 0 ? `${needCare} in maintenance` : null };
}

async function peopleStat(token: string, tenantId: string): Promise<WorkspaceStat | null> {
  const data = await coreGet<{ data: unknown[]; count: number }>(`/tenants/${tenantId}/members?limit=1`, token);
  return data ? { summary: plural(data.count, "member"), alert: null } : null;
}

/** Reviewers only — anyone else gets a 403, which lands here as `null`. */
async function leadApprovalStat(token: string): Promise<WorkspaceStat | null> {
  const data = await coreGet<{ status: string }[]>("/partner-applications", token);
  if (!data) return null;
  const pending = data.filter((a) => a.status === "PENDING").length;
  return { summary: `${pending} pending review`, alert: pending > 0 ? `${pending} to review` : null };
}

export async function getWorkspaceStats(token: string, tenantId: string): Promise<WorkspaceStats> {
  const [media, asset, people, lead] = await Promise.all([
    mediaStat(token),
    assetStat(token, tenantId),
    peopleStat(token, tenantId),
    leadApprovalStat(token),
  ]);
  return { "media-workspace": media, "asset-intelligence": asset, people, "lead-approval": lead };
}

/** Tenant-wide audit trail (`GET /tenants/:id/dashboard`'s `recentLogs`) —
 *  the manager variant's "Recent Activity". */
export async function getRecentActivity(token: string, tenantId: string): Promise<CoreRecentLog[] | null> {
  const data = await coreGet<{ recentLogs: CoreRecentLog[] }>(`/tenants/${tenantId}/dashboard`, token);
  return data ? data.recentLogs : null;
}
