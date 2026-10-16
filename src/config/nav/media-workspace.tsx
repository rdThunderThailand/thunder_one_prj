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
  EyeIcon,
  FileTextIcon,
  GaugeIcon,
  HeartIcon,
  ImageIcon,
  KioskIcon,
  LayoutIcon,
  MegaphoneIcon,
  NowNextIcon,
  PlaylistIcon,
  ProgramIcon,
  UsersIcon,
} from "@/components/ui/icons";
import type { NavConfig, NavItem } from "./types";

const iconClass = "h-full w-full";

export const mediaWorkspaceNav: NavConfig = {
  overviewItem: {
    label: "Overview",
    href: "/media-workspace",
    icon: <GaugeIcon className={iconClass} />,
  },
  sections: [
    {
      label: "Content",
      items: [
        { label: "Media Library", href: "/media-workspace/assets", icon: <ImageIcon className={iconClass} /> },
        { label: "Playlists", href: "/media-workspace/playlists", icon: <PlaylistIcon className={iconClass} /> },
        { label: "Layouts", href: "/media-workspace/layouts", icon: <LayoutIcon className={iconClass} /> },
      ],
    },
    {
      label: "Programming",
      items: [
        { label: "Programs", href: "/media-workspace/program", icon: <ProgramIcon className={iconClass} /> },
        { label: "Now & Next", href: "/media-workspace/now-next", icon: <NowNextIcon className={iconClass} /> },
        { label: "Calendar", href: "/media-workspace/calendar", icon: <CalendarIcon className={iconClass} /> },
      ],
    },
    {
      label: "Channels",
      items: [
        { label: "All Channels", href: "/media-workspace/channels", icon: <BroadcastIcon className={iconClass} /> },
        { label: "Channel Groups", href: "/media-workspace/channel-groups", icon: <UsersIcon className={iconClass} /> },
        { label: "PA / Audio", icon: <MegaphoneIcon className={iconClass} /> },
        { label: "Kiosks", icon: <KioskIcon className={iconClass} /> },
      ],
    },
    {
      label: "Monitoring",
      items: [
        { label: "Live View", icon: <EyeIcon className={iconClass} /> },
        { label: "Alerts", icon: <BellIcon className={iconClass} /> },
        { label: "System Health", icon: <HeartIcon className={iconClass} /> },
      ],
    },
    {
      label: "Reports & Analytics",
      items: [
        { label: "Playback Proof", href: "/media-workspace/playback-proof", icon: <FileTextIcon className={iconClass} /> },
        { label: "Analytics", icon: <ChartIcon className={iconClass} /> },
      ],
    },
  ],
  standaloneLinks: [] satisfies NavItem[],
  standaloneIcons: [],
};
