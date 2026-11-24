// R&D placeholder data for People Workspace's Policy page (`/people/policy`)
// — no backend yet, same discipline as this feature's sibling pages'
// mock-data.ts files.
//
// `policyStatTiles` carries the mockup's own header counts (48/42/5/1/2) as
// static labels; `policyCategories`' counts (12/8/6/5/6/4/3/4, summing to 48)
// are also copied straight from the mockup's sidebar, not derived from
// `policyRows` (8 rows) — same "mockup number vs. small sample" gap
// `people/personnel`'s mock-data.ts documents for itself.
export interface PolicyStatTile {
  id: string;
  icon: "document" | "check" | "clock" | "edit" | "archive";
  iconTone: string;
  label: string;
  value: string;
  sublabel: string;
}

export const policyStatTiles: PolicyStatTile[] = [
  {
    id: "total",
    icon: "document",
    iconTone: "bg-info-muted text-t1-blue-700",
    label: "นโยบายทั้งหมด",
    value: "48",
    sublabel: "รายการ",
  },
  {
    id: "published",
    icon: "check",
    iconTone: "bg-success-muted text-t1-green-700",
    label: "ประกาศใช้",
    value: "42",
    sublabel: "87.5%",
  },
  {
    id: "review",
    icon: "clock",
    iconTone: "bg-warning-muted text-t1-amber-700",
    label: "รอการทบทวน",
    value: "5",
    sublabel: "10.4%",
  },
  {
    id: "draft",
    icon: "edit",
    iconTone: "bg-in-progress-muted text-t1-purple-700",
    label: "กำลังร่าง",
    value: "1",
    sublabel: "2.1%",
  },
  {
    id: "retired",
    icon: "archive",
    iconTone: "bg-muted text-muted-foreground",
    label: "ยกเลิก",
    value: "2",
    sublabel: "4.2%",
  },
];

export interface PolicyCategory {
  id: string;
  label: string;
  count: number;
}

export const policyCategories: PolicyCategory[] = [
  { id: "work", label: "นโยบายการทำงาน", count: 12 },
  { id: "benefits", label: "สวัสดิการและผลตอบแทน", count: 8 },
  { id: "leave", label: "การลาหยุด", count: 6 },
  { id: "safety", label: "ความปลอดภัย อาชีวอนามัย", count: 5 },
  { id: "ethics", label: "จรรยาบรรณและการปฏิบัติตามกฎหมาย", count: 6 },
  { id: "it", label: "เทคโนโลยีสารสนเทศ", count: 4 },
  { id: "privacy", label: "การจัดการข้อมูลและความเป็นส่วนตัว", count: 3 },
  { id: "other", label: "อื่นๆ", count: 4 },
];

export type PolicyStatus = "published" | "review" | "draft" | "retired";

export interface PolicyRow {
  id: string;
  title: string;
  description: string;
  categoryLabel: string;
  status: PolicyStatus;
  version: string;
  publishedDateLabel: string | null;
  publisherName: string;
  publisherRole: string;
}

export const policyRows: PolicyRow[] = [
  {
    id: "pol-1",
    title: "นโยบายการทำงานจากที่บ้าน (Work From Home)",
    description: "แนวปฏิบัติสำหรับการทำงานจากที่บ้าน",
    categoryLabel: "นโยบายการทำงาน",
    status: "published",
    version: "v2.1",
    publishedDateLabel: "1 พ.ค. 2569",
    publisherName: "May HR",
    publisherRole: "HR Manager",
  },
  {
    id: "pol-2",
    title: "ระเบียบการลาหยุดของพนักงาน",
    description: "ประเภทการลา สิทธิการลา และขั้นตอนการลา",
    categoryLabel: "การลาหยุด",
    status: "published",
    version: "v3.0",
    publishedDateLabel: "15 เม.ย. 2569",
    publisherName: "May HR",
    publisherRole: "HR Manager",
  },
  {
    id: "pol-3",
    title: "นโยบายการแต่งกายและบุคลิกภาพ",
    description: "มาตรฐานการแต่งกายในการทำงาน",
    categoryLabel: "นโยบายการทำงาน",
    status: "published",
    version: "v1.3",
    publishedDateLabel: "10 เม.ย. 2569",
    publisherName: "May HR",
    publisherRole: "HR Manager",
  },
  {
    id: "pol-4",
    title: "จรรยาบรรณทางธุรกิจและจริยธรรม",
    description: "แนวทางการปฏิบัติงานอย่างมีจริยธรรม",
    categoryLabel: "จรรยาบรรณและการปฏิบัติ...",
    status: "published",
    version: "v2.0",
    publishedDateLabel: "1 เม.ย. 2569",
    publisherName: "May HR",
    publisherRole: "HR Manager",
  },
  {
    id: "pol-5",
    title: "นโยบายความปลอดภัย อาชีวอนามัย และสภาพแวดล้อม...",
    description: "แนวปฏิบัติเพื่อความปลอดภัยในการทำงาน",
    categoryLabel: "ความปลอดภัย อาชีวอนามัย",
    status: "review",
    version: "v1.5",
    publishedDateLabel: "20 มี.ค. 2569",
    publisherName: "Somchai W.",
    publisherRole: "Safety Officer",
  },
  {
    id: "pol-6",
    title: "นโยบายการใช้ทรัพยากรสารสนเทศ",
    description: "การใช้งานอุปกรณ์และระบบสารสนเทศของบริษัท",
    categoryLabel: "เทคโนโลยีสารสนเทศ",
    status: "published",
    version: "v2.2",
    publishedDateLabel: "10 มี.ค. 2569",
    publisherName: "IT Admin",
    publisherRole: "IT Manager",
  },
  {
    id: "pol-7",
    title: "นโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)",
    description: "แนวทางการเก็บรวบรวม ใช้ และเปิดเผยข้อมูล",
    categoryLabel: "การจัดการข้อมูลและความ...",
    status: "published",
    version: "v1.1",
    publishedDateLabel: "1 มี.ค. 2569",
    publisherName: "Nattaya P.",
    publisherRole: "DPO",
  },
  {
    id: "pol-8",
    title: "แนวทางการเบิกค่าใช้จ่ายในการเดินทาง",
    description: "ขั้นตอนและเอกสารประกอบการเบิกค่าใช้จ่าย",
    categoryLabel: "สวัสดิการและผลตอบแทน",
    status: "draft",
    version: "v0.1",
    publishedDateLabel: null,
    publisherName: "May HR",
    publisherRole: "HR Manager",
  },
];

export const policyTotalCount = 48;
export const policyPageSize = 10;
export const policyTotalPages = 5;
