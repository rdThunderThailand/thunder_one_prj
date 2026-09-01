// R&D placeholder data for People Workspace's Personnel list (`/people/personnel`)
// — the full org roster. No backend yet, same "R&D placeholder" discipline as
// people/overview's mock-data.ts.
//
// Tab/stat-tile counts (128/112/9/4/3/6) are the org-wide totals from the
// mockup, matching people/overview's totalHeadcount/personnelBreakdown so the
// two pages don't disagree. `personnelRows` below is a small, hand-picked
// sample (not all 128) — same "scaled up to read like a real org" gap as
// asset-intelligence/departments's mock-data.ts, just without the multiplier
// arithmetic since there's no smaller real dataset here to scale from.
export type PersonnelType = "employee" | "contractor" | "partner" | "guest" | "inactive";
export type WorkStatus = "active" | "on-leave" | "invited" | "inactive";

export interface PersonnelTab {
  id: PersonnelType | "all";
  label: string;
  count: number;
}

export const personnelTabs: PersonnelTab[] = [
  { id: "all", label: "ทั้งหมด", count: 128 },
  { id: "employee", label: "พนักงาน", count: 112 },
  { id: "contractor", label: "ผู้รับเหมา", count: 9 },
  { id: "partner", label: "พันธมิตร", count: 4 },
  { id: "guest", label: "แขก", count: 3 },
  { id: "inactive", label: "พ้นสภาพ/ไม่ใช้งาน", count: 6 },
];

export interface PersonnelStatTile {
  id: string;
  label: string;
  value: string;
  sublabel: string;
  color: "indigo" | "emerald" | "blue" | "purple" | "amber" | "red";
}

export const personnelStatTiles: PersonnelStatTile[] = [
  { id: "total", label: "บุคลากรทั้งหมด", value: "128", sublabel: "↑ 3 จากเดือนที่แล้ว", color: "indigo" },
  { id: "employee", label: "พนักงาน (Employee)", value: "112", sublabel: "87.5%", color: "emerald" },
  { id: "contractor", label: "ผู้รับเหมา (Contractor)", value: "9", sublabel: "7.0%", color: "blue" },
  { id: "partner", label: "พันธมิตร (Partner)", value: "4", sublabel: "3.1%", color: "purple" },
  { id: "guest", label: "แขก (Guest)", value: "3", sublabel: "2.4%", color: "amber" },
  { id: "inactive", label: "พ้นสภาพ/ไม่ใช้งาน", value: "6", sublabel: "จากทั้งหมด", color: "red" },
];

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
