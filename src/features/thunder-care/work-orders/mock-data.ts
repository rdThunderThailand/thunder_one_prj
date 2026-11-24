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

// ===== ด้านล่างนี้เป็นของใหม่ทั้งหมด — mock data สำหรับหน้าที่ redesign
// 2569-09-08 ตามผัง "Technician Workflow: Web ↔ Mobile" + 5 ผังหน้าจอ Web ที่
// ผู้ใช้ส่งมา (หน้าหลัก, งานของฉัน, ทรัพย์สินของฉัน, คำขอของฉัน, การคืนและ
// การส่งมอบ). แยกชุดจาก `mockWorkOrders`/`WorkOrder` ด้านบนโดยตั้งใจ — ตัวนั้น
// ยังใช้อยู่จริงโดย asset-intelligence/assets, mission-control, intelligence
// (ผ่าน `getMockWorkOrders`) และ thunder-care/service-ops (ผ่าน
// `mockTechnicians`) ไม่แตะ/ไม่เปลี่ยนรูปร่างเด็ดขาด. ผัง "ASSET WORKSPACE"
// breadcrumb ในภาพที่ผู้ใช้ส่งมาตรงกับที่ README ของฟีเจอร์นี้บันทึกไว้อยู่
// แล้วว่า Technician persona นี้เป็นส่วนหนึ่งของ requirement doc §4.4 (Asset
// Intelligence) — ไม่ใช่กรณีเดียวกับ Dispatcher's "Asset" ที่ลิงก์ไปหน้าอื่น
// ที่มีอยู่แล้ว เพราะไม่มีหน้าที่มีอยู่แล้วให้ reuse ตรงนี้.

export type JobStatus = "waiting" | "in_progress" | "done";

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  waiting: "รอดำเนินการ",
  in_progress: "กำลังดำเนินการ",
  done: "เสร็จสิ้น",
};

export interface TechJob {
  woId: string;
  title: string;
  category: string; // "แอร์", "จอแสดงผล", "ระบบไฟฟ้า", "เครือข่าย", "อุปกรณ์ทั่วไป"
  assetSerial: string;
  customerName: string;
  addressLabel: string;
  timeLabel: string; // "09:00"
  distanceLabel: string; // "2.3 กม."
  etaLabel: string; // "ประมาณ 7 นาที"
  status: JobStatus;
  statusTimeLabel: string; // "นัดหมาย 09:00" / "เริ่มงาน 11:25" / "เสร็จสิ้น 16:10"
  priority: 1 | 2 | 3; // จำนวนจุด — 3 = สูง, 2 = ปานกลาง, 1 = ต่ำ
}

// วันนี้ (5 งาน) — ใช้ร่วมกันทั้งหน้าหลัก (ย่อ) และงานของฉัน (เต็ม)
export const todayJobs: TechJob[] = [
  {
    woId: "WO-30522",
    title: "ระบบแอร์ไม่เย็น",
    category: "แอร์",
    assetSerial: "AC-2024-00123",
    customerName: "ABC Company",
    addressLabel: "123 ถนนสุขุมวิท แขวงคลองตัน เขตคลองเตย กรุงเทพ",
    timeLabel: "09:00",
    distanceLabel: "2.3 กม.",
    etaLabel: "ประมาณ 7 นาที",
    status: "waiting",
    statusTimeLabel: "นัดหมาย 09:00",
    priority: 3,
  },
  {
    woId: "WO-30518",
    title: "เปลี่ยนหลอดไฟ LED",
    category: "จอแสดงผล",
    assetSerial: "LED-2023-00456",
    customerName: "XYZ Hotel",
    addressLabel: "99 หมู่ 1 ถ.บางละมุง อ.บางละมุง จ.ชลบุรี",
    timeLabel: "11:30",
    distanceLabel: "5.7 กม.",
    etaLabel: "ประมาณ 14 นาที",
    status: "in_progress",
    statusTimeLabel: "เริ่มงาน 11:25",
    priority: 2,
  },
  {
    woId: "WO-30520",
    title: "ตรวจเช็คตู้ควบคุมไฟฟ้า",
    category: "ระบบไฟฟ้า",
    assetSerial: "CB-2023-0098",
    customerName: "DEF Company",
    addressLabel: "8/88 หมู่ 5 ถ.บางวัวทอง อ.บางวัวทอง จ.นนทบุรี",
    timeLabel: "14:00",
    distanceLabel: "8.9 กม.",
    etaLabel: "ประมาณ 18 นาที",
    status: "waiting",
    statusTimeLabel: "นัดหมาย 14:00",
    priority: 3,
  },
  {
    woId: "WO-30515",
    title: "ติดตั้ง Access Point",
    category: "เครือข่าย",
    assetSerial: "AP-2024-0087",
    customerName: "GHI Office",
    addressLabel: "90 อาคารชินวัตรทาวเวอร์ ชั้น 10 ถ.วิภาวดีรังสิต กรุงเทพ",
    timeLabel: "16:30",
    distanceLabel: "12.1 กม.",
    etaLabel: "ประมาณ 22 นาที",
    status: "done",
    statusTimeLabel: "เสร็จสิ้น 16:10",
    priority: 1,
  },
  {
    woId: "WO-30527",
    title: "เครื่องปริ้นเตอร์มีปัญหา",
    category: "อุปกรณ์ทั่วไป",
    assetSerial: "PR-2023-5566",
    customerName: "STU Co., Ltd.",
    addressLabel: "55/5 หมู่ 3 ถ.บางกรวย อ.นนทบุรี",
    timeLabel: "15:30",
    distanceLabel: "12.1 กม.",
    etaLabel: "ประมาณ 22 นาที",
    status: "done",
    statusTimeLabel: "เสร็จสิ้น 15:10",
    priority: 2,
  },
];

export const techJobStats = {
  totalToday: 5,
  waiting: 3,
  inProgress: 1,
  doneToday: 2,
};

export interface QuickActionCard {
  id: string;
  title: string;
  detail: string;
}

export const techQuickActions: QuickActionCard[] = [
  { id: "supplies", title: "ขอสิ่งที่ต้องใช้", detail: "อุปกรณ์/อะไหล่ สิทธิ์การใช้งาน" },
  { id: "issue", title: "แจ้งปัญหา", detail: "อุปกรณ์/ซ่อมแซม พื้นที่ทำงาน" },
  { id: "help", title: "ขอความช่วยเหลือ", detail: "สอบถามทีม/ขอคำแนะนำ" },
  { id: "return", title: "คืนและส่งมอบ", detail: "ส่งคืนอุปกรณ์หรือสิทธิ์การใช้งาน" },
];

export interface TechMapPin {
  woId: string;
  status: JobStatus;
  xPercent: number;
  yPercent: number;
}

// ตำแหน่งจำลอง (ไม่ใช่พิกัดจริง) — เหมือน thunder-care/dispatch's MapViewPage
export const techMapPins: TechMapPin[] = [
  { woId: "WO-30522", status: "waiting", xPercent: 75, yPercent: 28 },
  { woId: "WO-30518", status: "in_progress", xPercent: 40, yPercent: 45 },
  { woId: "WO-30520", status: "in_progress", xPercent: 85, yPercent: 55 },
  { woId: "WO-30515", status: "done", xPercent: 55, yPercent: 78 },
];

// ===== ทรัพย์สินของฉัน =====

export type MyAssetStatus = "active" | "maintenance" | "suspended" | "retired";

export const MY_ASSET_STATUS_LABEL: Record<MyAssetStatus, string> = {
  active: "ใช้งานอยู่",
  maintenance: "อยู่ระหว่างบำรุงรักษา",
  suspended: "หยุดใช้งาน",
  retired: "ยกเลิกใช้งาน",
};

export const MY_ASSET_STATUS_COLOR: Record<MyAssetStatus, "green" | "blue" | "zinc" | "yellow"> = {
  active: "green",
  maintenance: "blue",
  suspended: "zinc",
  retired: "zinc",
};

export interface MyAssetRow {
  assetTag: string;
  serial: string;
  category: string;
  model: string;
  location: string;
  status: MyAssetStatus;
  installedDateLabel: string;
  lastWorkDateLabel: string;
  lastWorkLabel: string;
}

export const myAssetRows: MyAssetRow[] = [
  { assetTag: "AC-00123", serial: "AC-2024-00123", category: "Air Conditioner", model: "Daikin FTKC25RVM2S", location: "ABC Company ชั้น 3 ห้องประชุมใหญ่", status: "active", installedDateLabel: "12 ม.ค. 2568", lastWorkDateLabel: "21 พ.ค. 2568", lastWorkLabel: "ซ่อมแอร์ไม่เย็น" },
  { assetTag: "LED-00098", serial: "LED-2023-00456", category: "LED Display", model: "Samsung LH55QHCEBGC", location: "XYZ Hotel Lobby ชั้น 1", status: "maintenance", installedDateLabel: "05 มี.ค. 2567", lastWorkDateLabel: "20 พ.ค. 2568", lastWorkLabel: "เปลี่ยนหลอดไฟ LED" },
  { assetTag: "EC-00045", serial: "EC-2023-0098", category: "Electrical Control", model: "Schneider PRAGMA", location: "DEF Company อาคารสำนักงาน", status: "active", installedDateLabel: "18 ก.ค. 2567", lastWorkDateLabel: "19 พ.ค. 2568", lastWorkLabel: "ตรวจเช็คตามรอบ" },
  { assetTag: "AP-00110", serial: "AP-2024-0087", category: "Access Point", model: "Ubiquiti U6-Lite", location: "GHI Office ชั้น 10 โซน A", status: "maintenance", installedDateLabel: "01 เม.ย. 2568", lastWorkDateLabel: "17 พ.ค. 2568", lastWorkLabel: "อัปเดต Firmware" },
  { assetTag: "FS-00077", serial: "FS-2023-1234", category: "Fire Extinguisher", model: "IMPERIAL 10lbs.", location: "STU Co., Ltd. ชั้น 5 ใกล้ลิฟต์", status: "suspended", installedDateLabel: "10 ม.ค. 2566", lastWorkDateLabel: "02 เม.ย. 2568", lastWorkLabel: "ตรวจสภาพประจำปี" },
];

export const myAssetSummary = { total: 28, active: 18, maintenance: 5, suspended: 2, retired: 3 };

// ===== คำขอของฉัน =====

export type RequestStatus = "pending" | "in_progress" | "done" | "cancelled";

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  pending: "รอดำเนินการ",
  in_progress: "กำลังดำเนินการ",
  done: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};

export const REQUEST_STATUS_COLOR: Record<RequestStatus, "yellow" | "blue" | "green" | "red"> = {
  pending: "yellow",
  in_progress: "blue",
  done: "green",
  cancelled: "red",
};

export interface MyRequestRow {
  id: string; // "REQ-2025-0056"
  type: string; // "จองอุปกรณ์" / "ของยืม" / "ขอสนับสนุนช่าง" / "ขอเอกสาร/สิทธิ์" / "คืนอุปกรณ์"
  itemName: string;
  purpose: string;
  dateLabel: string;
  status: RequestStatus;
  steps: string[]; // ["ส่งคำขอ", "รออนุมัติ", "จัดเตรียม", "ส่งมอบ", "เสร็จสิ้น"]
  currentStepIndex: number; // ดัชนีของ step ปัจจุบันใน `steps` (-1 = ยกเลิกก่อนถึงขั้นตอนถัดไป)
}

export const myRequestRows: MyRequestRow[] = [
  {
    id: "REQ-2025-0056",
    type: "จองอุปกรณ์",
    itemName: 'MacBook Pro 14" (SN: MBP14-2024-00012)',
    purpose: "สำหรับงานออกแบบสื่อตัดต่อวีดีโอ",
    dateLabel: "21 พ.ค. 2568 09:15",
    status: "pending",
    steps: ["ส่งคำขอ", "รออนุมัติ", "จัดเตรียม", "ส่งมอบ", "เสร็จสิ้น"],
    currentStepIndex: 1,
  },
  {
    id: "REQ-2025-0053",
    type: "ของยืม",
    itemName: "LED Power Supply 5V",
    purpose: "สำหรับซ่อม Power Supply ของจอ LED P2.5 Indoor",
    dateLabel: "19 พ.ค. 2568 14:40",
    status: "in_progress",
    steps: ["ส่งคำขอ", "อนุมัติแล้ว", "จัดเตรียม", "ส่งมอบ", "เสร็จสิ้น"],
    currentStepIndex: 2,
  },
  {
    id: "REQ-2025-0051",
    type: "ขอสนับสนุนช่าง",
    itemName: "ช่างเพิ่ม 1 คน",
    purpose: "ช่วยติดตั้ง LED หน้างาน ABC Company",
    dateLabel: "21 พ.ค. 2568 11:20",
    status: "in_progress",
    steps: ["ส่งคำขอ", "รออนุมัติ", "มอบหมาย", "ดำเนินการ", "เสร็จสิ้น"],
    currentStepIndex: 2,
  },
  {
    id: "REQ-2025-0048",
    type: "ขอเอกสาร/สิทธิ์",
    itemName: "สิทธิ์เข้าระบบ CMS",
    purpose: "สำหรับอัปโหลดสื่อประชาสัมพันธ์",
    dateLabel: "16 พ.ค. 2568 16:05",
    status: "done",
    steps: ["ส่งคำขอ", "อนุมัติ", "ดำเนินการ", "เสร็จสิ้น"],
    currentStepIndex: 3,
  },
  {
    id: "REQ-2025-0043",
    type: "คืนอุปกรณ์",
    itemName: "Mouse Logitech (SN: MSE-2023-00123)",
    purpose: "ยกเลิกใช้งาน / เปลี่ยนรุ่นใหม่",
    dateLabel: "14 พ.ค. 2568 10:30",
    status: "cancelled",
    steps: ["ส่งคำขอ", "ยกเลิก", "ดำเนินการ", "เสร็จสิ้น"],
    currentStepIndex: 1,
  },
];

export const myRequestSummary = { total: 12, pending: 3, inProgress: 5, done: 3, cancelled: 1 };

// ===== การคืนและการส่งมอบ =====

export type ReturnHandoverKind = "return" | "handover";
export type ReturnHandoverStatus = "waiting" | "done" | "cancelled";

export const RH_STATUS_LABEL: Record<ReturnHandoverKind, Record<ReturnHandoverStatus, string>> = {
  return: { waiting: "รอคืนอุปกรณ์", done: "คืนแล้วเสร็จ", cancelled: "ยกเลิก" },
  handover: { waiting: "รอส่งมอบ", done: "ส่งมอบแล้ว", cancelled: "ยกเลิก" },
};

export const RH_STATUS_COLOR: Record<ReturnHandoverStatus, "yellow" | "blue" | "green" | "red"> = {
  waiting: "yellow",
  done: "green",
  cancelled: "red",
};

export interface ReturnHandoverRow {
  id: string; // "RET-2025-0008" / "HND-2025-0012"
  kind: ReturnHandoverKind;
  itemName: string;
  serial: string;
  referenceLabel: string; // "ตรวจเช็คตู้ควบคุมไฟฟ้า"
  referenceWoId: string;
  customerName: string;
  addressLabel: string;
  dueDateLabel: string;
  status: ReturnHandoverStatus;
  statusDetailLabel: string; // "ค้าง 1 วัน" / "คืนแล้ว 18 พ.ค. 68"
}

export const returnHandoverRows: ReturnHandoverRow[] = [
  { id: "RET-2025-0008", kind: "return", itemName: "Router Ubiquiti ER-X", serial: "ERX-2024-00123", referenceLabel: "ตรวจเช็คตู้ควบคุมไฟฟ้า", referenceWoId: "WO-30520", customerName: "DEF Company", addressLabel: "8/88 หมู่ 5 บางวัวทอง นนทบุรี", dueDateLabel: "22 พ.ค. 2568", status: "waiting", statusDetailLabel: "ค้าง 1 วัน" },
  { id: "HND-2025-0012", kind: "handover", itemName: "LED Display P2.5", serial: "LED-2025-00234", referenceLabel: "เปลี่ยนแผงหลอดไฟ LED", referenceWoId: "WO-30518", customerName: "XYZ Hotel", addressLabel: "99 หมู่ 1 บางละมุง ชลบุรี", dueDateLabel: "21 พ.ค. 2568 · นัดหมาย 11:00", status: "waiting", statusDetailLabel: "" },
  { id: "RET-2025-0007", kind: "return", itemName: "Multimeter Fluke 117", serial: "FLU-2023-00987", referenceLabel: "ติดตั้ง Access Point", referenceWoId: "WO-30515", customerName: "GHI Office", addressLabel: "90 อาคารชินวัตรทาวเวอร์ กรุงเทพ", dueDateLabel: "18 พ.ค. 2568", status: "done", statusDetailLabel: "คืนแล้ว 18 พ.ค. 68" },
  { id: "HND-2025-0011", kind: "handover", itemName: "UPS APC 1500VA", serial: "APC-1500-00456", referenceLabel: "เปลี่ยน UPS ใหม่", referenceWoId: "WO-30510", customerName: "ABC Company", addressLabel: "123 สุขุมวิท คลองเตย กรุงเทพ", dueDateLabel: "17 พ.ค. 2568", status: "done", statusDetailLabel: "ส่งมอบแล้ว 17 พ.ค. 68" },
  { id: "RET-2025-0006", kind: "return", itemName: "Laptop Dell Latitude 5430", serial: "DELL-2023-01876", referenceLabel: "ตรวจเช็คอุปกรณ์", referenceWoId: "WO-30495", customerName: "STU Co., Ltd.", addressLabel: "55/5 หมู่ 3 ปากเกร็ด นนทบุรี", dueDateLabel: "20 พ.ค. 2568", status: "cancelled", statusDetailLabel: "ยกเลิกโดยผู้ใช้" },
];

export const returnHandoverSummary = { total: 8, waitingReturn: 3, waitingHandover: 2, done: 2, cancelled: 1 };
