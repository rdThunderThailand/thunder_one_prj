import type { OrgUnitNode } from "@/features/people/org-structure";

// Non-JSX values shared across the 3 add-person wizards (Employee/
// Contractor/Bulk) and their extracted step components — extracted
// 2026-09-17 (readability audit) alongside the step split, so the option
// lists a step component renders are the same array reference the parent
// uses to pick a default `useState` value from (no duplicated literals to
// drift out of sync). Pure structural move — every value here is byte-for-
// byte what each wizard already had inline.

export const WORK_LOCATION_OPTIONS = ["สำนักงานใหญ่ (Bangkok Office)", "สาขาเชียงใหม่", "สาขาขอนแก่น", "ทำงานทางไกล (Remote)"];

/** Contractor + Bulk only — Employee has no duration field. */
export const DURATION_OPTIONS = ["3 เดือน", "6 เดือน", "12 เดือน", "ไม่ระบุ"];

/** Contractor only. */
export const PAYMENT_TYPE_OPTIONS = ["รายเดือน", "รายงวด", "เมื่อเสร็จงาน"];
/** Contractor only. */
export const PAYMENT_CYCLE_OPTIONS = ["สิ้นเดือน", "ทุก 15 วัน"];

/** Employee only. */
export const EMPLOYMENT_TYPE_OPTIONS = ["พนักงานประจำ (Permanent)", "ทดลองงาน (Probation)", "พนักงานรายวัน (Daily)", "สัญญาจ้าง (Contract)"];
/** Employee only. */
export const SALARY_BAND_OPTIONS = [
  "Band D (18,000 - 25,000)",
  "Band E (25,000 - 35,000)",
  "Band F (35,000 - 45,000)",
  "Band G (45,000 - 60,000)",
  "Band H (60,000 - 90,000)",
];

/** Bulk only — both the parent (slicing `people` into pages) and its step 2
 *  component (rendering each row's `#` index) need the same page size. */
export const ROWS_PER_PAGE = 5;

/** Same "Division / Team" convention as people/personnel's core-mapper.ts —
 *  a top-level unit's own name, everything below it prefixed with its
 *  parent's. Was duplicated identically in all 3 wizard files; both each
 *  wizard's parent (building NewHireRow.unit) and its step components
 *  (rendering the หน่วยงาน select/summary) need it. */
export function unitLabel(unitId: string, units: Record<string, OrgUnitNode>): string {
  const unit = units[unitId];
  if (!unit) return "-";
  const parent = unit.parentId ? units[unit.parentId] : null;
  return parent && parent.parentId ? `${parent.name} / ${unit.name}` : unit.name;
}
