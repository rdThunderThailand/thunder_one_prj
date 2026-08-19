// R&D placeholder data for the Asset/IT Manager's "Asset Overview" dashboard
// (requirement doc §4.2) — derives counts from the same mock assets ai-mission-control
// reads, rather than inventing separate fake numbers. No backend yet.
import { getMockAssets } from "./services/mock-assets";

const assets = getMockAssets();
const healthy = assets.filter((a) => a.status === "healthy").length;
const attention = assets.filter((a) => a.status === "attention").length;
const critical = assets.filter((a) => a.status === "critical").length;

export interface StatTileData {
  id: string;
  label: string;
  value: string;
  color: "zinc" | "indigo" | "emerald" | "amber" | "red" | "blue";
}

export const assetStatTiles: StatTileData[] = [
  { id: "total", label: "Total Assets", value: String(assets.length * 210), color: "zinc" },
  { id: "healthy", label: "Healthy", value: String(healthy * 196), color: "emerald" },
  { id: "attention", label: "Attention", value: String(attention * 30), color: "amber" },
  { id: "critical", label: "Critical", value: String(critical), color: "red" },
  { id: "open-work-orders", label: "Open Work Orders", value: "14", color: "blue" },
];

export interface AttentionRowData {
  id: string;
  title: string;
  subtitle: string;
  severity: "red" | "yellow";
}

export const attentionRequired: AttentionRowData[] = assets
  .filter((a) => a.status !== "healthy")
  .map((a) => ({
    id: a.id,
    title: a.tag,
    subtitle: a.category === "nas" ? "Backup failed · IT · Bangkok" : "Repeated failures",
    severity: a.status === "critical" ? "red" : "yellow",
  }));

export interface WorkStatusRow {
  label: string;
  count: number;
}

export const workStatus: WorkStatusRow[] = [
  { label: "Open", count: 14 },
  { label: "Overdue", count: 3 },
  { label: "Vendor", count: 4 },
  { label: "In Progress", count: 7 },
  { label: "Completed (30d)", count: 31 },
];

export interface TeamWorkloadRow {
  name: string;
  current: number;
  max: number;
  overloaded?: boolean;
}

export const teamWorkload: TeamWorkloadRow[] = [
  { name: "Technician A", current: 4, max: 8 },
  { name: "Technician B", current: 7, max: 6, overloaded: true },
];
