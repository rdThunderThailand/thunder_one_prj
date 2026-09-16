// R&D placeholder data for People Workspace's Overview page (HR Manager's
// daily landing page). No backend yet — every export here is a static mock,
// same "R&D placeholder" discipline as asset-intelligence/departments's
// mock-data.ts. Component files map the semantic `tone`/`color`/`status`
// fields below to actual colors/icons — this file stays presentation-free.
import type { BarDatum } from "@/components/ui/BarChart";
import type { DonutSegment } from "@/components/ui/DonutChart";

export type StatTileColor = "indigo" | "emerald" | "amber" | "blue" | "red";

// `StatTileData`/`statTiles` (the old 5-tile mock, including a hardcoded
// "3"/"2" for การเปลี่ยนแปลง/ออกจากองค์กร) and `WorkforceHealthData`/
// `workforceHealth` (a synthetic 92% score) removed 2026-09-16 — a mock-data
// audit found `StatTilesRow` showing both as if real. Neither has anything
// to back it in Core yet: การเปลี่ยนแปลง/ออกจากองค์กร need the
// Change/Offboarding entities proposed separately; Workforce Health was a
// composite score with no real formula design at all, not just missing
// data. `StatTilesRow` now renders 3 real tiles only — see that component's
// own header comment.

// `AttentionStatus`/`AttentionItem`/`attentionItems`/`attentionTotalCount`
// (backed `AttentionListCard`, "งานที่ต้องให้ความสนใจ") removed 2026-09-16 —
// same mock-data audit as StatTilesRow above. Every row was fabricated
// person data (names, descriptions, due dates) with no real "attention
// items"/cross-App task concept in Core to back any of it — the whole card
// was removed from `OverviewPage` rather than kept showing fake people.

export interface OnboardingSummary {
  total: number;
  notStarted: number;
  inProgress: number;
  dueSoon: number;
  completed: number;
}

export const onboardingSummary: OnboardingSummary = {
  total: 5,
  notStarted: 1,
  inProgress: 3,
  dueSoon: 1,
  completed: 0,
};

export interface OnboardingRow {
  id: string;
  name: string;
  role: string;
  startDateLabel: string;
  progress: number;
  dueLabel: string;
}

export const onboardingRows: OnboardingRow[] = [
  { id: "ob-1", name: "Ann Supaporn", role: "Graphic Designer", startDateLabel: "เริ่ม 1 พ.ค. 2569", progress: 72, dueLabel: "อีก 2 วัน" },
  { id: "ob-2", name: "John P.", role: "Software Developer", startDateLabel: "เริ่ม 3 พ.ค. 2569", progress: 45, dueLabel: "อีก 4 วัน" },
  { id: "ob-3", name: "May S.", role: "Marketing Executive", startDateLabel: "เริ่ม 5 พ.ค. 2569", progress: 20, dueLabel: "อีก 6 วัน" },
  { id: "ob-4", name: "Win T.", role: "Sales Executive", startDateLabel: "เริ่ม 10 พ.ค. 2569", progress: 10, dueLabel: "อีก 11 วัน" },
  { id: "ob-5", name: "Krit P.", role: "Support Engineer", startDateLabel: "เริ่ม 15 พ.ค. 2569", progress: 0, dueLabel: "อีก 16 วัน" },
];

// `ActivityTag`/`TodayActivity`/`todayActivities` (the old mock for
// TodayActivityCard) removed 2026-09-15 once that card was wired to real
// data — see `../services/dashboard-api.ts` and the card's own header
// comment for why the 5-category tag concept didn't carry over.

export interface OrgStructureRow {
  id: string;
  name: string;
  count: number;
}

export const orgStructureRows: OrgStructureRow[] = [
  { id: "org-exec", name: "Executive Office", count: 8 },
  { id: "org-sales", name: "Sales", count: 23 },
  { id: "org-marketing", name: "Marketing", count: 15 },
  { id: "org-product", name: "Product & Technology", count: 38 },
  { id: "org-delivery", name: "Delivery", count: 27 },
  { id: "org-ops", name: "Operations", count: 17 },
];

export const totalHeadcount = 128;

export const personnelBreakdown: DonutSegment[] = [
  { label: "พนักงาน (Employee)", value: 112, color: "#6366f1" },
  { label: "ผู้รับเหมา (Contractor)", value: 9, color: "#22d3ee" },
  { label: "พันธมิตร (Partner)", value: 4, color: "#8b5cf6" },
  { label: "แขก (Guest)", value: 3, color: "#f59e0b" },
];

export const tenureDistribution: BarDatum[] = [
  { label: "น้อยกว่า 1 ปี", value: "18 (14.1%)", count: 18 },
  { label: "1 - 3 ปี", value: "34 (26.6%)", count: 34 },
  { label: "3 - 5 ปี", value: "26 (20.3%)", count: 26 },
  { label: "5 - 10 ปี", value: "28 (21.9%)", count: 28 },
  { label: "มากกว่า 10 ปี", value: "22 (17.1%)", count: 22 },
];

export type QuickActionId =
  | "add-employee"
  | "invite-person"
  | "transfer-employee"
  | "change-manager"
  | "start-offboarding"
  | "create-report";

export interface QuickAction {
  id: QuickActionId;
  label: string;
  sublabel: string;
}

export const quickActions: QuickAction[] = [
  { id: "add-employee", label: "เพิ่มพนักงานใหม่", sublabel: "เริ่ม Onboarding" },
  { id: "invite-person", label: "เชิญบุคคลเข้าร่วม", sublabel: "Partner / Guest / Contractor" },
  { id: "transfer-employee", label: "โอนย้ายพนักงาน", sublabel: "เปลี่ยนทีม / แผนก" },
  { id: "change-manager", label: "เปลี่ยนผู้จัดการ", sublabel: "Update Reporting" },
  { id: "start-offboarding", label: "เริ่ม Offboarding", sublabel: "พนักงานออกจากองค์กร" },
  { id: "create-report", label: "สร้างรายงาน", sublabel: "People Report" },
];
