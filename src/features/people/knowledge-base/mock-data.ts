// R&D placeholder data for People Workspace's Knowledge Base page
// (`/people/knowledge-base`) — no backend yet, same discipline as this
// feature's sibling pages' mock-data.ts files. No stat tiles row on this
// page (unlike every other people/* list page) — the mockup goes straight
// from the header into the filter bar.
export type KnowledgeCategoryIcon = "document" | "shield" | "users" | "monitor" | "help";

export interface KnowledgeCategory {
  id: string;
  icon: KnowledgeCategoryIcon;
  iconTone: string;
  label: string;
  description: string;
  count: number;
}

export const knowledgeCategories: KnowledgeCategory[] = [
  {
    id: "operations",
    icon: "document",
    iconTone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    label: "การทำงาน",
    description: "คู่มือและกระบวนการทำงาน",
    count: 24,
  },
  {
    id: "policy",
    icon: "shield",
    iconTone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    label: "นโยบายและระเบียบ",
    description: "นโยบายบริษัทและแนวปฏิบัติ",
    count: 18,
  },
  {
    id: "benefits",
    icon: "users",
    iconTone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    label: "สวัสดิการและสิทธิ",
    description: "สิทธิประโยชน์และสวัสดิการ",
    count: 12,
  },
  {
    id: "it",
    icon: "monitor",
    iconTone: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
    label: "IT และระบบ",
    description: "การใช้งานระบบและเครื่องมือ",
    count: 15,
  },
  {
    id: "faq",
    icon: "help",
    iconTone: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
    label: "คำถามที่พบบ่อย",
    description: "รวมคำถามและคำตอบ",
    count: 21,
  },
];

export interface KnowledgeArticle {
  id: string;
  title: string;
  description: string;
  tagLabel: string;
  tagTone: string;
  thumbnailTone: string;
  dateLabel: string;
  authorName: string;
  authorRole: string | null;
  viewCount: number;
}

export const knowledgeArticles: KnowledgeArticle[] = [
  {
    id: "kb-1",
    title: "แนวปฏิบัติสำหรับการทำงานจากที่บ้าน (Work From Home)",
    description: "แนวทางและข้อปฏิบัติสำหรับการทำงานจากที่บ้าน เพื่อให้การทำงานมีประสิทธิภาพและปลอดภัย",
    tagLabel: "การทำงาน",
    tagTone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    thumbnailTone: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
    dateLabel: "1 พ.ค. 2569",
    authorName: "May HR",
    authorRole: "HR Manager",
    viewCount: 312,
  },
  {
    id: "kb-2",
    title: "นโยบายการลาป่วย และลากิจส่วนตัว",
    description: "รายละเอียดสิทธิการลา ขั้นตอนการขออนุมัติ และเอกสารที่เกี่ยวข้อง",
    tagLabel: "นโยบายและระเบียบ",
    tagTone: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    thumbnailTone: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
    dateLabel: "28 เม.ย. 2569",
    authorName: "Somchai W.",
    authorRole: "HR",
    viewCount: 268,
  },
  {
    id: "kb-3",
    title: "การใช้งาน Multi-Factor Authentication (MFA)",
    description: "วิธีการตั้งค่าและใช้งาน MFA สำหรับระบบต่างๆ ขององค์กร",
    tagLabel: "IT และระบบ",
    tagTone: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
    thumbnailTone: "bg-zinc-800 text-blue-300 dark:bg-zinc-900 dark:text-blue-400",
    dateLabel: "27 เม.ย. 2569",
    authorName: "IT Admin",
    authorRole: null,
    viewCount: 201,
  },
  {
    id: "kb-4",
    title: "สิทธิประโยชน์ประกันสุขภาพพนักงาน",
    description: "รายละเอียดความคุ้มครอง ขั้นตอนการเบิก และเครือข่ายโรงพยาบาล",
    tagLabel: "สวัสดิการและสิทธิ",
    tagTone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    thumbnailTone: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
    dateLabel: "25 เม.ย. 2569",
    authorName: "Nattaya P.",
    authorRole: "HR",
    viewCount: 154,
  },
  {
    id: "kb-5",
    title: "ขั้นตอนการขออนุมัติเดินทางและค่าใช้จ่าย",
    description: "แนวทางการขออนุมัติเดินทางและการเบิกค่าใช้จ่ายในการปฏิบัติงาน",
    tagLabel: "การทำงาน",
    tagTone: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
    thumbnailTone: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
    dateLabel: "24 เม.ย. 2569",
    authorName: "May HR",
    authorRole: "HR Manager",
    viewCount: 133,
  },
];

export interface PopularTopic {
  rank: number;
  label: string;
  viewCount: number;
}

export const popularTopics: PopularTopic[] = [
  { rank: 1, label: "การทำงานจากที่บ้าน (WFH)", viewCount: 312 },
  { rank: 2, label: "การลาและการขออนุมัติ", viewCount: 268 },
  { rank: 3, label: "การเบิกค่าใช้จ่าย", viewCount: 201 },
  { rank: 4, label: "สิทธิประโยชน์พนักงาน", viewCount: 154 },
  { rank: 5, label: "การใช้ระบบ HR Self-Service", viewCount: 133 },
];

export interface KnowledgeAnnouncement {
  id: string;
  title: string;
  subtitle: string;
  postedLabel: string;
}

export const knowledgeAnnouncements: KnowledgeAnnouncement[] = [
  {
    id: "ann-1",
    title: "แจ้งปรับปรุงนโยบายการทำงานจากที่บ้าน",
    subtitle: "มีผลบังคับใช้ตั้งแต่ 1 พ.ค. 2569 เป็นต้นไป",
    postedLabel: "ประกาศเมื่อ 30 เม.ย. 2569",
  },
  {
    id: "ann-2",
    title: "สำรวจความพึงพอใจการใช้ระบบ HR",
    subtitle: "ร่วมแสดงความคิดเห็นได้ถึง 15 พ.ค. 2569",
    postedLabel: "ประกาศเมื่อ 28 เม.ย. 2569",
  },
  {
    id: "ann-3",
    title: "อบรมการใช้งานระบบใหม่ (HR Self-Service)",
    subtitle: "วันที่ 16 พ.ค. 2569 เวลา 10:00 – 12:00 น.",
    postedLabel: "ประกาศเมื่อ 25 เม.ย. 2569",
  },
];
