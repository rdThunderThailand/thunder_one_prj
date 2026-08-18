// Asset Intelligence's sidebar nav — one distinct nav per persona (requirement
// doc §2.2 / the "6 Core Personas" mockup), not one shared nav for the whole
// app. Selected by which persona route segment is active (resolveAssetIntelligenceNav),
// the same way the App Switcher (docs/adr/0022) picks a nav by app. This is a
// route-based approximation of role-based nav, not real RBAC — nothing gates
// which persona's pages a given user can reach (no permission gates exist yet,
// see docs/adr/0021-role-vocabulary-reconciliation.md); every persona's pages
// are reachable by anyone who navigates to their URL directly.
//
// IMPORTANT: resolveAssetIntelligenceNav only reads the URL's third path
// segment (pathname.split("/")[2]) to pick a nav. Any page beyond a persona's
// own landing route MUST therefore live under that persona's own segment
// (e.g. /asset-intelligence/my-assets/scan-qr, /asset-intelligence/service-ops/reports)
// — a sibling route like /asset-intelligence/scan-qr will silently fall back
// to the CEO nav instead of the Employee one, since "scan-qr" isn't a key in
// NAV_BY_PERSONA_SEGMENT below. This bit Employee's My Requests/Service
// Status/Scan QR pages once (fixed 2026-08-18 by nesting them under
// my-assets/, matching how Thunder Care's Customers/Work Queue/Reports were
// already nested under service-ops/) — don't reintroduce it for a new page.
//
// CEO and Asset/IT Manager's other items are still inert (no `href`) — the
// mockup's fuller sidebar, not yet backed by a page. Employee/User, Thunder
// Care, Technician, and Department Manager's navs are further along (real
// pages beyond the landing route) since those roles' flows were built out in
// detail — see ai-issues/ai-requests/ai-assets's RegisterAssetPage for
// Employee, ai-service-ops's Customers/Work Queue/Reports pages for Thunder
// Care, ai-work-orders's Assigned/Calendar pages for Technician, and
// ai-departments's Assets/Team/Requests/Approvals/Reports pages for
// Department Manager.
import {
  BoxIcon,
  CalendarIcon,
  ChartIcon,
  CheckCircleIcon,
  CheckIcon,
  EnvelopeIcon,
  GlobeIcon,
  GridIcon,
  HelpIcon,
  InfoIcon,
  ListIcon,
  MonitorIcon,
  SearchIcon,
  SettingsIcon,
  SparklesIcon,
  UsersIcon,
  WarningTriangleIcon,
} from "@/components/ui/icons";
import type { NavConfig, NavItem } from "./types";

const ceoNav: NavConfig = {
  overviewItem: {
    label: "Mission Control",
    href: "/asset-intelligence/mission-control",
    icon: <BoxIcon className="h-4 w-4 shrink-0" />,
  },
  sections: [],
  standaloneLinks: [
    { label: "Insights" },
    { label: "Reports" },
    { label: "Approvals" },
    { label: "Settings" },
  ] satisfies NavItem[],
  standaloneIcons: [
    <SparklesIcon key="insights" />,
    <ChartIcon key="reports" />,
    <CheckCircleIcon key="approvals" />,
    <SettingsIcon key="settings" />,
  ],
};

const assetManagerNav: NavConfig = {
  overviewItem: {
    label: "Assets",
    href: "/asset-intelligence/assets",
    icon: <BoxIcon className="h-4 w-4 shrink-0" />,
  },
  sections: [],
  standaloneLinks: [
    { label: "Locations" },
    { label: "Work Orders" },
    { label: "Maintenance" },
    { label: "Inspections" },
    { label: "Analytics" },
    { label: "Reports" },
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

const technicianNav: NavConfig = {
  overviewItem: {
    label: "My Work",
    href: "/asset-intelligence/work-orders",
    icon: <ListIcon className="h-4 w-4 shrink-0" />,
  },
  sections: [],
  standaloneLinks: [
    { label: "Assigned", href: "/asset-intelligence/work-orders/assigned" },
    { label: "Calendar", href: "/asset-intelligence/work-orders/calendar" },
    { label: "Assets" },
    { label: "Knowledge" },
    { label: "Settings" },
  ] satisfies NavItem[],
  standaloneIcons: [
    <ListIcon key="assigned" />,
    <CalendarIcon key="calendar" />,
    <BoxIcon key="assets" />,
    <InfoIcon key="knowledge" />,
    <SettingsIcon key="settings" />,
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

const thunderCareNav: NavConfig = {
  overviewItem: {
    label: "Overview",
    href: "/asset-intelligence/service-ops",
    icon: <GridIcon className="h-4 w-4 shrink-0" />,
  },
  sections: [],
  standaloneLinks: [
    { label: "Customers", href: "/asset-intelligence/service-ops/customers" },
    { label: "Work Queue", href: "/asset-intelligence/service-ops/work-queue" },
    { label: "SLA" },
    { label: "Reports", href: "/asset-intelligence/service-ops/reports" },
    { label: "Settings" },
  ] satisfies NavItem[],
  standaloneIcons: [
    <UsersIcon key="customers" />,
    <ListIcon key="work-queue" />,
    <WarningTriangleIcon key="sla" />,
    <ChartIcon key="reports" />,
    <SettingsIcon key="settings" />,
  ],
};

const NAV_BY_PERSONA_SEGMENT: Record<string, NavConfig> = {
  "mission-control": ceoNav,
  assets: assetManagerNav,
  departments: departmentManagerNav,
  "work-orders": technicianNav,
  "my-assets": employeeNav,
  "service-ops": thunderCareNav,
};

export function resolveAssetIntelligenceNav(pathname: string): NavConfig {
  const personaSegment = pathname.split("/")[2];
  return NAV_BY_PERSONA_SEGMENT[personaSegment] ?? ceoNav;
}
