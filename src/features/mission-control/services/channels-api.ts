// Real Thunder_Core integration for the homepage's display counts
// ("จอแสดงผล", "จอแสดงผลออนไลน์") — server-only, token passed in
// explicitly, fails open to `null` (same shape as dashboard-api.ts).
//
// Counts Media Workspace **channels** by their player health, the same
// source and rollup Media Workspace's own Overview uses (ADR 0074 §4:
// channel status is the player's health — channels, not the older
// `devices` table the tenant dashboard's `playerStatus` counts, which reads
// 0 for tenants whose screens exist only as channels). Core resolves the
// media tenant from the token + app key, so no tenant id in the path.
// A minimal local reader rather than importing media-workspace's internal
// channels-api (its public barrel only exposes the client-side fetch).
import { coreGet } from "@/lib/core/core-get";

type ChannelHealth = "online" | "warning" | "offline" | null;

export interface ChannelHealthSummary {
  total: number;
  online: number;
}

export async function getChannelHealthSummary(token: string): Promise<ChannelHealthSummary | null> {
  const data = await coreGet<unknown>("/media/channels", token);
  const channels = Array.isArray(data)
    ? data
    : data !== null && typeof data === "object" && Array.isArray((data as { channels?: unknown }).channels)
      ? (data as { channels: unknown[] }).channels
      : null;
  if (channels === null) return null;

  const online = channels.filter((channel) => (channel as { health?: ChannelHealth })?.health === "online").length;
  return { total: channels.length, online };
}
