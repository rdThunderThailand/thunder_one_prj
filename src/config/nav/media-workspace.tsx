// Media Workspace's sidebar nav — extracted verbatim from Sidebar.tsx
// (docs/adr/0022-app-switcher-multi-app-shell.md) with no behavior change
// beyond the app moving from "/" to "/communication" originally, and from
// "/communication" to "/media-workspace" since (Nie, 2026-08-25 — this is a
// media/DOOH publishing feature, not a generic "Communication" one; "Media
// Workspace" was the original, correct name per CONTEXT.md).
import {
  BroadcastIcon,
  ChartIcon,
  GridIcon,
  MonitorIcon,
  SettingsIcon,
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
      label: "Publishing",
      icon: <BroadcastIcon />,
      items: [
        { label: "Now & Next", href: "/media-workspace/publications" },
        { label: "Calendar" },
        { label: "Campaigns" },
        { label: "Playlists", href: "/media-workspace/playlists" },
      ],
    },
    {
      label: "Channels",
      icon: <GridIcon />,
      items: [
        { label: "All Channels", href: "/media-workspace/channels" },
        { label: "DOOH" },
        { label: "In-Store" },
        { label: "Online" },
        { label: "Social" },
        { label: "Other" },
      ],
    },
    {
      label: "Monitoring",
      icon: <MonitorIcon />,
      items: [{ label: "Live View" }, { label: "Alerts" }, { label: "System Health" }],
    },
  ],
  standaloneLinks: [{ label: "Reports & Analytics" }, { label: "Settings" }] satisfies NavItem[],
  standaloneIcons: [<ChartIcon key="reports" />, <SettingsIcon key="settings" />],
};
