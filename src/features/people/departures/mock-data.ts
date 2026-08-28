// R&D placeholder data for People Workspace's Departures page
// (`/people/departures`) — no backend yet, same discipline as this feature's
// sibling pages' mock-data.ts files.
//
// `departureTabs`/`departureStatTiles` carry the mockup's own header counts
// (7/4/2/1/0) as static labels; they are NOT derived from `departureRows` —
// same "mockup number vs. small sample" gap `people/personnel`'s mock-data.ts
// documents for itself.
export interface DepartureStatTile {
  id: string;
  icon: "users" | "clock" | "calendar" | "check" | "cancelled";
  iconTone: string;
  label: string;
  value: string;
  sublabel: string;
}

export const departureStatTiles: DepartureStatTile[] = [
  {
    id: "total",
    icon: "users",
    iconTone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    label: "ทั้งหมด",
    value: "7",
    sublabel: "รายการ",
  },
  {
    id: "in-progress",
    icon: "clock",
    iconTone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    label: "กำลังดำเนินการ",
    value: "4",
    sublabel: "57.1%",
  },
  {
    id: "due-soon",
    icon: "calendar",
    iconTone: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
    label: "ถึงกำหนดออก",
    value: "2",
    sublabel: "28.6%",
  },
  {
    id: "completed",
    icon: "check",
    iconTone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    label: "เสร็จสิ้น",
    value: "1",
    sublabel: "14.3%",
  },
  {
    id: "cancelled",
    icon: "cancelled",
    iconTone: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
    label: "ยกเลิก",
    value: "0",
    sublabel: "0%",
  },
];

export type DepartureStatus = "in-progress" | "due-soon" | "completed" | "cancelled";

export interface DepartureTab {
  id: DepartureStatus | "all";
  label: string;
  count: number;
}

export const departureTabs: DepartureTab[] = [
  { id: "all", label: "ทั้งหมด", count: 7 },
  { id: "in-progress", label: "กำลังดำเนินการ", count: 4 },
  { id: "due-soon", label: "ถึงกำหนดออก", count: 2 },
  { id: "completed", label: "เสร็จสิ้น", count: 1 },
  { id: "cancelled", label: "ยกเลิก", count: 0 },
];

export type OffboardingStepState = "done" | "current" | "pending";

export interface OffboardingStep {
  label: string;
  state: OffboardingStepState;
  /** Only set on the mockup's own verified example ("d-1"); every other row's
   *  steps are derived and skip dates rather than inventing them. */
  dateLabel?: string;
}

const STEP_LABELS = [
  "แจ้งผู้เกี่ยวข้อง",
  "ส่งมอบงาน",
  "ปิดสิทธิ์การเข้าถึงระบบ",
  "คืนอุปกรณ์และทรัพย์สิน",
  "เคลียร์ค่าใช้จ่าย / เอกสารการเงิน",
  "แบบประเมินการออกจากงาน",
  "ปิดบัญชีผู้ใช้ทั้งหมด",
  "เอกสารรับรองการทำงาน",
  "จ่ายเงินเดือนและสิทธิ์คงเหลือ",
  "อัปเดตสถานะในระบบ",
];

/** `doneCount` steps done, the next one (if any) "current", the rest
 *  pending — a simple monotonic stand-in for every row except "d-1"
 *  (สมชาย วงศ์ดี), whose exact 3-done-then-current sequence with real dates
 *  is the mockup's own verified example and is hand-written below instead. */
function buildSequentialSteps(doneCount: number): OffboardingStep[] {
  return STEP_LABELS.map((label, index) => ({
    label,
    state: index < doneCount ? "done" : index === doneCount ? "current" : "pending",
  }));
}

const SOMCHAI_STEPS: OffboardingStep[] = STEP_LABELS.map((label, index) => {
  const doneDates = ["17 พ.ค. 2569", "18 พ.ค. 2569", "19 พ.ค. 2569"];
  if (index < 3) return { label, state: "done", dateLabel: doneDates[index] };
  if (index === 3) return { label, state: "current" };
  return { label, state: "pending" };
});

export interface DepartureRow {
  id: string;
  name: string;
  employeeCode: string;
  position: string;
  unit: string;
  exitTypeLabel: string;
  exitTypeSubLabel: string;
  exitDateLabel: string | null;
  daysLeftLabel: string | null;
  status: DepartureStatus;
  progress: number | null;
  responsibleName: string;
  responsibleRole: string | null;
  updatedDateLabel: string;
  updatedTimeLabel: string;
  steps: OffboardingStep[];
}

export const departureRows: DepartureRow[] = [
  {
    id: "d-1",
    name: "สมชาย วงศ์ดี",
    employeeCode: "EMP-0007",
    position: "Project Manager",
    unit: "Delivery / Project",
    exitTypeLabel: "ลาออก",
    exitTypeSubLabel: "Resignation",
    exitDateLabel: "31 พ.ค. 2569",
    daysLeftLabel: "อีก 10 วัน",
    status: "in-progress",
    progress: 60,
    responsibleName: "Jane Smith",
    responsibleRole: "HR Manager",
    updatedDateLabel: "21 พ.ค. 2569",
    updatedTimeLabel: "09:30",
    steps: SOMCHAI_STEPS,
  },
  {
    id: "d-2",
    name: "ณิชา รัตนกุล",
    employeeCode: "EMP-0012",
    position: "Graphic Designer",
    unit: "Marketing / Creative",
    exitTypeLabel: "ลาออก",
    exitTypeSubLabel: "Resignation",
    exitDateLabel: "15 มิ.ย. 2569",
    daysLeftLabel: "อีก 25 วัน",
    status: "in-progress",
    progress: 35,
    responsibleName: "Somchai W.",
    responsibleRole: "Sales Director",
    updatedDateLabel: "21 พ.ค. 2569",
    updatedTimeLabel: "11:15",
    steps: buildSequentialSteps(4),
  },
  {
    id: "d-3",
    name: "Peter Wilson",
    employeeCode: "EXT-0003",
    position: "Business Analyst",
    unit: "Product / Platform",
    exitTypeLabel: "สัญญาสิ้นสุด",
    exitTypeSubLabel: "Contract End",
    exitDateLabel: "31 พ.ค. 2569",
    daysLeftLabel: "อีก 10 วัน",
    status: "in-progress",
    progress: 50,
    responsibleName: "Nattaya P.",
    responsibleRole: "Finance Manager",
    updatedDateLabel: "20 พ.ค. 2569",
    updatedTimeLabel: "16:45",
    steps: buildSequentialSteps(5),
  },
  {
    id: "d-4",
    name: "วิภา แสงศรี",
    employeeCode: "EMP-0009",
    position: "Accountant",
    unit: "Finance / Accounting",
    exitTypeLabel: "เกษียณอายุ",
    exitTypeSubLabel: "Retirement",
    exitDateLabel: "30 มิ.ย. 2569",
    daysLeftLabel: "อีก 40 วัน",
    status: "due-soon",
    progress: 80,
    responsibleName: "Nattaya P.",
    responsibleRole: "Finance Manager",
    updatedDateLabel: "20 พ.ค. 2569",
    updatedTimeLabel: "10:20",
    steps: buildSequentialSteps(8),
  },
  {
    id: "d-5",
    name: "ธนวัฒน์ ศรีไทย",
    employeeCode: "EMP-0010",
    position: "System Engineer",
    unit: "IT / Operations",
    exitTypeLabel: "ลาออก",
    exitTypeSubLabel: "Resignation",
    exitDateLabel: "20 มิ.ย. 2569",
    daysLeftLabel: "อีก 30 วัน",
    status: "due-soon",
    progress: 90,
    responsibleName: "Anan R.",
    responsibleRole: "IT Manager",
    updatedDateLabel: "19 พ.ค. 2569",
    updatedTimeLabel: "09:10",
    steps: buildSequentialSteps(9),
  },
  {
    id: "d-6",
    name: "Krittaya P.",
    employeeCode: "EXT-0004",
    position: "UX Designer",
    unit: "Product / Design",
    exitTypeLabel: "สัญญาสิ้นสุด",
    exitTypeSubLabel: "Contract End",
    exitDateLabel: "31 พ.ค. 2569",
    daysLeftLabel: "อีก 10 วัน",
    status: "completed",
    progress: 100,
    responsibleName: "HR Admin",
    responsibleRole: null,
    updatedDateLabel: "18 พ.ค. 2569",
    updatedTimeLabel: "15:50",
    steps: buildSequentialSteps(10),
  },
  {
    id: "d-7",
    name: "อภิเษษฐ์ ใจดี",
    employeeCode: "EMP-0006",
    position: "Sales Executive",
    unit: "Sales / Enterprise",
    exitTypeLabel: "ยกเลิก",
    exitTypeSubLabel: "Cancelled",
    exitDateLabel: null,
    daysLeftLabel: null,
    status: "cancelled",
    progress: null,
    responsibleName: "Jane Smith",
    responsibleRole: "HR Manager",
    updatedDateLabel: "17 พ.ค. 2569",
    updatedTimeLabel: "14:25",
    steps: buildSequentialSteps(0),
  },
];

export const departureTotalCount = 7;
export const departurePageSize = 10;
