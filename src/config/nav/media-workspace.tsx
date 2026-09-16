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
  ClockIcon,
  FolderIcon,
  GridIcon,
  HeartIcon,
  LayoutIcon,
  ListIcon,
  MegaphoneIcon,
  MonitorIcon,
  PlayIcon,
  TrendUpIcon,
  UsersIcon,
  VideoIcon,
} from "@/components/ui/icons";
import type { NavConfig, NavItem } from "./types";

export const mediaWorkspaceNav: NavConfig = {
  overviewItem: {
    label: "Overview",
    href: "/media-workspace",
    icon: <GridIcon />,
  },
  sections: [
    {
      label: "Content",
      items: [
        { label: "Media Library", href: "/media-workspace/assets", icon: <FolderIcon /> },
        { label: "Playlists", href: "/media-workspace/playlists", icon: <ListIcon /> },
        { label: "Layouts", href: "/media-workspace/layouts", icon: <LayoutIcon /> },
      ],
    },
    {
      label: "Programming",
      items: [
        { label: "Programs", href: "/media-workspace/publications/manage", icon: <PlayIcon /> },
        { label: "Now & Next", href: "/media-workspace/publications", icon: <ClockIcon /> },
        { label: "Calendar", icon: <CalendarIcon /> },
      ],
    },
    {
      label: "Channels",
      items: [
        { label: "All Channels", href: "/media-workspace/channels", icon: <BroadcastIcon /> },
        { label: "Channel Groups", href: "/media-workspace/channel-groups", icon: <UsersIcon /> },
        { label: "Screens", icon: <MonitorIcon /> },
        { label: "TV", icon: <VideoIcon /> },
        { label: "PA / Audio", icon: <MegaphoneIcon /> },
        { label: "Kiosks", icon: <LayoutIcon /> },
      ],
    },
    {
      label: "Monitoring",
      items: [
        { label: "Live View", icon: <BroadcastIcon /> },
        { label: "Alerts", icon: <BellIcon /> },
        { label: "System Health", icon: <HeartIcon /> },
      ],
    },
    {
      label: "Reports & Analytics",
      items: [
        { label: "Reports", icon: <ChartIcon /> },
        { label: "Analytics", icon: <TrendUpIcon /> },
      ],
    },
  ],
  standaloneLinks: [] satisfies NavItem[],
  standaloneIcons: [],
};
