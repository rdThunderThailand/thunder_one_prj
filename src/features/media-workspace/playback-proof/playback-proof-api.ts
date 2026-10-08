import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/api-error";
import { requestApi } from "@/lib/api/media-api";
import type { ChannelScope } from "../channels/channel-scope";

export type FailureReason = "decode_error" | "file_missing" | "file_corrupt" | "playback_stalled" | "other";

/** One Player-reported slot (ADR 0089 §1). Program/Source are null when the Player did not report a snapshot. */
export type PlaybackProofEntry = {
  id: string;
  played_at: string;
  duration_played_seconds: number;
  outcome: "played" | "failed";
  failure_reason: FailureReason | null;
  channel: { id: string; name: string; status: string } | null;
  device: { id: string; name: string | null };
  program: { id: string; name: string; status: string } | null;
  source: { type: "playlist" | "composition" | "media"; id: string | null; name: string | null; in_trash: boolean } | null;
  zone_name: string | null;
  media: {
    id: string;
    title: string;
    kind: string;
    in_trash: boolean;
    width: number | null;
    height: number | null;
    duration_seconds: number | null;
    mime_type: string | null;
    size_bytes: number | null;
    thumbnail_url: string | null;
  };
};

export type PlaybackProofKpis = {
  total: number;
  plays: number;
  failed: number;
  airtime_seconds: number;
  screens_reporting: number;
};

export type PlaybackProofResponse = {
  display_timezone: string;
  page: number;
  page_size: number;
  kpis: PlaybackProofKpis;
  items: PlaybackProofEntry[];
};

export type ProgramFilter = { kind: "all" } | { kind: "unattributed" } | { kind: "program"; id: string };

export type PlaybackProofQuery = {
  from: string;
  to: string;
  scope: ChannelScope;
  program: ProgramFilter;
  q: string;
  page: number;
  pageSize: number;
};

export function playbackProofParams(query: Omit<PlaybackProofQuery, "page" | "pageSize">): URLSearchParams {
  const params = new URLSearchParams({ from: query.from, to: query.to });
  if (query.scope.kind === "group") params.set("group_id", query.scope.id);
  if (query.scope.kind === "channel") params.set("channel_id", query.scope.id);
  if (query.program.kind === "program") params.set("publication_id", query.program.id);
  if (query.program.kind === "unattributed") params.set("unattributed", "true");
  if (query.q.trim()) params.set("q", query.q.trim());
  return params;
}

export function fetchPlaybackProof(query: PlaybackProofQuery) {
  const params = playbackProofParams(query);
  params.set("page", String(query.page));
  params.set("page_size", String(query.pageSize));
  return requestApi<PlaybackProofResponse>("GET", `/media/playback-proof?${params}`);
}

/** Downloads the current filters as CSV. A blob keeps the BOM the server adds for Excel; a rejection (e.g. over 50,000 rows) carries its message in an `error` body. */
export async function downloadPlaybackProofCsv(query: Omit<PlaybackProofQuery, "page" | "pageSize">) {
  const res = await apiClient.request<Blob>({
    url: `/api/proxy/media/playback-proof/export?${playbackProofParams(query)}`,
    method: "GET",
    responseType: "blob",
    validateStatus: () => true,
  });
  if (res.status < 200 || res.status >= 300) {
    const body = await res.data.text().then((text) => JSON.parse(text) as { error?: string }).catch(() => ({}) as { error?: string });
    throw new ApiError(body.error ?? `HTTP Error ${res.status}`, res.status);
  }
  // The proxy re-reads the body as text, which drops the server's BOM; put it back so Excel reads Thai names.
  const head = new Uint8Array(await res.data.slice(0, 3).arrayBuffer());
  const hasBom = head[0] === 0xef && head[1] === 0xbb && head[2] === 0xbf;
  const csv = hasBom ? res.data : new Blob(["\uFEFF", res.data], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(csv);
  const a = document.createElement("a");
  a.href = url;
  a.download = "playback-proof.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
