import { TechnicianHomePage } from "@/features/thunder-care/work-orders";

// Thunder Care — "หน้าหลัก" ของ Technician (แทนที่ "My Work" เดิม, redesign
// ตามผัง "Technician Workflow: Web ↔ Mobile" ที่ผู้ใช้ส่งมา 2569-09-08) — ไม่
// ใช้ PageHeader ทั่วไปเพราะ TechnicianHomePage มี greeting header ของตัวเอง
// อยู่แล้ว ตรงตามดีไซน์ใหม่ (เดียวกับ thunder-care/service-ops's ServiceOpsPage).
export default function WorkOrdersRoute() {
  return <TechnicianHomePage />;
}
