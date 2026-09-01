// R&D placeholder data for People Workspace's Personnel list (`/people/personnel`)
// — the full org roster. No backend yet, same "R&D placeholder" discipline as
// people/overview's mock-data.ts.
//
// `personnelRows` below is a small, hand-picked sample (not the full real
// count) — same "scaled up to read like a real org" gap as
// asset-intelligence/departments's mock-data.ts, just without the multiplier
// arithmetic since there's no smaller real dataset here to scale from.
export type PersonnelType = "employee" | "contractor" | "partner" | "guest" | "inactive";
export type WorkStatus = "active" | "on-leave" | "invited" | "inactive";

// 2026-09-01: redesigned from type-filter tabs (ทั้งหมด/พนักงาน/ผู้รับเหมา/…)
// into the mockup's 5 view tabs — a different axis (how the roster is
// grouped/displayed) rather than a row filter. Only "roster" has any mockup
// content (today's real table); the other 4 render the same "ยังไม่มีข้อมูล
// สำหรับแท็บนี้" placeholder people/org-structure's OrgStructurePage already
// uses for its own unbuilt tabs.
export type PersonnelViewTab = "roster" | "by-unit" | "by-position" | "by-employment-status" | "probation";

export interface PersonnelViewTabItem {
  id: PersonnelViewTab;
  label: string;
}

export const personnelViewTabs: PersonnelViewTabItem[] = [
  { id: "roster", label: "รายชื่อบุคลากร" },
  { id: "by-unit", label: "พนักงานตามหน่วยงาน" },
  { id: "by-position", label: "พนักงานตามตำแหน่ง" },
  { id: "by-employment-status", label: "สถานะการจ้างงาน" },
  { id: "probation", label: "พนักงานทดลองงาน" },
];

export interface PersonnelStatTile {
  id: string;
  label: string;
  value: string;
  sublabel: string;
}

// 2026-09-01: redesigned from 6 per-type tiles into the mockup's 5 —
// "พนักงานทั้งหมด" is real (PersonnelPage passes Core's actual `totalCount`
// through instead of this mock string); the other 4 (contractor headcount,
// this month's new-hire/departure counts, retention rate) have no Core
// aggregate endpoint yet and stay mock, same discipline as
// people/overview's own stat tiles.
export const personnelStatTiles: PersonnelStatTile[] = [
  { id: "contractors", label: "ผู้ปฏิบัติงานภายนอก", value: "9", sublabel: "คน" },
  { id: "new-this-month", label: "เข้าใหม่ (เดือนนี้)", value: "7", sublabel: "คน" },
  { id: "left-this-month", label: "ออกจากองค์กร (เดือนนี้)", value: "2", sublabel: "คน" },
];

export const personnelRetentionRate = 94.1;

export interface PersonnelRow {
  id: string;
  name: string;
  email: string;
  employeeCode: string;
  position: string;
  unit: string;
  type: PersonnelType;
  workStatus: WorkStatus;
  startDateLabel: string;
  managerName: string | null;
  managerRole: string | null;
}

export const personnelRows: PersonnelRow[] = [
  {
    id: "p-1",
    name: "อัญชนา สุภาภรณ์",
    email: "ann.s@thunderone.co.th",
    employeeCode: "EMP-0001",
    position: "Graphic Designer",
    unit: "Marketing / Creative",
    type: "employee",
    workStatus: "active",
    startDateLabel: "1 ก.ย. 2566",
    managerName: "Jane Smith",
    managerRole: "Marketing Manager",
  },
  {
    id: "p-2",
    name: "ดนัย กิตติพงษ์",
    email: "danai.k@thunderone.co.th",
    employeeCode: "EMP-0002",
    position: "Project Manager",
    unit: "Delivery / Project",
    type: "employee",
    workStatus: "active",
    startDateLabel: "15 มี.ค. 2565",
    managerName: "Somchai W.",
    managerRole: "Head of Delivery",
  },
  {
    id: "p-3",
    name: "นิชา วัฒนกุล",
    email: "nicha.w@thunderone.co.th",
    employeeCode: "EMP-0003",
    position: "Marketing Executive",
    unit: "Marketing / Growth",
    type: "employee",
    workStatus: "active",
    startDateLabel: "1 มิ.ย. 2567",
    managerName: "Jane Smith",
    managerRole: "Marketing Manager",
  },
  {
    id: "p-4",
    name: "วรพล ศรีนคร",
    email: "worapol.s@thunderone.co.th",
    employeeCode: "EMP-0004",
    position: "Software Developer",
    unit: "Product / Platform",
    type: "employee",
    workStatus: "active",
    startDateLabel: "10 ม.ค. 2566",
    managerName: "Pongpat P.",
    managerRole: "Tech Lead",
  },
  {
    id: "p-5",
    name: "Peter Wilson",
    email: "peter.w@consult.com",
    employeeCode: "EXT-0001",
    position: "Senior Consultant",
    unit: "Strategy",
    type: "partner",
    workStatus: "active",
    startDateLabel: "5 ก.พ. 2568",
    managerName: null,
    managerRole: null,
  },
  {
    id: "p-6",
    name: "สมชาย ใจดี",
    email: "somchai.j@thunderone.co.th",
    employeeCode: "CON-0001",
    position: "System Analyst",
    unit: "IT / Operations",
    type: "contractor",
    workStatus: "active",
    startDateLabel: "1 เม.ย. 2568",
    managerName: "Anan R.",
    managerRole: "IT Manager",
  },
  {
    id: "p-7",
    name: "ลลนา จันทร์สว่าง",
    email: "lalana.c@thunderone.co.th",
    employeeCode: "EMP-0005",
    position: "Accountant",
    unit: "Finance / Accounting",
    type: "employee",
    workStatus: "on-leave",
    startDateLabel: "20 ธ.ค. 2564",
    managerName: "Nattaya P.",
    managerRole: "Finance Manager",
  },
  {
    id: "p-8",
    name: "John Smith",
    email: "john.s@example.com",
    employeeCode: "EXT-0002",
    position: "Advisor",
    unit: "Executive Office",
    type: "guest",
    workStatus: "invited",
    startDateLabel: "-",
    managerName: "Kittipong T.",
    managerRole: "CEO",
  },
  {
    id: "p-9",
    name: "สมหญิง ใจงาม",
    email: "somying.j@thunderone.co.th",
    employeeCode: "EMP-0006",
    position: "Sales Executive",
    unit: "Sales / Enterprise",
    type: "inactive",
    workStatus: "inactive",
    startDateLabel: "1 ก.ค. 2563",
    managerName: "Somchai W.",
    managerRole: "Sales Director",
  },
  {
    id: "p-10",
    name: "กฤติยา บุญมี",
    email: "krittiya.b@thunderone.co.th",
    employeeCode: "EMP-0007",
    position: "UX Designer",
    unit: "Product / Design",
    type: "employee",
    workStatus: "active",
    startDateLabel: "12 ส.ค. 2567",
    managerName: "Pongpat P.",
    managerRole: "Tech Lead",
  },
];

export const personnelTotalCount = 128;
export const personnelPageSize = 10;
export const personnelTotalPages = 13;
