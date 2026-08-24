// R&D placeholder data for scheduled Inspections (requirement doc AM-07). No
// backend yet — a real version ties each inspection to a checklist template
// per asset category, not modeled here.
export type InspectionStatus = "scheduled" | "completed" | "overdue";

export interface Inspection {
  id: string;
  assetTag: string;
  inspectorName: string;
  scheduledDate: string;
  status: InspectionStatus;
}

export const mockInspections: Inspection[] = [
  { id: "insp-1", assetTag: "CCTV-021", inspectorName: "Technician A", scheduledDate: "2026-08-15", status: "overdue" },
  { id: "insp-2", assetTag: "NAS-002", inspectorName: "Technician B", scheduledDate: "2026-08-13", status: "scheduled" },
  { id: "insp-3", assetTag: "NAS-001", inspectorName: "Technician A", scheduledDate: "2026-08-11", status: "completed" },
  { id: "insp-4", assetTag: "PRN-019", inspectorName: "Technician B", scheduledDate: "2026-08-25", status: "scheduled" },
];

export function getMockInspections(): Inspection[] {
  return mockInspections;
}
