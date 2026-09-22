import { TriagePage } from "@/features/thunder-care/service-ops";

interface TriageRouteProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// Thunder Care — Triage (ขั้นตอนที่ 2-3 ของ "ผังการใช้งาน Service Operator").
// `?case=` มาจากปุ่ม "Triage" ในตารางของหน้าหลัก — เลือกเคสนั้นให้อัตโนมัติ
// ถ้าเข้าหน้านี้ตรงๆ (ไม่มี query) จะเลือกเคสแรกที่ยังไม่ถูกส่งให้เอง
export default async function TriageRoute({ searchParams }: TriageRouteProps) {
  const sp = await searchParams;
  const caseId = firstParam(sp.case);
  return <TriagePage initialCaseId={caseId} />;
}
