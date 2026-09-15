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

// `PersonnelStatTile`/`personnelStatTiles` (the old 3-tile mock) removed
// 2026-09-15 — พนักงานทั้งหมด/ผู้ปฏิบัติงานภายนอก/เข้าใหม่ (เดือนนี้) are all
// real now (computed in PersonnelPage from the fetched roster).
// ออกจากองค์กร (เดือนนี้)/อัตราการคงอยู่ stay mock below — no offboarding
// entity exists in Core at all, same gap as /people/departures.
export const personnelRetentionRate = 94.1;

export interface PersonnelRow {
  id: string;
  name: string;
  email: string;
  employeeCode: string;
  position: string;
  unit: string;
  /** Raw `default_department_id`, for pre-selecting the right option in
   *  EditPersonnelModal's department dropdown — `unit` above is already a
   *  resolved display label ("Parent / Child"), not usable as a form value.
   *  Omitted (not `null`) on mock rows, which never had a real id to carry. */
  departmentId?: string | null;
  type: PersonnelType;
  workStatus: WorkStatus;
  startDateLabel: string;
  /** Raw `start_date` ("YYYY-MM-DD"), alongside the formatted
   *  `startDateLabel` — added 2026-09-15 so EditPersonnelModal's date input
   *  can be pre-populated with a real value, not just displayed. Same
   *  optional-not-null reasoning as departmentId above. */
  startDate?: string | null;
  /** "N ปี M เดือน" duration since startDate, computed once in
   *  core-mapper.ts rather than re-derived per render. "-" when no
   *  startDate. Added 2026-09-15 for the redesigned table's "วันที่เริ่มงาน /
   *  ระยะเวลา" column. */
  tenureLabel?: string;
  /** Real `user.avatar_url` — added 2026-09-15. This app has no photo
   *  upload feature anywhere yet, so this is almost always `null` in
   *  practice (Avatar falls back to initials) even though the field itself
   *  is real. */
  avatarUrl?: string | null;
  /** Raw `probation_end_date` ("YYYY-MM-DD") — added 2026-09-15, same
   *  "confirmed already in Core's MEMBER_SELECT, frontend type hadn't
   *  caught up" story as member_type/start_date before it. "On probation"
   *  is derived (compare to today), not stored as a separate boolean, so
   *  there's one source of truth and it can't drift as today's date moves
   *  forward. */
  probationEndDate?: string | null;
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

// `personnelTotalCount`/`personnelPageSize`/`personnelTotalPages` (the old
// static mock numbers) removed 2026-09-15 once PersonnelTableControls
// started doing real client-side pagination over the fetched roster.
