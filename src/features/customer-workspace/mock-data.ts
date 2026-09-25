// Brand-new workspace, no Core integration exists for any of this yet
// (no customers/renewals/contracts tables in Thunder_Core) — every export
// here is mock data, straight from the Figma mockup's own sample rows
// (org names, contract numbers, dates, values), not a placeholder invented
// separately. Real wiring is a future task once Core has the schema for it.

export type CustomerStatus = "overdue" | "near" | "normal";
export type CustomerType = "direct" | "government" | "medical";
export type RenewalStatus = "overdue" | "near" | "normal" | "in-progress" | "done" | "cancelled";

export interface CustomerRow {
  id: string;
  orgName: string;
  orgNameEn: string;
  badgeLabel: string;
  badgeBg: string;
  badgeText: string;
  customerType: CustomerType;
  contactName: string;
  contactEmail: string;
  ownerName: string;
  renewalDate: string;
  daysNote?: string;
  status: CustomerStatus;
}

export interface RenewalRow {
  id: string;
  customerId: string;
  orgName: string;
  orgNameEn: string;
  badgeLabel: string;
  badgeBg: string;
  badgeText: string;
  contractNo: string;
  contractName: string;
  dueDate: string;
  daysNote?: string;
  value: number;
  status: RenewalStatus;
  ownerName: string;
  nextAction: string;
}

export const customers: CustomerRow[] = [
  {
    id: "siam-technology",
    orgName: "สยามเทคโนโลยี จำกัด",
    orgNameEn: "SIAM TECHNOLOGY",
    badgeLabel: "S",
    badgeBg: "bg-[#0f2f6b]",
    badgeText: "text-white",
    customerType: "direct",
    contactName: "คุณสมชาย ใจดี",
    contactEmail: "somchai@siamtech.co.th",
    ownerName: "นรินทร์ ส.",
    renewalDate: "15 พ.ค. 2569",
    daysNote: "เกินกำหนด 3 วัน",
    status: "overdue",
  },
  {
    id: "bma",
    orgName: "กรุงเทพมหานคร",
    orgNameEn: "BMA",
    badgeLabel: "◎",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-700",
    customerType: "government",
    contactName: "คุณสุภา วงศ์ไทย",
    contactEmail: "supa@bma.go.th",
    ownerName: "ศิริพร ก.",
    renewalDate: "20 พ.ค. 2569",
    daysNote: "อีก 8 วัน",
    status: "near",
  },
  {
    id: "delta-solutions",
    orgName: "เดลต้า โซลูชัน จำกัด",
    orgNameEn: "Delta Solutions",
    badgeLabel: "▲",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
    customerType: "direct",
    contactName: "คุณวิทยา กุลประเสริฐ",
    contactEmail: "wit@deltasolutions.co.th",
    ownerName: "นรินทร์ ส.",
    renewalDate: "28 พ.ค. 2569",
    daysNote: "อีก 16 วัน",
    status: "near",
  },
  {
    id: "thai-retail-group",
    orgName: "ไทยรีเทล กรุ๊ป",
    orgNameEn: "Thai Retail Group",
    badgeLabel: "T",
    badgeBg: "bg-red-600",
    badgeText: "text-white",
    customerType: "direct",
    contactName: "คุณนภา ศิริกุล",
    contactEmail: "napa@thairetail.co.th",
    ownerName: "ศิริพร ก.",
    renewalDate: "30 พ.ค. 2569",
    daysNote: "อีก 18 วัน",
    status: "near",
  },
  {
    id: "samitivej",
    orgName: "โรงพยาบาลสมิติเวช",
    orgNameEn: "Samitivej Hospital",
    badgeLabel: "+",
    badgeBg: "bg-emerald-600",
    badgeText: "text-white",
    customerType: "medical",
    contactName: "คุณอรทัย เมธาพัฒน์",
    contactEmail: "orathai@samitivej.co.th",
    ownerName: "กิตติพงศ์ น.",
    renewalDate: "5 มิ.ย. 2569",
    daysNote: "อีก 24 วัน",
    status: "normal",
  },
  {
    id: "cp-all",
    orgName: "ซีพี ออลล์ จำกัด (มหาชน)",
    orgNameEn: "CP ALL",
    badgeLabel: "CP",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
    customerType: "direct",
    contactName: "คุณธนกร ลีลาศิริ",
    contactEmail: "thanakorn@cpall.co.th",
    ownerName: "นรินทร์ ส.",
    renewalDate: "18 มิ.ย. 2569",
    status: "normal",
  },
  {
    id: "bgrimm-power",
    orgName: "บี.กริม เพาเวอร์ จำกัด",
    orgNameEn: "B.Grimm Power",
    badgeLabel: "R",
    badgeBg: "bg-violet-100",
    badgeText: "text-violet-700",
    customerType: "direct",
    contactName: "คุณวิรัชมน์ เตชะมงคล",
    contactEmail: "wirat@bgrimmpower.com",
    ownerName: "ศิริพร ก.",
    renewalDate: "22 มิ.ย. 2569",
    status: "normal",
  },
  {
    id: "central-group",
    orgName: "กลุ่มเซ็นทรัล",
    orgNameEn: "Central Group",
    badgeLabel: "●",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-700",
    customerType: "direct",
    contactName: "คุณกมลวรรณ ชื่นนำ",
    contactEmail: "kamonwan@central.co.th",
    ownerName: "กิตติพงศ์ น.",
    renewalDate: "30 มิ.ย. 2569",
    status: "normal",
  },
  {
    id: "ptt",
    orgName: "ปตท. จำกัด (มหาชน)",
    orgNameEn: "PTT",
    badgeLabel: "◆",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
    customerType: "direct",
    contactName: "คุณอัครเดช วิสุทธิ์",
    contactEmail: "akaradet@pttplc.com",
    ownerName: "นรินทร์ ส.",
    renewalDate: "12 ก.ค. 2569",
    status: "normal",
  },
  {
    id: "mea",
    orgName: "การไฟฟ้านครหลวง",
    orgNameEn: "MEA",
    badgeLabel: "☀",
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-700",
    customerType: "government",
    contactName: "คุณจิราพร สถาพร",
    contactEmail: "jiraporn@mea.or.th",
    ownerName: "ศิริพร ก.",
    renewalDate: "25 ก.ค. 2569",
    status: "normal",
  },
];

export const renewals: RenewalRow[] = [
  {
    id: "con-00123",
    customerId: "siam-technology",
    orgName: "สยามเทคโนโลยี จำกัด",
    orgNameEn: "SIAM TECHNOLOGY",
    badgeLabel: "S",
    badgeBg: "bg-[#0f2f6b]",
    badgeText: "text-white",
    contractNo: "CON-00123",
    contractName: "Digital Signage Solution",
    dueDate: "15 พ.ค. 2569",
    daysNote: "อีก 3 วัน",
    value: 450000,
    status: "overdue",
    ownerName: "นรินทร์ ส.",
    nextAction: "ติดต่อเสนอราคา",
  },
  {
    id: "con-04567",
    customerId: "bma",
    orgName: "กรุงเทพมหานคร",
    orgNameEn: "BMA",
    badgeLabel: "◎",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-700",
    contractNo: "CON-04567",
    contractName: "Media Platform",
    dueDate: "20 พ.ค. 2569",
    daysNote: "อีก 8 วัน",
    value: 1200000,
    status: "near",
    ownerName: "ศิริพร ก.",
    nextAction: "นัดประชุมต่ออายุ",
  },
  {
    id: "con-07890",
    customerId: "delta-solutions",
    orgName: "เดลต้า โซลูชัน จำกัด",
    orgNameEn: "Delta Solutions",
    badgeLabel: "▲",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
    contractNo: "CON-07890",
    contractName: "Content Management",
    dueDate: "28 พ.ค. 2569",
    daysNote: "อีก 16 วัน",
    value: 350000,
    status: "near",
    ownerName: "นรินทร์ ส.",
    nextAction: "ส่งใบเสนอราคา",
  },
  {
    id: "con-01111",
    customerId: "thai-retail-group",
    orgName: "ไทยรีเทล กรุ๊ป",
    orgNameEn: "Thai Retail Group",
    badgeLabel: "T",
    badgeBg: "bg-red-600",
    badgeText: "text-white",
    contractNo: "CON-01111",
    contractName: "Media Platform",
    dueDate: "30 พ.ค. 2569",
    daysNote: "อีก 18 วัน",
    value: 650000,
    status: "near",
    ownerName: "กิตติพงศ์ น.",
    nextAction: "นัดนำเสนอผู้บริหาร",
  },
  {
    id: "con-02233",
    customerId: "samitivej",
    orgName: "โรงพยาบาลสมิติเวช",
    orgNameEn: "Samitivej Hospital",
    badgeLabel: "+",
    badgeBg: "bg-emerald-600",
    badgeText: "text-white",
    contractNo: "CON-02233",
    contractName: "Digital Signage Solution",
    dueDate: "5 มิ.ย. 2569",
    daysNote: "อีก 24 วัน",
    value: 200000,
    status: "normal",
    ownerName: "ศิริพร ก.",
    nextAction: "เตรียมเอกสารต่ออายุ",
  },
  {
    id: "con-03321",
    customerId: "cp-all",
    orgName: "ซีพี ออลล์ จำกัด (มหาชน)",
    orgNameEn: "CP ALL",
    badgeLabel: "CP",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
    contractNo: "CON-03321",
    contractName: "Media Platform",
    dueDate: "12 มิ.ย. 2569",
    daysNote: "อีก 31 วัน",
    value: 1500000,
    status: "in-progress",
    ownerName: "นรินทร์ ส.",
    nextAction: "รอผลภายในสัปดาห์นี้",
  },
  {
    id: "con-05555",
    customerId: "central-group",
    orgName: "กลุ่มเซ็นทรัล",
    orgNameEn: "Central Group",
    badgeLabel: "●",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-700",
    contractNo: "CON-05555",
    contractName: "Digital Signage Solution",
    dueDate: "25 มิ.ย. 2569",
    daysNote: "อีก 44 วัน",
    value: 980000,
    status: "normal",
    ownerName: "ศิริพร ก.",
    nextAction: "ติดตามการอนุมัติ",
  },
  {
    id: "con-06666",
    customerId: "ptt",
    orgName: "ปตท. จำกัด (มหาชน)",
    orgNameEn: "PTT",
    badgeLabel: "◆",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
    contractNo: "CON-06666",
    contractName: "Media Platform",
    dueDate: "30 มิ.ย. 2569",
    daysNote: "อีก 49 วัน",
    value: 750000,
    status: "in-progress",
    ownerName: "กิตติพงศ์ น.",
    nextAction: "เตรียมสัญญาใหม่",
  },
  {
    id: "con-07777",
    customerId: "mea",
    orgName: "การไฟฟ้านครหลวง",
    orgNameEn: "MEA",
    badgeLabel: "☀",
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-700",
    contractNo: "CON-07777",
    contractName: "Content Management",
    dueDate: "15 ก.ค. 2569",
    daysNote: "อีก 64 วัน",
    value: 300000,
    status: "normal",
    ownerName: "นรินทร์ ส.",
    nextAction: "ติดตามเงื่อนไขสัญญา",
  },
  {
    id: "con-08888",
    customerId: "ais",
    orgName: "AIS",
    orgNameEn: "AIS",
    badgeLabel: "AIS",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-800",
    contractNo: "CON-08888",
    contractName: "Digital Signage Solution",
    dueDate: "20 ก.ค. 2569",
    daysNote: "อีก 69 วัน",
    value: 1800000,
    status: "normal",
    ownerName: "ศิริพร ก.",
    nextAction: "วางแผนต่ออายุล่วงหน้า",
  },
];

// Overview page's own tile/section counts — same 28 customers/renewals
// above but the mockup's Overview tiles use slightly different framings
// (เสร็จสิ้นแล้ว/แจ้งเตือน) than the Customers/Renewals pages' own tiles, so
// they're kept as their own small set rather than derived, matching the
// mockup exactly.
export const overviewStats = {
  totalCustomers: 28,
  totalCustomersDelta: 3,
  dueIn30Days: 5,
  dueIn30DaysDelta: 2,
  completed: 7,
  completedDelta: 1,
  alerts: 4,
};

export const customerStats = {
  total: 28,
  current: 24,
  nearRenewal: 5,
  overdue: 3,
};

export const renewalStats = {
  dueIn30Days: 5,
  dueIn30DaysDelta: 2,
  overdue: 3,
  inProgress: 12,
  upcomingValue: 2_850_000,
  upcomingValueDeltaPct: 15,
};

export const renewalTabCounts = {
  all: 28,
  dueIn30Days: 5,
  overdue: 3,
  inProgress: 12,
  done: 8,
  cancelled: 0,
};

export interface AnnouncementItem {
  id: string;
  title: string;
  detail: string;
  date: string;
}

export const announcements: AnnouncementItem[] = [
  {
    id: "server-maintenance",
    title: "แจ้งปรับปรุงระบบเซิร์ฟเวอร์",
    detail: "ระบบจะทำการปิดปรับปรุงในวันที่ 25 พ.ค. 2569 เวลา 22:00 - 02:00 น.",
    date: "25 พ.ค. 2569",
  },
  {
    id: "data-cleanup",
    title: "ทำความสะอาดข้อมูลลูกค้า",
    detail: "วันที่ 30 พ.ค. 2569 เวลา 09:00 - 12:00 น.",
    date: "30 พ.ค. 2569",
  },
  {
    id: "hybrid-policy",
    title: "ประกาศนโยบายการทำงาน Hybrid",
    detail: "มีผลตั้งแต่วันที่ 1 มิ.ย. 2569 เป็นต้นไป",
    date: "1 มิ.ย. 2569",
  },
];

export const usageStats = {
  totalUsers: 12,
  totalCustomers: 28,
  totalRenewals: 28,
};

export const lastUpdatedLabel = "12 พ.ค. 2569 08:30";
export const currentUserName = "นรินทร์ ส.";
