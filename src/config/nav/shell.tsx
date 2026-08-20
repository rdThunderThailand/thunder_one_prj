// Thunder One's shell-level nav — rendered when the active route belongs to
// no App (Sidebar.tsx falls back to this when config/apps.tsx's
// resolveActiveApp returns null). Mission Control gets its own detailed
// subnav (moved here from Asset Intelligence's former CEO persona — same
// Insights/Reports/Approvals pages, now shell-level) since it's the one
// shell destination that's actually built; My Work, Work Space,
// Intelligence, and Governance are flat links with no subnav of their own
// yet — docs/adr/0033-thunder-one-shell-launcher-not-dropdown.md.
import {
  BoxIcon,
  ChartIcon,
  CheckCircleIcon,
  GridIcon,
  LightningIcon,
  ListIcon,
  SettingsIcon,
  SparklesIcon,
} from "@/components/ui/icons";
import type { NavConfig, NavItem } from "./types";

const missionControlNav: NavConfig = {
  overviewItem: {
    label: "Mission Control",
    href: "/mission-control",
    icon: <BoxIcon className="h-4 w-4 shrink-0" />,
  },
  sections: [],
  standaloneLinks: [
    { label: "Insights", href: "/mission-control/insights" },
    { label: "Reports", href: "/mission-control/reports" },
    { label: "Approvals", href: "/mission-control/approvals" },
    { label: "Settings" },
  ] satisfies NavItem[],
  standaloneIcons: [
    <SparklesIcon key="insights" />,
    <ChartIcon key="reports" />,
    <CheckCircleIcon key="approvals" />,
    <SettingsIcon key="settings" />,
  ],
};

const shellHomeNav: NavConfig = {
  overviewItem: {
    label: "Home",
    href: "/",
    icon: <LightningIcon className="h-4 w-4 shrink-0" />,
  },
  sections: [],
  standaloneLinks: [
    { label: "Mission Control", href: "/mission-control" },
    { label: "My Work", href: "/my-work" },
    { label: "Work Space", href: "/work-space" },
    { label: "Intelligence", href: "/intelligence" },
    { label: "Governance", href: "/governance" },
  ] satisfies NavItem[],
  standaloneIcons: [
    <BoxIcon key="mission-control" />,
    <ListIcon key="my-work" />,
    <GridIcon key="work-space" />,
    <SparklesIcon key="intelligence" />,
    <CheckCircleIcon key="governance" />,
  ],
};

export function resolveShellNav(pathname: string): NavConfig {
  const topSegment = pathname.split("/")[1];
  if (topSegment === "mission-control") return missionControlNav;
  return shellHomeNav;
}
