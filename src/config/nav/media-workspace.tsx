// Media Workspace's sidebar nav — extracted verbatim from Sidebar.tsx
// (see docs/adr/0016-app-switcher-multi-app-shell.md) with no behavior change.
import {
  BroadcastIcon,
  ChartIcon,
  GridIcon,
  MonitorIcon,
  SettingsIcon,
} from "@/components/ui/icons";
import type { NavConfig, NavItem } from "./types";

export const mediaWorkspaceNav: NavConfig = {
  overviewItem: { label: "Overview", href: "/", icon: <GridIcon className="h-4 w-4 shrink-0" /> },
  sections: [
    {
      label: "Publishing",
      icon: <BroadcastIcon />,
      items: [
        { label: "Now & Next", href: "/publications" },
        { label: "Calendar" },
        { label: "Campaigns" },
        { label: "Playlists", href: "/playlists" },
      ],
    },
    {
      label: "Channels",
      icon: <GridIcon />,
      items: [
        { label: "All Channels", href: "/channels" },
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
