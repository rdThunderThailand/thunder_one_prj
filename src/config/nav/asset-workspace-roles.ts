// Which Asset Workspace nav items each role sees (docs/adr/0097, Spec v1.1.5
// §8.2–8.3, FigJam Navigation v1.1 `515:635`). Pure data so
// asset-workspace-nav.check.mts can run it; icons are added in
// ./asset-workspace.tsx. Hiding an item is never authorization (Spec §6.3).
//
// Items without `href` are screens not built yet — they render inert.
import type { NavSection } from "./types";

export type AssetWorkspaceRole = "asset_admin" | "manager" | "employee";

// ponytail: Phase 1 has no role source — every user gets the Asset Admin nav. Real role wiring is Phase 6.
export const DEFAULT_ASSET_WORKSPACE_ROLE: AssetWorkspaceRole = "asset_admin";

const ADMIN_SECTIONS: NavSection[] = [
  { label: "Asset Management", items: [{ label: "Assets" }, { label: "Assignments" }, { label: "Inventory" }] },
  { label: "Asset Structure", items: [{ label: "Categories" }, { label: "Locations" }] },
  { label: "Management", items: [{ label: "Lifecycle & Warranty" }, { label: "Reports" }, { label: "Settings" }] },
];

const MANAGER_ITEMS: ReadonlySet<string> = new Set(["Assets", "Assignments", "Inventory", "Reports"]);

/** Sections under the pinned Overview. Employees get none — their nav is My Assets alone. */
export function sectionsForRole(role: AssetWorkspaceRole): NavSection[] {
  if (role === "asset_admin") return ADMIN_SECTIONS;
  if (role === "employee") return [];
  return ADMIN_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => MANAGER_ITEMS.has(item.label)),
  })).filter((section) => section.items.length > 0);
}
