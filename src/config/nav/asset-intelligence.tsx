// Asset Intelligence's sidebar nav — one distinct nav per persona (requirement
// doc §2.2 / the "6 Core Personas" mockup), not one shared nav for the whole
// app. Selected by which persona route segment is active (resolveAssetIntelligenceNav),
// the same way the App Switcher (docs/adr/0022) picks a nav by app. This is a
// route-based approximation of role-based nav, not real RBAC — nothing gates
// which persona's pages a given user can reach (no permission gates exist yet,
// see docs/adr/0021-role-vocabulary-reconciliation.md); every persona's pages
// are reachable by anyone who navigates to their URL directly.
//
// Narrowed to three personas — CEO and Technician (+ Thunder Care) moved out
// to Thunder One's shell-level Mission Control and the new ThunderCare app
// respectively — docs/adr/0033-thunder-one-shell-launcher-not-dropdown.md.
// Their nav configs live in ./shell.tsx and ./thunder-care.tsx now, not here.
//
// IMPORTANT: resolveAssetIntelligenceNav only reads the URL's third path
// segment (pathname.split("/")[2]) to pick a nav. Any page beyond a persona's
// own landing route MUST therefore live under that persona's own segment
// (e.g. /asset-intelligence/my-assets/scan-qr) — a sibling route like
// /asset-intelligence/scan-qr will silently fall back to the Asset/IT
// Manager nav instead of the Employee one, since "scan-qr" isn't a key in
// NAV_BY_PERSONA_SEGMENT below. This bit Employee's My Requests/Service
// Status/Scan QR pages once (fixed 2026-08-18 by nesting them under
// my-assets/) — don't reintroduce it for a new page.
//
// Every remaining persona's nav is fully wired except "Settings",
// intentionally left inert everywhere (no settings page exists for any
// role) — see asset-intelligence/issues/asset-intelligence/requests/asset-intelligence/assets's RegisterAssetPage for
// Employee, asset-intelligence/departments's Assets/Team/Requests/Approvals/Reports pages
// for Department Manager, and asset-intelligence/assets's Locations/Work Orders/
// Maintenance/Inspections/Analytics/Reports pages (plus Add Asset/Pass to
// Department) for Asset/IT Manager.
import {
  BoxIcon,
  ChartIcon,
  CheckCircleIcon,
  CheckIcon,
  EnvelopeIcon,
  GlobeIcon,
  GridIcon,
  HelpIcon,
  ListIcon,
  MonitorIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
} from "@/components/ui/icons";
import type { NavConfig, NavItem } from "./types";

const assetManagerNav: NavConfig = {
  overviewItem: {
    label: "Assets",
    href: "/asset-intelligence/assets",
    icon: <BoxIcon className="h-4 w-4 shrink-0" />,
  },
  sections: [],
  standaloneLinks: [
    { label: "Locations", href: "/asset-intelligence/assets/locations" },
    { label: "Work Orders", href: "/asset-intelligence/assets/work-orders" },
    { label: "Maintenance", href: "/asset-intelligence/assets/maintenance" },
    { label: "Inspections", href: "/asset-intelligence/assets/inspections" },
    { label: "Analytics", href: "/asset-intelligence/assets/analytics" },
    { label: "Reports", href: "/asset-intelligence/assets/reports" },
    { label: "Settings" },
  ] satisfies NavItem[],
  standaloneIcons: [
    <GlobeIcon key="locations" />,
    <ListIcon key="work-orders" />,
    <SettingsIcon key="maintenance" />,
    <CheckIcon key="inspections" />,
    <ChartIcon key="analytics" />,
    <ChartIcon key="reports" />,
    <SettingsIcon key="settings" />,
  ],
};

const departmentManagerNav: NavConfig = {
  overviewItem: {
    label: "My Department",
    href: "/asset-intelligence/departments",
    icon: <GridIcon className="h-4 w-4 shrink-0" />,
  },
  sections: [],
  standaloneLinks: [
    { label: "Assets", href: "/asset-intelligence/departments/assets" },
    { label: "My Team", href: "/asset-intelligence/departments/team" },
    { label: "Requests", href: "/asset-intelligence/departments/requests" },
    { label: "Approvals", href: "/asset-intelligence/departments/approvals" },
    { label: "Reports", href: "/asset-intelligence/departments/reports" },
  ] satisfies NavItem[],
  standaloneIcons: [
    <BoxIcon key="assets" />,
    <UsersIcon key="my-team" />,
    <EnvelopeIcon key="requests" />,
    <CheckCircleIcon key="approvals" />,
    <ChartIcon key="reports" />,
  ],
};

const employeeNav: NavConfig = {
  overviewItem: {
    label: "My Assets",
    href: "/asset-intelligence/my-assets",
    icon: <BoxIcon className="h-4 w-4 shrink-0" />,
  },
  sections: [],
  standaloneLinks: [
    { label: "My Requests", href: "/asset-intelligence/my-assets/my-requests" },
    { label: "Service Status", href: "/asset-intelligence/my-assets/service-status" },
    { label: "Scan QR", href: "/asset-intelligence/my-assets/scan-qr" },
    { label: "Help" },
  ] satisfies NavItem[],
  standaloneIcons: [
    <EnvelopeIcon key="my-requests" />,
    <MonitorIcon key="service-status" />,
    <SearchIcon key="scan-qr" />,
    <HelpIcon key="help" />,
  ],
};

const NAV_BY_PERSONA_SEGMENT: Record<string, NavConfig> = {
  assets: assetManagerNav,
  departments: departmentManagerNav,
  "my-assets": employeeNav,
};

export function resolveAssetIntelligenceNav(pathname: string): NavConfig {
  const personaSegment = pathname.split("/")[2];
  return NAV_BY_PERSONA_SEGMENT[personaSegment] ?? assetManagerNav;
}
