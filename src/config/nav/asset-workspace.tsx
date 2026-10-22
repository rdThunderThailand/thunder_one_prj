// Asset Workspace's sidebar nav — one nav for the whole App, filtered by role
// (docs/adr/0097). Unlike Asset Intelligence (one nav per persona URL
// segment), the role picks the items, not the URL. Which items each role sees
// lives in ./asset-workspace-roles.ts; this file only adds icons.
import type { ReactNode } from "react";
import { BoxIcon, ClipboardIcon, GaugeIcon, GridIcon, SettingsIcon } from "@/components/ui/icons";
import { sectionsForRole, type AssetWorkspaceRole } from "./asset-workspace-roles";
import type { NavConfig } from "./types";

const SECTION_ICONS: Record<string, ReactNode> = {
  "Asset Management": <BoxIcon className="h-4 w-4" />,
  "Asset Structure": <GridIcon className="h-4 w-4" />,
  Management: <SettingsIcon className="h-4 w-4" />,
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
    sections: sectionsForRole(role).map((section) => ({ ...section, icon: SECTION_ICONS[section.label] })),
    standaloneLinks: [],
    standaloneIcons: [],
  };
}
