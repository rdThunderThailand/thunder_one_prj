// Media Workspace's sidebar nav — extracted verbatim from Sidebar.tsx
// (docs/adr/0022-app-switcher-multi-app-shell.md) with no behavior change
// beyond the app moving from "/" to "/communication" originally, and from
// "/communication" to "/media-workspace" since (Nie, 2026-08-25 — this is a
// media/DOOH publishing feature, not a generic "Communication" one; "Media
// Workspace" was the original, correct name per CONTEXT.md).
import {
  BellIcon,
  BroadcastIcon,
  CalendarIcon,
  ChartIcon,
  GridIcon,
  LayoutIcon,
  MonitorIcon,
  ShareNodesIcon,
  UploadIcon,
  WarningTriangleIcon,
} from "@/components/ui/icons";
import type { NavConfig, NavItem } from "./types";

export const mediaWorkspaceNav: NavConfig = {
  overviewItem: {
    label: "Overview",
    href: "/media-workspace",
    icon: <GridIcon className="h-4 w-4 shrink-0" />,
  },
  sections: [
    {
      label: "Content",
      items: [
        { label: "Media Library", href: "/media-workspace/assets", icon: <UploadIcon /> },
        { label: "Playlists", href: "/media-workspace/playlists", icon: <BroadcastIcon /> },
        { label: "Layouts", href: "/media-workspace/layouts", icon: <LayoutIcon />, badge: "NEW" },
      ],
    },
    {
      label: "Programming",
      triggerLabel: "Programs",
      icon: <MonitorIcon />,
      items: [
        { label: "Now & Next", href: "/media-workspace/publications" },
        { label: "Calendar", icon: <CalendarIcon /> },
      ],
    },
    {
      label: "Channels",
      items: [
        { label: "All Channels", href: "/media-workspace/channels", icon: <MonitorIcon /> },
        { label: "Screens", icon: <ShareNodesIcon /> },
        { label: "TV", icon: <MonitorIcon /> },
        { label: "PA / Audio", icon: <BroadcastIcon /> },
        { label: "Kiosks", icon: <LayoutIcon /> },
      ],
    },
    {
      label: "Monitoring",
      items: [
        { label: "Live View", icon: <GridIcon /> },
        { label: "Alerts", icon: <BellIcon />, badge: "12" },
        { label: "System Health", icon: <WarningTriangleIcon /> },
      ],
    },
    {
      label: "Reports & Analytics",
      items: [
        { label: "Reports", icon: <ChartIcon /> },
        { label: "Analytics", icon: <ChartIcon /> },
      ],
    },
  ],
  standaloneLinks: [] satisfies NavItem[],
  standaloneIcons: [],
};
