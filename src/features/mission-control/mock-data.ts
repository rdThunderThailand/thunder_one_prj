// R&D placeholder data for the homepage's still-mock sections (2026-09-16
// redesign, matching the coordinating session's new mockup). Numbers derived
// from asset-intelligence/thunder-care's own mock generators where it makes
// sense, rather than inventing separate fake numbers from scratch — same
// discipline the previous version of this file already used.
import { getMockAssets } from "@/features/asset-intelligence/assets";
import { getMockWorkOrders } from "@/features/thunder-care/work-orders";

const assets = getMockAssets();
const workOrders = getMockWorkOrders();
const attentionAssets = assets.filter((a) => a.status === "attention" || a.status === "critical").length;
const overdueWorkOrders = workOrders.filter((w) => w.status === "overdue").length;

export interface StatCardData {
  id: string;
  label: string;
  value: string;
  delta: string;
  trend: number[];
  color: "indigo" | "blue" | "amber" | "emerald";
  icon: "monitor" | "warningTriangle" | "checkCircle" | "chart";
}

// Read by InsightsPage (/mission-control/insights) — kept in the original
// "Total Assets / Attention / Critical / Maintenance YTD" shape (requirement
// doc §4.1 CEO-01), unrelated to the 2026-09-16 homepage redesign below.
export const statCards: StatCardData[] = [
  {
    id: "total-assets",
    label: "Total Assets",
    value: String(assets.length * 210), // scaled up from the small mock set to read like a real fleet
    delta: "3.4%",
    trend: [780, 795, 802, 810, 818, 825, 830, 834, 838, 840, 841, 842],
    color: "indigo",
    icon: "monitor",
  },
  {
    id: "attention",
    label: "Attention",
    value: String(attentionAssets * 8),
    delta: "1",
    trend: [10, 12, 11, 14, 13, 15, 16, 15, 17, 16, 17, 17],
    color: "amber",
    icon: "warningTriangle",
  },
  {
    id: "critical",
    label: "Critical",
    value: String(assets.filter((a) => a.status === "critical").length),
    delta: "0",
    trend: [3, 3, 4, 4, 3, 4, 4, 5, 4, 4, 4, 4],
    color: "blue",
    icon: "checkCircle",
  },
  {
    id: "maintenance-ytd",
    label: "Maintenance YTD",
    value: `฿${Math.round(assets.reduce((sum, a) => sum + a.purchaseValue * 0.02, 0) * 1600).toLocaleString("en-US")}`,
    delta: "10%",
    trend: [200, 210, 215, 230, 240, 250, 255, 260, 270, 275, 280, 286],
    color: "emerald",
    icon: "chart",
  },
];

export type RecommendationStatus = "pending" | "approved" | "rejected";

export interface RecommendationData {
  id: string;
  title: string;
  summary: string;
  evidence: string;
  status: RecommendationStatus;
}

// Read by ApprovalsPage (/mission-control/approvals) — CEO-03/CEO-04,
// unrelated to the homepage redesign below.
export const mockRecommendations: RecommendationData[] = [
  {
    id: "rec-1",
    title: "Replacement decision",
    summary: "3 Accounting printers now cost 42% of replacement value to maintain.",
    evidence: "11 incidents / 90 days",
    status: "pending",
  },
];

export function getMockRecommendations(): RecommendationData[] {
  return mockRecommendations;
}

// `strategicBrief`/`attentionItems`/`decisionItems`/`askRecommendations`/
// `todaySchedule`/`nextUpEvents` (the old CEO-strategic-brief-style homepage
// content — StrategicBriefCard/DecisionsCard/AskThunderOneCard/
// TodayScheduleCard) removed 2026-09-16, superseded by the sections below
// once the homepage was redesigned to match the new mockup — none of those
// cards exist in the new layout.

// "ThunderOne Brief" — a static teaser for an AI summary panel that doesn't
// exist yet (no assistant backend anywhere in this app), same honest-preview
// treatment the old AskThunderOneCard used.
export const briefTeaser = {
  summary: "ThunderOne กำลังพัฒนาการสรุปสิ่งสำคัญ สิ่งที่ต้องติดตาม และงานที่ต้องการความสนใจ",
};

// Top stat row (HomeStatTilesRow) — "บุคลากรเข้าใหม่" is real (see
// core-mapper.ts's computeHomeStats). The other 3 stay mock: no "needs
// attention" status exists on a real Core asset (only Ready/In Use/In
// Progress/Retired-Cancelled — see asset-list-api.ts's ASSET_LIST_STATUSES),
// and neither Thunder Care nor Media Workspace has a real Core integration
// in this app yet for a request-approval count or an online-display count.
export interface TopStatMock {
  id: string;
  label: string;
  value: number;
}

export const topStatsMock: TopStatMock[] = [
  { id: "assets-attention", label: "สินทรัพย์ที่ต้องดูแล", value: attentionAssets },
  { id: "pending-requests", label: "คำขอที่รออนุมัติ", value: overdueWorkOrders },
  { id: "displays-online", label: "จอแสดงผลออนไลน์", value: 98 },
];

// Org overview row (OrgOverviewRow) — "บุคลากรทั้งหมด"/"สินทรัพย์ทั้งหมด" are
// real (core-mapper.ts). "จอแสดงผล"/"คำขอที่เปิดอยู่" stay mock, same gap as
// topStatsMock above.
export interface OrgOverviewMock {
  id: string;
  label: string;
  value: number;
  deltaLabel: string;
}

export const orgOverviewMock: OrgOverviewMock[] = [
  { id: "displays", label: "จอแสดงผล", value: 36, deltaLabel: "▲ 5%" },
  { id: "open-requests", label: "คำขอที่เปิดอยู่", value: workOrders.length, deltaLabel: "▲ 20%" },
];

// "งานที่ต้องดำเนินการ" (right rail) — operational task pings. No real
// cross-App task-queue/approvals-aggregation backend exists, same gap the
// old NeedsAttentionCard's attentionItems already documented.
export interface ActionItemData {
  id: string;
  title: string;
  source: string;
  timeAgo: string;
  tone: "red" | "blue";
}

export const actionItems: ActionItemData[] = [
  { id: "act-1", title: "อนุมัติคำขอซื้ออุปกรณ์ IT", source: "จาก ฝ่ายปฏิบัติการ", timeAgo: "2 ชม. ที่แล้ว", tone: "red" },
  {
    id: "act-2",
    title: "ตรวจสอบสินทรัพย์ที่มีปัญหา",
    source: `มี ${attentionAssets} รายการที่ต้องดูแล`,
    timeAgo: "4 ชม. ที่แล้ว",
    tone: "red",
  },
  { id: "act-3", title: "ทบทวนสมาชิกใหม่", source: "ตรวจสอบและอนุมัติการเข้าใช้งาน", timeAgo: "1 วันที่แล้ว", tone: "blue" },
];

// "ข่าวสารและอัปเดต" (right rail) — static placeholder; no announcements/CMS
// backend exists anywhere in this app.
export interface NewsItemData {
  id: string;
  title: string;
  description: string;
  dateLabel: string;
}

export const newsItems: NewsItemData[] = [
  {
    id: "news-1",
    title: "อัปเดตฟีเจอร์ Asset Workspace",
    description: "เพิ่มการแจ้งเตือนอัตโนมัติสำหรับสินทรัพย์",
    dateLabel: "22 ส.ค. 2025",
  },
  {
    id: "news-2",
    title: "คู่มือเริ่มใช้งาน Thunder Care",
    description: "แนวทางการใช้งานสำหรับผู้บริหาร",
    dateLabel: "20 ส.ค. 2025",
  },
  {
    id: "news-3",
    title: "เทรนด์เทคโนโลยี Digital Signage",
    description: "อัปเดตแนวโน้มและกรณีศึกษาล่าสุด",
    dateLabel: "18 ส.ค. 2025",
  },
];

// "กิจกรรมล่าสุด" — real via services/dashboard-api.ts's getRecentLogs; no
// mock fallback data here (a failed fetch shows an explicit empty state).
