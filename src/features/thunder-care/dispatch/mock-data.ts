// ข้อมูลจำลองสำหรับ Dispatcher persona ของ Thunder Care Provider Side — ผัง
// หน้าจอที่ผู้ใช้ส่งมา 2569-09-08 (หน้าหลัก, งานรอจัดสรร, งานที่กำลังดำเนินการ,
// งานที่เสร็จสิ้น, ช่าง/ทีมของฉัน, ตารางงาน, แผนที่งาน, ลูกค้า, คลังอะไหล่/
// อุปกรณ์). R&D เท่านั้น ยังไม่มี backend จริง ทุกฟิลด์เป็น mock ล้วน — แต่ละ
// หน้ามี mock array ของตัวเอง (เหมือน thunder-care/service-ops) เพราะต้นแบบ
// (ผังหน้าจอหลายภาพ) เองก็ไม่ได้สอดคล้องกัน 100% ข้ามหน้า.
//
// "Asset" ในผังหน้าจอทุกหน้าไม่ได้สร้างใหม่ — เป็นหน้า Asset Intelligence ที่
// มีอยู่แล้ว (`/asset-intelligence/assets`, breadcrumb ในผังเขียน "ASSET
// WORKSPACE" ไม่ใช่ "CARE PROVIDER" ชัดเจน) ลิงก์ตรงไปเลยแทนที่จะสร้างซ้ำ.
// "คลังความรู้" ใช้หน้าเดิมที่สร้างให้ Service Operator ไปแล้ว
// (`thunder-care/service-ops`'s KnowledgeBasePage) ไม่ได้สร้างใหม่ แม้ผัง
// หน้าจอที่ส่งมาจะโชว์เนื้อหาคนละชุด (role มุมขวาในภาพนั้นเป็น "Customer
// Service Coordinator" ไม่ใช่ "Dispatcher" ด้วย — น่าจะเป็นคนละฉบับร่าง).

export type Priority = "urgent" | "normal" | "low";

export const PRIORITY_LABEL: Record<Priority, string> = {
  urgent: "เร่งด่วน",
  normal: "ปานกลาง",
  low: "ต่ำ",
};

// ===== หน้าหลัก Dispatcher =====

export interface DispatcherStat {
  id: string;
  label: string;
  value: number;
  sublabel: string;
  color: "zinc" | "amber" | "red" | "indigo" | "emerald" | "blue";
}

export const dispatcherStats: DispatcherStat[] = [
  { id: "assigned-today", label: "งานที่มอบหมายวันนี้", value: 42, sublabel: "เพิ่มขึ้นจากเมื่อวาน 12%", color: "indigo" },
  { id: "unassigned", label: "งานรอจัดสรร", value: 18, sublabel: "เกิน SLA 2 รายการ", color: "amber" },
  { id: "in-progress", label: "งานที่กำลังดำเนินการ", value: 23, sublabel: "Onsite 16 | Remote 7", color: "blue" },
  { id: "completed", label: "งานที่เสร็จสิ้น", value: 12, sublabel: "ปิดแล้ว 10 | ยืนยันแล้ว 2", color: "emerald" },
  { id: "sla-risk", label: "งานเสี่ยง SLA", value: 5, sublabel: "ใกล้เกิน SLA 3 รายการ", color: "red" },
  { id: "techs-available", label: "ช่าง/ทีมพร้อมใช้งาน", value: 23, sublabel: "ทั้งหมด 32 คน", color: "zinc" },
];

export interface UnassignedSummaryRow {
  id: string; // Ticket ID
  title: string;
  customerName: string;
  branchLabel: string;
  priority: Priority;
  slaRemainingLabel: string;
  reportedAtLabel: string; // เวลาเท่านั้น เช่น "09:15"
}

export const dashboardUnassignedRows: UnassignedSummaryRow[] = [
  { id: "TC-20518", title: "แอร์ไม่เย็น", customerName: "ABC Company", branchLabel: "Marketing Area ชั้น 2", priority: "urgent", slaRemainingLabel: "เหลือ 2:15 ชม.", reportedAtLabel: "09:15" },
  { id: "TC-20527", title: "ไฟไม่ติดบางจุด", customerName: "GHI Co., Ltd.", branchLabel: "อาคาร C ชั้น 3", priority: "normal", slaRemainingLabel: "เหลือ 4:30 ชม.", reportedAtLabel: "10:20" },
  { id: "TC-20528", title: "เสียงดังลิฟต์มา", customerName: "XYZ Hotel", branchLabel: "Lobby ชั้น 1", priority: "normal", slaRemainingLabel: "เหลือ 5:10 ชม.", reportedAtLabel: "10:28" },
  { id: "TC-20531", title: "Printer ไม่เชื่อมต่อ", customerName: "DEF Company", branchLabel: "Accounting", priority: "low", slaRemainingLabel: "เหลือ 10:45 ชม.", reportedAtLabel: "11:02" },
  { id: "TC-20534", title: "อินเทอร์เน็ตช้า", customerName: "MNO Company", branchLabel: "ห้องประชุม 2", priority: "low", slaRemainingLabel: "เหลือ 11:30 ชม.", reportedAtLabel: "11:15" },
];

export interface WorkStatusSlice {
  label: string;
  value: number;
  color: string;
}

export const workStatusBreakdown: WorkStatusSlice[] = [
  { label: "รอจัดสรร", value: 18, color: "#f59e0b" },
  { label: "กำลังดำเนินการ", value: 23, color: "#3b82f6" },
  { label: "เสร็จแล้ว", value: 12, color: "#10b981" },
  { label: "ยกเลิก", value: 2, color: "#a1a1aa" },
];

export interface SlaRiskSummary {
  id: string;
  title: string;
  slaLabel: string;
}

export const dashboardSlaRisk: SlaRiskSummary[] = [
  { id: "TC-20518", title: "แอร์ไม่เย็น", slaLabel: "เหลือ 2:15 ชม." },
  { id: "TC-20527", title: "ไฟไม่ติดบางจุด", slaLabel: "เหลือ 4:30 ชม." },
  { id: "TC-20528", title: "เสียงดังลิฟต์มา", slaLabel: "เหลือ 5:10 ชม." },
  { id: "TC-20516", title: "Wi-Fi หลุดบ่อย", slaLabel: "ใกล้เกิน SLA 20 นาที" },
  { id: "TC-20510", title: "กล้องไม่แสดงภาพ", slaLabel: "ใกล้เกิน SLA 1 ชม." },
];

export interface InProgressSummaryRow {
  woId: string;
  ticketId: string;
  title: string;
  customerName: string;
  assignee: string;
  status: string; // เช่น "Onsite", "กำลังเดินทาง", "Remote"
  appointmentLabel: string;
}

export const dashboardInProgressRows: InProgressSummaryRow[] = [
  { woId: "WO-30516", ticketId: "TC-20512", title: "ทิพย์ Access Point", customerName: "ABC Company", assignee: "สมชาย ต.", status: "Onsite", appointmentLabel: "10:05" },
  { woId: "WO-30517", ticketId: "TC-20512", title: "ตำแอร์ 4 ทิศทาง", customerName: "GHI Co., Ltd.", assignee: "นพพร ต.", status: "กำลังเดินทาง", appointmentLabel: "10:12" },
  { woId: "WO-30518", ticketId: "TC-20513", title: "เปลี่ยนหลอดไฟ LED", customerName: "XYZ Hotel", assignee: "วิชิต น.", status: "Onsite", appointmentLabel: "10:20" },
  { woId: "WO-30519", ticketId: "TC-20514", title: "แก้ปัญหา Network", customerName: "DEF Company", assignee: "ทีม Service A", status: "Remote", appointmentLabel: "09:58" },
  { woId: "WO-30520", ticketId: "TC-20515", title: "ตรวจสอบ UPS", customerName: "MNO Company", assignee: "เอกชัย ค.", status: "Onsite", appointmentLabel: "08:30" },
];

export interface AvailableTechRow {
  name: string;
  isTeam?: boolean;
  mode: "Onsite" | "Remote" | "ว่าง";
  statusLabel: string; // "ใกล้เสร็จ 2 ชม." หรือ "พร้อมทำงาน"
}

export const dashboardAvailableTechs: AvailableTechRow[] = [
  { name: "สมชาย ต.", mode: "Onsite", statusLabel: "ใกล้เสร็จ 2 ชม." },
  { name: "นพพร ก.", mode: "Onsite", statusLabel: "ใกล้เสร็จ 1 ชม." },
  { name: "วิชิต ก.", mode: "ว่าง", statusLabel: "พร้อมทำงาน" },
  { name: "เอกชัย ค.", mode: "Remote", statusLabel: "พร้อมทำงาน" },
  { name: "ทีม Service A", isTeam: true, mode: "ว่าง", statusLabel: "พร้อมทำงาน" },
];

export interface DispatcherAnnouncement {
  id: string;
  kind: "warning" | "info" | "stock";
  title: string;
  detail: string;
  dateLabel: string;
}

export const dispatcherAnnouncements: DispatcherAnnouncement[] = [
  { id: "da-1", kind: "warning", title: "อัปเดตนโยบาย SLA", detail: "นโยบาย SLA ใหม่เริ่มต้นแล้ว ตั้งแต่วันที่ 1 ก.ค. 2569 เป็นต้นไป", dateLabel: "22 ก.ค. 2569 09:30" },
  { id: "da-2", kind: "info", title: "ประกาศระบบ", detail: "ระบบจะปิดปรับปรุงในวันที่ 26 ก.ค. 2569 เวลา 22:00 - 00:00 น.", dateLabel: "21 ก.ค. 2569 17:45" },
  { id: "da-3", kind: "stock", title: "อะไหล่ใกล้หมด", detail: "Air Filter สำหรับ Daikin Cassette รุ่นใหม่เหลือน้อยกว่า 10 ชิ้น", dateLabel: "21 ก.ค. 2569 14:20" },
];

// ===== งานรอจัดสรร (UnassignedQueuePage) =====

export type UnassignedStatus = "pending_triage" | "waiting_info" | "duplicate";

export const UNASSIGNED_STATUS_LABEL: Record<UnassignedStatus, string> = {
  pending_triage: "รอ Triage",
  waiting_info: "รอข้อมูล",
  duplicate: "รอรวมเรื่อง",
};

export interface UnassignedRow {
  id: string; // "INC-2025-0627"
  isNew: boolean; // false = "รับเรื่องซ้ำ" / "รอข้อมูลเพิ่มเติม" แทนป้าย "ใหม่"
  statusTagLabel: string; // "ใหม่" | "รอข้อมูลเพิ่มเติม" | "รับเรื่องซ้ำ"
  issueTitle: string;
  issueCategory: string;
  assetTag: string;
  assetLabel: string;
  locationLabel: string;
  reporterName: string;
  reportedAtLabel: string;
  priority: Priority;
  slaRemainingLabel: string;
  status: UnassignedStatus;
}

export const unassignedRows: UnassignedRow[] = [
  { id: "INC-2025-0627", isNew: true, statusTagLabel: "ใหม่", issueTitle: "แอร์ไม่เย็น", issueCategory: "ระบบปรับอากาศ", assetTag: "AC-021", assetLabel: "แอร์ Samsung Inverter", locationLabel: "Marketing Area ชั้น 2", reporterName: "นัฐพล พ.", reportedAtLabel: "23 ส.ค. 2569 09:15", priority: "urgent", slaRemainingLabel: "เหลือ 3:10 ชม.", status: "pending_triage" },
  { id: "INC-2025-0626", isNew: true, statusTagLabel: "ใหม่", issueTitle: "สัญญาณ Wi-Fi หลุดบ่อย", issueCategory: "เครือข่าย", assetTag: "AP-03", assetLabel: "Access Point", locationLabel: "อาคาร C ชั้น 3", reporterName: "ปรีชา ท.", reportedAtLabel: "23 ส.ค. 2569 09:10", priority: "normal", slaRemainingLabel: "เหลือ 7:20 ชม.", status: "pending_triage" },
  { id: "INC-2025-0625", isNew: true, statusTagLabel: "ใหม่", issueTitle: "คอมพิวเตอร์เปิดไม่ติด", issueCategory: "Hardware", assetTag: "PC-145", assetLabel: "HP ProDesk 600 G6", locationLabel: "Finance Dept.", reporterName: "สมศักดิ์ ม.", reportedAtLabel: "23 ส.ค. 2569 08:58", priority: "urgent", slaRemainingLabel: "เหลือ 2:45 ชม.", status: "pending_triage" },
  { id: "INC-2025-0624", isNew: true, statusTagLabel: "ใหม่", issueTitle: "Printer กระดาษติด", issueCategory: "เครื่องพิมพ์", assetTag: "PRN-012", assetLabel: "Canon LBP6030", locationLabel: "อาคาร B ชั้น 2", reporterName: "วรรณะ ก.", reportedAtLabel: "23 ส.ค. 2569 08:45", priority: "low", slaRemainingLabel: "เหลือ 24:30 ชม.", status: "pending_triage" },
  { id: "INC-2025-0623", isNew: true, statusTagLabel: "ใหม่", issueTitle: "ไฟไม่ติดบางจุด", issueCategory: "ระบบไฟฟ้า", assetTag: "-", assetLabel: "-", locationLabel: "Meeting Room 3A ชั้น 3", reporterName: "อรัญ ว.", reportedAtLabel: "23 ส.ค. 2569 08:30", priority: "low", slaRemainingLabel: "เหลือ 22:10 ชม.", status: "pending_triage" },
  { id: "INC-2025-0622", isNew: false, statusTagLabel: "รอข้อมูลเพิ่มเติม", issueTitle: "ประตูห้องประชุมไม่ล็อค", issueCategory: "อุปกรณ์ล็อค", assetTag: "DL-02", assetLabel: "Digital Door Lock", locationLabel: "Meeting Room 1 ชั้น 4", reporterName: "ณเดช ณ.", reportedAtLabel: "23 ส.ค. 2569 08:20", priority: "normal", slaRemainingLabel: "เหลือ 6:50 ชม.", status: "waiting_info" },
  { id: "INC-2025-0621", isNew: false, statusTagLabel: "รับเรื่องซ้ำ", issueTitle: "กล้องวงจรปิดไม่ได้", issueCategory: "CCTV", assetTag: "CAM-07", assetLabel: "Hikvision Dome", locationLabel: "สนามจอด", reporterName: "ระบบ", reportedAtLabel: "23 ส.ค. 2569 07:55", priority: "urgent", slaRemainingLabel: "เหลือ 1:20 ชม.", status: "duplicate" },
];

// ===== งานที่กำลังดำเนินการ (InProgressPage) =====

export type InProgressStatus = "onsite" | "remote" | "waiting_update" | "sla_risk";

export const IN_PROGRESS_STATUS_LABEL: Record<string, string> = {
  onsite: "กำลังหน้างาน",
  traveling: "กำลังเดินทาง",
  in_progress: "กำลังดำเนินการ",
  waiting_info: "รอข้อมูล",
  waiting_update: "รออัปเดต",
};

export interface InProgressRow {
  woId: string;
  ticketId: string;
  issueTitle: string;
  assetTag: string;
  assetLabel: string;
  customerName: string;
  branchLabel: string;
  assignee: string;
  statusKey: keyof typeof IN_PROGRESS_STATUS_LABEL;
  progressPercent: number;
  slaLabel: string;
  slaAtRisk: boolean;
  appointmentLabel: string;
  priority: Priority;
}

export const inProgressRows: InProgressRow[] = [
  { woId: "WO-30516", ticketId: "TC-20518", issueTitle: "แอร์ไม่เย็น", assetTag: "AC-021", assetLabel: "Samsung Inverter", customerName: "ABC Company", branchLabel: "Marketing Area ชั้น 2", assignee: "สมชาย ต.", statusKey: "onsite", progressPercent: 60, slaLabel: "เหลือ 2:15 ชม.", slaAtRisk: false, appointmentLabel: "วันนี้ 09:00", priority: "urgent" },
  { woId: "WO-30517", ticketId: "TC-20527", issueTitle: "Wi-Fi หลุดบ่อย", assetTag: "AP-03", assetLabel: "Access Point", customerName: "GHI Co., Ltd.", branchLabel: "อาคาร C ชั้น 3", assignee: "นพพร ต.", statusKey: "traveling", progressPercent: 40, slaLabel: "เหลือ 4:30 ชม.", slaAtRisk: false, appointmentLabel: "วันนี้ 10:00", priority: "normal" },
  { woId: "WO-30518", ticketId: "TC-20528", issueTitle: "เสียงดังลิฟต์มา", assetTag: "PC-145", assetLabel: "HP ProDesk 600 G6", customerName: "XYZ Hotel", branchLabel: "Lobby ชั้น 1", assignee: "วิชิต ก.", statusKey: "in_progress", progressPercent: 30, slaLabel: "เหลือ 3:40 ชม.", slaAtRisk: false, appointmentLabel: "วันนี้ 10:00", priority: "normal" },
  { woId: "WO-30519", ticketId: "TC-20531", issueTitle: "Printer ไม่เชื่อมต่อ", assetTag: "PRN-012", assetLabel: "Canon LBP6030", customerName: "DEF Company", branchLabel: "Accounting", assignee: "เอกชัย ค.", statusKey: "in_progress", progressPercent: 70, slaLabel: "เหลือ 10:30 ชม.", slaAtRisk: false, appointmentLabel: "วันนี้ 09:00", priority: "low" },
  { woId: "WO-30520", ticketId: "TC-20534", issueTitle: "หน้าจอไม่ติด", assetTag: "-", assetLabel: 'LG 24" Monitor', customerName: "MNO Company", branchLabel: "ห้องประชุม 2", assignee: "ทีม Service A", statusKey: "waiting_info", progressPercent: 50, slaLabel: "เหลือ 6:20 ชม.", slaAtRisk: false, appointmentLabel: "วันนี้ 11:00", priority: "low" },
  { woId: "WO-30521", ticketId: "TC-20535", issueTitle: "กล้องวงจรปิด", assetTag: "CAM-07", assetLabel: "Hikvision Dome", customerName: "PQR Company", branchLabel: "หน้าประตู 5", assignee: "อธิยา ส.", statusKey: "waiting_update", progressPercent: 25, slaLabel: "เกิน 30 นาที", slaAtRisk: true, appointmentLabel: "วันนี้ 09:30", priority: "urgent" },
  { woId: "WO-30522", ticketId: "TC-20536", issueTitle: "ประตูอัตโนมัติไม่เปิด", assetTag: "DL-02", assetLabel: "Digital Door Lock", customerName: "STU Co., Ltd.", branchLabel: "หน้าอาคาร", assignee: "กฤษณะ ก.", statusKey: "in_progress", progressPercent: 80, slaLabel: "เหลือ 8:10 ชม.", slaAtRisk: false, appointmentLabel: "วันนี้ 08:00", priority: "normal" },
  { woId: "WO-30523", ticketId: "TC-20537", issueTitle: "UPS มีเสียงดัง", assetTag: "UPS-02", assetLabel: "APC 1500VA", customerName: "VWX Company", branchLabel: "Server Room", assignee: "ทีม Service B", statusKey: "in_progress", progressPercent: 55, slaLabel: "เหลือ 9:05 ชม.", slaAtRisk: false, appointmentLabel: "วันนี้ 08:30", priority: "normal" },
];

export interface WoUpdateLogEntry {
  atLabel: string;
  text: string;
}

export const workOrderUpdateLog: Record<string, WoUpdateLogEntry[]> = {
  "WO-30516": [
    { atLabel: "09:15", text: "สมชาย ต. ถึงหน้างานแล้ว" },
    { atLabel: "08:50", text: "ทีม Service A รับงาน" },
    { atLabel: "08:45", text: "จัดสรรงานให้ทีม Service A" },
    { atLabel: "08:40", text: "สร้าง Work Order" },
  ],
};

// ===== งานที่เสร็จสิ้น (CompletedWorkPage) =====

export interface CompletedRow {
  id: string; // "TC-2025-0510"
  issueTitle: string;
  issueCategory: string;
  customerName: string;
  assetTag: string;
  assetLabel: string;
  assignee: string;
  closedAtLabel: string;
  slaPassed: boolean;
  slaDetailLabel: string; // "ภายใน 4 ชม."
  rating: number;
  attachmentCount: number;
}

export const completedRows: CompletedRow[] = [
  { id: "TC-2025-0510", issueTitle: "แอร์ไม่เย็น", issueCategory: "ระบบปรับอากาศ", customerName: "ABC Company", assetTag: "AC-021", assetLabel: "Samsung Inverter", assignee: "สมชาย ต. · ทีม Service A", closedAtLabel: "23 ส.ค. 2569 11:25", slaPassed: true, slaDetailLabel: "ภายใน 4 ชม.", rating: 5.0, attachmentCount: 3 },
  { id: "TC-2025-0509", issueTitle: "Wi-Fi หลุดบ่อย", issueCategory: "เครือข่าย", customerName: "GHI Co., Ltd.", assetTag: "AP-03", assetLabel: "Access Point", assignee: "นพพร ต.", closedAtLabel: "23 ส.ค. 2569 10:40", slaPassed: true, slaDetailLabel: "ภายใน 8 ชม.", rating: 4.0, attachmentCount: 2 },
  { id: "TC-2025-0508", issueTitle: "เสียงดังลิฟต์มา", issueCategory: "เครื่องใช้ไฟฟ้า", customerName: "XYZ Hotel", assetTag: "PC-145", assetLabel: "HP ProDesk 600 G6", assignee: "วิชิต น.", closedAtLabel: "23 ส.ค. 2569 10:20", slaPassed: true, slaDetailLabel: "ภายใน 4 ชม.", rating: 5.0, attachmentCount: 4 },
  { id: "TC-2025-0507", issueTitle: "Printer ไม่เชื่อมต่อ", issueCategory: "เครื่องพิมพ์", customerName: "DEF Company", assetTag: "PRN-012", assetLabel: "Canon LBP6030", assignee: "เอกชัย ค.", closedAtLabel: "23 ส.ค. 2569 09:55", slaPassed: true, slaDetailLabel: "ภายใน 24 ชม.", rating: 4.0, attachmentCount: 2 },
  { id: "TC-2025-0506", issueTitle: "หน้าจอไม่ติด", issueCategory: "AV/Display", customerName: "MNO Company", assetTag: "-", assetLabel: 'LG 24" Monitor', assignee: "ทีม Service A", closedAtLabel: "23 ส.ค. 2569 09:30", slaPassed: true, slaDetailLabel: "ภายใน 8 ชม.", rating: 4.0, attachmentCount: 3 },
  { id: "TC-2025-0505", issueTitle: "กล้องวงจรปิดไม่ได้", issueCategory: "CCTV", customerName: "PQR Company", assetTag: "CAM-07", assetLabel: "Hikvision Dome", assignee: "อธิยา ส.", closedAtLabel: "23 ส.ค. 2569 08:45", slaPassed: true, slaDetailLabel: "ภายใน 4 ชม.", rating: 5.0, attachmentCount: 5 },
  { id: "TC-2025-0504", issueTitle: "ประตูอัตโนมัติไม่เปิด", issueCategory: "อุปกรณ์ล็อค", customerName: "STU Co., Ltd.", assetTag: "DL-02", assetLabel: "Digital Door Lock", assignee: "กฤษณะ ก.", closedAtLabel: "23 ส.ค. 2569 08:20", slaPassed: true, slaDetailLabel: "ภายใน 8 ชม.", rating: 4.0, attachmentCount: 2 },
  { id: "TC-2025-0503", issueTitle: "UPS มีเสียงดัง", issueCategory: "ไฟฟ้า", customerName: "VWX Company", assetTag: "UPS-02", assetLabel: "APC 1500VA", assignee: "ทีม Service B", closedAtLabel: "23 ส.ค. 2569 07:50", slaPassed: true, slaDetailLabel: "ภายใน 8 ชม.", rating: 5.0, attachmentCount: 3 },
];

// ===== ช่าง/ทีมของฉัน (TechniciansPage) =====

export type TechStatus = "working" | "available" | "unavailable";

export const TECH_STATUS_LABEL: Record<TechStatus, string> = {
  working: "กำลังปฏิบัติงาน",
  available: "ว่างงาน",
  unavailable: "อบรม / ไม่พร้อม",
};

export const TECH_STATUS_COLOR: Record<TechStatus, "green" | "blue" | "yellow"> = {
  working: "green",
  available: "blue",
  unavailable: "yellow",
};

export interface TechnicianRow {
  name: string;
  phone: string;
  team: string;
  status: TechStatus;
  skills: string[];
  currentLocation: string;
  busyHoursLabel: string;
  email: string;
  certifications: string[];
  serviceArea: string;
  notes: string;
}

export const technicianRows: TechnicianRow[] = [
  { name: "สมชาย ต.", phone: "081-234-5678", team: "ทีม Service A", status: "working", skills: ["Network", "Wi-Fi", "Access Point"], currentLocation: "ABC Company ชั้น 2", busyHoursLabel: "3 ชม.", email: "somchai.w@thundercare.co.th", certifications: ["CompTIA Network+", "Ubiquiti UEWA"], serviceArea: "กรุงเทพและปริมณฑล", notes: "ทำงานเช้า/เย็น สลับรอบ" },
  { name: "นพพร ต.", phone: "082-345-6789", team: "ทีม Service A", status: "available", skills: ["Network", "Camera", "Router"], currentLocation: "สำนักงาน", busyHoursLabel: "0 ชม.", email: "nopporn.t@thundercare.co.th", certifications: ["CompTIA Network+"], serviceArea: "กรุงเทพและปริมณฑล", notes: "-" },
  { name: "วิชิต น.", phone: "083-456-7890", team: "ทีม Service B", status: "working", skills: ["LED Display", "AV", "Controller"], currentLocation: "XYZ Hotel Lobby ชั้น 1", busyHoursLabel: "2 ชม.", email: "wichit.n@thundercare.co.th", certifications: ["AV Technician Cert."], serviceArea: "กรุงเทพและปริมณฑล", notes: "-" },
  { name: "เอกชัย ค.", phone: "084-567-8901", team: "ทีม Service B", status: "working", skills: ["Printer", "Network", "Windows"], currentLocation: "DEF Company อาคาร B ชั้น 2", busyHoursLabel: "2 ชม.", email: "ekachai.k@thundercare.co.th", certifications: ["Microsoft MCP"], serviceArea: "กรุงเทพและปริมณฑล", notes: "-" },
  { name: "อธิยา ส.", phone: "085-678-9012", team: "ทีม Service C", status: "available", skills: ["Electrical", "Power", "UPS"], currentLocation: "สำนักงาน", busyHoursLabel: "0 ชม.", email: "athiya.s@thundercare.co.th", certifications: ["ช่างไฟฟ้าภายในอาคาร"], serviceArea: "กรุงเทพตะวันออก", notes: "-" },
  { name: "กฤษณะ ก.", phone: "086-789-0123", team: "ทีม Service C", status: "unavailable", skills: ["Access Control", "Door Lock", "CCTV"], currentLocation: "บ้าน (ไม่ได้ทำงาน)", busyHoursLabel: "0 ชม.", email: "kritsana.k@thundercare.co.th", certifications: ["CCTV Installer Cert."], serviceArea: "กรุงเทพตะวันตก", notes: "อบรมเพิ่มทักษะ 23-25 ส.ค." },
  { name: "อิรมย์ พ.", phone: "087-890-1234", team: "ทีม Service D", status: "available", skills: ["Solar", "Inverter", "Battery"], currentLocation: "สำนักงานใหม่ สาขา 2", busyHoursLabel: "0 ชม.", email: "iram.p@thundercare.co.th", certifications: ["Solar PV Installer"], serviceArea: "ปริมณฑลฝั่งตะวันตก", notes: "-" },
  { name: "ปิยวรรณ จ.", phone: "088-901-2345", team: "ทีม Service A", status: "working", skills: ["Support", "Document", "QA"], currentLocation: "GHI Co., Ltd. อาคาร C ชั้น 2", busyHoursLabel: "1 ชม.", email: "piyawan.j@thundercare.co.th", certifications: ["ISO 9001 Internal Auditor"], serviceArea: "กรุงเทพและปริมณฑล", notes: "-" },
];

export const technicianTeams = Array.from(new Set(technicianRows.map((t) => t.team)));

// ===== ตารางงาน (SchedulerPage) =====

export interface ScheduleBlock {
  woId: string;
  title: string;
  customerName: string;
  startHour: number; // เช่น 9 = 09:00
  endHour: number; // เช่น 11 = 11:00 (นับเป็นทศนิยมได้ เช่น 10.5 = 10:30)
  mode: "onsite" | "remote";
  progressPercent?: number;
}

export interface ScheduleRow {
  assignee: string;
  team: string;
  blocks: ScheduleBlock[];
}

export const schedulerRows: ScheduleRow[] = [
  { assignee: "สมชาย ต.", team: "ทีม Service A", blocks: [
    { woId: "WO-30516", title: "แอร์ไม่เย็น", customerName: "ABC Company", startHour: 9, endHour: 11, mode: "onsite", progressPercent: 60 },
    { woId: "WO-30521", title: "กล้องวงจรปิด", customerName: "PQR Company", startHour: 13, endHour: 15, mode: "onsite" },
  ] },
  { assignee: "นพพร ต.", team: "ทีม Service A", blocks: [
    { woId: "WO-30517", title: "Wi-Fi หลุดบ่อย", customerName: "GHI Co., Ltd.", startHour: 8.5, endHour: 10.5, mode: "onsite", progressPercent: 40 },
    { woId: "WO-30522", title: "ประตูอัตโนมัติไม่เปิด", customerName: "STU Co., Ltd.", startHour: 14, endHour: 16, mode: "onsite" },
  ] },
  { assignee: "วิชิต น.", team: "ทีม Service B", blocks: [
    { woId: "WO-30518", title: "เสียงดังลิฟต์มา", customerName: "XYZ Hotel", startHour: 9, endHour: 10, mode: "onsite", progressPercent: 30 },
  ] },
  { assignee: "เอกชัย ค.", team: "ทีม Service B", blocks: [
    { woId: "WO-30519", title: "Printer ไม่เชื่อมต่อ", customerName: "DEF Company", startHour: 9.5, endHour: 11.5, mode: "onsite", progressPercent: 70 },
    { woId: "WO-30524", title: "ประชุมประจำเดือน", customerName: "ABC Company", startHour: 14.5, endHour: 16.5, mode: "onsite" },
  ] },
  { assignee: "อธิยา ส.", team: "ทีม Service C", blocks: [
    { woId: "WO-30525", title: "ระบบบำรุงประจำวัน (Remote)", customerName: "", startHour: 8.5, endHour: 17, mode: "remote" },
  ] },
  { assignee: "กฤษณะ ก.", team: "ทีม Service C", blocks: [
    { woId: "WO-30520", title: "หน้าจอไม่ติด", customerName: "MNO Company", startHour: 9, endHour: 10.5, mode: "onsite" },
    { woId: "WO-30526", title: "ตรวจสอบอุปกรณ์", customerName: "CAM-07", startHour: 12, endHour: 13, mode: "onsite" },
  ] },
  { assignee: "ทีม Service D", team: "ทีม Service D", blocks: [
    { woId: "WO-30527", title: "Setup ระบบ", customerName: "STU Co., Ltd.", startHour: 16, endHour: 17.5, mode: "remote" },
    { woId: "WO-30528", title: "ตรวจสอบระบบรวมศูนย์ (ทีม)", customerName: "", startHour: 8, endHour: 17, mode: "remote" },
  ] },
];

export const SCHEDULER_HOURS = Array.from({ length: 11 }, (_, i) => 8 + i); // 08:00-18:00

// ===== แผนที่งาน (MapViewPage) =====

export interface MapJobPin {
  woId: string;
  ticketId: string;
  title: string;
  customerName: string;
  status: "in_progress" | "waiting" | "unassigned";
  mode: "Onsite" | "Remote";
  assignee: string;
  timeRangeLabel: string;
  xPercent: number; // ตำแหน่งจำลองบนแผนที่ (ไม่ใช่พิกัดจริง — ยังไม่ต่อ Mapbox)
  yPercent: number;
}

export const mapJobPins: MapJobPin[] = [
  { woId: "WO-30516", ticketId: "TC-20518", title: "แอร์ไม่เย็น", customerName: "ABC Company", status: "in_progress", mode: "Onsite", assignee: "สมชาย ต.", timeRangeLabel: "09:15 - 11:00", xPercent: 48, yPercent: 42 },
  { woId: "WO-30522", ticketId: "TC-20536", title: "ประตูอัตโนมัติไม่เปิด", customerName: "STU Co., Ltd.", status: "waiting", mode: "Onsite", assignee: "เอกชัย พ.", timeRangeLabel: "นัดหมาย 14:00 - 16:00", xPercent: 30, yPercent: 60 },
  { woId: "WO-30518", ticketId: "TC-20528", title: "เมนบรีกเกอร์ไม่ทำงาน", customerName: "XYZ Hotel", status: "in_progress", mode: "Onsite", assignee: "วิชิต น.", timeRangeLabel: "09:00 - 11:00", xPercent: 62, yPercent: 55 },
  { woId: "WO-30527", ticketId: "TC-20539", title: "Setup ระบบ", customerName: "STU Co., Ltd.", status: "unassigned", mode: "Remote", assignee: "-", timeRangeLabel: "16:00 - 17:30", xPercent: 55, yPercent: 30 },
  { woId: "WO-30519", ticketId: "TC-20531", title: "Printer ไม่เชื่อมต่อ", customerName: "DEF Company", status: "in_progress", mode: "Onsite", assignee: "เอกชัย ค.", timeRangeLabel: "09:30 - 11:30", xPercent: 40, yPercent: 68 },
];

export const mapNearestTech = { name: "สมชาย ต.", distanceLabel: "ห่าง 2.1 กม. · 15 นาที" };

// ===== ลูกค้า (CustomersPage — ใหม่ แทนที่ CustomerRow เดิม) =====

export type CustomerType = "องค์กร" | "หน่วยงานรัฐ" | "สถาบันการศึกษา";
export type CustomerStatus = "active" | "inactive";

export interface CustomerRecord {
  code: string; // "CUS-0001"
  name: string;
  type: CustomerType;
  area: string;
  contactName: string;
  contactRole: string;
  phone: string;
  status: CustomerStatus;
  outstandingBalance: number;
  taxId: string;
  address: string;
  email: string;
  customerSinceLabel: string;
  priorityLevel: "สูง" | "ปานกลาง" | "ปกติ";
  notes: string;
}

export const customerRecords: CustomerRecord[] = [
  { code: "CUS-0001", name: "บริษัท เอบีซี จำกัด (มหาชน)", type: "องค์กร", area: "กรุงเทพ", contactName: "คุณสมชาย", contactRole: "IT Manager", phone: "081-234-5678", status: "active", outstandingBalance: 0, taxId: "0105360001234", address: "123 ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพ 10310", email: "info@abc.co.th", customerSinceLabel: "15 มี.ค. 2565", priorityLevel: "สูง", notes: "ลูกค้ารายสำคัญ มีสัญญาที่หลายสาขา" },
  { code: "CUS-0002", name: "โรงแรม XYZ กรุงเทพ", type: "องค์กร", area: "กรุงเทพ", contactName: "คุณนพพล", contactRole: "Chief Engineer", phone: "082-345-6789", status: "active", outstandingBalance: 0, taxId: "0105561002345", address: "-", email: "-", customerSinceLabel: "-", priorityLevel: "ปานกลาง", notes: "-" },
  { code: "CUS-0003", name: "สำนักงานเทศบาลเมืองนนทบุรี", type: "หน่วยงานรัฐ", area: "นนทบุรี", contactName: "คุณเอกชัย", contactRole: "หัวหน้าฝ่าย", phone: "086-456-7890", status: "active", outstandingBalance: 25600, taxId: "-", address: "-", email: "-", customerSinceLabel: "-", priorityLevel: "ปกติ", notes: "-" },
  { code: "CUS-0004", name: "บริษัท ดีเอฟ จำกัด", type: "องค์กร", area: "สมุทรปราการ", contactName: "คุณวรัญ", contactRole: "Facility Manager", phone: "089-567-8901", status: "active", outstandingBalance: 0, taxId: "-", address: "-", email: "-", customerSinceLabel: "-", priorityLevel: "ปกติ", notes: "-" },
  { code: "CUS-0005", name: "โรงพยาบาลสามพราน 1", type: "องค์กร", area: "กรุงเทพ", contactName: "คุณปัญญา", contactRole: "Head of IT", phone: "081-678-9012", status: "active", outstandingBalance: 12800, taxId: "-", address: "-", email: "-", customerSinceLabel: "-", priorityLevel: "สูง", notes: "-" },
  { code: "CUS-0006", name: "มหาวิทยาลัยเทคโนโลยี X", type: "สถาบันการศึกษา", area: "ปทุมธานี", contactName: "คุณอุปกรณ์", contactRole: "หัวหน้าศูนย์คอมฯ", phone: "083-789-0123", status: "active", outstandingBalance: 0, taxId: "-", address: "-", email: "-", customerSinceLabel: "-", priorityLevel: "ปานกลาง", notes: "-" },
  { code: "CUS-0007", name: "บริษัท ทีอาร์เอชั่น จำกัด", type: "องค์กร", area: "ชลบุรี", contactName: "คุณสนามธร", contactRole: "-", phone: "084-890-1234", status: "inactive", outstandingBalance: 0, taxId: "-", address: "-", email: "-", customerSinceLabel: "-", priorityLevel: "ปกติ", notes: "-" },
  { code: "CUS-0008", name: "องค์การบริหารส่วนตำบลบางบัวทอง", type: "หน่วยงานรัฐ", area: "นนทบุรี", contactName: "คุณอรุณ", contactRole: "นักวิชาการ", phone: "085-901-2345", status: "active", outstandingBalance: 8500, taxId: "-", address: "-", email: "-", customerSinceLabel: "-", priorityLevel: "ปกติ", notes: "-" },
  { code: "CUS-0009", name: "ห้างสรรพสินค้า Central City", type: "องค์กร", area: "กรุงเทพ", contactName: "คุณเอกวุฒิ", contactRole: "-", phone: "087-012-3456", status: "active", outstandingBalance: 0, taxId: "-", address: "-", email: "-", customerSinceLabel: "-", priorityLevel: "ปานกลาง", notes: "-" },
  { code: "CUS-0010", name: "บริษัท สมาร์ทโฮม โซลูชั่น จำกัด", type: "องค์กร", area: "เชียงใหม่", contactName: "คุณจิราพร", contactRole: "Operations", phone: "086-123-4567", status: "inactive", outstandingBalance: 0, taxId: "-", address: "-", email: "-", customerSinceLabel: "-", priorityLevel: "ปกติ", notes: "-" },
];

export const customerSummary = {
  total: 156,
  active: 128,
  inactive: 28,
  organizations: 112,
  branches: 86,
  contacts: 203,
  overdueCount: 8,
  overdueTotal: 1245600,
};

// ===== คลังอะไหล่/อุปกรณ์ (InventoryPage) =====

export type StockStatus = "available" | "low" | "out";

export const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  available: "พร้อมใช้งาน",
  low: "ใกล้หมดสต็อก",
  out: "หมดสต็อก",
};

export const STOCK_STATUS_COLOR: Record<StockStatus, "green" | "yellow" | "red"> = {
  available: "green",
  low: "yellow",
  out: "red",
};

export interface InventoryItem {
  code: string;
  name: string;
  description: string;
  category: string;
  warehouse: string;
  quantity: number;
  unit: string;
  status: StockStatus;
  unitPrice: number;
  reorderPoint: number;
}

export interface InventoryUsage {
  woId: string;
  quantityUsed: number;
  unit: string;
  dateLabel: string;
}

export const inventoryItems: InventoryItem[] = [
  { code: "SP-AC-001", name: "แอร์ไม่เย็น 12000 BTU", description: "สำหรับแอร์บ้าน", category: "Air Condition", warehouse: "คลังหลัก", quantity: 18, unit: "ชิ้น", status: "available", unitPrice: 1250, reorderPoint: 5 },
  { code: "SP-FAN-002", name: "พัดลมระบายความร้อน 12V", description: "DC Fan 120x120x25mm", category: "Cooling System", warehouse: "คลังหลัก", quantity: 7, unit: "ชิ้น", status: "low", unitPrice: 320, reorderPoint: 10 },
  { code: "SP-PSU-003", name: "Power Supply 24V 10A", description: "Switching Power Supply", category: "Power Supply", warehouse: "คลังหลัก", quantity: 15, unit: "ชิ้น", status: "available", unitPrice: 850, reorderPoint: 5 },
  { code: "SP-HD-004", name: "Hard Disk 1TB", description: 'SATA 3.5"', category: "Storage", warehouse: "คลังหลัก", quantity: 0, unit: "ชิ้น", status: "out", unitPrice: 1450, reorderPoint: 3 },
  { code: "SP-LED-005", name: "LED Module P2.5 (Indoor)", description: "320x160mm", category: "LED Display", warehouse: "คลังหลัก", quantity: 3, unit: "ชิ้น", status: "low", unitPrice: 950, reorderPoint: 5 },
  { code: "SP-CAB-006", name: "สาย HDMI 2.0", description: "3 เมตร High Speed", category: "Cable", warehouse: "คลังสำรอง", quantity: 42, unit: "เส้น", status: "available", unitPrice: 180, reorderPoint: 10 },
  { code: "SP-VGA-007", name: "สาย VGA 5 เมตร", description: "VGA Cable", category: "Cable", warehouse: "คลังสำรอง", quantity: 20, unit: "เส้น", status: "available", unitPrice: 120, reorderPoint: 5 },
  { code: "SP-SW-008", name: "สวิตช์ไฟ 16A", description: "Electrical Switch 16A 250V", category: "Electrical", warehouse: "คลังหลัก", quantity: 4, unit: "ชิ้น", status: "low", unitPrice: 85, reorderPoint: 10 },
];

export const inventoryUsageByCode: Record<string, InventoryUsage[]> = {
  "SP-AC-001": [
    { woId: "WO-2025-0267", quantityUsed: 1, unit: "ชิ้น", dateLabel: "18 ส.ค. 2569" },
    { woId: "WO-2025-0261", quantityUsed: 1, unit: "ชิ้น", dateLabel: "17 ส.ค. 2569" },
    { woId: "WO-2025-0238", quantityUsed: 1, unit: "ชิ้น", dateLabel: "15 ส.ค. 2569" },
  ],
};

export function inventorySummary() {
  const totalValue = inventoryItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const available = inventoryItems.filter((i) => i.status === "available").length;
  const low = inventoryItems.filter((i) => i.status === "low").length;
  const out = inventoryItems.filter((i) => i.status === "out").length;
  return { totalValue, totalItems: inventoryItems.length, available, low, out };
}
