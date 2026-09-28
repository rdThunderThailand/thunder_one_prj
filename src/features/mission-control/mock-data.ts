// R&D placeholder data for mission-control's still-mock surfaces: the
// Insights/Approvals sub-routes (`statCards`, `mockRecommendations`) and the
// Brief teaser's copy. The homepage itself no longer reads any mock numbers
// (2026-09-25) — see core-mapper.ts. Numbers here derive from
// asset-intelligence's own mock generator rather than being invented from
// scratch.
import { getMockAssets } from "@/features/asset-intelligence/assets";

const assets = getMockAssets();
const attentionAssets = assets.filter((a) => a.status === "attention" || a.status === "critical").length;

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

// Top stat tiles / org overview / "งานที่ต้องดำเนินการ" / "ข่าวสารและอัปเดต":
// their mocks (`topStatsMock`, `orgOverviewMock`, `actionItems`, `newsItems`)
// were removed 2026-09-25. The tiles now read real Core data
// (core-mapper.ts); anything without a Core source renders "-" or an empty
// state instead of placeholder numbers.

// "กิจกรรมล่าสุด" — real via services/dashboard-api.ts's getRecentLogs; no
// mock fallback data here (a failed fetch shows an explicit empty state).
