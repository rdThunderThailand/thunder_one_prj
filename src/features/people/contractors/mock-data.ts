// R&D placeholder data for People Workspace's new standalone
// "ผู้ปฏิบัติงานภายนอก (Contractor)" roster page (`/people/contractors`) —
// built 2026-09-01 from the FigJam "People Workspace" board. Fully mock:
// Core has neither `member_type` (so real rows can't be reliably filtered
// to contractors — confirmed, docs/people/core-response-people-workspace-api.md,
// same limitation people/personnel's core-mapper.ts already documents for
// its own type badge) nor any of this page's contract-specific fields
// (contracting company, internal coordinator, contract start/end) at all.
export type ContractorStatus = "active" | "expiring-soon" | "expired" | "pending-approval";

export interface ContractorRow {
  id: string;
  name: string;
  code: string;
  company: string;
  role: string;
  unit: string;
  coordinatorName: string;
  coordinatorRole: string;
  contractStartLabel: string;
  contractEndLabel: string;
  status: ContractorStatus;
}

export const contractorRows: ContractorRow[] = [
  {
    id: "ctr-1",
    name: "นพนันท์ ใจดี",
    code: "CTR-00048",
    company: "บริษัท มิลเลอร์ โซลูชั่นส์ จำกัด",
    role: "Network Engineer",
    unit: "IT Operations",
    coordinatorName: "สหรัฐ วงศ์ทวี",
    coordinatorRole: "IT Manager",
    contractStartLabel: "1 ก.ย. 2569",
    contractEndLabel: "31 มี.ค. 2570",
    status: "active",
  },
  {
    id: "ctr-2",
    name: "วิรัณ นครินทร์",
    code: "CTR-00047",
    company: "บริษัท พีเพิล เซิร์ฟ จำกัด",
    role: "HR Consultant",
    unit: "HR",
    coordinatorName: "May HR",
    coordinatorRole: "HR Manager",
    contractStartLabel: "1 ต.ค. 2569",
    contractEndLabel: "31 มี.ค. 2570",
    status: "active",
  },
  {
    id: "ctr-3",
    name: "กิตติพงศ์ สุนทร",
    code: "CTR-00046",
    company: "บริษัท ครีเอทีฟ วิชั่น จำกัด",
    role: "Graphic Designer",
    unit: "Marketing",
    coordinatorName: "วิชาพร ลิ้มทอง",
    coordinatorRole: "Marketing Manager",
    contractStartLabel: "15 ม.ค. 2569",
    contractEndLabel: "14 ก.ค. 2569",
    status: "expiring-soon",
  },
  {
    id: "ctr-4",
    name: "เจษฎาภรณ์ เรืองเดช",
    code: "CTR-00045",
    company: "บริษัท ซิสเต็ม อินทิเกรท จำกัด",
    role: "System Analyst",
    unit: "IT Projects",
    coordinatorName: "ศิริพงษ์ ไพรแก้ว",
    coordinatorRole: "Project Manager",
    contractStartLabel: "1 พ.ย. 2568",
    contractEndLabel: "30 เม.ย. 2569",
    status: "expired",
  },
  {
    id: "ctr-5",
    name: "ธนพงษ์ ศรีสัตย์",
    code: "CTR-00044",
    company: "บริษัท ลีเกิล แอดไวเซอร์ จำกัด",
    role: "Legal Advisor",
    unit: "Legal",
    coordinatorName: "สรัญญ์ สมบุญ",
    coordinatorRole: "Legal Manager",
    contractStartLabel: "10 มิ.ย. 2569",
    contractEndLabel: "9 ธ.ค. 2569",
    status: "active",
  },
  {
    id: "ctr-6",
    name: "อรทัย ภูวนาถ",
    code: "CTR-00043",
    company: "บริษัท คลาวด์ เวิร์คส์ จำกัด",
    role: "Cloud Engineer",
    unit: "IT Operations",
    coordinatorName: "สหรัฐ วงศ์ทวี",
    coordinatorRole: "IT Manager",
    contractStartLabel: "1 ก.พ. 2569",
    contractEndLabel: "31 ก.ค. 2569",
    status: "expiring-soon",
  },
  {
    id: "ctr-7",
    name: "ปวริศ ตันสกุล",
    code: "CTR-00042",
    company: "บริษัท ไฟแนนซ์ พาร์ทเนอร์ จำกัด",
    role: "Financial Advisor",
    unit: "Finance",
    coordinatorName: "นันทยา ปิยะวงศ์",
    coordinatorRole: "Finance Manager",
    contractStartLabel: "1 ธ.ค. 2568",
    contractEndLabel: "31 พ.ค. 2569",
    status: "expired",
  },
  {
    id: "ctr-8",
    name: "ศศิวิมล แก้วมณี",
    code: "CTR-00049",
    company: "บริษัท ทาเลนต์ ฮับ จำกัด",
    role: "Recruiter",
    unit: "HR",
    coordinatorName: "May HR",
    coordinatorRole: "HR Manager",
    contractStartLabel: "1 ต.ค. 2569",
    contractEndLabel: "31 มี.ค. 2570",
    status: "pending-approval",
  },
];

export interface ContractorStatTile {
  id: string;
  label: string;
  value: string;
  sublabel: string;
}

// The mockup's own top-line numbers — not derived from `contractorRows`
// above (8 rows here vs. 48 in the header), same documented gap every other
// people/* mock-data.ts carries for its own header counts.
export const contractorStatTiles: ContractorStatTile[] = [
  { id: "total", label: "ทั้งหมด", value: "48", sublabel: "คน" },
  { id: "active", label: "กำลังปฏิบัติงาน", value: "32", sublabel: "คน" },
  { id: "expiring-soon", label: "ใกล้หมดสัญญา", value: "6", sublabel: "ภายใน 30 วัน" },
  { id: "expired", label: "หมดสัญญาแล้ว", value: "10", sublabel: "คน" },
  { id: "expiring-90", label: "สัญญาที่หมดอายุใน 90 วัน", value: "11", sublabel: "คน" },
];

export interface ContractorTab {
  id: ContractorStatus | "all";
  label: string;
  count: number;
}

export const contractorTabs: ContractorTab[] = [
  { id: "all", label: "ทั้งหมด", count: 48 },
  { id: "active", label: "กำลังปฏิบัติงาน", count: 32 },
  { id: "expiring-soon", label: "ใกล้หมดสัญญา", count: 6 },
  { id: "expired", label: "สิ้นสุดแล้ว", count: 10 },
  { id: "pending-approval", label: "รออนุมัติ", count: 0 },
];
