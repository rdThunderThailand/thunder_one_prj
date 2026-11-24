import type { CustomerStatus, CustomerType, RenewalStatus } from "./mock-data";

export const CUSTOMER_STATUS_LABEL: Record<CustomerStatus, string> = {
  overdue: "เกินกำหนด",
  near: "ใกล้ครบกำหนด",
  normal: "ปกติ",
};

export const CUSTOMER_STATUS_CLASSES: Record<CustomerStatus, string> = {
  overdue: "bg-error-muted text-t1-red-700",
  near: "bg-warning-muted text-t1-amber-700",
  normal: "bg-success-muted text-t1-green-700",
};

export const CUSTOMER_TYPE_LABEL: Record<CustomerType, string> = {
  direct: "ลูกค้าทางตรง",
  government: "ภาครัฐ",
  medical: "การแพทย์",
};

export const CUSTOMER_TYPE_CLASSES: Record<CustomerType, string> = {
  direct: "bg-accent text-primary",
  government: "bg-in-progress-muted text-t1-purple-700",
  medical: "bg-success-muted text-t1-green-700",
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
  overdue: "bg-error-muted text-t1-red-700",
  near: "bg-warning-muted text-t1-amber-700",
  normal: "bg-success-muted text-t1-green-700",
  "in-progress": "bg-info-muted text-t1-blue-700",
  done: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-t1-gray-400",
};
