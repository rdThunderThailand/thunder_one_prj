"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { CheckIcon, FilterIcon, XIcon } from "@/components/ui/icons";
import { REQUEST_STATUS_COLOR, REQUEST_STATUS_LABEL, myRequestRows, myRequestSummary } from "../mock-data";

// "คำขอของฉัน" — ติดตามคำขออุปกรณ์/ของยืม/สนับสนุนช่าง/เอกสารของ Technician
// (ผังหน้าจอที่ผู้ใช้ส่งมา 2569-09-08).
function StepProgress({ steps, currentStepIndex, cancelled }: { steps: string[]; currentStepIndex: number; cancelled: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => {
        const isCancelledStep = cancelled && i === currentStepIndex;
        const done = i < currentStepIndex && !isCancelledStep;
        const current = i === currentStepIndex;
        return (
          <div key={step} className="flex items-center gap-1">
            <span
              title={step}
              className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${
                isCancelledStep
                  ? "bg-error text-error-foreground"
                  : done
                    ? "bg-success text-success-foreground"
                    : current
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
              }`}
            >
              {isCancelledStep ? <XIcon className="h-2.5 w-2.5" /> : done ? <CheckIcon className="h-2.5 w-2.5" /> : ""}
            </span>
            {i < steps.length - 1 && <span className="h-px w-3 bg-muted" />}
          </div>
        );
      })}
    </div>
  );
}

export function MyRequestsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">คำขอของฉัน</h1>
          <p className="text-sm text-muted-foreground">ติดตามสถานะคำขอทั้งหมดของคุณ</p>
        </div>
        <Button variant="primary" disabled title="ยังไม่เปิดใช้งาน">
          + สร้างคำขอใหม่
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">ทั้งหมด</p>
          <span className="text-2xl font-semibold text-primary">{myRequestSummary.total}</span>
          <p className="text-xs text-t1-gray-400">คำขอ</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">รอดำเนินการ</p>
          <span className="text-2xl font-semibold text-t1-amber-700">{myRequestSummary.pending}</span>
          <p className="text-xs text-t1-gray-400">รอการอนุมัติ</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">กำลังดำเนินการ</p>
          <span className="text-2xl font-semibold text-t1-blue-700">{myRequestSummary.inProgress}</span>
          <p className="text-xs text-t1-gray-400">อยู่ระหว่างจัดเตรียม</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">เสร็จสิ้น</p>
          <span className="text-2xl font-semibold text-t1-green-700">{myRequestSummary.done}</span>
          <p className="text-xs text-t1-gray-400">ดำเนินการแล้วเสร็จ</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">ยกเลิก</p>
          <span className="text-2xl font-semibold text-t1-red-700">{myRequestSummary.cancelled}</span>
          <p className="text-xs text-t1-gray-400">ยกเลิกการขอ</p>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="ค้นหาเลขที่คำขอ, อุปกรณ์, วัตถุประสงค์..." className="max-w-sm" />
        {["สถานะ: ทั้งหมด", "ประเภทคำขอ: ทั้งหมด"].map((label) => (
          <select key={label} disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
            <option>{label}</option>
          </select>
        ))}
        <input disabled title="ยังไม่เปิดใช้งาน" readOnly value="01 พ.ค. 2568 - 21 พ.ค. 2568" className="cursor-not-allowed rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground" />
        <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
          <FilterIcon className="h-3.5 w-3.5" /> ตัวกรอง
        </button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr>
              <th className="px-2 py-2 font-medium">เลขที่คำขอ</th>
              <th className="px-2 py-2 font-medium">ประเภทคำขอ / อุปกรณ์</th>
              <th className="px-2 py-2 font-medium">วัตถุประสงค์</th>
              <th className="px-2 py-2 font-medium">วันที่ขอ</th>
              <th className="px-2 py-2 font-medium">สถานะ</th>
              <th className="px-2 py-2 font-medium">ลำดับขั้นตอน</th>
              <th className="px-2 py-2 font-medium">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {myRequestRows.map((req) => (
              <tr key={req.id}>
                <td className="px-2 py-2 font-medium text-foreground">{req.id}</td>
                <td className="px-2 py-2 text-foreground">
                  <p className="text-xs text-primary">{req.type}</p>
                  <p>{req.itemName}</p>
                </td>
                <td className="max-w-[220px] px-2 py-2 text-xs text-muted-foreground">{req.purpose}</td>
                <td className="whitespace-nowrap px-2 py-2 text-xs text-muted-foreground">{req.dateLabel}</td>
                <td className="px-2 py-2">
                  <Badge variant="pill" color={REQUEST_STATUS_COLOR[req.status]}>
                    {REQUEST_STATUS_LABEL[req.status]}
                  </Badge>
                </td>
                <td className="px-2 py-2">
                  <StepProgress steps={req.steps} currentStepIndex={req.currentStepIndex} cancelled={req.status === "cancelled"} />
                </td>
                <td className="px-2 py-2">
                  <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground">
                    ดูรายละเอียด
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="text-right text-xs text-t1-gray-400">แสดง 1-{myRequestRows.length} จาก {myRequestSummary.total} รายการ</p>
    </div>
  );
}
