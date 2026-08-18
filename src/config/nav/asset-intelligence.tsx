// Asset Intelligence's sidebar nav — see docs/adr/0016-app-switcher-multi-app-shell.md
// and docs/asset-intelligence/plan-app-switcher.md. Sections beyond Assets are
// inert placeholders (no `href`) until their features are built in later sprints
// (see Asset Intelligence - Dev Process Mapping §5 in the Obsidian vault).
import { BoxIcon, ChartIcon, SettingsIcon } from "@/components/ui/icons";
import type { NavConfig, NavItem } from "./types";

export const assetIntelligenceNav: NavConfig = {
  overviewItem: {
    label: "Mission Control",
    href: "/asset-intelligence/mission-control",
    icon: <BoxIcon className="h-4 w-4 shrink-0" />,
  },
  sections: [
    {
      label: "Assets",
      icon: <BoxIcon />,
      items: [
        { label: "All Assets", href: "/asset-intelligence/assets" },
        { label: "Locations" },
        { label: "Maintenance" },
        { label: "Inspections" },
      ],
    },
    {
      label: "Operations",
      icon: <SettingsIcon />,
      items: [{ label: "Departments" }, { label: "Work Orders" }, { label: "Service Ops" }],
    },
  ],
  standaloneLinks: [{ label: "Reports & Analytics" }, { label: "Settings" }] satisfies NavItem[],
  standaloneIcons: [<ChartIcon key="reports" />, <SettingsIcon key="settings" />],
};
