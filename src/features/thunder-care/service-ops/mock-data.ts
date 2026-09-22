// ข้อมูลจำลองสำหรับ Service Operator persona ของ Thunder Care Provider Side —
// ผังหน้าจอที่ผู้ใช้ส่งมา 2569-09-08 (หน้าหลัก, Triage, เคสจากลูกค้า, ติดตามเคส,
// คลังความรู้). แทนที่ "Customer Health" placeholder เดิมทั้งหมด. R&D เท่านั้น
// ยังไม่มี backend จริง ทุกฟิลด์เป็น mock ล้วน
//
// แต่ละหน้ามี mock array ของตัวเอง (ไม่ได้รวมเป็น single source of truth
// เดียวกัน) เพราะต้นแบบ (ผังหน้าจอ 4 หน้าที่ผู้ใช้ส่งมาแยกกัน) เองก็ไม่ได้
// สอดคล้องกัน 100% ข้ามหน้า — เช่น TC-20518 เป็น "ยังไม่ได้จัดการ" ในผัง
// เคสจากลูกค้า แต่เป็น "กำลังเดินทาง" ในผังติดตามเคส (คนละภาพตัวอย่าง คนละ
// จุดเวลา ไม่ใช่ snapshot เดียวกัน) — ทำ array รวมเดียวแล้วบังคับให้ตรงกันทุก
// หน้าจะยิ่งบิดเบือนต้นแบบมากกว่าคงความคลาดเคลื่อนแบบนี้ไว้ตามที่เป็น
//
// `issueStatusBadge` ใน status-colors.ts ยังใช้อยู่ (ReportsPage/WorkQueuePage,
// นอกขอบเขตรอบนี้) — ไม่แตะ. `CustomerRow`/`mockCustomers`/`CustomersPage.tsx`
// เดิม (English health-score placeholder) ถูกลบไปแล้ว 2569-09-08 — แทนที่
// ด้วย thunder-care/dispatch's CustomersPage (CRM เต็มรูปแบบ, persona
// Dispatcher) ตามที่ผู้ใช้ตัดสินใจไว้.

// ===== ฟิลด์ร่วมของทุกหน้า Service Operator ที่แสดงรายการเคส =====

export type CasePriority = "high" | "medium" | "low";
export type CaseChannel = "web" | "line" | "phone" | "email";
export type SlaRisk = "ok" | "warning" | "overdue";

export interface ServiceCase {
  id: string; // Ticket ID เช่น "TC-20518"
  title: string; // เรื่อง/ปัญหา
  customerName: string;
  branchLabel: string; // สาขา/พื้นที่ เช่น "Marketing Area ชั้น 2"
  assetTag: string; // เช่น "AC-021"
  assetLabel: string; // เช่น "Daikin Cassette"
  reportedAtLabel: string; // "23 ส.ค. 2569 09:15"
  priority: CasePriority;
  slaRemainingLabel: string; // "เหลือ 3 ชม. 15 นาที" หรือ "เกิน SLA 1 ชม."
  slaRisk: SlaRisk;
  channel: CaseChannel;
}

export const CHANNEL_LABEL: Record<CaseChannel, string> = {
  web: "Web Portal",
  line: "LINE OA",
  phone: "Phone",
  email: "Email",
};

// ===== หน้าหลัก (ServiceOpsPage) =====

// เคสที่รอ Triage วันนี้ — ตรงกับตารางในผังหน้าจอ "เคสเข้าใหม่ (รอ Triage)"
export const pendingTriageCases: ServiceCase[] = [
  {
    id: "TC-20518",
    title: "แอร์เสีย / ไม่เย็น",
    customerName: "ABC Company",
    branchLabel: "Marketing Area ชั้น 2",
    assetTag: "AC-021",
    assetLabel: "Daikin Cassette",
    reportedAtLabel: "23 ส.ค. 2569 09:15",
    priority: "high",
    slaRemainingLabel: "เหลือ 3 ชม. 15 นาที",
    slaRisk: "ok",
    channel: "web",
  },
  {
    id: "TC-20517",
    title: "Display เปิดไม่ได้ (จอ Lobby)",
    customerName: "XYZ Hotel",
    branchLabel: "Lobby ชั้น 1",
    assetTag: "DIS-045",
    assetLabel: "LED Display",
    reportedAtLabel: "23 ส.ค. 2569 09:12",
    priority: "medium",
    slaRemainingLabel: "เหลือ 7 ชม. 12 นาที",
    slaRisk: "ok",
    channel: "line",
  },
  {
    id: "TC-20516",
    title: "Internet ใช้ไม่ได้ (WiFi หลุดบ่อย)",
    customerName: "DEF Company",
    branchLabel: "อาคาร C ชั้น 3",
    assetTag: "AP-003",
    assetLabel: "Access Point",
    reportedAtLabel: "23 ส.ค. 2569 09:05",
    priority: "high",
    slaRemainingLabel: "เหลือ 2 ชม. 1 นาที",
    slaRisk: "warning",
    channel: "phone",
  },
  {
    id: "TC-20515",
    title: "Printer พิมพ์ไม่ออก",
    customerName: "GHI Co., Ltd.",
    branchLabel: "Finance Dept.",
    assetTag: "PRN-012",
    assetLabel: "Canon LBP6030",
    reportedAtLabel: "23 ส.ค. 2569 08:58",
    priority: "low",
    slaRemainingLabel: "เหลือ 22 ชม. 58 นาที",
    slaRisk: "ok",
    channel: "email",
  },
  {
    id: "TC-20514",
    title: "ไฟฟ้าดับเป็นระยะ",
    customerName: "JKL Company",
    branchLabel: "อาคาร B ชั้น 2",
    assetTag: "ELE-009",
    assetLabel: "Lighting Panel",
    reportedAtLabel: "23 ส.ค. 2569 08:50",
    priority: "medium",
    slaRemainingLabel: "เหลือ 6 ชม. 50 นาที",
    slaRisk: "ok",
    channel: "web",
  },
];

export interface DashboardStat {
  id: string;
  label: string;
  value: number;
  sublabel: string;
  color: "zinc" | "amber" | "red" | "indigo" | "emerald";
}

export const dashboardStats: DashboardStat[] = [
  { id: "new", label: "เคสเข้าใหม่", value: 18, sublabel: "วันนี้ 18 รายการ", color: "indigo" },
  { id: "pending-triage", label: "รอ Triage", value: 10, sublabel: "เกิน SLA 2 รายการ", color: "amber" },
  { id: "waiting-info", label: "รอข้อมูลลูกค้า", value: 3, sublabel: "เกิน SLA 1 รายการ", color: "zinc" },
  { id: "sla-risk", label: "ใกล้/เกิน SLA", value: 5, sublabel: "เกิน SLA 2 รายการ", color: "red" },
  { id: "done-today", label: "เสร็จวันนี้", value: 12, sublabel: "ปิดแล้ว 9 รายการ", color: "emerald" },
];

export interface SlaRiskRow {
  id: string;
  customerName: string;
  issueLabel: string; // "แอร์เสียไม่เย็น (AC-021)"
  risk: "overdue" | "warning";
  riskLabel: string; // "เกิน SLA 1 ชม." หรือ "ใกล้เกิน SLA"
  timeLabel: string; // "00:45"
  deltaLabel: string; // "เกิน 15 นาที" หรือ "เหลือ 35 นาที"
}

export const slaRiskRows: SlaRiskRow[] = [
  {
    id: "TC-20518",
    customerName: "ABC Company",
    issueLabel: "แอร์เสียไม่เย็น (AC-021)",
    risk: "overdue",
    riskLabel: "เกิน SLA 1 ชม.",
    timeLabel: "00:45",
    deltaLabel: "เกิน 15 นาที",
  },
  {
    id: "TC-20516",
    customerName: "DEF Company",
    issueLabel: "Internet ใช้ไม่ได้",
    risk: "overdue",
    riskLabel: "เกิน SLA",
    timeLabel: "01:10",
    deltaLabel: "เกิน 10 นาที",
  },
  {
    id: "TC-20517",
    customerName: "XYZ Hotel",
    issueLabel: "Display เปิดไม่ได้",
    risk: "warning",
    riskLabel: "ใกล้เกิน SLA",
    timeLabel: "01:25",
    deltaLabel: "เหลือ 35 นาที",
  },
];

export interface WaitingForCustomerRow {
  id: string;
  customerName: string;
  reasonLabel: string; // "ขอรูปถ่ายเพิ่ม"
  waitingDaysLabel: string; // "รอ 1 วัน"
}

export const waitingForCustomerRows: WaitingForCustomerRow[] = [
  { id: "TC-20513", customerName: "GHI Co., Ltd.", reasonLabel: "ขอรูปถ่ายเพิ่ม", waitingDaysLabel: "รอ 1 วัน" },
  { id: "TC-20511", customerName: "ABC Company", reasonLabel: "รอยืนยันเวลานัด", waitingDaysLabel: "รอ 2 วัน" },
  { id: "TC-20509", customerName: "JKL Company", reasonLabel: "รอข้อมูลเพิ่มเติม", waitingDaysLabel: "รอ 3 วัน" },
];

export interface IssueCategorySlice {
  label: string;
  value: number;
  color: string;
}

// สีอิงจากชุดสีที่ใช้อยู่แล้วในโปรเจกต์ (indigo/blue/amber/emerald/zinc)
export const issueCategoryBreakdown: IssueCategorySlice[] = [
  { label: "ระบบปรับอากาศ", value: 6, color: "#6366f1" },
  { label: "เครื่องใช้ไฟฟ้า/Internet", value: 4, color: "#3b82f6" },
  { label: "AV/Display", value: 3, color: "#f59e0b" },
  { label: "เครื่องพิมพ์", value: 2, color: "#10b981" },
  { label: "อื่นๆ", value: 3, color: "#a1a1aa" },
];

export interface ChannelBreakdownRow {
  channel: CaseChannel;
  count: number;
  percent: number;
}

export const channelBreakdown: ChannelBreakdownRow[] = [
  { channel: "web", count: 8, percent: 44 },
  { channel: "line", count: 5, percent: 28 },
  { channel: "phone", count: 3, percent: 17 },
  { channel: "email", count: 2, percent: 11 },
];

export interface AnnouncementRow {
  id: string;
  title: string;
  detail: string;
  dateLabel: string;
}

export const announcements: AnnouncementRow[] = [
  {
    id: "ann-1",
    title: "แจ้งปรับเวลาให้บริการ Support",
    detail: "ทีม Support เปลี่ยนเวลาเป็น 08:00 น. เริ่มตั้งแต่ 25 ส.ค. 2569 เป็นต้นไป",
    dateLabel: "22 ส.ค. 2569",
  },
  {
    id: "ann-2",
    title: "อบรมการใช้งาน Triage",
    detail: "สำหรับ Service Operator ทุกคน วันที่ 26 ส.ค. 2569 เวลา 10:00 น.",
    dateLabel: "21 ส.ค. 2569",
  },
  {
    id: "ann-3",
    title: "อัปเดตคู่มือการบริการ (AC)",
    detail: "เอกสารการตรวจสอบและแก้ไขปัญหาแอร์เวอร์ชันใหม่ พร้อมใช้งานแล้ว",
    dateLabel: "20 ส.ค. 2569",
  },
];

// ===== Triage — ตรวจสอบความครบถ้วน + ฟอร์ม Triage (หลังเลือกเคสจากคิว) =====

export interface CompletenessCheck {
  label: string;
  done: boolean;
}

// ตรวจสอบความครบถ้วนก่อน Triage — ทุกเคส mock ถือว่าครบแล้ว (happy path)
// เพื่อให้โฟกัสอยู่ที่ฟอร์ม Triage เอง; เคสที่ข้อมูลไม่ครบจะย้อนกลับไป
// "รอข้อมูลจากลูกค้า" ตามผังงาน ไม่ได้เข้ามาที่คิว Triage นี้
export const completenessChecklist: CompletenessCheck[] = [
  { label: "ข้อมูลลูกค้า", done: true },
  { label: "Asset / รหัสเครื่อง", done: true },
  { label: "รูปภาพ/หลักฐาน", done: true },
  { label: "สิทธิ์บริการ / SLA", done: true },
];

export const SERVICE_CATEGORY_OPTIONS = ["Facility", "IT / Network", "AV / Display", "อื่นๆ"];
export const SERVICE_TYPE_OPTIONS: Record<string, string[]> = {
  Facility: ["Air Conditioner", "Lighting", "Plumbing"],
  "IT / Network": ["Network / WiFi", "Printer", "Computer"],
  "AV / Display": ["Display / Monitor", "Projector", "Sound System"],
  อื่นๆ: ["อื่นๆ"],
};
export const ISSUE_CATEGORY_OPTIONS = ["Not Cooling / ไม่เย็น", "ไม่ทำงานเลย", "เสียงดังผิดปกติ", "รั่วซึม", "อื่นๆ"];
export const COMPLEXITY_OPTIONS = ["ง่าย", "ปานกลาง", "ซับซ้อน"];
export const RECOMMENDED_ACTION_OPTIONS = ["Onsite Service", "Remote / โทรแนะนำ", "ส่งต่อ Vendor"];

// เคสในคิว Triage เต็ม (หน้า "Triage" — ผังหน้าจอที่ 2 ที่ผู้ใช้ส่งมา) — ชุด
// ใหญ่กว่า pendingTriageCases ของหน้าหลัก (ซึ่งโชว์แค่ 5 แถวแรกแบบย่อ)
export const triageQueueCases: ServiceCase[] = [
  ...pendingTriageCases,
  {
    id: "TC-20519",
    title: "คอมพิวเตอร์เปิดไม่ติด",
    customerName: "GHI Co., Ltd.",
    branchLabel: "Finance Dept.",
    assetTag: "PC-12",
    assetLabel: "Dell OptiPlex 7080",
    reportedAtLabel: "23 ส.ค. 2569 09:02",
    priority: "medium",
    slaRemainingLabel: "เหลือ 6 ชม. 02 นาที",
    slaRisk: "ok",
    channel: "email",
  },
  {
    id: "TC-20520",
    title: "เครื่องปรินท์เตอร์กระดาษติด",
    customerName: "JKL Company",
    branchLabel: "อาคาร B ชั้น 2",
    assetTag: "PRN-021",
    assetLabel: "Canon LBP6030",
    reportedAtLabel: "23 ส.ค. 2569 08:58",
    priority: "low",
    slaRemainingLabel: "เหลือ 22 ชม. 58 นาที",
    slaRisk: "ok",
    channel: "web",
  },
  {
    id: "TC-20521",
    title: "กล้องวงจรปิดภาพไม่ชัด",
    customerName: "MNO Company",
    branchLabel: "หน้าประตู",
    assetTag: "CAM-07",
    assetLabel: "Hikvision Dome",
    reportedAtLabel: "23 ส.ค. 2569 08:45",
    priority: "medium",
    slaRemainingLabel: "เหลือ 6 ชม. 45 นาที",
    slaRisk: "ok",
    channel: "line",
  },
  {
    id: "TC-20522",
    title: "ไฟไม่ติดบางจุด",
    customerName: "PQR Company",
    branchLabel: "อาคาร B ชั้น 2",
    assetTag: "ELE-009",
    assetLabel: "Lighting Panel",
    reportedAtLabel: "23 ส.ค. 2569 08:30",
    priority: "low",
    slaRemainingLabel: "เหลือ 46 ชม. 20 นาที",
    slaRisk: "ok",
    channel: "phone",
  },
  {
    id: "TC-20524",
    title: "โปรเจคเตอร์สีเพี้ยน",
    customerName: "STU Company",
    branchLabel: "สำนักงานใหญ่",
    assetTag: "PJ-02",
    assetLabel: "Epson EB-X51",
    reportedAtLabel: "23 ส.ค. 2569 08:10",
    priority: "low",
    slaRemainingLabel: "เหลือ 70 ชม. 10 นาที",
    slaRisk: "ok",
    channel: "web",
  },
  {
    id: "TC-20525",
    title: "Tablet ชาร์จไม่เข้า",
    customerName: "YZA Company",
    branchLabel: "Sales Dept.",
    assetTag: "TAB-05",
    assetLabel: "iPad Gen 9",
    reportedAtLabel: "23 ส.ค. 2569 08:05",
    priority: "low",
    slaRemainingLabel: "เหลือ 22 ชม. 05 นาที",
    slaRisk: "ok",
    channel: "email",
  },
];

// ===== เคสจากลูกค้า (CasesInboxPage) =====

export type InboxStatus = "unhandled" | "pending_triage" | "waiting_customer";

export interface InboxCase extends ServiceCase {
  status: InboxStatus;
}

export const INBOX_STATUS_LABEL: Record<InboxStatus, string> = {
  unhandled: "ยังไม่ได้จัดการ",
  pending_triage: "รอ Triage",
  waiting_customer: "รอข้อมูลลูกค้า",
};

export const inboxCases: InboxCase[] = [
  { ...pendingTriageCases[0], status: "unhandled" },
  { ...pendingTriageCases[1], status: "unhandled" },
  { ...pendingTriageCases[2], status: "unhandled" },
  { ...pendingTriageCases[3], status: "pending_triage" },
  { ...pendingTriageCases[4], status: "waiting_customer" },
  {
    id: "TC-20513",
    title: "กล้องวงจรปิดภาพไม่ชัด",
    customerName: "MNO Company",
    branchLabel: "หน้าประตู",
    assetTag: "CAM-07",
    assetLabel: "Hikvision Dome",
    reportedAtLabel: "23 ส.ค. 2569 08:45",
    priority: "medium",
    slaRemainingLabel: "เหลือ 6 ชม. 45 นาที",
    slaRisk: "ok",
    channel: "line",
    status: "waiting_customer",
  },
  {
    id: "TC-20512",
    title: "ประตูอัตโนมัติเปิดไม่ได้",
    customerName: "PQR Company",
    branchLabel: "อาคาร A ชั้น 1",
    assetTag: "DL-02",
    assetLabel: "Digital Door Lock",
    reportedAtLabel: "23 ส.ค. 2569 08:30",
    priority: "low",
    slaRemainingLabel: "เหลือ 46 ชม. 30 นาที",
    slaRisk: "ok",
    channel: "phone",
    status: "pending_triage",
  },
  {
    id: "TC-20511",
    title: "เสียงก้องในห้องประชุม",
    customerName: "STU Company",
    branchLabel: "ห้องประชุม 1",
    assetTag: "SPK-11",
    assetLabel: "TOA Speaker",
    reportedAtLabel: "23 ส.ค. 2569 08:20",
    priority: "low",
    slaRemainingLabel: "เหลือ 46 ชม. 20 นาที",
    slaRisk: "ok",
    channel: "web",
    status: "unhandled",
  },
];

export interface CaseDetail {
  description: string;
  attachmentCount: number;
  activity: { actor: string; action: string; atLabel: string }[];
}

// รายละเอียดเพิ่มเติมสำหรับ panel ด้านขวา — mock เฉพาะเคสที่ถูกเลือกดูตัวอย่าง
// ได้จริงในผังหน้าจอ (TC-20518) เคสอื่นใช้ placeholder ทั่วไปแทน
export const caseDetailById: Record<string, CaseDetail> = {
  "TC-20518": {
    description: "แอร์ไม่เย็น อุณหภูมิตั้งไว้ประมาณ 30°C เปิดแล้ว 10 นาที",
    attachmentCount: 2,
    activity: [
      { actor: "ระบบ", action: "สร้างจากช่องทาง Web Portal", atLabel: "23 ส.ค. 2569 09:15" },
      { actor: "ลูกค้า (ABC Staff)", action: "แจ้งปัญหา", atLabel: "23 ส.ค. 2569 09:12" },
    ],
  },
};

const DEFAULT_CASE_DETAIL: CaseDetail = {
  description: "รอรายละเอียดเพิ่มเติมจากลูกค้า",
  attachmentCount: 0,
  activity: [{ actor: "ระบบ", action: "สร้างเคสจากช่องทางที่แจ้งเข้ามา", atLabel: "-" }],
};

export function getCaseDetail(caseId: string): CaseDetail {
  return caseDetailById[caseId] ?? DEFAULT_CASE_DETAIL;
}

// ===== ติดตามเคส (CaseTrackingPage) =====

export type TrackingStatus = "in_progress" | "on_the_way" | "waiting_appointment" | "waiting_parts" | "closed";

export const TRACKING_STATUS_LABEL: Record<TrackingStatus, string> = {
  in_progress: "กำลังดำเนินการ",
  on_the_way: "กำลังเดินทาง",
  waiting_appointment: "รอนัดหมาย",
  waiting_parts: "รอชิ้นส่วน",
  closed: "ปิดแล้ว",
};

export const TRACKING_STATUS_COLOR: Record<TrackingStatus, "blue" | "yellow" | "indigo" | "zinc" | "green"> = {
  in_progress: "blue",
  on_the_way: "yellow",
  waiting_appointment: "indigo",
  waiting_parts: "yellow",
  closed: "green",
};

export interface Assignee {
  name: string;
  role: "Service Operator" | "Dispatcher" | "Technician";
}

export interface TrackingRow extends ServiceCase {
  status: TrackingStatus;
  updatedAtLabel: string; // "23 ส.ค. 2569 10:20"
  assignee: Assignee;
}

const somchai: Assignee = { name: "สมชาย ต.", role: "Technician" };
const orathai: Assignee = { name: "อรทัย ก.", role: "Dispatcher" };

export const trackingRows: TrackingRow[] = [
  {
    id: "TC-20516",
    title: "Internet ใช้ไม่ได้",
    customerName: "DEF Company",
    branchLabel: "อาคาร C ชั้น 3",
    assetTag: "AP-003",
    assetLabel: "Access Point",
    reportedAtLabel: "23 ส.ค. 2569 09:05",
    priority: "high",
    slaRemainingLabel: "เหลือ 1 ชม. 05 นาที",
    slaRisk: "warning",
    channel: "phone",
    status: "in_progress",
    updatedAtLabel: "23 ส.ค. 2569 10:20",
    assignee: somchai,
  },
  {
    id: "TC-20517",
    title: "Display เปิดไม่ได้",
    customerName: "XYZ Hotel",
    branchLabel: "Lobby ชั้น 1",
    assetTag: "DIS-045",
    assetLabel: "LED Display P2",
    reportedAtLabel: "23 ส.ค. 2569 09:12",
    priority: "medium",
    slaRemainingLabel: "เหลือ 7 ชม. 12 นาที",
    slaRisk: "ok",
    channel: "line",
    status: "waiting_appointment",
    updatedAtLabel: "23 ส.ค. 2569 09:50",
    assignee: orathai,
  },
  {
    id: "TC-20515",
    title: "Printer พิมพ์ไม่ออก",
    customerName: "GHI Co., Ltd.",
    branchLabel: "Finance Dept.",
    assetTag: "PRN-012",
    assetLabel: "Canon LBP6030",
    reportedAtLabel: "23 ส.ค. 2569 08:58",
    priority: "low",
    slaRemainingLabel: "เหลือ 22 ชม. 58 นาที",
    slaRisk: "ok",
    channel: "email",
    status: "waiting_parts",
    updatedAtLabel: "23 ส.ค. 2569 09:20",
    assignee: somchai,
  },
  {
    id: "TC-20518",
    title: "แอร์เสียไม่เย็น",
    customerName: "ABC Company",
    branchLabel: "Marketing Area ชั้น 2",
    assetTag: "AC-021",
    assetLabel: "Daikin Cassette",
    reportedAtLabel: "23 ส.ค. 2569 08:45",
    priority: "high",
    slaRemainingLabel: "เหลือ 3 ชม. 15 นาที",
    slaRisk: "ok",
    channel: "web",
    status: "on_the_way",
    updatedAtLabel: "23 ส.ค. 2569 10:20",
    assignee: somchai,
  },
  {
    id: "TC-20511",
    title: "กล้องวงจรปิดภาพไม่ชัด",
    customerName: "MNO Company",
    branchLabel: "หน้าประตู",
    assetTag: "CAM-07",
    assetLabel: "Hikvision Dome",
    reportedAtLabel: "23 ส.ค. 2569 08:30",
    priority: "medium",
    slaRemainingLabel: "เหลือ 6 ชม. 45 นาที",
    slaRisk: "ok",
    channel: "line",
    status: "in_progress",
    updatedAtLabel: "23 ส.ค. 2569 08:30",
    assignee: somchai,
  },
  {
    id: "TC-20520",
    title: "เครื่องปรินท์เตอร์กระดาษติด",
    customerName: "JKL Company",
    branchLabel: "อาคาร B ชั้น 2",
    assetTag: "PRN-021",
    assetLabel: "Canon LBP6030",
    reportedAtLabel: "23 ส.ค. 2569 07:55",
    priority: "low",
    slaRemainingLabel: "เหลือ 22 ชม. 05 นาที",
    slaRisk: "ok",
    channel: "web",
    status: "waiting_appointment",
    updatedAtLabel: "23 ส.ค. 2569 07:55",
    assignee: orathai,
  },
  {
    id: "TC-20513",
    title: "ไฟไม่ติดบางจุด",
    customerName: "PQR Company",
    branchLabel: "อาคาร B ชั้น 2",
    assetTag: "ELE-009",
    assetLabel: "Lighting Panel",
    reportedAtLabel: "23 ส.ค. 2569 07:20",
    priority: "low",
    slaRemainingLabel: "เหลือ 46 ชม. 10 นาที",
    slaRisk: "ok",
    channel: "phone",
    status: "waiting_appointment",
    updatedAtLabel: "23 ส.ค. 2569 07:20",
    assignee: orathai,
  },
  {
    id: "TC-20522",
    title: "Tablet ชาร์จไม่เข้า",
    customerName: "YZA Company",
    branchLabel: "Sales Dept.",
    assetTag: "TAB-05",
    assetLabel: "iPad Gen 9",
    reportedAtLabel: "23 ส.ค. 2569 07:10",
    priority: "low",
    slaRemainingLabel: "เหลือ 21 ชม. 40 นาที",
    slaRisk: "ok",
    channel: "email",
    status: "waiting_appointment",
    updatedAtLabel: "23 ส.ค. 2569 07:10",
    assignee: orathai,
  },
  {
    id: "TC-20509",
    title: "ระบบแจ้งเตือนไม่ทำงาน",
    customerName: "STU Company",
    branchLabel: "ห้องประชุม 1",
    assetTag: "SPK-11",
    assetLabel: "TOA Speaker",
    reportedAtLabel: "23 ส.ค. 2569 06:50",
    priority: "low",
    slaRemainingLabel: "เหลือ 46 ชม. 20 นาที",
    slaRisk: "ok",
    channel: "web",
    status: "waiting_appointment",
    updatedAtLabel: "23 ส.ค. 2569 06:50",
    assignee: orathai,
  },
  {
    id: "TC-20506",
    title: "ประตูอัตโนมัติล็อค error",
    customerName: "BCD Company",
    branchLabel: "อาคาร A ชั้น 1",
    assetTag: "DL-02",
    assetLabel: "Digital Door Lock",
    reportedAtLabel: "23 ส.ค. 2569 06:30",
    priority: "low",
    slaRemainingLabel: "เหลือ 45 ชม. 10 นาที",
    slaRisk: "ok",
    channel: "phone",
    status: "waiting_appointment",
    updatedAtLabel: "23 ส.ค. 2569 06:30",
    assignee: orathai,
  },
];

export interface TimelineStep {
  label: string;
  done: boolean;
  atLabel?: string;
  byLabel?: string; // "โดย ณัฐวุฒิ ส. (Service Operator)"
  extra?: string; // เช่น "WO-30516"
}

// Timeline เฉพาะเคสที่ผังหน้าจอโชว์ตัวอย่างไว้ (TC-20516) เคสอื่นใช้
// placeholder ทั่วไปแทน (ดู getCaseTimeline)
export const trackingTimelineById: Record<string, TimelineStep[]> = {
  "TC-20516": [
    { label: "รับเรื่องจากลูกค้า", done: true, atLabel: "23 ส.ค. 2569 09:05", byLabel: "ณัฐวุฒิ ส. (Service Operator)" },
    { label: "Triage เรียบร้อย", done: true, atLabel: "23 ส.ค. 2569 09:10", byLabel: "ณัฐวุฒิ ส. (Service Operator)" },
    {
      label: "สร้าง Work Order",
      done: true,
      atLabel: "23 ส.ค. 2569 09:12",
      byLabel: "อรทัย ก. (Dispatcher)",
      extra: "WO-30516",
    },
    { label: "ช่างเดินทาง", done: false, atLabel: "23 ส.ค. 2569 09:15", byLabel: "สมชาย ต. (Technician)" },
    { label: "กำลังดำเนินการ", done: false, atLabel: "23 ส.ค. 2569 10:20", extra: "กำลังตรวจสอบสาเหตุ" },
  ],
};

const DEFAULT_TIMELINE: TimelineStep[] = [
  { label: "รับเรื่องจากลูกค้า", done: true, byLabel: "ณัฐวุฒิ ส. (Service Operator)" },
  { label: "Triage เรียบร้อย", done: true, byLabel: "ณัฐวุฒิ ส. (Service Operator)" },
  { label: "สร้าง Work Order", done: false },
];

export function getCaseTimeline(caseId: string): TimelineStep[] {
  return trackingTimelineById[caseId] ?? DEFAULT_TIMELINE;
}

// ===== คลังความรู้ (KnowledgeBasePage) =====

export interface KnowledgeCategory {
  id: string;
  label: string;
  articleCount: number;
}

export const knowledgeCategories: KnowledgeCategory[] = [
  { id: "manuals", label: "คู่มืออุปกรณ์", articleCount: 128 },
  { id: "troubleshooting", label: "การแก้ไขปัญหา (Troubleshooting)", articleCount: 216 },
  { id: "practices", label: "แนวปฏิบัติการให้บริการ", articleCount: 64 },
  { id: "policy", label: "นโยบายและมาตรฐาน", articleCount: 48 },
  { id: "training", label: "การอบรมและทักษะ", articleCount: 32 },
  { id: "archive", label: "คลังเอกสาร", articleCount: 56 },
];

export interface FeaturedArticle {
  id: string;
  title: string;
  categoryId: string;
  viewsLabel: string; // "2.1K"
  dateLabel: string;
}

export const featuredArticles: FeaturedArticle[] = [
  { id: "feat-1", title: "คู่มือการใช้งานแอร์ Daikin Cassette รุ่น FCNQ Series", categoryId: "manuals", viewsLabel: "2.1K", dateLabel: "15 ส.ค. 2569" },
  {
    id: "feat-2",
    title: "อินเทอร์เน็ตใช้งานไม่ได้ ไม่มีสัญญาณ (ขั้นตอนการตรวจสอบเบื้องต้น)",
    categoryId: "troubleshooting",
    viewsLabel: "1.8K",
    dateLabel: "12 ส.ค. 2569",
  },
  {
    id: "feat-3",
    title: "ขั้นตอนการสร้าง Work Order และการส่งต่อให้ Dispatcher",
    categoryId: "practices",
    viewsLabel: "1.3K",
    dateLabel: "10 ส.ค. 2569",
  },
  {
    id: "feat-4",
    title: "มาตรฐานการให้บริการ Thunder Care (Service Standard v2.0)",
    categoryId: "policy",
    viewsLabel: "960",
    dateLabel: "8 ส.ค. 2569",
  },
];

export interface PopularArticle {
  id: string;
  title: string;
  categoryId: string;
  viewsLabel: string;
  dateLabel: string;
}

export const popularArticles: PopularArticle[] = [
  { id: "pop-1", title: "วิธีเคลียร์ / ล้างฟิลเตอร์เครื่องปรับอากาศเบื้องต้น", categoryId: "troubleshooting", viewsLabel: "3.2K", dateLabel: "5 ส.ค. 2569" },
  { id: "pop-2", title: "การตรวจเช็คและทำความสะอาดเครื่องเบื้องต้น", categoryId: "manuals", viewsLabel: "2.7K", dateLabel: "1 ส.ค. 2569" },
  { id: "pop-3", title: "ขั้นตอนการปิดเคส (Case Closure) และการบันทึกผลลัพธ์", categoryId: "practices", viewsLabel: "2.5K", dateLabel: "29 ก.ค. 2569" },
  { id: "pop-4", title: "รหัส Error Code ของแอร์ (F, H, U, J Series)", categoryId: "manuals", viewsLabel: "2.3K", dateLabel: "27 ก.ค. 2569" },
  { id: "pop-5", title: "วิธีเชื่อมต่อ Wi-Fi สำหรับอุปกรณ์ Smart TV", categoryId: "troubleshooting", viewsLabel: "1.9K", dateLabel: "26 ก.ค. 2569" },
];

export interface HowToGuide {
  id: string;
  title: string;
  durationLabel: string; // "04:35"
  dateLabel: string;
  viewsLabel: string;
}

export const howToGuides: HowToGuide[] = [
  { id: "guide-1", title: "วิธีถอดแผงและทำความสะอาดฟิลเตอร์แอร์ Cassette", durationLabel: "04:35", dateLabel: "14 ส.ค. 2569", viewsLabel: "1.4K" },
  { id: "guide-2", title: "การตั้งค่าเราเตอร์ใหม่ (Factory Reset) ทีละขั้นตอน", durationLabel: "03:12", dateLabel: "11 ส.ค. 2569", viewsLabel: "1.2K" },
  { id: "guide-3", title: "การบันทึกข้อมูลการสนทนากับลูกค้าอย่างมีประสิทธิภาพ", durationLabel: "02:58", dateLabel: "9 ส.ค. 2569", viewsLabel: "980" },
];

export interface KnowledgeQuickLink {
  label: string;
}

export const knowledgeQuickLinks: KnowledgeQuickLink[] = [
  { label: "Search by Asset/Model" },
  { label: "Service Manual Portal" },
  { label: "Firmware & Software" },
  { label: "SLA & Policy Portal" },
  { label: "แบบฟอร์มและเอกสาร" },
];

export interface KnowledgeUpdateRow {
  id: string;
  title: string;
  categoryId: string;
  dateLabel: string;
}

export const knowledgeUpdates: KnowledgeUpdateRow[] = [
  { id: "upd-1", title: "อัปเดตคู่มือแอร์ Daikin FCNQ Series", categoryId: "manuals", dateLabel: "23 ส.ค. 2569" },
  { id: "upd-2", title: "อัปเดตขั้นตอนการสร้าง Work Order v1.2", categoryId: "practices", dateLabel: "22 ส.ค. 2569" },
  { id: "upd-3", title: "เพิ่มรหัส Error Code ใหม่ (R32)", categoryId: "manuals", dateLabel: "21 ส.ค. 2569" },
];
