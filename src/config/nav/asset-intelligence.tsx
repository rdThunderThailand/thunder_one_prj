// Asset Intelligence's sidebar nav — see docs/adr/0016-app-switcher-multi-app-shell.md
// and docs/asset-intelligence/plan-app-switcher.md. One landing route per persona
// (requirement doc §4) now exists as a placeholder so every role's page is
// reachable for review, even though nothing is role-gated yet (no permission
// gates exist — see docs/adr/0021-role-vocabulary-reconciliation.md). Locations/
// Maintenance/Inspections stay inert (no `href`) — narrower sub-views inside
// Asset Overview, not yet built.
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
        { label: "My Assets", href: "/asset-intelligence/my-assets" },
        { label: "Locations" },
        { label: "Maintenance" },
        { label: "Inspections" },
      ],
    },
    {
      label: "Operations",
      icon: <SettingsIcon />,
      items: [
        { label: "Departments", href: "/asset-intelligence/departments" },
        { label: "Work Orders", href: "/asset-intelligence/work-orders" },
        { label: "Service Ops", href: "/asset-intelligence/service-ops" },
      ],
    },
  ],
  standaloneLinks: [{ label: "Reports & Analytics" }, { label: "Settings" }] satisfies NavItem[],
  standaloneIcons: [<ChartIcon key="reports" />, <SettingsIcon key="settings" />],
};
