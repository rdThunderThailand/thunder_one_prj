// R&D placeholder data for "Manage MA" (Maintenance Agreement — requirement
// doc AM-03: contracts tied to a Vendor + Asset, with expiry warnings). No
// backend yet.
export type MaintenanceAgreementStatus = "active" | "expiring_soon" | "expired";

export interface MaintenanceAgreement {
  id: string;
  assetTag: string;
  vendorName: string;
  expiryDate: string;
  status: MaintenanceAgreementStatus;
}

export const mockMaintenanceAgreements: MaintenanceAgreement[] = [
  { id: "ma-1", assetTag: "NAS-001", vendorName: "Synology", expiryDate: "2026-11-02", status: "expiring_soon" },
  { id: "ma-2", assetTag: "PRN-019", vendorName: "HP", expiryDate: "2026-09-14", status: "expiring_soon" },
  { id: "ma-3", assetTag: "NB-032", vendorName: "Dell", expiryDate: "2026-09-01", status: "expiring_soon" },
  { id: "ma-4", assetTag: "CCTV-021", vendorName: "Samsung", expiryDate: "2027-03-10", status: "active" },
  { id: "ma-5", assetTag: "PRN-044", vendorName: "HP", expiryDate: "2026-10-05", status: "expiring_soon" },
  { id: "ma-6", assetTag: "MON-019", vendorName: "Dell", expiryDate: "2025-06-01", status: "expired" },
];

export function getMockMaintenanceAgreements(): MaintenanceAgreement[] {
  return mockMaintenanceAgreements;
}
