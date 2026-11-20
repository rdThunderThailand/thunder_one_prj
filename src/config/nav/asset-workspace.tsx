// Asset Workspace's sidebar nav — one nav for the whole App, filtered by role
// (docs/adr/0097). Unlike Asset Intelligence (one nav per persona URL
// segment), the role picks the items, not the URL. Which items each role sees
// lives in ./asset-workspace-roles.ts; this file only adds icons.
import type { ReactNode } from "react";
import {
  AssignmentIcon,
  BoxIcon,
  CategoryIcon,
  ClipboardIcon,
  FileTextIcon,
  GaugeIcon,
  CheckSquareIcon,
  HomeIcon,
  LocationIcon,
  ScanIcon,
  SettingsIcon,
  WarrantyIcon,
} from "@/components/ui/icons";
import { sectionsForRole, standaloneLinksForRole, type AssetWorkspaceRole } from "./asset-workspace-roles";
import type { NavConfig } from "./types";

const iconClass = "h-full w-full";

// ADR 0098 §4 icon map; Reports and Settings are platform concepts (T1Icon).
const ITEM_ICONS: Record<string, ReactNode> = {
  Assets: <BoxIcon className={iconClass} />,
  Assignments: <AssignmentIcon className={iconClass} />,
  // Not InventoryIcon: next to Assignments both read as documents; a stock check is a checked square.
  Inventory: <CheckSquareIcon className={iconClass} />,
  Categories: <CategoryIcon className={iconClass} />,
  Locations: <LocationIcon className={iconClass} />,
  "Lifecycle & Warranty": <WarrantyIcon className={iconClass} />,
  Reports: <FileTextIcon className={iconClass} />,
  Settings: <SettingsIcon className={iconClass} />,
};

const STANDALONE_ICONS: Record<string, ReactNode> = {
  "My Assets": <ClipboardIcon className="h-4 w-4" />,
  "My Tasks": <CheckSquareIcon className="h-4 w-4" />,
  "Scan Asset": <ScanIcon className="h-4 w-4" />,
};

const overviewItem = {
  label: "Overview",
  href: "/asset-workspace",
  icon: <GaugeIcon className="h-4 w-4 shrink-0" />,
};

// Employees' pinned item: Home is their overview, like Overview for admins (persona map §3).
const homeItem = {
  label: "Home",
  href: "/asset-workspace/home",
  icon: <HomeIcon className="h-4 w-4 shrink-0" />,
};

export function filterAssetWorkspaceNav(role: AssetWorkspaceRole): NavConfig {
  const standaloneLinks = standaloneLinksForRole(role);
  return {
    overviewItem: role === "employee" ? homeItem : overviewItem,
    sections: sectionsForRole(role).map((section) => ({
      ...section,
      items: section.items.map((item) => ({ ...item, icon: ITEM_ICONS[item.label] })),
    })),
    standaloneLinks,
    standaloneIcons: standaloneLinks.map((item) => STANDALONE_ICONS[item.label]),
  };
}
