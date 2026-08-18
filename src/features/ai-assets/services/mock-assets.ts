// R&D placeholder — no Thunder_Core sync exists yet (see AM-01 in the
// requirement doc, and docs/asset-intelligence/questions-thunder-core-contract.md).
// Replace with a real service call once that contract is settled.
import type { Asset } from "../types";

const mockAssets: Asset[] = [
  {
    id: "nas-001",
    tag: "NAS-001",
    category: "nas",
    status: "critical",
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
    locationId: "bangkok-floor-3",
    departmentId: "sales",
    assigneeId: "emp-114",
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
    locationId: "central-world-entrance",
    departmentId: "it",
    assigneeId: null,
    vendorId: "samsung",
    warrantyExpiry: "2027-03-10",
    purchaseValue: 68000,
    healthScore: 91,
    externalRef: null,
  },
];

export function getMockAssets(): Asset[] {
  return mockAssets;
}
