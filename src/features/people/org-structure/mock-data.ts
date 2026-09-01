// R&D placeholder data for People Workspace's Org Structure page
// (`/people/org-structure`) — no backend yet, same discipline as
// people/overview's and people/personnel's mock-data.ts.
//
// `orgStatTiles` carries the mockup's own top-line numbers (18 units, 56
// teams, 128 employees, 142 positions, 87% fill rate) as static labels — they
// are NOT derived from `orgUnits` below (which only models the org chart's
// visible boxes, not every team/position in the company), same
// "mockup number vs. deeper page's real list" gap documented in
// people/personnel's mock-data.ts.
//
// `orgUnits` is a flat, id-keyed map (not nested objects) so OrgDetailPanel
// can look up any clicked node — including one several levels deep — by id
// in O(1), and so a sub-unit's "หน่วยงานย่อย" row and the chart node for the
// same unit are provably the same record.
export interface OrgStatTile {
  id: string;
  label: string;
  value: string;
  sublabel: string;
}

export const orgStatTiles: OrgStatTile[] = [
  { id: "units", label: "หน่วยงานทั้งหมด", value: "18", sublabel: "↑ 1 จากเดือนที่แล้ว" },
  { id: "teams", label: "ทีมทั้งหมด", value: "56", sublabel: "↑ 3 จากเดือนที่แล้ว" },
  { id: "employees", label: "พนักงานทั้งหมด", value: "128", sublabel: "↑ 3 จากเดือนที่แล้ว" },
  { id: "positions", label: "ตำแหน่งงาน", value: "142", sublabel: "↑ 5 จากเดือนที่แล้ว" },
  { id: "fill-rate", label: "อัตราบรรจุ", value: "87%", sublabel: "จากตำแหน่งงานทั้งหมด" },
];

export const orgStructureUpdatedLabel = "แก้ไขเมื่อ 10 พ.ค. 2569";
export const orgStructureUpdatedBy = "โดย May HR";

// `headName`/`headTitle`/`positionsCount`/`fillRate` are nullable — every mock
// unit below has all four, but the real Core-derived units (mapped in
// `core-mapper.ts` from `GET /tenants/:id/organizations`) can't supply any of
// them yet: `manager_id` isn't in Core's select list yet (flagged to Core,
// docs/people/core-response-people-workspace-api.md), and no
// positions/fill-rate concept exists in Core's schema at all. Components
// render "-" for these when null rather than a misleading 0.
export interface OrgUnitNode {
  id: string;
  name: string;
  headName: string | null;
  headTitle: string | null;
  employeeCount: number;
  unitCode: string;
  unitType: string;
  teamsCount: number;
  positionsCount: number | null;
  fillRate: number | null;
  parentId: string | null;
  childIds: string[];
}

export const rootUnitId = "exec";

export const orgUnits: Record<string, OrgUnitNode> = {
  exec: {
    id: "exec",
    name: "Executive Office",
    headName: "Kittipong T.",
    headTitle: "CEO",
    employeeCount: 8,
    unitCode: "DEP-001",
    unitType: "สายงานหลัก",
    teamsCount: 5,
    positionsCount: 10,
    fillRate: 80,
    parentId: null,
    childIds: ["sales", "marketing", "product-tech", "delivery", "operations"],
  },

  sales: {
    id: "sales",
    name: "Sales",
    headName: "Somchai W.",
    headTitle: "Sales Director",
    employeeCount: 23,
    unitCode: "DEP-002",
    unitType: "สายงานหลัก",
    teamsCount: 2,
    positionsCount: 24,
    fillRate: 83,
    parentId: "exec",
    childIds: ["sales-enterprise", "sales-partnership"],
  },
  "sales-enterprise": {
    id: "sales-enterprise",
    name: "Enterprise",
    headName: "Araya P.",
    headTitle: "Enterprise Lead",
    employeeCount: 12,
    unitCode: "DEP-002-01",
    unitType: "สายงานหลัก",
    teamsCount: 1,
    positionsCount: 13,
    fillRate: 92,
    parentId: "sales",
    childIds: [],
  },
  "sales-partnership": {
    id: "sales-partnership",
    name: "Partnership",
    headName: "Nattapong S.",
    headTitle: "Partnership Lead",
    employeeCount: 11,
    unitCode: "DEP-002-02",
    unitType: "สายงานหลัก",
    teamsCount: 1,
    positionsCount: 12,
    fillRate: 92,
    parentId: "sales",
    childIds: [],
  },

  marketing: {
    id: "marketing",
    name: "Marketing",
    headName: "Nalinee K.",
    headTitle: "Marketing Director",
    employeeCount: 15,
    unitCode: "DEP-003",
    unitType: "สายงานหลัก",
    teamsCount: 3,
    positionsCount: 17,
    fillRate: 88,
    parentId: "exec",
    childIds: ["marketing-content", "marketing-creative", "marketing-growth"],
  },
  "marketing-content": {
    id: "marketing-content",
    name: "Content",
    headName: "Pimchanok T.",
    headTitle: "Content Lead",
    employeeCount: 6,
    unitCode: "DEP-003-01",
    unitType: "สายงานหลัก",
    teamsCount: 1,
    positionsCount: 7,
    fillRate: 86,
    parentId: "marketing",
    childIds: [],
  },
  "marketing-creative": {
    id: "marketing-creative",
    name: "Creative",
    headName: "Thanawat R.",
    headTitle: "Creative Lead",
    employeeCount: 5,
    unitCode: "DEP-003-02",
    unitType: "สายงานหลัก",
    teamsCount: 1,
    positionsCount: 6,
    fillRate: 83,
    parentId: "marketing",
    childIds: [],
  },
  "marketing-growth": {
    id: "marketing-growth",
    name: "Growth",
    headName: "Suda W.",
    headTitle: "Growth Lead",
    employeeCount: 4,
    unitCode: "DEP-003-03",
    unitType: "สายงานหลัก",
    teamsCount: 1,
    positionsCount: 5,
    fillRate: 80,
    parentId: "marketing",
    childIds: [],
  },

  "product-tech": {
    id: "product-tech",
    name: "Product & Technology",
    headName: "Kridsada S.",
    headTitle: "CTO",
    employeeCount: 38,
    unitCode: "DEP-004",
    unitType: "สายงานหลัก",
    teamsCount: 4,
    positionsCount: 42,
    fillRate: 90,
    parentId: "exec",
    childIds: ["pt-product", "pt-engineering", "pt-qa", "pt-itops"],
  },
  "pt-product": {
    id: "pt-product",
    name: "Product",
    headName: "Chalita N.",
    headTitle: "Head of Product",
    employeeCount: 12,
    unitCode: "DEP-004-01",
    unitType: "สายงานหลัก",
    teamsCount: 1,
    positionsCount: 13,
    fillRate: 92,
    parentId: "product-tech",
    childIds: [],
  },
  "pt-engineering": {
    id: "pt-engineering",
    name: "Engineering",
    headName: "Ekapop J.",
    headTitle: "Engineering Lead",
    employeeCount: 18,
    unitCode: "DEP-004-02",
    unitType: "สายงานหลัก",
    teamsCount: 1,
    positionsCount: 20,
    fillRate: 90,
    parentId: "product-tech",
    childIds: [],
  },
  "pt-qa": {
    id: "pt-qa",
    name: "QA & Testing",
    headName: "Manee C.",
    headTitle: "QA Lead",
    employeeCount: 4,
    unitCode: "DEP-004-03",
    unitType: "สายงานหลัก",
    teamsCount: 1,
    positionsCount: 5,
    fillRate: 80,
    parentId: "product-tech",
    childIds: [],
  },
  "pt-itops": {
    id: "pt-itops",
    name: "IT Operations",
    headName: "Anan R.",
    headTitle: "IT Operations Lead",
    employeeCount: 4,
    unitCode: "DEP-004-04",
    unitType: "สายงานหลัก",
    teamsCount: 1,
    positionsCount: 4,
    fillRate: 100,
    parentId: "product-tech",
    childIds: [],
  },

  delivery: {
    id: "delivery",
    name: "Delivery",
    headName: "Ratchanee P.",
    headTitle: "Delivery Director",
    employeeCount: 27,
    unitCode: "DEP-005",
    unitType: "สายงานหลัก",
    teamsCount: 3,
    positionsCount: 30,
    fillRate: 90,
    parentId: "exec",
    childIds: ["dl-pm", "dl-impl", "dl-cs"],
  },
  "dl-pm": {
    id: "dl-pm",
    name: "Project Management",
    headName: "Worapon S.",
    headTitle: "PMO Lead",
    employeeCount: 10,
    unitCode: "DEP-005-01",
    unitType: "สายงานหลัก",
    teamsCount: 1,
    positionsCount: 11,
    fillRate: 91,
    parentId: "delivery",
    childIds: [],
  },
  "dl-impl": {
    id: "dl-impl",
    name: "Implementation",
    headName: "Sirilak B.",
    headTitle: "Implementation Lead",
    employeeCount: 12,
    unitCode: "DEP-005-02",
    unitType: "สายงานหลัก",
    teamsCount: 1,
    positionsCount: 13,
    fillRate: 92,
    parentId: "delivery",
    childIds: [],
  },
  "dl-cs": {
    id: "dl-cs",
    name: "Customer Success",
    headName: "Nattaya P.",
    headTitle: "CS Lead",
    employeeCount: 5,
    unitCode: "DEP-005-03",
    unitType: "สายงานหลัก",
    teamsCount: 1,
    positionsCount: 6,
    fillRate: 83,
    parentId: "delivery",
    childIds: [],
  },

  operations: {
    id: "operations",
    name: "Operations",
    headName: "Sirinya B.",
    headTitle: "Operations Director",
    employeeCount: 17,
    unitCode: "DEP-006",
    unitType: "สายงานหลัก",
    teamsCount: 3,
    positionsCount: 19,
    fillRate: 89,
    parentId: "exec",
    childIds: ["op-finance", "op-people", "op-admin"],
  },
  "op-finance": {
    id: "op-finance",
    name: "Finance & Accounting",
    headName: "Nattaya P.",
    headTitle: "Finance Lead",
    employeeCount: 6,
    unitCode: "DEP-006-01",
    unitType: "สายงานหลัก",
    teamsCount: 1,
    positionsCount: 7,
    fillRate: 86,
    parentId: "operations",
    childIds: [],
  },
  "op-people": {
    id: "op-people",
    name: "People & Culture",
    headName: "May H.",
    headTitle: "People & Culture Lead",
    employeeCount: 6,
    unitCode: "DEP-006-02",
    unitType: "สายงานหลัก",
    teamsCount: 1,
    positionsCount: 7,
    fillRate: 86,
    parentId: "operations",
    childIds: [],
  },
  "op-admin": {
    id: "op-admin",
    name: "Admin & Facilities",
    headName: "Kanya T.",
    headTitle: "Admin Lead",
    employeeCount: 5,
    unitCode: "DEP-006-03",
    unitType: "สายงานหลัก",
    teamsCount: 1,
    positionsCount: 5,
    fillRate: 100,
    parentId: "operations",
    childIds: [],
  },
};

export const orgViewTabs = [
  { id: "chart", label: "แผนผังองค์กร" },
  { id: "list", label: "รายชื่อหน่วยงาน" },
  { id: "positions", label: "ตำแหน่งงาน" },
] as const;

export type OrgViewTabId = (typeof orgViewTabs)[number]["id"];
