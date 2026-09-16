import type { NowNextOccurrence, NowNextResponse, NowNextRow } from "./now-next";

function at(minutes: number) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function cover(name: string) {
  const hue = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  const label = name.split(" ").slice(0, 2).join(" ");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="140" viewBox="0 0 240 140"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl(${hue} 72% 32%)"/><stop offset="1" stop-color="hsl(${(hue + 55) % 360} 78% 58%)"/></linearGradient></defs><rect width="240" height="140" rx="16" fill="url(#g)"/><circle cx="202" cy="26" r="46" fill="white" opacity=".12"/><path d="M-10 118 78 44l64 62 44-35 64 69H-10z" fill="white" opacity=".12"/><text x="18" y="112" fill="white" font-family="Arial,sans-serif" font-size="22" font-weight="700">${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function occurrence(id: string, name: string, opensIn: number, duration: number, playback: NowNextOccurrence["playback_state"] = "not_confirmed", priority: NowNextOccurrence["priority"] = "normal"): NowNextOccurrence {
  return {
    occurrence_id: id,
    opens_at: at(opensIn),
    closes_at: at(opensIn + duration),
    remaining_seconds: opensIn <= 0 ? (opensIn + duration) * 60 : null,
    priority,
    output_kind: "publication",
    publications: [{ id, name, publication_type: "playlist", content_name: name, thumbnail_url: cover(name) }],
    scheduled_now: opensIn <= 0,
    playback_state: playback,
    suppressed: [],
  };
}

const demoRows: NowNextRow[] = [
  {
    row_type: "channel",
    channel: { id: "demo-central-world", name: "Central World - LED Screen 3" },
    device: null,
    devices: [{ id: "demo-device-1", name: "LED Screen 3", status_level: "online", last_heartbeat_at: at(0), playback_state: "confirmed" }],
    current: occurrence("demo-morning", "Morning Corporate", -5, 35, "confirmed"),
    upcoming: [occurrence("demo-lunch", "Lunch Promotion", 30, 60, "not_confirmed", "normal")],
    suppressed_count: 0,
  },
  {
    row_type: "channel",
    channel: { id: "demo-siam", name: "Siam Paragon - Digital Wall" },
    device: null,
    devices: [{ id: "demo-device-2", name: "Digital Wall", status_level: "warning", last_heartbeat_at: at(-8), playback_state: "stale" }],
    current: occurrence("demo-coffee", "Coffee Lovers", -12, 30, "stale", "high"),
    upcoming: [occurrence("demo-safety", "Safety Awareness", 18, 45, "not_confirmed", "high"), occurrence("demo-launch", "New Product Launch", 90, 45, "not_confirmed", "low")],
    suppressed_count: 1,
  },
  {
    row_type: "direct_device",
    channel: null,
    device: { id: "demo-device-3", name: "Lobby TV - Building A" },
    devices: [],
    current: occurrence("demo-news", "Company News", -7, 22),
    upcoming: [occurrence("demo-weather", "Weather Update", 15, 10, "not_confirmed", "low"), occurrence("demo-training", "Internal Training", 75, 40, "not_confirmed", "high")],
    suppressed_count: 0,
  },
  {
    row_type: "channel",
    channel: { id: "demo-idle", name: "Visitor Kiosk - Main Lobby" },
    device: null,
    devices: [{ id: "demo-device-4", name: "Visitor Kiosk", status_level: "offline", last_heartbeat_at: at(-120), playback_state: "not_confirmed" }],
    current: null,
    upcoming: [],
    suppressed_count: 0,
  },
];

export function getDemoPublication(id: string) {
  for (const row of demoRows) {
    for (const occurrence of [row.current, ...row.upcoming]) {
      const publication = occurrence?.publications.find((item) => item.id === id);
      if (publication && occurrence) return { publication, occurrence, channelName: row.channel?.name ?? row.device?.name ?? "Direct Media Device" };
    }
  }
  return null;
}

export function getDemoNowNext(horizon: 60 | 180, includeIdle: boolean, query: string): NowNextResponse {
  const needle = query.trim().toLowerCase();
  const rows = demoRows
    .filter((row) => includeIdle || row.current || row.upcoming.length)
    .map((row) => ({ ...row, upcoming: row.upcoming.filter((item) => new Date(item.opens_at).getTime() <= Date.now() + horizon * 60_000) }))
    .filter((row) => !needle || [row.channel?.name, row.device?.name, row.current?.publications[0]?.name, ...row.upcoming.flatMap((item) => item.publications.map((publication) => publication.name))].some((value) => value?.toLowerCase().includes(needle)));

  return {
    as_of: new Date().toISOString(),
    display_timezone: "Asia/Bangkok",
    horizon_minutes: horizon,
    freshness: { online_before: at(-2), warning_before: at(-10) },
    summary: {
      scheduled_now_channels: rows.filter((row) => row.current).length,
      playback_confirmed_channels: rows.filter((row) => row.current?.playback_state === "confirmed").length,
      upcoming_60m_channels: rows.filter((row) => row.upcoming.some((item) => new Date(item.opens_at).getTime() <= Date.now() + 60 * 60_000)).length,
      upcoming_3h_channels: rows.filter((row) => row.upcoming.length).length,
      total_active_channels: demoRows.filter((row) => row.row_type === "channel").length,
    },
    rows,
  };
}
