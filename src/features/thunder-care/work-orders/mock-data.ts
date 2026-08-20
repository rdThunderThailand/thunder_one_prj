// R&D placeholder data for the Technician role (requirement doc §4.4). No
// backend yet — a real version would come from
// GET /api/v1/work-orders?assignee_id=me&date=.
//
// wo-1/wo-2/wo-10 are explicitly linked to asset-intelligence/issues via issueId (Employee
// reported -> Thunder Care dispatched -> Technician worked it), closing what
// was otherwise two unconnected mock datasets sharing only coincidentally
// similar descriptions. Everything else here (scheduled inspections,
// deploys) has no issueId — not every work order originates from a reported
// problem.

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
  /**
   * Which reported problem this work order exists for (requirement doc §3
   * data model: Work Order.source(issue_id/onboarding_id) — only the issue
   * side is modeled here). `undefined` for work orders that didn't originate
   * from an Employee-reported Issue (e.g. scheduled inspections, deploys).
   */
  issueId?: string;
  /** Which of mockTechnicians this is assigned to. `undefined` = unassigned. */
  technicianId?: string;
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
    issueId: "issue-2",
    technicianId: "tech-a",
  },
  {
    id: "wo-2",
    date: TODAY_DATE,
    time: "10:30",
    title: "Repair PRN-019",
    assetTag: "PRN-019",
    location: "Accounting · Floor 4",
    description: "Recurring paper jam on tray 2.",
    status: "completed",
    issueId: "issue-3",
    technicianId: "tech-b",
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
  {
    id: "wo-10",
    date: "2026-08-18",
    time: "11:30",
    title: "Repair NB-032",
    assetTag: "NB-032",
    location: "Sales",
    description: "Laptop battery drains within an hour, even fully charged.",
    status: "completed",
    issueId: "issue-1",
    technicianId: "tech-a",
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

// Read by Thunder Care's Work Queue dispatch action (thunder-care/service-ops) — picking
// a technician there conceptually feeds this list, though nothing is wired
// live (see asset-intelligence/issues/components/ReportProblemForm.tsx's comment for why this
// sprint keeps such actions client-local rather than mutating shared mock state).
export interface TechnicianOption {
  id: string;
  name: string;
}

export const mockTechnicians: TechnicianOption[] = [
  { id: "tech-a", name: "Technician A" },
  { id: "tech-b", name: "Technician B" },
];
