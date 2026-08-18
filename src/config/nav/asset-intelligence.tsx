// Asset Intelligence's sidebar nav — one distinct nav per persona (requirement
// doc §2.2 / the "6 Core Personas" mockup), not one shared nav for the whole
// app. Selected by which persona route segment is active (resolveAssetIntelligenceNav),
// the same way the App Switcher (docs/adr/0022) picks a nav by app. This is a
// route-based approximation of role-based nav, not real RBAC — nothing gates
// which persona's pages a given user can reach (no permission gates exist yet,
// see docs/adr/0021-role-vocabulary-reconciliation.md); every persona's pages
// are reachable by anyone who navigates to their URL directly.
//
// Only each persona's own landing route is built so far (Sprint 1 placeholders
// — see docs/asset-intelligence/plan-role-requirements.md), so every other item
// below is intentionally inert (no `href`) — the mockup's fuller sidebar, not
// yet backed by a page.
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
    { label: "Assets" },
    { label: "My Team" },
    { label: "Requests" },
    { label: "Approvals" },
    { label: "Reports" },
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
    { label: "Assigned" },
    { label: "Calendar" },
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
    { label: "My Requests" },
    { label: "Service Status" },
    { label: "Scan QR" },
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
    { label: "Customers" },
    { label: "Work Queue" },
    { label: "SLA" },
    { label: "Reports" },
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
