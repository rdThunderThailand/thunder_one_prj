// R&D placeholder data for the Asset/IT Manager's ("Asset Admin") Dashboard
// — the redesigned `/asset-intelligence/assets` landing page matching the
// reference mockup exactly (Nie, 2026-08-26). Replaces the earlier, much
// simpler "Asset Overview" dashboard (assetStatTiles/attentionRequired/
// workStatus/teamWorkload, now removed) — this mockup is a full org-wide
// dashboard, not a work-order-triage view, so it doesn't reuse that shape.
// Two independent status axes over the same 2,458-asset total: Asset Status
// (operational — Ready/In Use/In Progress/Retired) and Lifecycle Status
// (Active/Maintenance/Suspended/Retired/Planned) — different questions,
// same population, so they're modeled as two separate breakdowns rather
// than one. No backend yet.

export interface HeroStatTileData {
  id: string;
  label: string;
  value: string;
  unit?: string;
  sublabel: string;
  deltaLabel?: string;
  icon: "readiness" | "box" | "checkCircle" | "wrench" | "truck" | "xCircle";
  iconTone: string;
  viz?: { type: "donut"; percent: number };
}

export const heroStatTiles: HeroStatTileData[] = [
  {
    id: "readiness",
    label: "ความพร้อมของทรัพย์สิน",
    value: "72",
    unit: "%",
    sublabel: "ความพร้อม",
    deltaLabel: "▲ 7% จากเดือนที่แล้ว",
    icon: "readiness",
    iconTone: "text-indigo-500",
    viz: { type: "donut", percent: 72 },
  },
  {
    id: "total",
    label: "ทรัพย์สินทั้งหมด",
    value: "2,458",
    sublabel: "รายการ",
    icon: "box",
    iconTone: "bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400",
  },
  {
    id: "ready",
    label: "พร้อมใช้งาน",
    value: "1,842",
    sublabel: "75.0% ของทั้งหมด",
    deltaLabel: "▲ 5.2%",
    icon: "checkCircle",
    iconTone: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  {
    id: "in-use",
    label: "อยู่ระหว่างใช้งาน",
    value: "312",
    sublabel: "12.7% ของทั้งหมด",
    icon: "wrench",
    iconTone: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
  },
  {
    id: "in-progress",
    label: "ระหว่างดำเนินการ",
    value: "98",
    sublabel: "4.0% ของทั้งหมด",
    icon: "truck",
    iconTone: "bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400",
  },
  {
    id: "retired",
    label: "หมดสภาพ / ยกเลิก",
    value: "206",
    sublabel: "8.3% ของทั้งหมด",
    icon: "xCircle",
    iconTone: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
  },
];

export const assetStatusOverview = {
  total: 2458,
  segments: [
    { label: "พร้อมใช้งาน", value: 1842, percentLabel: "75.0%", color: "#6366f1" },
    { label: "อยู่ระหว่างใช้งาน", value: 312, percentLabel: "12.7%", color: "#3b82f6" },
    { label: "ระหว่างดำเนินการ", value: 98, percentLabel: "4.0%", color: "#a855f7" },
    { label: "หมดสภาพ / ยกเลิก", value: 206, percentLabel: "8.3%", color: "#ef4444" },
  ],
};

export interface AssetCategoryBreakdownRow {
  id: string;
  label: string;
  allocated: number;
  total: number;
  percent: number;
}

export const assetCategoryBreakdown: AssetCategoryBreakdownRow[] = [
  { id: "it-equipment", label: "IT Equipment", allocated: 1256, total: 1452, percent: 86.5 },
  { id: "mobile-device", label: "Mobile Device", allocated: 512, total: 612, percent: 83.7 },
  { id: "furniture", label: "Furniture", allocated: 148, total: 220, percent: 67.3 },
  { id: "other-equipment", label: "Other Equipment", allocated: 60, total: 174, percent: 34.5 },
];

export const assetAllocationSummary = {
  allocated: { value: 1976, percentLabel: "80.4% ของทั้งหมด" },
  unallocated: { value: 482, percentLabel: "19.6% ของทั้งหมด" },
};

export interface PendingRequestData {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  priority: "เร่งด่วน" | "ปกติ";
  timeAgo: string;
}

export const pendingRequests: PendingRequestData[] = [
  {
    id: "req-1",
    code: "REQ-2024-0567",
    title: "ขอ Laptop สำหรับพนักงานใหม่",
    subtitle: "New Hire · Marketing Department",
    priority: "เร่งด่วน",
    timeAgo: "10 นาทีที่แล้ว",
  },
  {
    id: "req-2",
    code: "TRF-2024-0214",
    title: "ขอโอนย้าย Monitor 24\" จำนวน 2 เครื่อง",
    subtitle: "จาก IT Dept. ไป Sales Dept.",
    priority: "ปกติ",
    timeAgo: "1 ชั่วโมงที่แล้ว",
  },
  {
    id: "req-3",
    code: "MAI-2024-0133",
    title: "แจ้งซ่อมเครื่องพิมพ์เสีย",
    subtitle: "อาคาร A ชั้น 3 · Operations",
    priority: "เร่งด่วน",
    timeAgo: "2 ชั่วโมงที่แล้ว",
  },
];

export interface LifecycleStatusRow {
  id: string;
  label: string;
  value: number;
  percent: number;
  color: "emerald" | "amber" | "red" | "indigo" | "zinc";
}

export const lifecycleStatus: LifecycleStatusRow[] = [
  { id: "active", label: "Active", value: 1842, percent: 75.0, color: "emerald" },
  { id: "maintenance", label: "Maintenance", value: 128, percent: 5.2, color: "amber" },
  { id: "suspended", label: "Suspended", value: 72, percent: 2.9, color: "zinc" },
  { id: "retired", label: "Retired", value: 206, percent: 8.3, color: "red" },
  { id: "planned", label: "Planned / Installing", value: 210, percent: 8.6, color: "indigo" },
];

export interface QuickActionData {
  id: string;
  icon: "add" | "scanQr" | "allocate" | "transfer" | "borrowReturn" | "count";
  label: string;
}

export const dashboardQuickActions: QuickActionData[] = [
  { id: "qa-add", icon: "add", label: "เพิ่มทรัพย์สิน" },
  { id: "qa-scan", icon: "scanQr", label: "สแกน QR / Barcode" },
  { id: "qa-allocate", icon: "allocate", label: "จัดสรรทรัพย์สิน" },
  { id: "qa-transfer", icon: "transfer", label: "โอนย้ายทรัพย์สิน" },
  { id: "qa-borrow", icon: "borrowReturn", label: "คืนและยืม" },
  { id: "qa-count", icon: "count", label: "ตรวจนับทรัพย์สินประจำปี" },
];

export interface DashboardActivityRow {
  id: string;
  text: string;
  timeAgo: string;
}

export const dashboardActivity: DashboardActivityRow[] = [
  { id: "act-1", text: "จัดสรร MacBook Pro 14\" ให้ พนักงานใหม่ฝ่ายการตลาด", timeAgo: "10 นาทีที่แล้ว" },
  { id: "act-2", text: "รับคืน iPhone 14 จากพนักงานลาออก", timeAgo: "45 นาทีที่แล้ว" },
  { id: "act-3", text: "โอนย้าย Monitor 24\" จำนวน 2 เครื่อง", timeAgo: "1 ชั่วโมงที่แล้ว" },
  { id: "act-4", text: "เพิ่มทรัพย์สินใหม่ 12 รายการเข้าระบบ", timeAgo: "4 ชั่วโมงที่แล้ว" },
];

export interface DashboardNotificationRow {
  id: string;
  text: string;
  count: number;
  severity: "red" | "amber";
}

export const dashboardNotifications: DashboardNotificationRow[] = [
  { id: "notif-1", text: "ทรัพย์สินใกล้หมด Warranty ภายใน 30 วัน", count: 18, severity: "amber" },
  { id: "notif-2", text: "ทรัพย์สินเกินกำหนดคืน", count: 32, severity: "red" },
  { id: "notif-3", text: "ทรัพย์สินรออนุมัติการเบิก/ยืม", count: 15, severity: "amber" },
  { id: "notif-4", text: "ทรัพย์สินยังไม่ได้รับการตรวจนับ 7 วัน", count: 21, severity: "red" },
];

export interface DashboardActionBarItem {
  id: string;
  label: string;
  href?: string;
  badge?: number;
}

export const dashboardActionBar: DashboardActionBarItem[] = [
  { id: "bar-new-request", label: "สร้างคำขอใหม่" },
  { id: "bar-request-equipment", label: "ส่งคำขอเบิกอุปกรณ์" },
  { id: "bar-approve-overdue", label: "อนุมัติล่าช้า", badge: 5 },
  { id: "bar-view-report", label: "ดูรายงาน", href: "/asset-intelligence/assets/reports" },
  { id: "bar-add-equipment", label: "เพิ่มอุปกรณ์", href: "/asset-intelligence/assets/all" },
  { id: "bar-schedule-pm", label: "นัดหมาย PM" },
];

// The All Assets registry (/asset-intelligence/assets/all) moved off mock
// data on 2026-08-26 — it now reads real rows from Thunder_Core via
// `features/asset-intelligence/assets/services/asset-list-api.ts`, wired up
// in that route's page.tsx. This is the first page in this feature to do
// so; every other Asset Admin page below is still mock-data-driven pending
// its own real endpoint (see the asset-admin-real-data-and-rbac-backlog
// memory). AssetsListPage/AM-04 "Pass to Department" (services/mock-assets.ts,
// types/index.ts) is a separate, older, untouched flow — still mock, not
// affected by this change.

// --- Asset Allocation ("Asset Admin" table at
// /asset-intelligence/assets/allocation) — matching the reference mockup
// exactly (Nie, 2026-08-26). Own dedicated dataset, same reasoning as the
// All Assets registry above — a master/detail view (table + a selected-row
// detail panel) that doesn't fit assetRegistryRows' shape (no employee/
// holder, no allocation history).

export interface AllocationStatTileData {
  id: string;
  label: string;
  value: string;
  sublabel: string;
  linkLabel?: string;
  icon: "users" | "checkCircle" | "clock" | "repeat" | "warning";
  iconTone: string;
}

export const allocationStatTiles: AllocationStatTileData[] = [
  { id: "total", label: "จัดสรรทั้งหมด", value: "568", sublabel: "จัดแล้วทั้งหมด", icon: "users", iconTone: "bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400" },
  { id: "in-use", label: "จัดสรรใช้งานอยู่", value: "482", sublabel: "84.9% ของทั้งหมด", icon: "checkCircle", iconTone: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400" },
  { id: "pending-delivery", label: "รอการส่งมอบ", value: "42", sublabel: "7.4% ของทั้งหมด", icon: "clock", iconTone: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400" },
  { id: "pending-return", label: "รอการคืน", value: "32", sublabel: "5.6% ของทั้งหมด", icon: "repeat", iconTone: "bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400" },
  { id: "overdue", label: "เกินกำหนดคืน", value: "12", sublabel: "ดูรายการ", icon: "warning", iconTone: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" },
];

export const allocationTabs = ["จัดสรรใช้งานอยู่", "รอการส่งมอบ", "รอการคืน", "ประวัติการจัดสรรทั้งหมด"] as const;

export const allocationFilterOptions = {
  category: ["ทั้งหมด", "IT Equipment", "Office Equipment", "Network Equipment", "Facility Equipment", "AV Equipment", "Mobile Device", "Power Equipment"],
  status: ["ทั้งหมด", "ใช้งานอยู่", "รอส่งมอบ", "รอคืน"],
  department: ["ทั้งหมด", "Marketing", "Finance", "HR", "Sales", "Training", "Creative", "IT Department", "Storage"],
  location: ["ทั้งหมด", "อาคาร A", "อาคาร B", "อาคาร C", "ห้องรวม"],
};

export interface AllocationRow {
  id: string;
  employee: string;
  department: string;
  assetName: string;
  assetModel: string;
  serial: string;
  category: string;
  subcategory: string;
  allocatedDate: string;
  status: "ใช้งานอยู่";
}

export const allocationRows: AllocationRow[] = [
  { id: "al-1", employee: "สมชาย ใจดี", department: "Marketing", assetName: 'MacBook Pro 14"', assetModel: "Space Gray", serial: "C02J93XXXXXX", category: "IT Equipment", subcategory: "Notebook", allocatedDate: "15 ม.ค. 2569", status: "ใช้งานอยู่" },
  { id: "al-2", employee: "ปวรวรรณ อินทร์", department: "Marketing", assetName: 'Dell UltraSharp 24"', assetModel: "Monitor", serial: "CN-0J8YXXXXX", category: "IT Equipment", subcategory: "Monitor", allocatedDate: "15 ม.ค. 2569", status: "ใช้งานอยู่" },
  { id: "al-3", employee: "วรวิทย์ คงขุน", department: "Finance", assetName: "HP LaserJet Pro M404dn", assetModel: "Printer", serial: "CNB4JXXXXXXX", category: "Office Equipment", subcategory: "Printer", allocatedDate: "20 ก.พ. 2569", status: "ใช้งานอยู่" },
  { id: "al-4", employee: "อาริยา เกิดผล", department: "HR", assetName: "Daikin FTKF13TV2S", assetModel: "Air Conditioner", serial: "E0015XXXXXX", category: "Facility Equipment", subcategory: "Air Conditioner", allocatedDate: "05 มี.ค. 2569", status: "ใช้งานอยู่" },
  { id: "al-5", employee: "ณัฐพล ทองดี", department: "Sales", assetName: "iPhone 14", assetModel: "128GB", serial: "355122XXXXXXX", category: "Mobile Device", subcategory: "Smartphone", allocatedDate: "12 มิ.ย. 2569", status: "ใช้งานอยู่" },
  { id: "al-6", employee: "ธีรพล แสงสว่าง", department: "Training", assetName: "EPSON EB-X06", assetModel: "Projector", serial: "V11HXXXXXXX", category: "AV Equipment", subcategory: "Projector", allocatedDate: "11 พ.ค. 2569", status: "ใช้งานอยู่" },
  { id: "al-7", employee: "กมลรรณ ศรีสุข", department: "Creative", assetName: "Ubiquiti UniFi 6 Lite", assetModel: "Access Point", serial: "A3F2XXXXXXX", category: "Network Equipment", subcategory: "Access Point", allocatedDate: "10 มี.ค. 2569", status: "ใช้งานอยู่" },
  { id: "al-8", employee: "รจนา คลื่นทอง", department: "Storage", assetName: "APC Back-UPS 1100VA", assetModel: "UPS", serial: "AS192XXXXXXX", category: "Power Equipment", subcategory: "UPS", allocatedDate: "07 ม.ค. 2569", status: "ใช้งานอยู่" },
];

export const allocationTotalCount = 482;
export const allocationPageSize = 25;
export const allocationTotalPages = 20;

export interface AllocationHistoryEvent {
  id: string;
  label: string;
  by: string;
  timestamp: string;
  tone: "emerald" | "blue" | "zinc";
}

export const allocationDetail = {
  assetName: 'MacBook Pro 14"',
  assetModel: "Space Gray",
  status: "ใช้งานอยู่" as const,
  serial: "C02J93XXXXXX",
  category: "IT Equipment / Notebook",
  assetId: "AST-IT-NB-000245",
  holder: "สมชาย ใจดี",
  holderDepartment: "Marketing Department",
  location: "อาคาร A / ชั้น 3 / ห้อง MA-301",
  allocatedDate: "15 ม.ค. 2569",
  allocatedBy: "กนกวรรณ ก. / Asset Admin",
  note: "จัดสรรตามคำขออุปกรณ์สำหรับพนักงานใหม่",
  history: [
    { id: "h-1", label: "จัดสรรทรัพย์สิน", by: "โดย กนกวรรณ ก.", timestamp: "15 ม.ค. 2569 10:15", tone: "emerald" },
    { id: "h-2", label: "ส่งมอบทรัพย์สินแล้ว", by: "โดย กนกวรรณ ก.", timestamp: "15 ม.ค. 2569 14:20", tone: "blue" },
    { id: "h-3", label: "รับใช้งาน", by: "โดย สมชาย ใจดี", timestamp: "15 ม.ค. 2569 14:25", tone: "zinc" },
  ] satisfies AllocationHistoryEvent[],
};

// --- Return & Delivery ("Asset Admin" table at
// /asset-intelligence/assets/borrow-return, titled "การคืนและส่งมอบ" on
// the mockup — the sidebar label was renamed to match, see
// config/nav/asset-intelligence.tsx) — matching the reference mockup
// exactly (Nie, 2026-08-26). Own dedicated dataset, same reasoning as
// Allocation above.

export interface ReturnStatTileData {
  id: string;
  label: string;
  value: string;
  sublabel: string;
  icon: "repeat" | "truck" | "clipboard" | "checkCircle" | "warning";
  iconTone: string;
}

export const returnStatTiles: ReturnStatTileData[] = [
  { id: "pending-return", label: "รอการคืน", value: "128", sublabel: "25.6% ของทั้งหมด", icon: "repeat", iconTone: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400" },
  { id: "pending-delivery", label: "รอส่งมอบ", value: "36", sublabel: "7.2% ของทั้งหมด", icon: "truck", iconTone: "bg-teal-50 text-teal-500 dark:bg-teal-500/10 dark:text-teal-400" },
  { id: "in-progress", label: "ดำเนินการอยู่", value: "74", sublabel: "14.8% ของทั้งหมด", icon: "clipboard", iconTone: "bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400" },
  { id: "completed", label: "เสร็จสมบูรณ์", value: "512", sublabel: "76.8% ของทั้งหมด", icon: "checkCircle", iconTone: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400" },
  { id: "overdue", label: "เกินกำหนด", value: "12", sublabel: "ดูรายการ", icon: "warning", iconTone: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" },
];

export const returnTabs = ["รอการคืน", "รอส่งมอบ", "ดำเนินการอยู่", "เสร็จสมบูรณ์", "เกินกำหนด"] as const;

export const returnFilterOptions = {
  docType: ["ทั้งหมด", "ขอคืน", "โอนย้าย"],
  category: ["ทั้งหมด", "IT Equipment", "Office Equipment", "Network Equipment", "AV Equipment", "Mobile Device", "Power Equipment"],
  department: ["ทั้งหมด", "Marketing", "Finance", "Sales", "Training", "Creative", "Storage"],
  status: ["ทั้งหมด", "เกินกำหนด", "รอการคืน"],
};

export type ReturnDocType = "ขอคืน" | "โอนย้าย";
export type ReturnRowStatus = "เกินกำหนด" | "รอการคืน";

export interface ReturnRow {
  id: string;
  docNumber: string;
  docType: ReturnDocType;
  person: string;
  department: string;
  assetName: string;
  serial: string;
  dueDate: string;
  dueSublabel: string;
  status: ReturnRowStatus;
  requestDate: string;
}

export const returnRows: ReturnRow[] = [
  { id: "ret-1", docNumber: "RET-2024-0133", docType: "ขอคืน", person: "สมชาย ใจดี", department: "Marketing", assetName: 'MacBook Pro 14"', serial: "C02J93XXXXXX", dueDate: "15 พ.ค. 2569", dueSublabel: "เกินกำหนด 2 วัน", status: "เกินกำหนด", requestDate: "10 พ.ค. 2569" },
  { id: "ret-2", docNumber: "RET-2024-0134", docType: "ขอคืน", person: "ปวรวรรณ อินทร์", department: "Marketing", assetName: 'Dell UltraSharp 24"', serial: "CN-0J8YXXXXX", dueDate: "16 พ.ค. 2569", dueSublabel: "เกินกำหนด 1 วัน", status: "เกินกำหนด", requestDate: "11 พ.ค. 2569" },
  { id: "ret-3", docNumber: "RET-2024-0135", docType: "ขอคืน", person: "วรวิทย์ คงขุน", department: "Finance", assetName: "HP LaserJet Pro M404dn", serial: "CNB4JXXXXXXX", dueDate: "20 พ.ค. 2569", dueSublabel: "อีก 3 วัน", status: "รอการคืน", requestDate: "08 พ.ค. 2569" },
  { id: "ret-4", docNumber: "TRN-2024-0088", docType: "โอนย้าย", person: "ณัฐพล ทองดี", department: "Sales", assetName: "iPhone 14 128GB", serial: "355122XXXXXXX", dueDate: "22 พ.ค. 2569", dueSublabel: "อีก 5 วัน", status: "รอการคืน", requestDate: "12 พ.ค. 2569" },
  { id: "ret-5", docNumber: "RET-2024-0136", docType: "ขอคืน", person: "ธีรพล แสงสว่าง", department: "Training", assetName: "Epson EB-X06", serial: "V11HXXXXXXX", dueDate: "23 พ.ค. 2569", dueSublabel: "อีก 6 วัน", status: "รอการคืน", requestDate: "13 พ.ค. 2569" },
  { id: "ret-6", docNumber: "RET-2024-0137", docType: "ขอคืน", person: "กมลรรณ ศรีสุข", department: "Creative", assetName: "Ubiquiti UniFi 6 Lite", serial: "A3F2XXXXXXX", dueDate: "25 พ.ค. 2569", dueSublabel: "อีก 8 วัน", status: "รอการคืน", requestDate: "15 พ.ค. 2569" },
  { id: "ret-7", docNumber: "RET-2024-0138", docType: "ขอคืน", person: "รจนา คลื่นแก้ว", department: "Storage", assetName: "APC Back-UPS 1100VA", serial: "AS192XXXXXXX", dueDate: "27 พ.ค. 2569", dueSublabel: "อีก 10 วัน", status: "รอการคืน", requestDate: "17 พ.ค. 2569" },
];

export const returnTotalCount = 128;
export const returnPageSize = 25;
export const returnTotalPages = 6;

export interface ReturnHistoryEvent {
  id: string;
  label: string;
  by: string;
  timestamp: string;
  tone: "amber" | "blue";
}

export const returnDetail = {
  docNumber: "RET-2024-0133",
  status: "เกินกำหนด" as ReturnRowStatus,
  docTypeLabel: "ขอคืนทรัพย์สิน",
  person: "สมชาย ใจดี",
  personDepartment: "Marketing Department",
  personEmail: "somchai.j@company.com",
  personPhone: "081-234-5678",
  requestDate: "10 พ.ค. 2569 14:32",
  dueDate: "15 พ.ค. 2569 (เกินกำหนด 2 วัน)",
  reason: "สิ้นสุดสัญญาว่าจ้าง",
  note: "-",
  assetName: 'MacBook Pro 14"',
  assetModel: "Space Gray",
  assetStatus: "พร้อมใช้งาน",
  serial: "C02J93XXXXXX",
  category: "IT Equipment / Notebook",
  assetId: "AST-IT-NB-000245",
  quantity: "1 เครื่อง",
  history: [
    { id: "rh-1", label: "สร้างรายการคืน", by: "โดย สมชาย ใจดี", timestamp: "10 พ.ค. 2569 14:32", tone: "amber" },
    { id: "rh-2", label: "รอการตรวจสอบ", by: "โดย ทีมงาน ก.", timestamp: "10 พ.ค. 2569 15:10", tone: "blue" },
  ] satisfies ReturnHistoryEvent[],
};

// --- Transfer ("Asset Admin" table at /asset-intelligence/assets/transfer)
// — matching the reference mockup exactly (Nie, 2026-08-26). Own dedicated
// dataset, same reasoning as Allocation/Return above — transfer type here
// spans person/department/location/bulk/project pairings, and the detail
// panel needs a two-party (from/to) layout plus a multi-item asset list,
// neither of which the other two tables' shapes carry.

export interface TransferStatTileData {
  id: string;
  label: string;
  value: string;
  sublabel: string;
  deltaLabel?: string;
  icon: "repeat" | "checkCircle" | "clock" | "truck" | "xCircle";
  iconTone: string;
}

export const transferStatTiles: TransferStatTileData[] = [
  { id: "total", label: "รายการโอนย้ายทั้งหมด", value: "96", sublabel: "จากเดือนที่แล้ว", deltaLabel: "▲ 8.5%", icon: "repeat", iconTone: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400" },
  { id: "completed", label: "ดำเนินการเสร็จสิ้น", value: "48", sublabel: "50.0% ของทั้งหมด", icon: "checkCircle", iconTone: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400" },
  { id: "pending", label: "รอดำเนินการ", value: "36", sublabel: "37.5% ของทั้งหมด", icon: "clock", iconTone: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400" },
  { id: "in-progress", label: "อยู่ระหว่างดำเนินการ", value: "8", sublabel: "8.3% ของทั้งหมด", icon: "truck", iconTone: "bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400" },
  { id: "cancelled", label: "ยกเลิก", value: "4", sublabel: "4.2% ของทั้งหมด", icon: "xCircle", iconTone: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" },
];

export const transferTabs = ["รอดำเนินการ", "อยู่ระหว่างดำเนินการ", "เสร็จสิ้น", "ยกเลิก", "ทั้งหมด"] as const;

export const transferFilterOptions = {
  type: ["ทั้งหมด", "บุคคล ↔ บุคคล", "หน่วยงาน ↔ หน่วยงาน", "สถานที่ ↔ สถานที่", "หลายรายการ", "โครงการ ↔ โครงการ"],
  from: ["ทั้งหมด"],
  to: ["ทั้งหมด"],
  status: ["ทั้งหมด", "รอดำเนินการ", "อยู่ระหว่างดำเนินการ", "เสร็จสิ้น", "ยกเลิก"],
};

export type TransferTypeLabel =
  | "บุคคล ↔ บุคคล"
  | "หน่วยงาน ↔ หน่วยงาน"
  | "สถานที่ ↔ สถานที่"
  | "หลายรายการ"
  | "โครงการ ↔ โครงการ"
  | "บุคคล → สถานที่"
  | "บุคคล → พ้นงาน"
  | "สถานที่ → คลัง";

export interface TransferRow {
  id: string;
  docNumber: string;
  type: TransferTypeLabel;
  typeSublabel: string;
  from: string;
  to: string;
  assetDisplay: string;
  serial: string;
  requestDate: string;
  requestTime: string;
  dueDate: string;
}

export const transferRows: TransferRow[] = [
  { id: "tr-1", docNumber: "TRF-2024-0042", type: "บุคคล ↔ บุคคล", typeSublabel: "Internal Transfer", from: "สมชาย ใจดี · Marketing", to: "ปวารี จันทรา · Marketing +1", assetDisplay: 'MacBook Pro 14"', serial: "C02J93XXXXXX", requestDate: "12 พ.ค. 2569", requestTime: "10:15", dueDate: "15 พ.ค. 2569" },
  { id: "tr-2", docNumber: "TRF-2024-0043", type: "หน่วยงาน ↔ หน่วยงาน", typeSublabel: "Department Transfer", from: "IT Department", to: "Finance Department +2", assetDisplay: 'Dell UltraSharp 24"', serial: "CN-0J8YXXXXX", requestDate: "12 พ.ค. 2569", requestTime: "09:30", dueDate: "16 พ.ค. 2569" },
  { id: "tr-3", docNumber: "TRF-2024-0044", type: "สถานที่ ↔ สถานที่", typeSublabel: "Location Transfer", from: "อาคาร A / ชั้น 3 / ห้อง MA-301", to: "อาคาร B / ชั้น 2 / ห้อง FB-201", assetDisplay: "HP LaserJet Pro M404dn", serial: "CNB4JXXXXXXX", requestDate: "11 พ.ค. 2569", requestTime: "14:00", dueDate: "14 พ.ค. 2569" },
  { id: "tr-4", docNumber: "TRF-2024-0045", type: "หลายรายการ", typeSublabel: "Bulk Transfer", from: "Storage", to: "IT Department", assetDisplay: "อุปกรณ์ 12 รายการ", serial: "ดูรายละเอียด", requestDate: "11 พ.ค. 2569", requestTime: "15:20", dueDate: "17 พ.ค. 2569" },
  { id: "tr-5", docNumber: "TRF-2024-0046", type: "โครงการ ↔ โครงการ", typeSublabel: "Project Transfer", from: "Project Alpha", to: "Project Beta", assetDisplay: "Projector EB-X06", serial: "V11HXXXXXXX", requestDate: "10 พ.ค. 2569", requestTime: "11:10", dueDate: "13 พ.ค. 2569" },
  { id: "tr-6", docNumber: "TRF-2024-0047", type: "บุคคล → สถานที่", typeSublabel: "User to Location", from: "เอกชัย พงศ์ไพร · Sales", to: "อาคาร C / ชั้น 1 / ห้อง SC-101", assetDisplay: "iPhone 14 128GB", serial: "355122XXXXXXX", requestDate: "10 พ.ค. 2569", requestTime: "09:05", dueDate: "13 พ.ค. 2569" },
  { id: "tr-7", docNumber: "TRF-2024-0048", type: "บุคคล → พ้นงาน", typeSublabel: "User Exit Transfer", from: "รจนา คลื่นแก้ว · Creative", to: "IT Department", assetDisplay: 'Monitor 24" +1 รายการ', serial: "ดูรายละเอียด", requestDate: "09 พ.ค. 2569", requestTime: "17:25", dueDate: "09 พ.ค. 2569" },
  { id: "tr-8", docNumber: "TRF-2024-0049", type: "สถานที่ → คลัง", typeSublabel: "Location to Storage", from: "อาคาร A / ชั้น 2 / ห้อง HR-205", to: "คลังกลาง", assetDisplay: "UPS APC 1100VA", serial: "AS192XXXXXXX", requestDate: "09 พ.ค. 2569", requestTime: "14:40", dueDate: "12 พ.ค. 2569" },
];

export const transferTotalCount = 36;
export const transferPageSize = 25;
export const transferTotalPages = 2;

export interface TransferDetailAsset {
  id: string;
  name: string;
  model: string;
  serial: string;
  status: string;
}

export interface TransferHistoryEvent {
  id: string;
  label: string;
  by: string;
  timestamp: string;
  tone: "blue" | "zinc";
}

export const transferDetail = {
  docNumber: "TRF-2024-0042",
  status: "รอดำเนินการ",
  from: {
    name: "สมชาย ใจดี",
    department: "Marketing Department",
    email: "somchai.j@company.com",
    phone: "081-234-5678",
    location: "อาคาร A / ชั้น 3 / ห้อง MA-301",
  },
  to: {
    name: "ปวารี จันทรา",
    department: "Marketing Department",
    email: "p.panvadee@company.com",
    phone: "082-345-6789",
    location: "อาคาร A / ชั้น 3 / ห้อง MA-302",
  },
  assets: [
    { id: "ta-1", name: 'MacBook Pro 14"', model: "Space Gray", serial: "C02J93XXXXXX", status: "พร้อมใช้งาน" },
    { id: "ta-2", name: "Magic Mouse 2", model: "White", serial: "MMQ52ZA/A", status: "พร้อมใช้งาน" },
  ] satisfies TransferDetailAsset[],
  type: "บุคคล ↔ บุคคล" as TransferTypeLabel,
  requestDate: "12 พ.ค. 2569 10:15",
  requestedBy: "สมชาย ใจดี",
  reason: "เปลี่ยนผู้รับผิดชอบงาน",
  dueDate: "15 พ.ค. 2569",
  note: "-",
  history: [
    { id: "th-1", label: "สร้างรายการโอนย้าย", by: "โดย สมชาย ใจดี", timestamp: "12 พ.ค. 2569 10:15", tone: "blue" },
    { id: "th-2", label: "รอการอนุมัติ", by: "โดย Asset Admin", timestamp: "12 พ.ค. 2569 10:20", tone: "zinc" },
  ] satisfies TransferHistoryEvent[],
};

// --- Asset Count ("Asset Admin" table at /asset-intelligence/assets/count)
// — matching the reference mockup exactly (Nie, 2026-08-26). Own dedicated
// dataset, same reasoning as Allocation/Return/Transfer above — this one's
// detail panel centers on a count-result donut (found/missing/extra/
// pending), a shape none of the other three tables' details carry.

export interface CountStatTileData {
  id: string;
  label: string;
  value: string;
  sublabel: string;
  icon: "clipboard" | "checkCircle" | "clock" | "box" | "warning";
  iconTone: string;
}

export const countStatTiles: CountStatTileData[] = [
  { id: "total", label: "แผนการตรวจนับทั้งหมด", value: "24", sublabel: "ทั้งหมด", icon: "clipboard", iconTone: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400" },
  { id: "completed", label: "ดำเนินการแล้ว", value: "16", sublabel: "66.7% ของทั้งหมด", icon: "checkCircle", iconTone: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400" },
  { id: "in-progress", label: "อยู่ระหว่างดำเนินการ", value: "6", sublabel: "25.0% ของทั้งหมด", icon: "clock", iconTone: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400" },
  { id: "pending-approval", label: "รออนุมัติ", value: "2", sublabel: "8.3% ของทั้งหมด", icon: "box", iconTone: "bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400" },
  { id: "discrepancy", label: "พบความคลาดเคลื่อน", value: "3", sublabel: "12.5% ของทั้งหมด", icon: "warning", iconTone: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" },
];

export const countTabs = ["แผนการตรวจนับ", "กำลังดำเนินการ", "รออนุมัติผล", "ประวัติการตรวจนับ"] as const;

export const countFilterOptions = {
  year: ["2569", "2568", "2567"],
  category: ["ทั้งหมด", "Laptop", "Network", "Office Equipment", "Air Conditioner", "AV Equipment", "Power Equipment"],
  location: ["ทั้งหมด", "อาคาร A", "อาคาร B", "อาคาร C", "Data Center"],
  status: ["ทั้งหมด", "ดำเนินการแล้ว", "อยู่ระหว่างดำเนินการ", "รออนุมัติผล", "รอเริ่มดำเนินการ", "พบความคลาดเคลื่อน"],
};

export type CountRowStatus = "ดำเนินการแล้ว" | "รออนุมัติผล" | "อยู่ระหว่างดำเนินการ" | "รอเริ่มดำเนินการ" | "พบความคลาดเคลื่อน";

export interface CountRow {
  id: string;
  planCode: string;
  planName: string;
  category: string;
  location: string;
  scheduleStart: string;
  scheduleEnd: string;
  owner: string;
  ownerDepartment: string;
  status: CountRowStatus;
  progressPercent: number;
  countedItems: number;
  totalItems: number;
}

export const countRows: CountRow[] = [
  { id: "cnt-1", planCode: "CNT-2025-0001", planName: "ตรวจนับทรัพย์สินประจำปี 2569 รอบที่ 1", category: "ทั้งหมด", location: "สำนักงานใหญ่ / อาคาร A, B, C", scheduleStart: "10 ม.ค. 2569", scheduleEnd: "20 ม.ค. 2569", owner: "สมชาย ใจดี", ownerDepartment: "Asset Manager", status: "ดำเนินการแล้ว", progressPercent: 100, countedItems: 1245, totalItems: 1245 },
  { id: "cnt-2", planCode: "CNT-2025-0002", planName: "ตรวจนับ Laptop ประจำไตรมาส 1/2569", category: "Laptop", location: "อาคาร A ชั้น 3, 4, 5", scheduleStart: "05 ก.พ. 2569", scheduleEnd: "07 ก.พ. 2569", owner: "ปวารี จันทรา", ownerDepartment: "IT Department", status: "ดำเนินการแล้ว", progressPercent: 100, countedItems: 320, totalItems: 320 },
  { id: "cnt-3", planCode: "CNT-2025-0003", planName: "ตรวจนับอุปกรณ์ Network ประจำปี", category: "Network", location: "Data Center DC-01", scheduleStart: "15 ก.พ. 2569", scheduleEnd: "16 ก.พ. 2569", owner: "วรวิทย์ คงขุน", ownerDepartment: "IT Support", status: "รออนุมัติผล", progressPercent: 100, countedItems: 85, totalItems: 85 },
  { id: "cnt-4", planCode: "CNT-2025-0004", planName: "ตรวจนับเฟอร์นิเจอร์สำนักงาน ไตรมาส 1/2569", category: "Office Equipment", location: "อาคาร B ชั้น 2", scheduleStart: "20 ก.พ. 2569", scheduleEnd: "21 ก.พ. 2569", owner: "แนวรวย แสงงาม", ownerDepartment: "Admin Department", status: "อยู่ระหว่างดำเนินการ", progressPercent: 60, countedItems: 180, totalItems: 300 },
  { id: "cnt-5", planCode: "CNT-2025-0005", planName: "ตรวจนับเครื่องปรับอากาศ", category: "Air Conditioner", location: "อาคาร A, B, C ทุกชั้น", scheduleStart: "01 มี.ค. 2569", scheduleEnd: "05 มี.ค. 2569", owner: "อาทิตย์ เกิดผล", ownerDepartment: "Facility", status: "รอเริ่มดำเนินการ", progressPercent: 0, countedItems: 0, totalItems: 240 },
  { id: "cnt-6", planCode: "CNT-2025-0006", planName: "ตรวจนับโปรเจคเตอร์และจอแสดงผล", category: "AV Equipment", location: "ห้องประชุม ทุกห้อง", scheduleStart: "05 มี.ค. 2569", scheduleEnd: "06 มี.ค. 2569", owner: "ธีรพล แสงสว่าง", ownerDepartment: "Training", status: "รอเริ่มดำเนินการ", progressPercent: 0, countedItems: 0, totalItems: 56 },
  { id: "cnt-7", planCode: "CNT-2025-0007", planName: "ตรวจนับ UPS และอุปกรณ์ไฟฟ้า ประจำปี", category: "Power Equipment", location: "แต่ละ MDF", scheduleStart: "10 มี.ค. 2569", scheduleEnd: "12 มี.ค. 2569", owner: "สุรชัย แก้วมณี", ownerDepartment: "IT Support", status: "พบความคลาดเคลื่อน", progressPercent: 100, countedItems: 42, totalItems: 48 },
  { id: "cnt-8", planCode: "CNT-2025-0008", planName: "ตรวจนับทรัพย์สินสาขาใหม่ ประจำปี 2569", category: "ทั้งหมด", location: "สาขาใหม่ ทุกที่ตั้ง", scheduleStart: "15 มี.ค. 2569", scheduleEnd: "18 มี.ค. 2569", owner: "กฤษณา วงศ์สุข", ownerDepartment: "Branch Admin", status: "พบความคลาดเคลื่อน", progressPercent: 85, countedItems: 510, totalItems: 600 },
];

export const countTotalCount = 24;
export const countPageSize = 25;
export const countTotalPages = 1;

export interface CountResultSegment {
  label: string;
  value: number;
  percentLabel: string;
  color: string;
}

export interface CountHistoryEvent {
  id: string;
  label: string;
  by: string;
  timestamp: string;
  tone: "emerald" | "blue" | "zinc";
}

export const countDetail = {
  planCode: "CNT-2025-0002",
  planName: "ตรวจนับ Laptop ประจำไตรมาส 1/2569",
  status: "ดำเนินการแล้ว" as CountRowStatus,
  category: "Laptop",
  scope: "อาคาร A ชั้น 3, 4, 5",
  scheduleRange: "05 ก.พ. 2569 - 07 ก.พ. 2569",
  owner: "ปวารี จันทรา",
  ownerDepartment: "IT Department",
  resultTotal: 320,
  resultSegments: [
    { label: "พบครบ", value: 310, percentLabel: "96.9%", color: "#10b981" },
    { label: "ไม่พบ", value: 6, percentLabel: "1.9%", color: "#ef4444" },
    { label: "พบเพิ่ม", value: 2, percentLabel: "0.6%", color: "#3b82f6" },
    { label: "รอการตรวจสอบ", value: 2, percentLabel: "0.6%", color: "#a1a1aa" },
  ] satisfies CountResultSegment[],
  history: [
    { id: "ch-1", label: "สร้างแผนการตรวจนับ", by: "โดย ปวารี จันทรา", timestamp: "05 ก.พ. 2569 09:10", tone: "emerald" },
    { id: "ch-2", label: "เริ่มการตรวจนับ", by: "โดย ปวารี จันทรา", timestamp: "05 ก.พ. 2569 09:30", tone: "blue" },
    { id: "ch-3", label: "ดำเนินการตรวจนับเสร็จสิ้น", by: "โดย ปวารี จันทรา", timestamp: "07 ก.พ. 2569 16:45", tone: "emerald" },
    { id: "ch-4", label: "อนุมัติผลการตรวจนับ", by: "โดย สมชาย ใจดี", timestamp: "07 ก.พ. 2569 17:20", tone: "zinc" },
  ] satisfies CountHistoryEvent[],
};

// --- Asset Categories ("Asset Admin" table at
// /asset-intelligence/assets/categories) — matching the reference mockup
// exactly (Nie, 2026-08-26). Own dedicated dataset, same reasoning as the
// other Asset Admin tables — a simpler filter/pagination shape (one status
// dropdown, pagination below the table rather than above) and a detail
// panel with its own internal Details/Assets tabs, neither of which the
// other tables' shapes carry.

export interface CategoryStatTileData {
  id: string;
  label: string;
  value: string;
  sublabel: string;
  icon: "box" | "checkCircle" | "boxInactive" | "grid" | "chart";
  iconTone: string;
}

export const categoryStatTiles: CategoryStatTileData[] = [
  { id: "total", label: "ประเภททรัพย์สินทั้งหมด", value: "28", sublabel: "ทั้งหมด", icon: "box", iconTone: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400" },
  { id: "active", label: "ใช้งานอยู่", value: "25", sublabel: "89.3% ของทั้งหมด", icon: "checkCircle", iconTone: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400" },
  { id: "inactive", label: "ไม่ได้ใช้", value: "3", sublabel: "10.7% ของทั้งหมด", icon: "boxInactive", iconTone: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400" },
  { id: "total-assets", label: "ทรัพย์สินทั้งหมด", value: "12,846", sublabel: "รวมทุกประเภท", icon: "grid", iconTone: "bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400" },
  { id: "total-value", label: "มูลค่ารวม (THB)", value: "2.35M", sublabel: "ราคาทุนรวม", icon: "chart", iconTone: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400" },
];

export const categoryFilterOptions = {
  status: ["ทั้งหมด", "ใช้งานอยู่", "ไม่ได้ใช้"],
};

export type CategoryIcon = "laptop" | "desktop" | "printer" | "mobile" | "tablet" | "monitor" | "furniture" | "vehicle" | "ac" | "projector";
export type CategoryStatus = "ใช้งานอยู่" | "ไม่ได้ใช้งาน";

export interface CategoryRow {
  id: string;
  name: string;
  nameEn: string;
  icon: CategoryIcon;
  code: string;
  parent: string;
  assetCount: number;
  totalValueTHB: number;
  status: CategoryStatus;
}

export const categoryRows: CategoryRow[] = [
  { id: "cat-1", name: "คอมพิวเตอร์พกพา", nameEn: "Laptop", icon: "laptop", code: "AST-CMP-LAP", parent: "IT Equipment", assetCount: 2385, totalValueTHB: 856450000, status: "ใช้งานอยู่" },
  { id: "cat-2", name: "คอมพิวเตอร์ตั้งโต๊ะ", nameEn: "Desktop", icon: "desktop", code: "AST-CMP-DES", parent: "IT Equipment", assetCount: 1542, totalValueTHB: 245680000, status: "ใช้งานอยู่" },
  { id: "cat-3", name: "เครื่องพิมพ์", nameEn: "Printer", icon: "printer", code: "AST-PRT-001", parent: "Office Equipment", assetCount: 654, totalValueTHB: 48965000, status: "ใช้งานอยู่" },
  { id: "cat-4", name: "โทรศัพท์มือถือ", nameEn: "Mobile Device", icon: "mobile", code: "AST-MOB-001", parent: "IT Equipment", assetCount: 2954, totalValueTHB: 88620000, status: "ใช้งานอยู่" },
  { id: "cat-5", name: "แท็บเล็ต", nameEn: "Tablet", icon: "tablet", code: "AST-TAB-001", parent: "IT Equipment", assetCount: 412, totalValueTHB: 15460000, status: "ใช้งานอยู่" },
  { id: "cat-6", name: "จอแสดงผล", nameEn: "Monitor", icon: "monitor", code: "AST-MON-001", parent: "IT Equipment", assetCount: 1876, totalValueTHB: 71240000, status: "ใช้งานอยู่" },
  { id: "cat-7", name: "เฟอร์นิเจอร์สำนักงาน", nameEn: "Office Furniture", icon: "furniture", code: "AST-FUR-001", parent: "Office Equipment", assetCount: 1256, totalValueTHB: 34120000, status: "ใช้งานอยู่" },
  { id: "cat-8", name: "ยานพาหนะ", nameEn: "Vehicle", icon: "vehicle", code: "AST-VEH-001", parent: "Transport", assetCount: 24, totalValueTHB: 1250000, status: "ไม่ได้ใช้งาน" },
  { id: "cat-9", name: "เครื่องปรับอากาศ", nameEn: "Air Conditioner", icon: "ac", code: "AST-AC-001", parent: "Facility Equipment", assetCount: 198, totalValueTHB: 12310000, status: "ใช้งานอยู่" },
  { id: "cat-10", name: "เครื่องฉายภาพ", nameEn: "Projector", icon: "projector", code: "AST-PRO-001", parent: "AV Equipment", assetCount: 118, totalValueTHB: 6870000, status: "ใช้งานอยู่" },
];

export const categoryTotalCount = 28;
export const categoryPageSize = 10;
export const categoryTotalPages = 3;

export const categoryDetail = {
  name: "คอมพิวเตอร์พกพา",
  nameEn: "Laptop",
  icon: "laptop" as CategoryIcon,
  code: "AST-CMP-LAP",
  parent: "IT Equipment",
  status: "ใช้งานอยู่" as CategoryStatus,
  assetCount: 2385,
  totalValueTHB: 856450000,
  netValueTHB: 642380000,
  description: "คอมพิวเตอร์พกพาสำหรับใช้งานของพนักงาน รวมทุกแบรนด์และสเปก",
  features: [
    "ติดตาม Serial Number / Asset Tag",
    "บริหารการ Lifecycle และ Warranty",
    "รองรับการจัดสรร, โอนย้าย, คืน และตรวจนับ",
    "เชื่อมโยงผู้ใช้งานและหน่วยงาน",
  ],
  createdLabel: "15 ธ.ค. 2566 10:15 โดย กนกวรรณ ก.",
  updatedLabel: "08 พ.ค. 2569 14:32 โดย กนกวรรณ ก.",
};

// --- Locations & Areas ("Asset Admin" table at
// /asset-intelligence/assets/locations) — a full redesign matching the
// reference mockup exactly (Nie, 2026-08-26), replacing the earlier
// LocationsPage (a flat list explicitly documented as a placeholder for
// "the hierarchical tree the requirement doc AM-05 describes" — that tree
// is what this is). Own dedicated dataset, same reasoning as the other
// Asset Admin tables. LocationsPage (services/mock-assets.ts +
// mock-reference-data.ts-backed) is untouched and still exported — this
// route just stopped rendering it.

export interface LocationStatTileData {
  id: string;
  label: string;
  value: string;
  sublabel: string;
  icon: "building" | "buildingGreen" | "buildingAmber" | "grid" | "currency" | "gauge";
  iconTone: string;
}

export const locationStatTiles: LocationStatTileData[] = [
  { id: "locations", label: "สถานที่", value: "15", sublabel: "ทั้งหมด", icon: "building", iconTone: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400" },
  { id: "buildings", label: "อาคาร", value: "48", sublabel: "ใช้งานอยู่ 46", icon: "buildingGreen", iconTone: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400" },
  { id: "floors", label: "ชั้น", value: "136", sublabel: "ใช้งานอยู่ 128", icon: "buildingAmber", iconTone: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400" },
  { id: "rooms", label: "ห้อง / พื้นที่", value: "512", sublabel: "ใช้งานอยู่ 486", icon: "grid", iconTone: "bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400" },
  { id: "value", label: "มูลค่าสินทรัพย์ (THB)", value: "2.35M", sublabel: "ในทุกสถานที่", icon: "currency", iconTone: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400" },
  { id: "utilization", label: "พื้นที่ใช้งาน", value: "96%", sublabel: "486 / 512", icon: "gauge", iconTone: "bg-teal-50 text-teal-500 dark:bg-teal-500/10 dark:text-teal-400" },
];

export const locationFilterOptions = {
  type: ["ทั้งหมด", "Head Office", "Building", "Warehouse", "Branch Office", "Factory"],
  status: ["ทั้งหมด", "ใช้งานอยู่", "ไม่ได้ใช้งาน"],
};

export type LocationNodeType = "Head Office" | "Building" | "Floor" | "Room" | "Warehouse" | "Branch Office" | "Factory";

export interface LocationNode {
  id: string;
  name: string;
  badge?: string;
  type: LocationNodeType;
  code: string;
  assetCount: number;
  valueTHB: number;
  status: "ใช้งานอยู่";
  moreLabel?: string;
  children?: LocationNode[];
}

export const locationTree: LocationNode[] = [
  {
    id: "loc-hq",
    name: "บริษัท ธันเดอร์ วัน จำกัด (มหาชน)",
    badge: "สำนักงานใหญ่",
    type: "Head Office",
    code: "LOC-HQ",
    assetCount: 3245,
    valueTHB: 1245680000,
    status: "ใช้งานอยู่",
    children: [
      {
        id: "loc-building-a",
        name: "อาคาร A (อาคารสำนักงานใหญ่)",
        type: "Building",
        code: "B-A",
        assetCount: 1842,
        valueTHB: 856450000,
        status: "ใช้งานอยู่",
        children: [
          {
            id: "loc-floor-a3",
            name: "ชั้น 3",
            type: "Floor",
            code: "A-03",
            assetCount: 642,
            valueTHB: 285450000,
            status: "ใช้งานอยู่",
            moreLabel: "ดูอีก 5 ห้อง",
            children: [
              { id: "loc-room-a03-301", name: "ห้อง 301 - ห้องประชุมใหญ่", type: "Room", code: "A-03-301", assetCount: 48, valueTHB: 18650000, status: "ใช้งานอยู่" },
              { id: "loc-room-a03-302", name: "ห้อง 302 - ฝ่ายการตลาด", type: "Room", code: "A-03-302", assetCount: 72, valueTHB: 24120000, status: "ใช้งานอยู่" },
              { id: "loc-room-a03-303", name: "ห้อง 303 - ฝ่ายไอที", type: "Room", code: "A-03-303", assetCount: 156, valueTHB: 75420000, status: "ใช้งานอยู่" },
            ],
          },
          { id: "loc-floor-a2", name: "ชั้น 2", type: "Floor", code: "A-02", assetCount: 614, valueTHB: 235680000, status: "ใช้งานอยู่" },
          { id: "loc-floor-a1", name: "ชั้น 1", type: "Floor", code: "A-01", assetCount: 586, valueTHB: 198250000, status: "ใช้งานอยู่" },
        ],
      },
      { id: "loc-building-b", name: "อาคาร B (อาคารสำนักงาน 2)", type: "Building", code: "B-B", assetCount: 892, valueTHB: 324650000, status: "ใช้งานอยู่" },
      { id: "loc-building-c", name: "อาคาร C (ศูนย์บริการ)", type: "Building", code: "B-C", assetCount: 511, valueTHB: 64580000, status: "ใช้งานอยู่" },
    ],
  },
  { id: "loc-wh-bkk", name: "คลังสินค้า กรุงเทพ", badge: "คลังสินค้า", type: "Warehouse", code: "LOC-WH-BKK", assetCount: 1258, valueTHB: 412380000, status: "ใช้งานอยู่" },
  { id: "loc-cnx", name: "สำนักงานสาขา เชียงใหม่", badge: "สาขา", type: "Branch Office", code: "LOC-CNX", assetCount: 684, valueTHB: 156420000, status: "ใช้งานอยู่" },
  { id: "loc-spk", name: "โรงงานผลิต สมุทรปราการ", badge: "โรงงาน", type: "Factory", code: "LOC-SPK", assetCount: 2124, valueTHB: 512650000, status: "ใช้งานอยู่" },
];

export const locationTotalCount = 15;
export const locationPageSize = 10;
export const locationTotalPages = 2;

export const locationDetail = {
  name: "บริษัท ธันเดอร์ วัน จำกัด (มหาชน)",
  status: "ใช้งานอยู่",
  type: "สำนักงานใหญ่",
  code: "LOC-HQ",
  manager: "กนกวรรณ จันทร์",
  managerDepartment: "Asset Admin",
  phone: "02-123-4567",
  email: "asset.admin@thunderone.co.th",
  address: "123 ถนนพหลโยธิน แขวงลาดยาว เขตจตุจักร กรุงเทพฯ 10110",
  summary: {
    total: { value: "3,245", label: "รวมทั้งหมด" },
    valueTHB: { value: "1.24M", unit: "THB", label: "มูลค่า" },
    utilization: { value: "96%", label: "พื้นที่ใช้งาน", detail: "486/512" },
    needsAttention: { value: "18", label: "รายการที่ต้องแจ้ง" },
  },
};

// --- Warranty / Lifecycle ("Asset Admin" table at
// /asset-intelligence/assets/warranty) — matching the reference mockup
// exactly (Nie, 2026-08-26). Own dedicated dataset, same reasoning as the
// other Asset Admin tables. Only the "ทรัพย์สิน (Warranty)" tab (the one
// active in the mockup) has real content — Overview/Service
// Contracts/Claim History/Lifecycle are placeholders, same as every other
// non-default tab across this feature's tables.

export interface WarrantyStatTileData {
  id: string;
  label: string;
  value: string;
  sublabel: string;
  icon: "shield" | "checkCircle" | "clock" | "warning" | "clipboard" | "currency";
  iconTone: string;
}

export const warrantyStatTiles: WarrantyStatTileData[] = [
  { id: "total", label: "ทรัพย์สินทั้งหมด", value: "1,248", sublabel: "100%", icon: "shield", iconTone: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400" },
  { id: "in-warranty", label: "อยู่ในประกัน", value: "856", sublabel: "68.6%", icon: "checkCircle", iconTone: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400" },
  { id: "expiring", label: "ใกล้หมดอายุ (≤ 60 วัน)", value: "142", sublabel: "11.4%", icon: "clock", iconTone: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400" },
  { id: "expired", label: "หมดอายุแล้ว", value: "126", sublabel: "10.1%", icon: "warning", iconTone: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" },
  { id: "contracts", label: "สัญญาบริการ Active", value: "38", sublabel: "Active", icon: "clipboard", iconTone: "bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400" },
  { id: "coverage-value", label: "มูลค่าความคุ้มครอง (THB)", value: "1.24M", sublabel: "THB", icon: "currency", iconTone: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400" },
];

export const warrantyTabs = ["ภาพรวม", "ทรัพย์สิน (Warranty)", "สัญญาบริการ", "ประวัติการเคลม", "Lifecycle"] as const;

export const warrantyFilterOptions = {
  category: ["ทั้งหมด", "Laptop", "Monitor", "Printer", "UPS", "Network Switch", "Projector", "Tablet", "NVR"],
  status: ["ทั้งหมด", "อยู่ในประกัน", "ใกล้หมดอายุ", "หมดอายุแล้ว"],
  vendor: ["ทั้งหมด", "Apple", "DELL", "HP", "APC", "Cisco", "SONY", "Microsoft", "HIKVISION"],
  expiringWithin: ["ทั้งหมด", "30 วัน", "60 วัน", "90 วัน"],
};

export type WarrantyStatus = "อยู่ในประกัน" | "ใกล้หมดอายุ" | "หมดอายุแล้ว";

export interface WarrantyRow {
  id: string;
  assetName: string;
  assetTag: string;
  location: string;
  category: string;
  serial: string;
  vendor: string;
  status: WarrantyStatus;
  expiryDate: string;
  daysLabel: string;
  coverageValueTHB: number;
}

export const warrantyRows: WarrantyRow[] = [
  { id: "war-1", assetName: 'MacBook Pro 14"', assetTag: "AST-2024-0001", location: "Head Office / IT", category: "Laptop", serial: "C02J93XXXXXX", vendor: "Apple", status: "อยู่ในประกัน", expiryDate: "20 ก.ค. 2569", daysLabel: "69 วัน", coverageValueTHB: 64900 },
  { id: "war-2", assetName: 'Dell UltraSharp 24"', assetTag: "AST-2024-0002", location: "Head Office / IT", category: "Monitor", serial: "CN-0J8XXXXX", vendor: "DELL", status: "อยู่ในประกัน", expiryDate: "15 มิ.ย. 2569", daysLabel: "34 วัน", coverageValueTHB: 15600 },
  { id: "war-3", assetName: "HP LaserJet Pro M404dn", assetTag: "AST-2024-0003", location: "Head Office / IT", category: "Printer", serial: "CNDJJXXXXXX", vendor: "HP", status: "ใกล้หมดอายุ", expiryDate: "02 มิ.ย. 2569", daysLabel: "21 วัน", coverageValueTHB: 12500 },
  { id: "war-4", assetName: "APC Smart-UPS 1500VA", assetTag: "AST-2023-0156", location: "Data Center", category: "UPS", serial: "AS192XXXXXX", vendor: "APC", status: "อยู่ในประกัน", expiryDate: "30 มิ.ย. 2569", daysLabel: "111 วัน", coverageValueTHB: 45000 },
  { id: "war-5", assetName: "Cisco Catalyst 2960X", assetTag: "AST-2023-0088", location: "Network Room", category: "Network Switch", serial: "FD01234XXXXX", vendor: "Cisco", status: "หมดอายุแล้ว", expiryDate: "10 มี.ค. 2569", daysLabel: "-2 วัน", coverageValueTHB: 28900 },
  { id: "war-6", assetName: "Sony Projector VPL-EX575", assetTag: "AST-2024-0102", location: "Meeting Room 2", category: "Projector", serial: "PX1234XXXXX", vendor: "SONY", status: "หมดอายุแล้ว", expiryDate: "01 เม.ย. 2569", daysLabel: "-42 วัน", coverageValueTHB: 18900 },
  { id: "war-7", assetName: "Microsoft Surface Pro 9", assetTag: "AST-2024-0410", location: "Sales Team", category: "Tablet", serial: "0F01234567", vendor: "Microsoft", status: "อยู่ในประกัน", expiryDate: "05 ก.ค. 2569", daysLabel: "117 วัน", coverageValueTHB: 42900 },
  { id: "war-8", assetName: "Hikvision NVR 16CH", assetTag: "AST-2023-0211", location: "CCTV Room", category: "NVR", serial: "DS-7616NI-K2", vendor: "HIKVISION", status: "ใกล้หมดอายุ", expiryDate: "01 ก.ค. 2569", daysLabel: "50 วัน", coverageValueTHB: 22000 },
];

export const warrantyTotalCount = 1248;
export const warrantyPageSize = 10;
export const warrantyTotalPages = 125;

export const warrantyDetail = {
  assetTag: "AST-2024-0001",
  status: "อยู่ในประกัน" as WarrantyStatus,
  assetName: 'MacBook Pro 14"',
  location: "Head Office / IT Department",
  vendor: "Apple",
  planType: "AppleCare+ for Business",
  contractNumber: "ACB-TH-2024-001234",
  startDate: "21 ก.ค. 2567",
  expiryDate: "20 ก.ค. 2569",
  duration: "2 ปี",
  coverageValueTHB: "64,900 THB",
  coverageScope: "Hardware & Battery, Accidental Damage",
  specialTerms: "Onsite Service",
  provider: "Apple Thailand",
  phone: "1800-019-900",
  email: "support@apple.com",
  website: "apple.com/th",
};

// --- Reports ("Asset Admin" analytics dashboard at
// /asset-intelligence/assets/reports) — a full redesign matching the
// reference mockup exactly (Nie, 2026-08-26), replacing the earlier
// ReportsPage (a plain 3-stat + flat table summary). Own dedicated
// dataset, same reasoning as the other Asset Admin pages. ReportsPage
// itself (getMockAssets/getMockIssues-backed) is untouched and still
// exported — this route just stopped rendering it.

export interface ReportStatTileData {
  id: string;
  label: string;
  value: string;
  sublabel: string;
  icon: "box" | "checkCircle" | "wrench" | "warning" | "clipboard" | "currency";
  iconTone: string;
}

export const reportStatTiles: ReportStatTileData[] = [
  { id: "total", label: "ทรัพย์สินทั้งหมด", value: "1,248", sublabel: "100%", icon: "box", iconTone: "bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400" },
  { id: "in-use", label: "ใช้งานอยู่", value: "1,072", sublabel: "85.9%", icon: "checkCircle", iconTone: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400" },
  { id: "maintenance", label: "ซ่อมบำรุง / รออะไหล่", value: "126", sublabel: "10.1%", icon: "wrench", iconTone: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400" },
  { id: "expired", label: "หมดอายุ / เสีย", value: "50", sublabel: "4.0%", icon: "warning", iconTone: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" },
  { id: "contracts", label: "เอกสารสัญญา", value: "38", sublabel: "3.0%", icon: "clipboard", iconTone: "bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400" },
  { id: "total-value", label: "มูลค่ารวม (THB)", value: "2.35M", sublabel: "ทั้งองค์กร", icon: "currency", iconTone: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400" },
];

export const reportFilterOptions = {
  period: ["ปีงบประมาณ 2569", "ปีงบประมาณ 2568", "ปีงบประมาณ 2567"],
  compare: ["ปีงบประมาณ 2568", "ปีงบประมาณ 2567", "ไม่เปรียบเทียบ"],
  location: ["ทั้งหมด", "อาคาร A", "อาคาร B", "อาคาร C", "Data Center"],
};

export const categoryDistribution = {
  total: 1248,
  segments: [
    { label: "คอมพิวเตอร์ / Laptop", value: 481, percentLabel: "38.5%", color: "#6366f1" },
    { label: "อุปกรณ์สำนักงาน", value: 243, percentLabel: "19.5%", color: "#10b981" },
    { label: "เครื่องพิมพ์ / Scanner", value: 140, percentLabel: "11.2%", color: "#f59e0b" },
    { label: "โทรศัพท์มือถือ / Tablet", value: 116, percentLabel: "9.3%", color: "#3b82f6" },
    { label: "อุปกรณ์เครือข่าย", value: 89, percentLabel: "7.1%", color: "#a855f7" },
    { label: "อื่นๆ", value: 179, percentLabel: "14.4%", color: "#a1a1aa" },
  ],
};

export const usageStatusDistribution = {
  total: 1248,
  segments: [
    { label: "ใช้งานอยู่", value: 1072, percentLabel: "85.9%", color: "#10b981" },
    { label: "ซ่อมบำรุง / รอซ่อม", value: 126, percentLabel: "10.1%", color: "#f59e0b" },
    { label: "หมดอายุ", value: 40, percentLabel: "3.2%", color: "#ef4444" },
    { label: "ไม่ได้ใช้งาน", value: 10, percentLabel: "0.8%", color: "#a1a1aa" },
  ],
};

export interface LocationValueRow {
  label: string;
  valueTHB: number;
  valueLabel: string;
}

export const valueByLocation: LocationValueRow[] = [
  { label: "สำนักงานใหญ่", valueTHB: 1240000, valueLabel: "1.24M" },
  { label: "อาคาร A (สำนักงานใหญ่)", valueTHB: 560000, valueLabel: "560K" },
  { label: "คลังสินค้า กรุงเทพ", valueTHB: 320000, valueLabel: "320K" },
  { label: "สาขา เชียงใหม่", valueTHB: 140000, valueLabel: "140K" },
  { label: "สาขา ขอนแก่น", valueTHB: 60000, valueLabel: "60K" },
  { label: "อื่นๆ", valueTHB: 70000, valueLabel: "70K" },
];

export const purchaseTrend = {
  xKey: "month",
  series: [
    { key: "fy2569", label: "ปีงบประมาณ 2569", color: "#6366f1" },
    { key: "fy2568", label: "ปีงบประมาณ 2568", color: "#a1a1aa" },
  ],
  data: [
    { month: "ต.ค.", fy2569: 120000, fy2568: 90000 },
    { month: "พ.ย.", fy2569: 210000, fy2568: 160000 },
    { month: "ธ.ค.", fy2569: 340000, fy2568: 260000 },
    { month: "ม.ค.", fy2569: 460000, fy2568: 380000 },
    { month: "ก.พ.", fy2569: 560000, fy2568: 470000 },
    { month: "มี.ค.", fy2569: 690000, fy2568: 590000 },
    { month: "เม.ย.", fy2569: 820000, fy2568: 700000 },
    { month: "พ.ค.", fy2569: 950000, fy2568: 810000 },
    { month: "มิ.ย.", fy2569: 1400000, fy2568: 1150000 },
    { month: "ก.ค.", fy2569: 1750000, fy2568: 1450000 },
    { month: "ส.ค.", fy2569: 2100000, fy2568: 1750000 },
    { month: "ก.ย.", fy2569: 2350000, fy2568: 1980000 },
  ],
  summary: [
    { id: "fy2569", label: "ปีงบประมาณ 2569", value: "2.35M THB", deltaLabel: "▲ 18.6%" },
    { id: "fy2568", label: "ปีงบประมาณ 2568", value: "1.98M THB" },
  ],
};

export interface ExpiringWarrantyRow {
  id: string;
  assetName: string;
  serial: string;
  expiryDate: string;
  daysLabel: string;
  valueTHB: number;
}

export const expiringWarrantyRows: ExpiringWarrantyRow[] = [
  { id: "ew-1", assetName: "Dell Latitude 5430", serial: "CN-0J9XXXXXX", expiryDate: "15 พ.ค. 2569", daysLabel: "3 วัน", valueTHB: 32900 },
  { id: "ew-2", assetName: "HP LaserJet Pro M404dn", serial: "CNDJJXXXXXX", expiryDate: "22 พ.ค. 2569", daysLabel: "10 วัน", valueTHB: 12500 },
  { id: "ew-3", assetName: "Cisco Catalyst 2960X", serial: "FD01234XXXXX", expiryDate: "05 มิ.ย. 2569", daysLabel: "24 วัน", valueTHB: 28900 },
  { id: "ew-4", assetName: "APC Smart-UPS 1500VA", serial: "AS192XXXXXX", expiryDate: "18 มิ.ย. 2569", daysLabel: "37 วัน", valueTHB: 45000 },
  { id: "ew-5", assetName: "iPad Air (5th Gen)", serial: "DMQHXXXXXXX", expiryDate: "01 ก.ค. 2569", daysLabel: "50 วัน", valueTHB: 24900 },
];

export interface PopularReportData {
  id: string;
  title: string;
  subtitle: string;
}

export const popularReports: PopularReportData[] = [
  { id: "pr-1", title: "สรุปทรัพย์สินทั้งหมด", subtitle: "ภาพรวมทรัพย์สินในองค์กร" },
  { id: "pr-2", title: "ทรัพย์สินตามสถานะ", subtitle: "แสดงทรัพย์สินแยกตามสถานะ" },
  { id: "pr-3", title: "ทรัพย์สินตามประเภท", subtitle: "แสดงทรัพย์สินแยกตามประเภท" },
  { id: "pr-4", title: "รายงาน Warranty ใกล้หมดอายุ", subtitle: "ทรัพย์สิน Warranty ใกล้หมดอายุ" },
  { id: "pr-5", title: "ประวัติการซ่อมบำรุง", subtitle: "สรุปประวัติการซ่อมบำรุงทั้งหมด" },
];

export interface RecentReportData {
  id: string;
  title: string;
  fileType: "XLSX" | "PDF";
  createdLabel: string;
}

export const recentReports: RecentReportData[] = [
  { id: "rr-1", title: "สรุปทรัพย์สินทั้งหมด", fileType: "XLSX", createdLabel: "สร้างโดย กนกวรรณ ก. · 12 พ.ค. 2569 10:30" },
  { id: "rr-2", title: "ทรัพย์สินตามสถานที่", fileType: "PDF", createdLabel: "สร้างโดย กนกวรรณ ก. · 12 พ.ค. 2569 09:15" },
  { id: "rr-3", title: "รายงาน Warranty ใกล้หมดอายุ", fileType: "XLSX", createdLabel: "สร้างโดย กนกวรรณ ก. · 11 พ.ค. 2569 16:45" },
  { id: "rr-4", title: "ประวัติการซ่อมบำรุง", fileType: "XLSX", createdLabel: "สร้างโดย กนกวรรณ ก. · 11 พ.ค. 2569 14:20" },
];

// --- Knowledge Base ("Asset Admin" article hub at
// /asset-intelligence/assets/knowledge-base) — matching the reference
// mockup exactly (Nie, 2026-08-26). Own dedicated dataset, same reasoning
// as the other Asset Admin pages. The last item in this sidebar's nav to
// get a real page — closes out the whole "ช่วยเหลือ" section.

export interface KnowledgeStatTileData {
  id: string;
  label: string;
  value: string;
  sublabel: string;
  icon: "book" | "document" | "play" | "question" | "download";
  iconTone: string;
}

export const knowledgeStatTiles: KnowledgeStatTileData[] = [
  { id: "articles", label: "บทความทั้งหมด", value: "128", sublabel: "+12 บทความใหม่", icon: "book", iconTone: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400" },
  { id: "guides", label: "คู่มือ / SOP", value: "24", sublabel: "อัปเดตล่าสุด 10 พ.ค. 2569", icon: "document", iconTone: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400" },
  { id: "videos", label: "วิดีโอสาธิต", value: "18", sublabel: "+2 วิดีโอใหม่", icon: "play", iconTone: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400" },
  { id: "faq", label: "คำถามที่พบบ่อย", value: "36", sublabel: "ครอบคลุม 9 หมวด", icon: "question", iconTone: "bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400" },
  { id: "downloads", label: "เอกสารดาวน์โหลด", value: "56", sublabel: "เทมเพลต & ฟอร์ม", icon: "download", iconTone: "bg-teal-50 text-teal-500 dark:bg-teal-500/10 dark:text-teal-400" },
];

export const knowledgeFilterOptions = {
  category: ["ทั้งหมด", "เริ่มต้นใช้งาน", "การจัดการทรัพย์สิน", "การจัดสรร & โอนย้าย", "การตรวจนับ", "การบำรุงรักษา"],
  contentType: ["ทั้งหมด", "บทความ", "คู่มือ", "วิดีโอ", "FAQ"],
  tag: ["ทั้งหมด"],
  status: ["ทั้งหมด", "เผยแพร่แล้ว", "ฉบับร่าง"],
};

export interface KnowledgeCategoryData {
  id: string;
  icon: "book" | "rocket" | "document" | "box" | "search" | "wrench" | "shield" | "chart" | "clipboard" | "settings";
  iconTone: string;
  label: string;
  count: number;
}

export const knowledgeCategories: KnowledgeCategoryData[] = [
  { id: "kc-all", icon: "book", iconTone: "text-indigo-500", label: "ทั้งหมด", count: 128 },
  { id: "kc-start", icon: "rocket", iconTone: "text-blue-500", label: "เริ่มต้นใช้งาน", count: 12 },
  { id: "kc-management", icon: "document", iconTone: "text-emerald-500", label: "การจัดการทรัพย์สิน", count: 24 },
  { id: "kc-allocation", icon: "box", iconTone: "text-purple-500", label: "การจัดสรร & โอนย้าย", count: 18 },
  { id: "kc-count", icon: "search", iconTone: "text-amber-500", label: "การตรวจนับ", count: 12 },
  { id: "kc-maintenance", icon: "wrench", iconTone: "text-teal-500", label: "การบำรุงรักษา", count: 11 },
  { id: "kc-warranty", icon: "shield", iconTone: "text-red-500", label: "Warranty & Lifecycle", count: 15 },
  { id: "kc-reports", icon: "chart", iconTone: "text-blue-500", label: "รายงาน & วิเคราะห์", count: 12 },
  { id: "kc-policy", icon: "clipboard", iconTone: "text-purple-500", label: "นโยบาย & แนวปฏิบัติ", count: 8 },
  { id: "kc-system", icon: "settings", iconTone: "text-zinc-500", label: "ระบบ & การตั้งค่า", count: 6 },
];

export interface FeaturedArticleData {
  id: string;
  icon: "book" | "document" | "play" | "question" | "wrench";
  iconTone: string;
  title: string;
  tag: string;
  tagTone: string;
  author: string;
  dateLabel: string;
  views: string;
}

export const featuredArticles: FeaturedArticleData[] = [
  { id: "fa-1", icon: "book", iconTone: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400", title: "การลงทะเบียนทรัพย์สินใหม่", tag: "เริ่มต้นใช้งาน", tagTone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400", author: "Asset Admin", dateLabel: "10 พ.ค. 2569", views: "1.2K" },
  { id: "fa-2", icon: "document", iconTone: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400", title: "แนวปฏิบัติการจัดสรรทรัพย์สินให้พนักงาน", tag: "การจัดสรร & โอนย้าย", tagTone: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400", author: "Asset Admin", dateLabel: "8 พ.ค. 2569", views: "856" },
  { id: "fa-3", icon: "play", iconTone: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400", title: "วิธีใช้แอป Mobile สำหรับตรวจนับทรัพย์สิน", tag: "การตรวจนับ", tagTone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400", author: "Asset Admin", dateLabel: "5 พ.ค. 2569", views: "642" },
  { id: "fa-4", icon: "question", iconTone: "bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400", title: "FAQ: การคืนและส่งมอบทรัพย์สิน", tag: "คำถามที่พบบ่อย", tagTone: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300", author: "Asset Admin", dateLabel: "3 พ.ค. 2569", views: "521" },
  { id: "fa-5", icon: "wrench", iconTone: "bg-teal-50 text-teal-500 dark:bg-teal-500/10 dark:text-teal-400", title: "แนวทางการบำรุงรักษาอุปกรณ์ IT เบื้องต้น", tag: "การบำรุงรักษา", tagTone: "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400", author: "Asset Admin", dateLabel: "30 เม.ย. 2569", views: "408" },
];

export interface QuickAccessLinkData {
  id: string;
  icon: "book" | "shield" | "clipboard" | "play" | "help";
  title: string;
  subtitle: string;
}

export const knowledgeQuickAccess: QuickAccessLinkData[] = [
  { id: "qa-1", icon: "book", title: "คู่มือการใช้งานระบบ", subtitle: "เริ่มต้นใช้งานและตั้งค่าระบบ" },
  { id: "qa-2", icon: "shield", title: "นโยบายการบริหารทรัพย์สิน", subtitle: "นโยบายและแนวปฏิบัติองค์กร" },
  { id: "qa-3", icon: "clipboard", title: "แบบฟอร์ม & เทมเพลต", subtitle: "ดาวน์โหลดแบบฟอร์มที่ใช้บ่อย" },
  { id: "qa-4", icon: "play", title: "วิธีแก้ปัญหาการใช้งาน", subtitle: "เรียนรู้วิธีแก้ปัญหาด้วยวิดีโอ" },
  { id: "qa-5", icon: "help", title: "ถามผู้ดูแล (Ask Admin)", subtitle: "ส่งคำถามหากยังหาคำตอบไม่พบ" },
];

export interface PopularArticleData {
  id: string;
  rank: number;
  title: string;
  views: string;
}

export const popularArticles: PopularArticleData[] = [
  { id: "pa-1", rank: 1, title: "การตรวจนับทรัพย์สินประจำปี", views: "2.1K" },
  { id: "pa-2", rank: 2, title: "ขั้นตอนการโอนย้ายทรัพย์สิน", views: "1.8K" },
  { id: "pa-3", rank: 3, title: "การจัดการ Warranty และการเคลม", views: "1.3K" },
  { id: "pa-4", rank: 4, title: "การสร้างรายงานขั้นสูง", views: "1.1K" },
  { id: "pa-5", rank: 5, title: "การตั้งค่าประเภททรัพย์สิน", views: "982" },
];

export interface RecentArticleData {
  id: string;
  title: string;
  dateLabel: string;
}

export const recentArticles: RecentArticleData[] = [
  { id: "ra-1", title: "การเชื่อมต่อเครื่องพิมพ์บาร์โค้ด", dateLabel: "10 พ.ค. 2569" },
  { id: "ra-2", title: "วิธีอัปโหลดเอกสารประกอบทรัพย์สิน", dateLabel: "9 พ.ค. 2569" },
  { id: "ra-3", title: "แนวทางการจัดเก็บทรัพย์สินไม่ใช้งาน", dateLabel: "8 พ.ค. 2569" },
];

// Asset Detail (/asset-intelligence/assets/all/[assetId]) moved off mock
// data on 2026-08-26, same day as the List page — it now reads a single
// real row via `getAsset()` in services/asset-list-api.ts. The old mock
// record (assetDetail) and its Lifecycle/Documents/Activity-history arrays
// were removed rather than kept as dead exports: `GET .../assets/{assetId}`
// only returns the same fields as a List row, so those sections now render
// an explicit "not available" state (DetailSectionUnavailable.tsx) instead
// of fabricated content for whichever asset was actually clicked.
