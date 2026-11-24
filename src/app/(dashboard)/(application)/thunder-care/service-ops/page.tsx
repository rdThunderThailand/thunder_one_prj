import { ServiceOpsPage } from "@/features/thunder-care/service-ops";

// Thunder Care — "หน้าหลัก" ของ Service Operator (แทนที่ "Customer Health"
// เดิม, redesign ตามผังหน้าจอ Service Operator ที่ผู้ใช้ส่งมา 2569-09-08) —
// ไม่ใช้ PageHeader ทั่วไปเพราะ ServiceOpsPage มี greeting header ของตัวเองอยู่แล้ว
// ตรงตามดีไซน์ใหม่.
export default function ServiceOpsRoute() {
  return <ServiceOpsPage />;
}
