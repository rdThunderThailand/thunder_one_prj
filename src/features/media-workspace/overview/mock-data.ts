// R&D placeholder data for the Overview dashboard — no backend exists yet.
// Replace with real data fetching once `assets`/`channels`/`playlists`
// services are implemented.
import type { DonutSegment } from "@/components/ui/DonutChart";

export interface StatCardData {
  id: string;
  label: string;
  value: string;
  total?: string;
  delta: string;
  trend: number[];
  color: "indigo" | "blue" | "amber" | "emerald";
  icon: "monitor" | "paperPlane" | "calendar" | "checkCircle";
  failedLabel?: string;
  failedProgress?: number;
}

export const statCards: StatCardData[] = [
  {
    id: "active-channels",
    label: "Active Channels",
    value: "186",
    total: "206",
    delta: "12",
    trend: [40, 42, 38, 45, 50, 48, 55, 60, 58, 62, 65, 63],
    color: "indigo",
    icon: "monitor",
  },
  {
    id: "live-publications",
    label: "Live Publications",
    value: "253",
    delta: "18",
    trend: [30, 35, 33, 40, 45, 42, 48, 50, 55, 52, 58, 60],
    color: "blue",
    icon: "paperPlane",
  },
  {
    id: "scheduled-today",
    label: "Scheduled Today",
    value: "128",
    delta: "7",
    trend: [20, 25, 22, 28, 30, 27, 32, 35, 33, 38, 36, 40],
    color: "amber",
    icon: "calendar",
  },
  {
    id: "delivery-success-rate",
    label: "Delivery Success Rate",
    value: "98.6%",
    delta: "1.2%",
    trend: [96, 97, 95, 98, 97, 99, 98, 97, 99, 98, 99, 98.6],
    color: "emerald",
    icon: "checkCircle",
    failedLabel: "Failed 3 (1.4%)",
    failedProgress: 98.6,
  },
];

export interface AlertItemData {
  id: string;
  severity: "red" | "yellow" | "blue";
  title: string;
  subtitle: string;
  timeAgo: string;
}

export const recentAlerts: AlertItemData[] = [
  {
    id: "1",
    severity: "red",
    title: "Central World - LED Screen 3",
    subtitle: "Connection lost",
    timeAgo: "5m ago",
  },
  {
    id: "2",
    severity: "yellow",
    title: "Siam Square Branch",
    subtitle: "Player offline",
    timeAgo: "18m ago",
  },
  {
    id: "3",
    severity: "yellow",
    title: "Paragon - LED Pillar 02",
    subtitle: "Low brightness",
    timeAgo: "32m ago",
  },
  {
    id: "4",
    severity: "blue",
    title: "Website Banner",
    subtitle: "Asset expired soon",
    timeAgo: "50m ago",
  },
];

// Colors are a validated categorical palette (see dataviz skill's
// validate_palette.js) — the original indigo/blue pair failed CVD
// separation (ΔE 7.2, indistinguishable to most colorblind and even some
// normal-vision viewers) and gray "Other" fell below the chroma floor.
export const channelDistribution: DonutSegment[] = [
  { label: "DOOH", value: 78, color: "#2a78d6" },
  { label: "In-Store", value: 56, color: "#eb6834" },
  { label: "Online", value: 34, color: "#1baf7a" },
  { label: "Social", value: 24, color: "#eda100" },
  { label: "Other", value: 14, color: "#e87ba4" },
];

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
  { label: "Create Playlist", icon: "playlist", color: "blue" },
  { label: "Upload Media", icon: "upload", color: "emerald" },
  { label: "Create Campaign", icon: "campaign", color: "amber" },
  { label: "Schedule Publication", icon: "schedule", color: "violet" },
  { label: "Add Channel", icon: "channel", color: "teal" },
];
