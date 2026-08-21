// Communication's sidebar nav (Media Workspace, renamed — see CONTEXT.md and
// docs/adr/0033-thunder-one-shell-launcher-not-dropdown.md) — extracted
// verbatim from Sidebar.tsx (docs/adr/0022-app-switcher-multi-app-shell.md)
// with no behavior change beyond the app moving from "/" to "/communication".
import {
  BroadcastIcon,
  ChartIcon,
  GridIcon,
  MonitorIcon,
  SettingsIcon,
} from "@/components/ui/icons";
import type { NavConfig, NavItem } from "./types";

export const communicationNav: NavConfig = {
  overviewItem: {
    label: "Overview",
    href: "/communication",
    icon: <GridIcon className="h-4 w-4 shrink-0" />,
  },
  sections: [
    {
      label: "Publishing",
      icon: <BroadcastIcon />,
      items: [
        { label: "Now & Next", href: "/communication/publications" },
        { label: "Calendar" },
        { label: "Campaigns" },
        { label: "Playlists", href: "/communication/playlists" },
      ],
    },
    {
      label: "Channels",
      icon: <GridIcon />,
      items: [
        { label: "All Channels", href: "/communication/channels" },
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
