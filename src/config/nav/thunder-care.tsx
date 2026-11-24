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

// Technician persona — ผังหน้าจอ "Technician Workflow: Web ↔ Mobile" ที่
// ผู้ใช้ส่งมา 2569-09-08 (หน้าหลัก, งานของฉัน, ทรัพย์สินของฉัน, คำขอของฉัน,
// การคืนและการส่งมอบ). "พื้นที่ทำงานของฉัน"/"แจ้งปัญหา" ปรากฏใน sidebar ของ
// ผังแต่ไม่มี mockup รายละเอียด — ปล่อย inert ตามธรรมเนียม. "คลังอะไหล่ /
// อุปกรณ์"/"คลังความรู้" ลิงก์ไปหน้าที่สร้างให้ Dispatcher/Service Operator
// แล้ว ไม่ได้สร้างซ้ำ. `Assigned`/`Calendar` เดิม (English placeholder, นอก
// ขอบเขต redesign รอบนี้) ยังเก็บไว้ให้เข้าถึงได้ผ่าน standaloneLinks.
const technicianNav: NavConfig = {
  overviewItem: {
    label: "หน้าหลัก",
    href: "/thunder-care/work-orders",
    icon: <GridIcon className="h-4 w-4 shrink-0" />,
  },
  sections: [
    {
      label: "งานของฉัน",
      icon: <ListIcon />,
      items: [
        { label: "งานของฉัน", href: "/thunder-care/work-orders/my-work" },
        { label: "ทรัพย์สินของฉัน", href: "/thunder-care/work-orders/assets" },
        { label: "คำขอของฉัน", href: "/thunder-care/work-orders/requests" },
        { label: "การคืนและการส่งมอบ", href: "/thunder-care/work-orders/returns" },
        { label: "พื้นที่ทำงานของฉัน" },
      ] satisfies NavItem[],
    },
    {
      label: "คลังและความรู้",
      icon: <BoxIcon />,
      items: [
        { label: "คลังอะไหล่ / อุปกรณ์", href: "/thunder-care/dispatch/inventory" },
        { label: "คลังความรู้", href: "/thunder-care/service-ops/knowledge-base" },
      ] satisfies NavItem[],
    },
    {
      label: "ช่วยเหลือ",
      icon: <InfoIcon />,
      items: [{ label: "แจ้งปัญหา" }] satisfies NavItem[],
    },
  ],
  standaloneLinks: [
    { label: "Assigned", href: "/thunder-care/work-orders/assigned" },
    { label: "Calendar", href: "/thunder-care/work-orders/calendar" },
    { label: "Settings" },
  ] satisfies NavItem[],
  standaloneIcons: [<ListIcon key="assigned" />, <CalendarIcon key="calendar" />, <SettingsIcon key="settings" />],
};

const thunderCareNav: NavConfig = {
  // "หน้าหลัก" — เปลี่ยนจาก "Overview" ให้ตรงกับผังหน้าจอ Service Operator
  // ที่ผู้ใช้ส่งมา (2569-09-08, ครบทั้ง 5 หน้าของ persona นี้แล้ว: หน้าหลัก,
  // เคสจากลูกค้า, Triage, ติดตามเคส, คลังความรู้). ศูนย์บริการ/ช่วยเหลือ
  // section ตรงกับ sidebar ในผังนั้นเป๊ะ.
  overviewItem: {
    label: "หน้าหลัก",
    href: "/thunder-care/service-ops",
    icon: <GridIcon className="h-4 w-4 shrink-0" />,
  },
  sections: [
    {
      label: "ศูนย์บริการ",
      icon: <WarningTriangleIcon />,
      items: [
        { label: "เคสจากลูกค้า", href: "/thunder-care/service-ops/cases" },
        { label: "Triage", href: "/thunder-care/service-ops/triage" },
        { label: "ติดตามเคส", href: "/thunder-care/service-ops/tracking" },
      ] satisfies NavItem[],
    },
    {
      label: "ช่วยเหลือ",
      icon: <InfoIcon />,
      items: [{ label: "คลังความรู้", href: "/thunder-care/service-ops/knowledge-base" }] satisfies NavItem[],
    },
  ],
  // ของเดิม (นอกขอบเขต redesign รอบนี้) — เก็บไว้ให้ยังเข้าถึงได้ผ่าน sidebar
  // แม้จะไม่อยู่ใน sidebar ของผังหน้าจอใหม่ก็ตาม. "Customers" (ของเดิม
  // English placeholder) ถูกลบไปแล้ว — แทนที่ด้วย thunder-care/dispatch's
  // ลูกค้า (persona Dispatcher, ดูตรงนั้นแทน) ไม่ใช่ของ Service Operator.
  standaloneLinks: [
    { label: "Work Queue", href: "/thunder-care/service-ops/work-queue" },
    { label: "Reports", href: "/thunder-care/service-ops/reports" },
    { label: "Settings" },
  ] satisfies NavItem[],
  standaloneIcons: [<ListIcon key="work-queue" />, <ChartIcon key="reports" />, <SettingsIcon key="settings" />],
};

// Dispatcher persona — ผังหน้าจอที่ผู้ใช้ส่งมา 2569-09-08 (หน้าหลัก, งานรอ
// จัดสรร, งานที่กำลังดำเนินการ, งานที่เสร็จสิ้น, ช่าง/ทีมของฉัน, ตารางงาน,
// แผนที่งาน, ลูกค้า, คลังอะไหล่/อุปกรณ์). "Asset" ลิงก์ไปหน้า Asset
// Intelligence ที่มีอยู่แล้วตรงๆ (ผังหน้าจอเขียน "ASSET WORKSPACE" ไว้ชัดเจน
// ว่าไม่ใช่หน้าใหม่ของ Thunder Care) — ข้ามระบบ persona/nav แต่เป็นความ
// ตั้งใจ ไม่ใช่บั๊ก. "คลังความรู้" ลิงก์ไปหน้าเดียวกับที่สร้างให้ Service
// Operator แล้ว ไม่ได้สร้างซ้ำ (ดู mock-data.ts's header comment).
const dispatcherNav: NavConfig = {
  overviewItem: {
    label: "หน้าหลัก",
    href: "/thunder-care/dispatch",
    icon: <GridIcon className="h-4 w-4 shrink-0" />,
  },
  sections: [
    {
      label: "งานบริการ",
      icon: <WarningTriangleIcon />,
      items: [
        { label: "งานรอจัดสรร", href: "/thunder-care/dispatch/unassigned" },
        { label: "งานที่กำลังดำเนินการ", href: "/thunder-care/dispatch/in-progress" },
        { label: "งานที่เสร็จสิ้น", href: "/thunder-care/dispatch/completed" },
      ] satisfies NavItem[],
    },
    {
      label: "จัดการช่างและทีม",
      icon: <UsersIcon />,
      items: [
        { label: "ช่าง / ทีมของฉัน", href: "/thunder-care/dispatch/technicians" },
        { label: "ตารางงาน (Scheduler)", href: "/thunder-care/dispatch/scheduler" },
        { label: "แผนที่งาน (Map View)", href: "/thunder-care/dispatch/map" },
      ] satisfies NavItem[],
    },
    {
      label: "ข้อมูลประกอบ",
      icon: <BoxIcon />,
      items: [
        { label: "ลูกค้า", href: "/thunder-care/dispatch/customers" },
        { label: "Asset", href: "/asset-intelligence/assets" },
        { label: "คลังอะไหล่ / อุปกรณ์", href: "/thunder-care/dispatch/inventory" },
      ] satisfies NavItem[],
    },
    {
      label: "ช่วยเหลือ",
      icon: <InfoIcon />,
      items: [{ label: "คลังความรู้", href: "/thunder-care/service-ops/knowledge-base" }] satisfies NavItem[],
    },
  ],
  standaloneLinks: [],
  standaloneIcons: [],
};

const NAV_BY_PERSONA_SEGMENT: Record<string, NavConfig> = {
  "work-orders": technicianNav,
  "service-ops": thunderCareNav,
  dispatch: dispatcherNav,
};

export function resolveThunderCareNav(pathname: string): NavConfig {
  const personaSegment = pathname.split("/")[2];
  return NAV_BY_PERSONA_SEGMENT[personaSegment] ?? technicianNav;
}
