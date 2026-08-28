// R&D placeholder data for People Workspace's Overview page (HR Manager's
// daily landing page). No backend yet — every export here is a static mock,
// same "R&D placeholder" discipline as asset-intelligence/departments's
// mock-data.ts. Component files map the semantic `tone`/`color`/`status`
// fields below to actual colors/icons — this file stays presentation-free.
import type { BarDatum } from "@/components/ui/BarChart";
import type { DonutSegment } from "@/components/ui/DonutChart";

export type StatTileColor = "indigo" | "emerald" | "amber" | "blue" | "red";

export interface StatTileData {
  id: string;
  label: string;
  value: string;
  sublabel?: string;
  deltaLabel?: string;
  color: StatTileColor;
}

export const statTiles: StatTileData[] = [
  {
    id: "headcount",
    label: "จำนวนบุคลากรทั้งหมด",
    value: "128",
    deltaLabel: "↑ 3 จากเดือนที่แล้ว",
    color: "indigo",
  },
  {
    id: "new-hires",
    label: "เข้าใหม่ (เดือนนี้)",
    value: "8",
    deltaLabel: "↑ 2 จากเดือนที่แล้ว",
    color: "emerald",
  },
  {
    id: "onboarding",
    label: "กำลัง Onboarding",
    value: "5",
    sublabel: "3 คนใกล้ครบกำหนด",
    color: "amber",
  },
  {
    id: "changes",
    label: "การเปลี่ยนแปลง",
    value: "3",
    sublabel: "รออนุมัติ 2 รายการ",
    color: "blue",
  },
  {
    id: "departures",
    label: "ออกจากองค์กร (เดือนนี้)",
    value: "2",
    sublabel: "รอ Clearance 1 รายการ",
    color: "red",
  },
];

export interface WorkforceHealthData {
  score: number;
  deltaLabel: string;
  previousLabel: string;
}

export const workforceHealth: WorkforceHealthData = {
  score: 92,
  deltaLabel: "↑ 4%",
  previousLabel: "ดีขึ้นจากที่แล้ว 88%",
};

export type AttentionStatus = "pending" | "awaiting-approval" | "awaiting-response" | "overdue";

export interface AttentionItem {
  id: string;
  name: string;
  description: string;
  status: AttentionStatus;
  dateLabel: string;
  dueLabel: string;
  dueUrgent: boolean;
}

export const attentionItems: AttentionItem[] = [
  {
    id: "att-1",
    name: "สมชาย วงศ์ดี",
    description: "เริ่มงานพรุ่งนี้",
    status: "pending",
    dateLabel: "13 พ.ค. 2569",
    dueLabel: "พรุ่งนี้",
    dueUrgent: true,
  },
  {
    id: "att-2",
    name: "ณิชา รัตนกุล",
    description: "คำขอเปลี่ยนผู้จัดการ",
    status: "awaiting-approval",
    dateLabel: "14 พ.ค. 2569",
    dueLabel: "อีก 2 วัน",
    dueUrgent: false,
  },
  {
    id: "att-3",
    name: "Peter Wilson",
    description: "คำเชิญเข้าร่วมองค์กร",
    status: "awaiting-response",
    dateLabel: "16 พ.ค. 2569",
    dueLabel: "อีก 4 วัน",
    dueUrgent: false,
  },
  {
    id: "att-4",
    name: "Tom K.",
    description: "สิ้นสุดสัญญาจ้าง",
    status: "pending",
    dateLabel: "31 พ.ค. 2569",
    dueLabel: "อีก 19 วัน",
    dueUrgent: false,
  },
  {
    id: "att-5",
    name: "Ann Supaporn",
    description: "เอกสารนโยบายค้างอ่าน",
    status: "overdue",
    dateLabel: "-",
    dueLabel: "เกินกำหนด 3 วัน",
    dueUrgent: true,
  },
];

export const attentionTotalCount = 12;

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

export type ActivityTag = "onboarding" | "change" | "meeting" | "training" | "offboarding";

export interface TodayActivity {
  id: string;
  time: string;
  title: string;
  subtitle: string;
  tag: ActivityTag;
}

export const todayActivities: TodayActivity[] = [
  { id: "act-1", time: "09:00", title: "Ann Supaporn", subtitle: "First day", tag: "onboarding" },
  { id: "act-2", time: "10:30", title: "John P.", subtitle: "Department Transfer", tag: "change" },
  { id: "act-3", time: "11:00", title: "Team Stand-up", subtitle: "People & Culture", tag: "meeting" },
  { id: "act-4", time: "14:00", title: "Policy Update Briefing", subtitle: "สำหรับพนักงานใหม่", tag: "training" },
  { id: "act-5", time: "15:30", title: "Exit Interview", subtitle: "Tom K.", tag: "offboarding" },
];

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
