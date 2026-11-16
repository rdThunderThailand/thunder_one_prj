// Which Asset Workspace nav items each role sees (docs/adr/0097, Product
// Specification 02 §3.3 and §4.2, FigJam Navigation v1.1 `515:635`). Pure data so
// asset-workspace-nav.check.mts can run it; icons are added in
// ./asset-workspace.tsx. Hiding an item is never authorization (02 §3.3).
//
// Items without `href` are screens not built yet — they render inert.
import type { NavItem, NavSection } from "./types";

export type AssetWorkspaceRole = "asset_admin" | "manager" | "employee";

const BASE = "/asset-workspace";

const ADMIN_SECTIONS: NavSection[] = [
  {
    label: "Asset Management",
    items: [
      { label: "Assets", href: `${BASE}/assets` },
      { label: "Assignments", href: `${BASE}/assignments` },
      { label: "Inventory", href: `${BASE}/inventory` },
    ],
  },
  {
    label: "Asset Structure",
    items: [
      { label: "Categories", href: `${BASE}/categories` },
      { label: "Locations", href: `${BASE}/locations` },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Lifecycle & Warranty", href: `${BASE}/lifecycle-warranty` },
      { label: "Reports", href: `${BASE}/reports` },
      { label: "Settings", href: `${BASE}/settings` },
    ],
  },
];

const MANAGER_ITEMS: ReadonlySet<string> = new Set(["Assets", "Assignments", "Inventory", "Reports"]);

// Employee links under the pinned My Assets (persona map §3). No href until each batch ships, so they render inert.
const EMPLOYEE_LINKS: NavItem[] = [{ label: "My Tasks" }, { label: "Scan Asset" }, { label: "Home" }];

export function standaloneLinksForRole(role: AssetWorkspaceRole): NavItem[] {
  return role === "employee" ? EMPLOYEE_LINKS : [];
}

/** Sections under the pinned Overview. Employees get none — their nav is My Assets plus standalone links. */
export function sectionsForRole(role: AssetWorkspaceRole): NavSection[] {
  if (role === "asset_admin") return ADMIN_SECTIONS;
  if (role === "employee") return [];
  return ADMIN_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => MANAGER_ITEMS.has(item.label)),
  })).filter((section) => section.items.length > 0);
}
