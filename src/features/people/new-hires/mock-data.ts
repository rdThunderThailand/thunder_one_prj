// R&D placeholder data for People Workspace's New Hires page
// (`/people/new-hires`) — no backend yet, same discipline as this feature's
// sibling pages' mock-data.ts files.
//
// `newHireTabs` carries the mockup's own header counts (8/5/2/1/0) as static
// labels; they are NOT derived from `newHireRows` (8 rows, but their real
// per-row `status` only sums to 3 in-progress / 3 pending / 2 not-started —
// same "mockup number vs. small sample" gap `people/personnel`'s mock-data.ts
// documents for its own tab counts).
export interface NewHireStatTile {
  id: string;
  icon: "users" | "calendar" | "clock" | "hourglass" | "check";
  iconTone: string;
  label: string;
  value: string;
  sublabel: string;
}

export const newHireStatTiles: NewHireStatTile[] = [
  {
    id: "total",
    icon: "users",
    iconTone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    label: "ทั้งหมด",
    value: "8",
    sublabel: "ทั้งหมด",
  },
  {
    id: "starting-this-week",
    icon: "calendar",
    iconTone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    label: "เริ่มงานสัปดาห์นี้",
    value: "2",
    sublabel: "23 – 29 พ.ค. 2569",
  },
  {
    id: "in-progress",
    icon: "clock",
    iconTone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    label: "กำลังดำเนินการ",
    value: "5",
    sublabel: "62.5% ของทั้งหมด",
  },
  {
    id: "pending",
    icon: "hourglass",
    iconTone: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
    label: "รอการดำเนินการ",
    value: "2",
    sublabel: "25% ของทั้งหมด",
  },
  {
    id: "ready",
    icon: "check",
    iconTone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    label: "พร้อมเริ่มงาน",
    value: "1",
    sublabel: "12.5% ของทั้งหมด",
  },
];

export type NewHireStatus = "in-progress" | "pending" | "not-started" | "completed";

export interface NewHireTab {
  id: NewHireStatus | "all";
  label: string;
  count: number;
}

export const newHireTabs: NewHireTab[] = [
  { id: "all", label: "ทั้งหมด", count: 8 },
  { id: "in-progress", label: "กำลังดำเนินการ", count: 5 },
  { id: "pending", label: "รอการดำเนินการ", count: 2 },
  { id: "not-started", label: "พร้อมเริ่มงาน", count: 1 },
  { id: "completed", label: "เสร็จสิ้น", count: 0 },
];

export interface OnboardingStep {
  label: string;
  done: boolean;
  /** The literal badge text — step 9's differs ("รอการเริ่มงาน") from every
   *  other pending step's ("รอดำเนินการ") even though both are just "not done
   *  yet", matching the mockup's own wording. */
  pendingLabel: string;
}

const STEP_LABELS = [
  "ข้อมูลบุคลากร",
  "โครงสร้างและตำแหน่งงาน",
  "บัญชีผู้ใช้และสิทธิ์การเข้าถึง",
  "อุปกรณ์และทรัพยากร",
  "แอปพลิเคชันที่จำเป็น",
  "นโยบายและเอกสาร",
  "การอบรมที่จำเป็น",
  "เตรียมความพร้อมผู้จัดการ",
  "พร้อมเริ่มงาน",
];

/** Marks the first `doneCount` steps done, in order — a simple monotonic
 *  stand-in for every row except "p-1" (แอน), whose exact 1/2/3/6/8 sequence
 *  is the mockup's own verified example and is hand-written below instead. */
function buildSequentialSteps(doneCount: number): OnboardingStep[] {
  return STEP_LABELS.map((label, index) => ({
    label,
    done: index < doneCount,
    pendingLabel: index === STEP_LABELS.length - 1 ? "รอการเริ่มงาน" : "รอดำเนินการ",
  }));
}

/** Marks exactly `doneIndices` done — used by AddEmployeeModal, whose 5
 *  wizard steps each complete a non-contiguous subset of the 9 canonical
 *  steps rather than a simple prefix. */
export function buildStepsFromDoneIndices(doneIndices: number[]): OnboardingStep[] {
  return STEP_LABELS.map((label, index) => ({
    label,
    done: doneIndices.includes(index),
    pendingLabel: index === STEP_LABELS.length - 1 ? "รอการเริ่มงาน" : "รอดำเนินการ",
  }));
}

const ANN_STEPS: OnboardingStep[] = STEP_LABELS.map((label, index) => ({
  label,
  done: [0, 1, 2, 5, 7].includes(index),
  pendingLabel: index === STEP_LABELS.length - 1 ? "รอการเริ่มงาน" : "รอดำเนินการ",
}));

export interface NewHireRow {
  id: string;
  name: string;
  employeeCode: string;
  position: string;
  unit: string;
  startDateLabel: string;
  daysLeftLabel: string;
  progress: number;
  status: NewHireStatus;
  managerName: string | null;
  managerRole: string | null;
  steps: OnboardingStep[];
  /** Only set for a row created via AddEmployeeModal's real Core invite path
   *  (`isPendingInvite(result)` — the email had no existing account, so Core
   *  created an invitation rather than a membership). Core's `invite_url`,
   *  shown in NewHireDetailPanel so HR can copy/resend it. */
  inviteUrl?: string;
}

export const newHireRows: NewHireRow[] = [
  {
    id: "p-1",
    name: "แอน สุภาภรณ์",
    employeeCode: "EMP-0101",
    position: "Graphic Designer",
    unit: "Marketing / Creative",
    startDateLabel: "1 มิ.ย. 2569",
    daysLeftLabel: "อีก 5 วัน",
    progress: 72,
    status: "in-progress",
    managerName: "Jane Smith",
    managerRole: "Marketing Manager",
    steps: ANN_STEPS,
  },
  {
    id: "p-2",
    name: "จอห์น พี.",
    employeeCode: "EMP-0102",
    position: "Software Developer",
    unit: "Product / Platform",
    startDateLabel: "3 มิ.ย. 2569",
    daysLeftLabel: "อีก 7 วัน",
    progress: 45,
    status: "pending",
    managerName: "Pongpat P.",
    managerRole: "Tech Lead",
    steps: buildSequentialSteps(4),
  },
  {
    id: "p-3",
    name: "เมย์ ศิริวรรณ",
    employeeCode: "EMP-0103",
    position: "Marketing Executive",
    unit: "Marketing / Growth",
    startDateLabel: "5 มิ.ย. 2569",
    daysLeftLabel: "อีก 9 วัน",
    progress: 20,
    status: "pending",
    managerName: "Jane Smith",
    managerRole: "Marketing Manager",
    steps: buildSequentialSteps(2),
  },
  {
    id: "p-4",
    name: "วิน ธนวัฒน์",
    employeeCode: "EMP-0104",
    position: "Sales Executive",
    unit: "Sales / Enterprise",
    startDateLabel: "10 มิ.ย. 2569",
    daysLeftLabel: "อีก 14 วัน",
    progress: 10,
    status: "in-progress",
    managerName: "Somchai W.",
    managerRole: "Sales Director",
    steps: buildSequentialSteps(1),
  },
  {
    id: "p-5",
    name: "กรีน นภัสสร",
    employeeCode: "EMP-0105",
    position: "Accountant",
    unit: "Finance / Accounting",
    startDateLabel: "15 มิ.ย. 2569",
    daysLeftLabel: "อีก 19 วัน",
    progress: 0,
    status: "not-started",
    managerName: "Nattaya P.",
    managerRole: "Finance Manager",
    steps: buildSequentialSteps(0),
  },
  {
    id: "p-6",
    name: "ดัน อัครวุฒิ",
    employeeCode: "CON-0101",
    position: "System Analyst",
    unit: "IT / Operations",
    startDateLabel: "1 มิ.ย. 2569",
    daysLeftLabel: "อีก 5 วัน",
    progress: 65,
    status: "in-progress",
    managerName: "Anan R.",
    managerRole: "IT Manager",
    steps: buildSequentialSteps(6),
  },
  {
    id: "p-7",
    name: "ปีเตอร์ วิลสัน",
    employeeCode: "EXT-0101",
    position: "Senior Consultant",
    unit: "Strategy",
    startDateLabel: "3 มิ.ย. 2569",
    daysLeftLabel: "อีก 7 วัน",
    progress: 30,
    status: "pending",
    managerName: null,
    managerRole: null,
    steps: buildSequentialSteps(3),
  },
  {
    id: "p-8",
    name: "ลูกน้ำ ภัทรา",
    employeeCode: "EXT-0102",
    position: "UX Designer",
    unit: "Product / Design",
    startDateLabel: "5 มิ.ย. 2569",
    daysLeftLabel: "อีก 9 วัน",
    progress: 0,
    status: "not-started",
    managerName: "Pongpat P.",
    managerRole: "Tech Lead",
    steps: buildSequentialSteps(0),
  },
];

export const newHireTotalCount = 8;
export const newHirePageSize = 10;
