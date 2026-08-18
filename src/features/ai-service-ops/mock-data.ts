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
