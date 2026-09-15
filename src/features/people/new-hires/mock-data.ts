// R&D placeholder data for People Workspace's New Hires page
// (`/people/new-hires`) — no backend yet, same discipline as this feature's
// sibling pages' mock-data.ts files.
//
// 2026-09-01: redesigned from a status-tabs + table layout to a 4-stage
// Kanban board (Pre-boarding → Onboarding → Ready to Work → Active) per the
// FigJam "People Workspace" board. `newHireFunnelStats` carries the
// mockup's own top-of-page header counts (32/6/3/18) as static labels; they
// are NOT derived from `newHireRows` below — same "mockup number vs. small
// sample" gap this feature's original comments already documented for the
// table layout's own header counts.
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

/** Marks exactly `doneIndices` done — used by the add-person wizards, whose
 *  intake steps each complete a non-contiguous subset of the 9 canonical
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

const ALL_DONE_STEPS: OnboardingStep[] = STEP_LABELS.map((label) => ({
  label,
  done: true,
  pendingLabel: "รอการเริ่มงาน",
}));

export type NewHireStatus = "pre-boarding" | "onboarding" | "ready-to-work" | "active";

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
  /** Only set for a row created via the add-person wizards' real Core
   *  invite path (`isPendingInvite(result)` — the email had no existing
   *  account, so Core created an invitation rather than a membership).
   *  Core's `invite_url`, shown in the Kanban card / handoff so HR can
   *  copy/resend it. */
  inviteUrl?: string;
  /** Raw onboarding checklist counts — only set on rows from the real
   *  roster fetch (`../core-mapper.ts`), not mock rows or the add-person
   *  wizards' handoff (added 2026-09-15 for drag-and-drop's real
   *  `PATCH .../members/:memberId/onboarding` calls, which need to know
   *  exactly which step indices to toggle, not just the rounded `progress`
   *  percentage). Drag-and-drop is disabled on a card until these are
   *  present. */
  onboardingDone?: number;
  onboardingTotal?: number;
  /** Raw "YYYY-MM-DD" (Core's `start_date`), alongside the already-formatted
   *  `startDateLabel` — added 2026-09-15 for real date-range filtering and
   *  NewHireSidebar's "พร้อมเริ่มงานใน 7 วัน"/"เริ่มแล้ว (เดือนนี้)" tiles,
   *  neither of which a formatted Thai label string can be parsed back out
   *  of reliably. Only set on real roster rows, same as onboardingDone/
   *  Total. */
  startDate?: string | null;
}

// The original 8 rows, reassigned from the old 4-status model to the new
// Kanban stages by their existing `progress` (0 → pre-boarding, 1-88 →
// onboarding) — no row's own progress/steps were altered, only `status`.
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
    status: "onboarding",
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
    status: "onboarding",
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
    status: "onboarding",
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
    status: "onboarding",
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
    status: "pre-boarding",
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
    status: "onboarding",
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
    status: "onboarding",
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
    status: "pre-boarding",
    managerName: "Pongpat P.",
    managerRole: "Tech Lead",
    steps: buildSequentialSteps(0),
  },
  // The original 8 rows had no "ready-to-work" or "active" example — added
  // below rather than reinterpreting p-1's verified checklist example.
  {
    id: "p-9",
    name: "พชรพล ศิริมาศ",
    employeeCode: "EMP-0106",
    position: "Business Analyst",
    unit: "Product / Platform",
    startDateLabel: "16 พ.ค. 2569",
    daysLeftLabel: "อีก 4 วัน",
    progress: 89,
    status: "ready-to-work",
    managerName: "Pongpat P.",
    managerRole: "Tech Lead",
    steps: buildStepsFromDoneIndices([0, 1, 2, 3, 4, 5, 6, 7]),
  },
  {
    id: "p-10",
    name: "อภิเชษฐ์ นิลเพชร",
    employeeCode: "EMP-0090",
    position: "Product Manager",
    unit: "Product / Platform",
    startDateLabel: "20 เม.ย. 2569",
    daysLeftLabel: "-",
    progress: 100,
    status: "active",
    managerName: "Pongpat P.",
    managerRole: "Tech Lead",
    steps: ALL_DONE_STEPS,
  },
  {
    id: "p-11",
    name: "รัชนก เกิดสุข",
    employeeCode: "EMP-0091",
    position: "Customer Success",
    unit: "Sales / Enterprise",
    startDateLabel: "18 เม.ย. 2569",
    daysLeftLabel: "-",
    progress: 100,
    status: "active",
    managerName: "Somchai W.",
    managerRole: "Sales Director",
    steps: ALL_DONE_STEPS,
  },
  {
    id: "p-12",
    name: "ธนกร นิลเพชร",
    employeeCode: "EMP-0092",
    position: "System Admin",
    unit: "IT / Operations",
    startDateLabel: "15 เม.ย. 2569",
    daysLeftLabel: "-",
    progress: 100,
    status: "active",
    managerName: "Anan R.",
    managerRole: "IT Manager",
    steps: ALL_DONE_STEPS,
  },
];

export interface NewHireFunnelStat {
  id: NewHireStatus;
  label: string;
  sublabel: string;
}

// Stage metadata (id/label/sublabel) NewHireKanbanBoard iterates to render
// its 4 columns — each column's actual count is computed live from the
// fetched `rows` (`stageRows.length`), never read from here. **2026-09-16**:
// dropped the `count` field this array used to carry (32/6/3/18) — it was
// already dead (nothing read it; both this board and NewHireFunnelRow
// compute real counts independently), just misleading to leave sitting next
// to real stage data.
export const newHireFunnelStats: NewHireFunnelStat[] = [
  { id: "pre-boarding", label: "Pre-boarding", sublabel: "รอเริ่มงาน / เอกสาร" },
  { id: "onboarding", label: "Onboarding", sublabel: "กำลังดำเนินการ" },
  { id: "ready-to-work", label: "Ready to Work", sublabel: "ให้พร้อมเริ่มงาน" },
  { id: "active", label: "Active", sublabel: "เริ่มงานแล้ว" },
];

// `NewHireSummaryStat`/`newHireSummaryStats` (dead — NewHireSidebar computes
// its own real summaryStats from `rows`), `NewHireActionItem`/
// `newHireActionItems` (fabricated task counts), and `NewHireResource`/
// `newHireResources` (fabricated document names with no real target) all
// removed 2026-09-16 — see NewHireSidebar.tsx's own header comment.
