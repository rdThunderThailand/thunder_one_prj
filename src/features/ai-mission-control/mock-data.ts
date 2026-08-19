// R&D placeholder data for the CEO Mission Control dashboard — derived from
// ai-assets's mock data where it makes sense, rather than duplicating fake
// numbers from scratch. Replace once a real assets/insights backend exists.
import { getMockAssets } from "@/features/ai-assets";

const assets = getMockAssets();

export interface StatCardData {
  id: string;
  label: string;
  value: string;
  delta: string;
  trend: number[];
  color: "indigo" | "blue" | "amber" | "emerald";
  icon: "monitor" | "warningTriangle" | "checkCircle" | "chart";
}

const critical = assets.filter((a) => a.status === "critical").length;
const attention = assets.filter((a) => a.status === "attention").length;
const maintenanceYtd = assets.reduce((sum, a) => sum + a.purchaseValue * 0.02, 0);

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
    value: String(attention * 8),
    delta: "1",
    trend: [10, 12, 11, 14, 13, 15, 16, 15, 17, 16, 17, 17],
    color: "amber",
    icon: "warningTriangle",
  },
  {
    id: "critical",
    label: "Critical",
    value: String(critical),
    delta: "0",
    trend: [3, 3, 4, 4, 3, 4, 4, 5, 4, 4, 4, 4],
    color: "blue",
    icon: "checkCircle",
  },
  {
    id: "maintenance-ytd",
    label: "Maintenance YTD",
    value: `฿${Math.round(maintenanceYtd * 1600).toLocaleString("en-US")}`,
    delta: "10%",
    trend: [200, 210, 215, 230, 240, 250, 255, 260, 270, 275, 280, 286],
    color: "emerald",
    icon: "chart",
  },
];

export interface AlertItemData {
  id: string;
  severity: "red" | "yellow" | "blue";
  title: string;
  subtitle: string;
  timeAgo: string;
}

const severityFor = (status: (typeof assets)[number]["status"]): "red" | "yellow" | "blue" =>
  status === "critical" ? "red" : status === "attention" ? "yellow" : "blue";

// The simple asset+severity+time feed (requirement doc §4.1 "Recent Alerts
// list") — distinct from mockRecommendations below ("Requires Your
// Attention": a decision with evidence, not just a status ping).
const TIMES_AGO = ["5m ago", "18m ago", "32m ago", "50m ago", "1h ago", "2h ago"];

export const recentAlerts: AlertItemData[] = assets
  .filter((a) => a.status !== "healthy")
  .map((a, index) => ({
    id: a.id,
    severity: severityFor(a.status),
    title: a.tag,
    subtitle: a.category === "nas" ? "Backup failed, Server Room" : "Repeated failures",
    timeAgo: TIMES_AGO[index % TIMES_AGO.length],
  }));

export type RecommendationStatus = "pending" | "approved" | "rejected";

export interface RecommendationData {
  id: string;
  title: string;
  summary: string;
  evidence: string;
  status: RecommendationStatus;
}

// CEO-03: a decision with evidence, reviewed via Approvals (CEO-04) —
// matches the requirement doc's mockup text exactly.
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

export interface AssetOutlookData {
  warrantyExposure: string;
  criticalAssetRisks: number;
  maintenanceCostTrend: string;
  majorIncidents: number;
}

// CEO-02 — matches the requirement doc's mockup text exactly.
export const assetOutlook: AssetOutlookData = {
  warrantyExposure: "฿420K",
  criticalAssetRisks: 4,
  maintenanceCostTrend: "+18%",
  majorIncidents: 7,
};
