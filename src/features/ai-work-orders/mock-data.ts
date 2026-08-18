// R&D placeholder data for the Technician's "My Work" dashboard (requirement
// doc §4.4). No backend yet — a real version would come from
// GET /api/v1/work-orders?assignee_id=me&date=.
export interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  subtitle: string;
  severity?: "red";
}

export const todaySchedule: ScheduleItem[] = [
  {
    id: "wo-1",
    time: "09:00",
    title: "Inspect NAS-001",
    subtitle: "Backup failure · Critical · Server Room",
    severity: "red",
  },
  { id: "wo-2", time: "10:30", title: "Repair PRN-019", subtitle: "Accounting · Floor 4" },
  { id: "wo-3", time: "13:00", title: "Deploy NB-044", subtitle: "New Employee · Sales" },
  { id: "wo-4", time: "15:00", title: "Check CCTV-021", subtitle: "Monthly inspection" },
];

export const todaySummary = {
  assigned: 7,
  completed: 0,
  overdue: 2,
};
