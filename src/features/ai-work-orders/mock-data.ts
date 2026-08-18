// R&D placeholder data for the Technician role (requirement doc §4.4). No
// backend yet — a real version would come from
// GET /api/v1/work-orders?assignee_id=me&date=.

// Must stay in sync with calendar-grid.ts's TODAY_DAY (11).
export const TODAY_DATE = "2026-08-11";

export type WorkOrderStatus = "assigned" | "in_progress" | "completed" | "overdue";

export interface WorkOrder {
  id: string;
  date: string; // ISO date, e.g. "2026-08-11"
  time: string; // "09:00"
  title: string;
  assetTag: string;
  location: string;
  description: string;
  status: WorkOrderStatus;
  severity?: "critical";
}

export const mockWorkOrders: WorkOrder[] = [
  {
    id: "wo-1",
    date: TODAY_DATE,
    time: "09:00",
    title: "Inspect NAS-001",
    assetTag: "NAS-001",
    location: "Server Room",
    description: "Nightly backup has failed three nights in a row — inspect and restore.",
    status: "in_progress",
    severity: "critical",
  },
  {
    id: "wo-2",
    date: TODAY_DATE,
    time: "10:30",
    title: "Repair PRN-019",
    assetTag: "PRN-019",
    location: "Accounting · Floor 4",
    description: "Recurring paper jam on tray 2.",
    status: "assigned",
  },
  {
    id: "wo-3",
    date: TODAY_DATE,
    time: "13:00",
    title: "Deploy NB-044",
    assetTag: "NB-044",
    location: "Sales",
    description: "New employee onboarding — set up and hand over laptop.",
    status: "assigned",
  },
  {
    id: "wo-4",
    date: TODAY_DATE,
    time: "15:00",
    title: "Check CCTV-021",
    assetTag: "CCTV-021",
    location: "Central World Entrance",
    description: "Monthly scheduled inspection.",
    status: "assigned",
  },
  {
    id: "wo-5",
    date: "2026-08-12",
    time: "09:30",
    title: "Repair PRN-005",
    assetTag: "PRN-005",
    location: "HR · Floor 1",
    description: "Toner replacement requested.",
    status: "assigned",
  },
  {
    id: "wo-6",
    date: "2026-08-13",
    time: "11:00",
    title: "Inspect NAS-002",
    assetTag: "NAS-002",
    location: "Server Room",
    description: "Quarterly scheduled inspection.",
    status: "assigned",
  },
  {
    id: "wo-7",
    date: "2026-08-06",
    time: "10:00",
    title: "Repair MON-011",
    assetTag: "MON-011",
    location: "Finance · Floor 3",
    description: "Flickering display, intermittent.",
    status: "overdue",
  },
  {
    id: "wo-8",
    date: "2026-08-10",
    time: "14:00",
    title: "Deploy NB-030",
    assetTag: "NB-030",
    location: "Marketing · Floor 2",
    description: "New hire equipment setup — was rescheduled from last week.",
    status: "overdue",
  },
  {
    id: "wo-9",
    date: "2026-08-09",
    time: "16:00",
    title: "Deploy PHONE-021",
    assetTag: "PHONE-021",
    location: "Sales",
    description: "Replacement device handover, confirmed received.",
    status: "completed",
  },
];

export function getMockWorkOrders(): WorkOrder[] {
  return mockWorkOrders;
}

const todayOrders = mockWorkOrders.filter((w) => w.date === TODAY_DATE);

export const todaySummary = {
  assigned: todayOrders.filter((w) => w.status === "assigned" || w.status === "in_progress").length,
  completed: todayOrders.filter((w) => w.status === "completed").length,
  overdue: mockWorkOrders.filter((w) => w.status === "overdue").length,
};

// Read by Thunder Care's Work Queue dispatch action (ai-service-ops) — picking
// a technician there conceptually feeds this list, though nothing is wired
// live (see ai-issues/components/ReportProblemForm.tsx's comment for why this
// sprint keeps such actions client-local rather than mutating shared mock state).
export interface TechnicianOption {
  id: string;
  name: string;
}

export const mockTechnicians: TechnicianOption[] = [
  { id: "tech-a", name: "Technician A" },
  { id: "tech-b", name: "Technician B" },
];
