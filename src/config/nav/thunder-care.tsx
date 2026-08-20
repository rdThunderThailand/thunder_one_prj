// ThunderCare's sidebar nav — Technician and Thunder Care personas, moved
// wholesale out of Asset Intelligence when Thunder One's shell was
// introduced (they used to live in ./asset-intelligence.tsx's
// NAV_BY_PERSONA_SEGMENT under "work-orders"/"service-ops") —
// docs/adr/0033-thunder-one-shell-launcher-not-dropdown.md. Same
// segment-based resolution pattern as Asset Intelligence's own nav.
import {
  BoxIcon,
  CalendarIcon,
  ChartIcon,
  GridIcon,
  InfoIcon,
  ListIcon,
  SettingsIcon,
  UsersIcon,
  WarningTriangleIcon,
} from "@/components/ui/icons";
import type { NavConfig, NavItem } from "./types";

const technicianNav: NavConfig = {
  overviewItem: {
    label: "My Work",
    href: "/thunder-care/work-orders",
    icon: <ListIcon className="h-4 w-4 shrink-0" />,
  },
  sections: [],
  standaloneLinks: [
    { label: "Assigned", href: "/thunder-care/work-orders/assigned" },
    { label: "Calendar", href: "/thunder-care/work-orders/calendar" },
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

const thunderCareNav: NavConfig = {
  overviewItem: {
    label: "Overview",
    href: "/thunder-care/service-ops",
    icon: <GridIcon className="h-4 w-4 shrink-0" />,
  },
  sections: [],
  standaloneLinks: [
    { label: "Customers", href: "/thunder-care/service-ops/customers" },
    { label: "Work Queue", href: "/thunder-care/service-ops/work-queue" },
    { label: "SLA" },
    { label: "Reports", href: "/thunder-care/service-ops/reports" },
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
  "work-orders": technicianNav,
  "service-ops": thunderCareNav,
};

export function resolveThunderCareNav(pathname: string): NavConfig {
  const personaSegment = pathname.split("/")[2];
  return NAV_BY_PERSONA_SEGMENT[personaSegment] ?? technicianNav;
}
