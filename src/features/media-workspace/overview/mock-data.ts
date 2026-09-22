// Overview data status:
// - `NowNextPublicationsCard` reads the existing publications API.
// - Everything exported here remains an R&D placeholder until the corresponding
//   monitoring/read-side endpoint exists. Do not present it as live telemetry.


export interface AlertItemData {
  id: string;
  severity: "red" | "yellow" | "blue";
  title: string;
  subtitle: string;
  timeAgo: string;
  category: "Screen" | "TV" | "Kiosk" | "PA";
}

export const recentAlerts: AlertItemData[] = [
  {
    id: "1",
    severity: "red",
    title: "Central World - LED Screen 3",
    subtitle: "Connection lost",
    timeAgo: "5m ago",
    category: "Screen",
  },
  {
    id: "2",
    severity: "yellow",
    title: "Siam Square Branch",
    subtitle: "Player offline",
    timeAgo: "10m ago",
    category: "TV",
  },
  {
    id: "3",
    severity: "yellow",
    title: "Paragon - LED Pillar 02",
    subtitle: "Low brightness",
    timeAgo: "15m ago",
    category: "Screen",
  },
  {
    id: "4",
    severity: "blue",
    title: "Website Banner",
    subtitle: "Asset expired soon",
    timeAgo: "30m ago",
    category: "Kiosk",
  },
  {
    id: "5",
    severity: "blue",
    title: "PA Zone 03 - No Heartbeat",
    subtitle: "Device not responding",
    timeAgo: "35m ago",
    category: "PA",
  },
];

export const channelTypes = [
  { label: "Screens", count: 82, online: 80, issues: 2, icon: "monitor" },
  { label: "TV", count: 24, online: 24, issues: 0, icon: "broadcast" },
  { label: "PA / Audio", count: 28, online: 27, issues: 1, icon: "megaphone" },
  { label: "Kiosks", count: 8, online: 7, issues: 1, icon: "layout" },
] as const;

export interface StatusRow {
  label: string;
  color: "green" | "yellow" | "red";
  count: number;
  percent: number;
}

export const channelStatusRows: StatusRow[] = [
  { label: "Online", color: "green", count: 186, percent: 90.3 },
  { label: "Warning", color: "yellow", count: 12, percent: 5.8 },
  { label: "Offline", color: "red", count: 8, percent: 3.9 },
];

export interface TopChannelRow {
  rank: number;
  name: string;
  platform: string;
  views: string;
}

export const topPerformingChannels: TopChannelRow[] = [
  { rank: 1, name: "Central World - LED Screen 1", platform: "DOOH", views: "1.2M" },
  { rank: 2, name: "KFC Drive Thru Screens", platform: "DOOH", views: "879K" },
  { rank: 3, name: "Facebook Page", platform: "Social", views: "645K" },
  { rank: 4, name: "Website Homepage Banner", platform: "Online", views: "523K" },
  { rank: 5, name: "Siam Paragon - Digital Wall", platform: "DOOH", views: "412K" },
];

// PublicationRow / nowLivePublications / nextUpPublications lived here until
// NowNextPublicationsCard started reading GET /media/publications. Its `version`
// column had no source anywhere in the API or the domain model.

export type QuickActionIcon =
  | "publication"
  | "playlist"
  | "upload"
  | "campaign"
  | "schedule"
  | "channel";

export interface QuickActionData {
  label: string;
  icon: QuickActionIcon;
  color: "indigo" | "blue" | "emerald" | "amber" | "violet" | "teal";
  href?: string; // omit for actions not built yet — renders inert
}

export const quickActions: QuickActionData[] = [
  { label: "Create Publication", icon: "publication", color: "indigo", href: "/media-workspace/publications/create" },
  { label: "Create Playlist", icon: "playlist", color: "blue", href: "/media-workspace/playlists/create" },
  { label: "Create Program", icon: "campaign", color: "amber" },
  { label: "Upload Media", icon: "upload", color: "emerald", href: "/media-workspace/assets/upload" },
  { label: "Add Channel", icon: "channel", color: "teal" },
  { label: "Schedule Program", icon: "schedule", color: "violet" },
];
