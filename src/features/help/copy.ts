// Help chrome strings in both locales. Guide content lives in content/guides.ts; this file is only
// the frame around it. No i18n library exists in this repo, so Help carries its own small table.

import type { ContentType, Locale, WorkspaceKey } from "./types";

/** Canonical names from the spec, the same in both locales so the taxonomy never forks. */
export const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  "getting-started": "Getting Started",
  "how-to": "How-to",
  concept: "Concept & Explanation",
  troubleshooting: "Troubleshooting",
  reference: "Reference",
};

export const CONTENT_TYPE_HINT: Record<ContentType, Record<Locale, string>> = {
  "getting-started": { th: "เริ่มใช้งานครั้งแรก", en: "First steps" },
  "how-to": { th: "ทำงานทีละขั้นตอน", en: "Step-by-step tasks" },
  concept: { th: "แนวคิดและความหมาย", en: "Ideas and terms explained" },
  troubleshooting: { th: "แก้ปัญหาที่พบบ่อย", en: "Fix common problems" },
  reference: { th: "ข้อมูลอ้างอิง", en: "Facts to look up" },
};

export const WORKSPACE_LABEL: Record<WorkspaceKey, Record<Locale, string>> = {
  media: { th: "Media Workspace", en: "Media Workspace" },
  general: { th: "ทั่วไป", en: "General" },
};

export const LOCALE_NAME: Record<Locale, Record<Locale, string>> = {
  th: { th: "ภาษาไทย", en: "Thai" },
  en: { th: "ภาษาอังกฤษ", en: "English" },
};

const COPY = {
  helpCenter: { th: "ศูนย์ช่วยเหลือ", en: "Help Center" },
  heroTitle: { th: "เราช่วยอะไรคุณได้บ้าง?", en: "How can we help you?" },
  heroSubtitle: { th: "ค้นหาคู่มือ วิธีแก้ปัญหา และข้อมูลอ้างอิงของ ThunderOne", en: "Find guides, troubleshooting and reference for ThunderOne." },
  searchPlaceholder: { th: "ค้นหาในศูนย์ช่วยเหลือ…", en: "Search Help…" },
  searchLabel: { th: "ค้นหาความช่วยเหลือ", en: "Search help" },
  search: { th: "ค้นหา", en: "Search" },
  browseByWorkspace: { th: "เลือกดูตาม Workspace", en: "Browse by Workspace" },
  browseByType: { th: "เลือกดูตามประเภทเนื้อหา", en: "Browse by content type" },
  recommended: { th: "คู่มือแนะนำ", en: "Recommended guides" },
  viewAll: { th: "ดูคู่มือทั้งหมด", en: "View all guides" },
  guidesCount: { th: "{n} คู่มือ", en: "{n} guides" },
  guideCountOne: { th: "{n} คู่มือ", en: "{n} guide" },
  allGuides: { th: "คู่มือทั้งหมด", en: "All guides" },
  searchResults: { th: "ผลการค้นหา", en: "Search results" },
  resultsFor: { th: "{n} ผลลัพธ์สำหรับ “{q}”", en: "{n} results for “{q}”" },
  resultFor: { th: "{n} ผลลัพธ์สำหรับ “{q}”", en: "{n} result for “{q}”" },
  filters: { th: "ตัวกรอง", en: "Filters" },
  workspace: { th: "Workspace", en: "Workspace" },
  contentType: { th: "ประเภทเนื้อหา", en: "Content type" },
  all: { th: "ทั้งหมด", en: "All" },
  clearFilters: { th: "ล้างตัวกรอง", en: "Clear filters" },
  emptyQueryTitle: { th: "พิมพ์คำที่ต้องการค้นหา", en: "Type something to search" },
  emptyQueryText: { th: "หรือเลือกดูคู่มือจากหมวดด้านล่าง", en: "Or browse the guides below." },
  noResultsTitle: { th: "ไม่พบผลลัพธ์", en: "No results found" },
  noResultsText: { th: "ไม่พบคู่มือที่ตรงกับ “{q}”", en: "We couldn't find guides matching “{q}”." },
  noGuidesTitle: { th: "ยังไม่มีคู่มือในหมวดนี้", en: "No guides here yet" },
  noGuidesText: { th: "ยังไม่มีคู่มือที่เผยแพร่สำหรับตัวเลือกนี้", en: "There are no published guides for this selection yet." },
  tryThis: { th: "ลองวิธีนี้", en: "Try this" },
  trySpelling: { th: "ตรวจตัวสะกด หรือใช้คำที่เห็นบนหน้าจอ", en: "Check the spelling, or use the words you see on screen." },
  tryFewer: { th: "ใช้คำให้น้อยลงหรือกว้างขึ้น", en: "Use fewer or broader words." },
  tryBrowse: { th: "เลือกดูตาม Workspace หรือประเภทเนื้อหา", en: "Browse by Workspace or content type." },
  newSearch: { th: "ค้นหาใหม่", en: "New search" },
  browseGuides: { th: "เลือกดูคู่มือ", en: "Browse guides" },
  contactSupport: { th: "ติดต่อฝ่ายสนับสนุน", en: "Contact Support" },
  stillNeedHelp: { th: "ยังต้องการความช่วยเหลือ?", en: "Still need help?" },
  stillNeedHelpText: { th: "ติดต่อทีมสนับสนุนของเรา", en: "Our support team can help." },
  backToThunderOne: { th: "กลับไป ThunderOne", en: "Back to ThunderOne" },
  goToThunderOne: { th: "ไปที่ ThunderOne", en: "Go to ThunderOne" },
  onThisPage: { th: "ในบทความนี้", en: "In this article" },
  relatedGuides: { th: "คู่มือที่เกี่ยวข้อง", en: "Related guides" },
  troubleshooting: { th: "การแก้ปัญหา", en: "Troubleshooting" },
  updated: { th: "อัปเดต {date}", en: "Updated {date}" },
  language: { th: "ภาษา", en: "Language" },
  onlyIn: { th: "มีเฉพาะ{lang}", en: "{lang} only" },
  translationUnavailableTitle: { th: "ยังไม่มีคู่มือนี้เป็น{lang}", en: "This guide isn't available in {lang} yet" },
  translationUnavailableText: { th: "คู่มือ “{title}” มีให้อ่านเป็น{other}", en: "“{title}” is available in {other}." },
  readIn: { th: "อ่านเป็น{lang}", en: "Read in {lang}" },
  breadcrumb: { th: "เส้นทางนำทาง", en: "Breadcrumb" },
  // Unavailable / error (HLP-008)
  articleUnavailableTitle: { th: "คู่มือนี้ไม่พร้อมให้อ่าน", en: "This article is not available" },
  articleUnavailableText: { th: "คู่มืออาจถูกย้าย ปรับปรุง หรือเลิกใช้แล้ว ลองค้นหาคู่มือที่เกี่ยวข้อง", en: "It may have been moved, updated or retired. Try searching for a related guide." },
  openHelpCenter: { th: "เปิดศูนย์ช่วยเหลือ", en: "Open Help Center" },
  unableToLoadTitle: { th: "โหลดศูนย์ช่วยเหลือไม่สำเร็จ", en: "Unable to load Help Center" },
  unableToLoadText: { th: "เกิดปัญหาชั่วคราว ลองอีกครั้งในอีกสักครู่ งานใน ThunderOne ของคุณไม่ได้รับผลกระทบ", en: "There's a temporary problem. Try again in a moment. Your work in ThunderOne is not affected." },
  tryAgain: { th: "ลองอีกครั้ง", en: "Try again" },
  loading: { th: "กำลังโหลด", en: "Loading" },
  // Drawer (HLP-004)
  help: { th: "ความช่วยเหลือ", en: "Help" },
  helpForThisPage: { th: "ความช่วยเหลือสำหรับหน้านี้", en: "Help for this page" },
  helpGeneral: { th: "ความช่วยเหลือทั่วไป", en: "General help" },
  forThisPage: { th: "สำหรับหน้านี้", en: "For this page" },
  related: { th: "หัวข้อที่เกี่ยวข้อง", en: "Related" },
  searchHelp: { th: "ค้นหาความช่วยเหลือ…", en: "Search help…" },
  backToTopics: { th: "กลับไปหัวข้อของหน้านี้", en: "Back to topics for this page" },
  openInHelpCenter: { th: "เปิดในศูนย์ช่วยเหลือ", en: "Open in Help Center" },
  noHelpForPageTitle: { th: "ยังไม่มีคู่มือสำหรับหน้านี้", en: "No guides for this page yet" },
  noHelpForPageText: { th: "ลองค้นหา หรือเปิดศูนย์ช่วยเหลือเพื่อดูคู่มือทั้งหมด", en: "Search, or open the Help Center to see every guide." },
  drawerErrorTitle: { th: "โหลดความช่วยเหลือไม่สำเร็จ", en: "Unable to load help content" },
  drawerErrorText: { th: "หน้าที่คุณทำงานอยู่ไม่ได้รับผลกระทบ", en: "The page you are working on is not affected." },
  close: { th: "ปิด", en: "Close" },
} satisfies Record<string, Record<Locale, string>>;

export type CopyKey = keyof typeof COPY;

/** "1 guide" / "3 guides" — Thai has no plural form, English does. */
export function guideCount(n: number, locale: Locale): string {
  return t(n === 1 ? "guideCountOne" : "guidesCount", locale, { n });
}

/** `t("resultsFor", "en", { n: 3, q: "x" })` → "3 results for “x”". */
export function t(key: CopyKey, locale: Locale, vars: Record<string, string | number> = {}): string {
  return COPY[key][locale].replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}

export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" }).format(new Date(`${iso}T00:00:00+07:00`));
}
