// R&D placeholder data for Thunder Care's "Customer Health" / Service
// Operations dashboard (requirement doc §4.6). No backend yet.
export interface StatTileData {
  id: string;
  label: string;
  value: string;
  color: "zinc" | "red" | "amber" | "emerald";
}

export const serviceStatTiles: StatTileData[] = [
  { id: "total-customers", label: "Total Customers", value: "18", color: "zinc" },
  { id: "critical", label: "Critical", value: "2", color: "red" },
  { id: "attention", label: "Attention", value: "14", color: "amber" },
  { id: "avg-health", label: "Avg Health Score", value: "91%", color: "emerald" },
];

export interface CustomerAttentionRow {
  id: string;
  name: string;
  subtitle: string;
  severity: "red" | "yellow" | "green";
}

export const customerAttention: CustomerAttentionRow[] = [
  {
    id: "abc",
    name: "ABC Company",
    subtitle: "NAS backup failure · 1 Critical · SLA 1h 32m",
    severity: "red",
  },
  {
    id: "xyz",
    name: "XYZ Company",
    subtitle: "8 Assets require attention · 2 Warranty · 3 Inspection · 3 Issues",
    severity: "yellow",
  },
  { id: "def", name: "DEF Company", subtitle: "Healthy", severity: "green" },
];

export const todayCard = {
  openWorkOrders: 24,
  slaRisk: 3,
  onsite: 8,
  remote: 13,
};

export interface CustomerRow {
  id: string;
  name: string;
  healthScore: number;
  openRequests: number;
  status: "red" | "yellow" | "green";
}

// A representative sample, not literally all 18 (serviceStatTiles.totalCustomers)
// — same "plausible, not exhaustive" mock discipline as the rest of this sprint.
export const mockCustomers: CustomerRow[] = [
  { id: "abc", name: "ABC Company", healthScore: 42, openRequests: 1, status: "red" },
  { id: "xyz", name: "XYZ Company", healthScore: 68, openRequests: 3, status: "yellow" },
  { id: "def", name: "DEF Company", healthScore: 95, openRequests: 0, status: "green" },
  { id: "ghi", name: "GHI Logistics", healthScore: 88, openRequests: 1, status: "green" },
  { id: "jkl", name: "JKL Retail Group", healthScore: 74, openRequests: 2, status: "yellow" },
  { id: "mno", name: "MNO Bank", healthScore: 91, openRequests: 0, status: "green" },
];
