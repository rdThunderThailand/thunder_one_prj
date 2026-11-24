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
  GridIcon,
  InventoryIcon,
  LocationIcon,
  SettingsIcon,
  WarrantyIcon,
} from "@/components/ui/icons";
import { sectionsForRole, type AssetWorkspaceRole } from "./asset-workspace-roles";
import type { NavConfig } from "./types";

const SECTION_ICONS: Record<string, ReactNode> = {
  "Asset Management": <BoxIcon className="h-4 w-4" />,
  "Asset Structure": <GridIcon className="h-4 w-4" />,
  Management: <SettingsIcon className="h-4 w-4" />,
};

const iconClass = "h-full w-full";

// ADR 0098 §4 icon map; Reports and Settings are platform concepts (T1Icon).
const ITEM_ICONS: Record<string, ReactNode> = {
  Assets: <BoxIcon className={iconClass} />,
  Assignments: <AssignmentIcon className={iconClass} />,
  Inventory: <InventoryIcon className={iconClass} />,
  Categories: <CategoryIcon className={iconClass} />,
  Locations: <LocationIcon className={iconClass} />,
  "Lifecycle & Warranty": <WarrantyIcon className={iconClass} />,
  Reports: <FileTextIcon className={iconClass} />,
  Settings: <SettingsIcon className={iconClass} />,
};

const overviewItem = {
  label: "Overview",
  href: "/asset-workspace",
  icon: <GaugeIcon className="h-4 w-4 shrink-0" />,
};

const myAssetsItem = {
  label: "My Assets",
  href: "/asset-workspace/my-assets",
  icon: <ClipboardIcon className="h-4 w-4 shrink-0" />,
};

export function filterAssetWorkspaceNav(role: AssetWorkspaceRole): NavConfig {
  return {
    overviewItem: role === "employee" ? myAssetsItem : overviewItem,
    sections: sectionsForRole(role).map((section) => ({
      ...section,
      icon: SECTION_ICONS[section.label],
      items: section.items.map((item) => ({ ...item, icon: ITEM_ICONS[item.label] })),
    })),
    standaloneLinks: [],
    standaloneIcons: [],
  };
}
