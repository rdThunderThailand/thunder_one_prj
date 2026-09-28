import type { CustomerStatus, CustomerType, RenewalStatus } from "./mock-data";

export const CUSTOMER_STATUS_LABEL: Record<CustomerStatus, string> = {
  overdue: "เกินกำหนด",
  near: "ใกล้ครบกำหนด",
  normal: "ปกติ",
};

export const CUSTOMER_STATUS_CLASSES: Record<CustomerStatus, string> = {
  overdue: "bg-red-50 text-red-600",
  near: "bg-amber-50 text-amber-600",
  normal: "bg-emerald-50 text-emerald-600",
};

export const CUSTOMER_TYPE_LABEL: Record<CustomerType, string> = {
  direct: "ลูกค้าทางตรง",
  government: "ภาครัฐ",
  medical: "การแพทย์",
};

export const CUSTOMER_TYPE_CLASSES: Record<CustomerType, string> = {
  direct: "bg-indigo-50 text-indigo-600",
  government: "bg-purple-50 text-purple-600",
  medical: "bg-teal-50 text-teal-600",
};

export const RENEWAL_STATUS_LABEL: Record<RenewalStatus, string> = {
  overdue: "เกินกำหนด",
  near: "ใกล้ครบกำหนด",
  normal: "ปกติ",
  "in-progress": "อยู่ระหว่างดำเนินการ",
  done: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};

export const RENEWAL_STATUS_CLASSES: Record<RenewalStatus, string> = {
  overdue: "bg-red-50 text-red-600",
  near: "bg-amber-50 text-amber-600",
  normal: "bg-emerald-50 text-emerald-600",
  "in-progress": "bg-blue-50 text-blue-600",
  done: "bg-zinc-100 text-zinc-600",
  cancelled: "bg-zinc-100 text-zinc-400",
};
