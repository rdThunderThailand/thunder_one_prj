// R&D placeholder — no Thunder_Core sync exists yet (see AM-01 in the
// requirement doc, and docs/asset-intelligence/questions-thunder-core-contract.md).
// Replace with a real service call once that contract is settled.
import { CURRENT_EMPLOYEE_ID } from "@/config/current-employee";
import type { Asset } from "../types";

const mockAssets: Asset[] = [
  {
    id: "nas-001",
    tag: "NAS-001",
    category: "nas",
    status: "critical",
    lifecycleStatus: "active",
    locationId: "bangkok-server-room",
    departmentId: "it",
    assigneeId: null,
    vendorId: "synology",
    warrantyExpiry: "2026-11-02",
    purchaseValue: 85000,
    healthScore: 22,
    externalRef: null,
  },
  {
    id: "prn-019",
    tag: "PRN-019",
    category: "printer",
    status: "attention",
    lifecycleStatus: "active",
    locationId: "bangkok-floor-4",
    departmentId: "accounting",
    assigneeId: null,
    vendorId: "hp",
    warrantyExpiry: "2026-09-14",
    purchaseValue: 32000,
    healthScore: 58,
    externalRef: null,
  },
  {
    id: "nb-032",
    tag: "NB-032",
    category: "laptop",
    status: "attention",
    lifecycleStatus: "active",
    model: "Dell Latitude 5450",
    locationId: "bangkok-floor-3",
    departmentId: "sales",
    assigneeId: CURRENT_EMPLOYEE_ID,
    vendorId: "dell",
    warrantyExpiry: "2026-09-01",
    purchaseValue: 42000,
    healthScore: 64,
    externalRef: null,
  },
  {
    id: "cctv-021",
    tag: "CCTV-021",
    category: "media_player_device",
    status: "healthy",
    lifecycleStatus: "active",
    locationId: "central-world-entrance",
    departmentId: "it",
    assigneeId: null,
    vendorId: "samsung",
    warrantyExpiry: "2027-03-10",
    purchaseValue: 68000,
    healthScore: 91,
    externalRef: null,
  },
  // The following are the current employee's own equipment (formerly a
  // separate mock-my-assets.ts shape) — folded into the real Asset registry so
  // "which employee holds which asset" has one source of truth.
  {
    id: "mon-019",
    tag: "MON-019",
    category: "other",
    status: "healthy",
    lifecycleStatus: "active",
    model: 'Dell 27" Monitor',
    locationId: "bangkok-floor-3",
    departmentId: "sales",
    assigneeId: CURRENT_EMPLOYEE_ID,
    vendorId: "dell",
    warrantyExpiry: "2027-01-20",
    purchaseValue: 9000,
    healthScore: 95,
    externalRef: null,
  },
  {
    id: "phone-008",
    tag: "PHONE-008",
    category: "other",
    status: "healthy",
    lifecycleStatus: "active",
    model: "iPhone 14",
    locationId: "bangkok-floor-3",
    departmentId: "sales",
    assigneeId: CURRENT_EMPLOYEE_ID,
    vendorId: "apple",
    warrantyExpiry: "2027-05-02",
    purchaseValue: 28000,
    healthScore: 97,
    externalRef: null,
  },
  // Newly assigned, waiting for the employee to scan/confirm receipt (EMP-01).
  {
    id: "mon-044",
    tag: "MON-044",
    category: "other",
    status: "healthy",
    lifecycleStatus: "pending_acknowledgement",
    model: 'LG 24" Monitor',
    locationId: "bangkok-floor-3",
    departmentId: "sales",
    assigneeId: CURRENT_EMPLOYEE_ID,
    vendorId: "lg",
    warrantyExpiry: "2028-02-10",
    purchaseValue: 6500,
    healthScore: 100,
    externalRef: null,
  },
  // Owned by the Sales department but not yet assigned to a specific
  // employee — the kind of row Department Manager's "Assets"/"My Team" pages
  // would offer up for DM-02 (assign/reassign), not built this round.
  {
    id: "prn-044",
    tag: "PRN-044",
    category: "printer",
    status: "critical",
    lifecycleStatus: "active",
    model: "HP LaserJet Pro",
    locationId: "bangkok-floor-3",
    departmentId: "sales",
    assigneeId: null,
    vendorId: "hp",
    warrantyExpiry: "2026-10-05",
    purchaseValue: 18000,
    healthScore: 31,
    externalRef: null,
  },
  // Transferred from Asset Manager, awaiting Department Manager's
  // acknowledgement (DM-01) — one step earlier in the onboarding flow than
  // mon-044 above, which is already past that step and waiting on the
  // employee instead.
  {
    id: "mon-051",
    tag: "MON-051",
    category: "other",
    status: "healthy",
    lifecycleStatus: "pending_department_ack",
    model: 'Dell 24" Monitor',
    locationId: "bangkok-floor-3",
    departmentId: "sales",
    assigneeId: null,
    vendorId: "dell",
    warrantyExpiry: "2028-06-01",
    purchaseValue: 7200,
    healthScore: 100,
    externalRef: null,
  },
  // Newly received into Asset Manager's own pool, not yet passed to any
  // department (AM-02/AM-04) — departmentId: null is what makes "Pass to
  // Department" available on AssetsListPage for this row.
  {
    id: "nb-060",
    tag: "NB-060",
    category: "laptop",
    status: "healthy",
    lifecycleStatus: "active",
    model: "Dell Latitude 5450",
    locationId: "bangkok-server-room",
    departmentId: null,
    assigneeId: null,
    vendorId: "dell",
    warrantyExpiry: "2029-01-15",
    purchaseValue: 43000,
    healthScore: 100,
    externalRef: null,
  },
];

export function getMockAssets(): Asset[] {
  return mockAssets;
}
