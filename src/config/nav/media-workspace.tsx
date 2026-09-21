// Media Workspace's sidebar nav — extracted verbatim from Sidebar.tsx
// (docs/adr/0022-app-switcher-multi-app-shell.md) with no behavior change
// beyond the app moving from "/" to "/communication" originally, and from
// "/communication" to "/media-workspace" since (Nie, 2026-08-25 — this is a
// media/DOOH publishing feature, not a generic "Communication" one; "Media
// Workspace" was the original, correct name per CONTEXT.md).
import {
  Activity,
  Bell,
  BarChart3,
  CalendarDays,
  Clock3,
  Folder,
  Grid2x2,
  HeartPulse,
  LayoutDashboard,
  ListVideo,
  Megaphone,
  PlaySquare,
  Radio,
  TrendingUp,
  Users,
} from "lucide-react";
import type { NavConfig, NavItem } from "./types";

const iconClass = "h-full w-full";

export const mediaWorkspaceNav: NavConfig = {
  overviewItem: {
    label: "Overview",
    href: "/media-workspace",
    icon: <Grid2x2 className={iconClass} />,
  },
  sections: [
    {
      label: "Content",
      items: [
        { label: "Media Library", href: "/media-workspace/assets", icon: <Folder className={iconClass} /> },
        { label: "Playlists", href: "/media-workspace/playlists", icon: <ListVideo className={iconClass} /> },
        { label: "Layouts", href: "/media-workspace/layouts", icon: <LayoutDashboard className={iconClass} /> },
      ],
    },
    {
      label: "Programming",
      items: [
        { label: "Programs", href: "/media-workspace/publications/manage", icon: <PlaySquare className={iconClass} /> },
        { label: "Now & Next", href: "/media-workspace/publications", icon: <Clock3 className={iconClass} /> },
        { label: "Calendar", icon: <CalendarDays className={iconClass} /> },
      ],
    },
    {
      label: "Channels",
      items: [
        { label: "All Channels", href: "/media-workspace/channels", icon: <Radio className={iconClass} /> },
        { label: "Channel Groups", href: "/media-workspace/channel-groups", icon: <Users className={iconClass} /> },
        { label: "PA / Audio", icon: <Megaphone className={iconClass} /> },
        { label: "Kiosks", icon: <LayoutDashboard className={iconClass} /> },
      ],
    },
    {
      label: "Monitoring",
      items: [
        { label: "Live View", icon: <Activity className={iconClass} /> },
        { label: "Alerts", icon: <Bell className={iconClass} /> },
        { label: "System Health", icon: <HeartPulse className={iconClass} /> },
      ],
    },
    {
      label: "Reports & Analytics",
      items: [
        { label: "Reports", icon: <BarChart3 className={iconClass} /> },
        { label: "Analytics", icon: <TrendingUp className={iconClass} /> },
      ],
    },
  ],
  standaloneLinks: [] satisfies NavItem[],
  standaloneIcons: [],
};
