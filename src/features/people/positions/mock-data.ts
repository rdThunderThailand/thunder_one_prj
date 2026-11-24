// R&D placeholder data for People Workspace's new "ตำแหน่งงาน" (Positions)
// page (`/people/positions`) — built 2026-09-01 from the FigJam "People
// Workspace" board. Fully mock: `docs/people/requirements-people-workspace-api.md`
// has no standalone "position" entity at all — `position` is just a free-text
// string on a Membership (Core's own confirmation, see §5 of that doc, and
// people/org-structure's `positionsCount`/`fillRate` already being
// documented as unavailable from Core for the same reason). If Core ever
// ships a real positions/headcount-planning entity, this whole feature
// needs re-pointing at it, not extending.
export type PositionLevel = "executive" | "manager" | "operator";
export type PositionStatus = "open" | "filled" | "closed" | "cancelled";

export interface PositionRow {
  id: string;
  name: string;
  code: string;
  unit: string;
  level: PositionLevel;
  status: PositionStatus;
  filled: number;
  total: number;
  managerName: string | null;
  managerRole: string | null;
}

export const positionRows: PositionRow[] = [
  {
    id: "pos-1",
    name: "Sales Manager",
    code: "POS-001",
    unit: "Sales",
    level: "manager",
    status: "filled",
    filled: 1,
    total: 1,
    managerName: "สมชาย โควรณ์",
    managerRole: "Head of Sales",
  },
  {
    id: "pos-2",
    name: "Assistant Sales Manager",
    code: "POS-002",
    unit: "Sales",
    level: "manager",
    status: "filled",
    filled: 2,
    total: 2,
    managerName: "สมชาย โควรณ์",
    managerRole: "Head of Sales",
  },
  {
    id: "pos-3",
    name: "Sales Supervisor",
    code: "POS-003",
    unit: "Sales",
    level: "manager",
    status: "filled",
    filled: 6,
    total: 6,
    managerName: "สมชาย โควรณ์",
    managerRole: "Head of Sales",
  },
  {
    id: "pos-4",
    name: "Senior Sales Executive",
    code: "POS-004",
    unit: "Sales",
    level: "operator",
    status: "open",
    filled: 12,
    total: 15,
    managerName: null,
    managerRole: null,
  },
  {
    id: "pos-5",
    name: "Sales Executive",
    code: "POS-005",
    unit: "Sales",
    level: "operator",
    status: "open",
    filled: 3,
    total: 5,
    managerName: null,
    managerRole: null,
  },
  {
    id: "pos-6",
    name: "Digital Marketing Manager",
    code: "MKT-001",
    unit: "Marketing",
    level: "manager",
    status: "filled",
    filled: 1,
    total: 1,
    managerName: "Jane Smith",
    managerRole: "Marketing Manager",
  },
  {
    id: "pos-7",
    name: "Content Marketing Specialist",
    code: "MKT-002",
    unit: "Marketing",
    level: "operator",
    status: "filled",
    filled: 2,
    total: 2,
    managerName: "Jane Smith",
    managerRole: "Marketing Manager",
  },
  {
    id: "pos-8",
    name: "Accountant",
    code: "FIN-001",
    unit: "Finance",
    level: "operator",
    status: "filled",
    filled: 1,
    total: 1,
    managerName: "Nattaya P.",
    managerRole: "Finance Manager",
  },
];

export interface PositionStatTile {
  id: string;
  label: string;
  value: string;
  sublabel: string;
}

// The mockup's own top-line numbers — not derived from `positionRows` above
// (8 rows here vs. 128 in the header), same documented gap every other
// people/* mock-data.ts carries for its own header counts.
export const positionStatTiles: PositionStatTile[] = [
  { id: "total", label: "ตำแหน่งงานทั้งหมด", value: "128", sublabel: "ตำแหน่ง" },
  { id: "open", label: "ตำแหน่งที่เปิดรับ", value: "12", sublabel: "ดูรายละเอียด →" },
  { id: "filled", label: "ตำแหน่งที่มีคนครอง", value: "116", sublabel: "ดูรายละเอียด →" },
];

export const positionFillRate = 90.6;

export interface PositionLevelBar {
  label: string;
  value: string;
  count: number;
}

export const positionLevelBars: PositionLevelBar[] = [
  { label: "ระดับบริหาร", value: "23", count: 23 },
  { label: "ระดับหัวหน้างาน", value: "38", count: 38 },
  { label: "ระดับปฏิบัติงาน", value: "22", count: 22 },
];

export interface PositionTab {
  id: PositionStatus | "all";
  label: string;
  count: number;
}

export const positionTabs: PositionTab[] = [
  { id: "all", label: "ทั้งหมด", count: 128 },
  { id: "open", label: "เปิดรับ", count: 12 },
  { id: "filled", label: "มีคนครอง", count: 116 },
  { id: "closed", label: "ปิดรับ", count: 0 },
  { id: "cancelled", label: "ยกเลิก", count: 0 },
];
