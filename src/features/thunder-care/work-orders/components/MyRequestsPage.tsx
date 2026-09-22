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
                  ? "bg-red-500 text-white"
                  : done
                    ? "bg-emerald-500 text-white"
                    : current
                      ? "bg-indigo-500 text-white"
                      : "bg-zinc-200 dark:bg-zinc-700"
              }`}
            >
              {isCancelledStep ? <XIcon className="h-2.5 w-2.5" /> : done ? <CheckIcon className="h-2.5 w-2.5" /> : ""}
            </span>
            {i < steps.length - 1 && <span className="h-px w-3 bg-zinc-200 dark:bg-zinc-700" />}
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
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">คำขอของฉัน</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">ติดตามสถานะคำขอทั้งหมดของคุณ</p>
        </div>
        <Button variant="primary" disabled title="ยังไม่เปิดใช้งาน">
          + สร้างคำขอใหม่
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">ทั้งหมด</p>
          <span className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400">{myRequestSummary.total}</span>
          <p className="text-xs text-zinc-400">คำขอ</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">รอดำเนินการ</p>
          <span className="text-2xl font-semibold text-amber-600 dark:text-amber-400">{myRequestSummary.pending}</span>
          <p className="text-xs text-zinc-400">รอการอนุมัติ</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">กำลังดำเนินการ</p>
          <span className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{myRequestSummary.inProgress}</span>
          <p className="text-xs text-zinc-400">อยู่ระหว่างจัดเตรียม</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">เสร็จสิ้น</p>
          <span className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{myRequestSummary.done}</span>
          <p className="text-xs text-zinc-400">ดำเนินการแล้วเสร็จ</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">ยกเลิก</p>
          <span className="text-2xl font-semibold text-red-600 dark:text-red-400">{myRequestSummary.cancelled}</span>
          <p className="text-xs text-zinc-400">ยกเลิกการขอ</p>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="ค้นหาเลขที่คำขอ, อุปกรณ์, วัตถุประสงค์..." className="max-w-sm" />
        {["สถานะ: ทั้งหมด", "ประเภทคำขอ: ทั้งหมด"].map((label) => (
          <select key={label} disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            <option>{label}</option>
          </select>
        ))}
        <input disabled title="ยังไม่เปิดใช้งาน" readOnly value="01 พ.ค. 2568 - 21 พ.ค. 2568" className="cursor-not-allowed rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400" />
        <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          <FilterIcon className="h-3.5 w-3.5" /> ตัวกรอง
        </button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
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
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {myRequestRows.map((req) => (
              <tr key={req.id}>
                <td className="px-2 py-2 font-medium text-zinc-900 dark:text-zinc-50">{req.id}</td>
                <td className="px-2 py-2 text-zinc-700 dark:text-zinc-200">
                  <p className="text-xs text-indigo-500">{req.type}</p>
                  <p>{req.itemName}</p>
                </td>
                <td className="max-w-[220px] px-2 py-2 text-xs text-zinc-500 dark:text-zinc-400">{req.purpose}</td>
                <td className="whitespace-nowrap px-2 py-2 text-xs text-zinc-500 dark:text-zinc-400">{req.dateLabel}</td>
                <td className="px-2 py-2">
                  <Badge variant="pill" color={REQUEST_STATUS_COLOR[req.status]}>
                    {REQUEST_STATUS_LABEL[req.status]}
                  </Badge>
                </td>
                <td className="px-2 py-2">
                  <StepProgress steps={req.steps} currentStepIndex={req.currentStepIndex} cancelled={req.status === "cancelled"} />
                </td>
                <td className="px-2 py-2">
                  <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg border border-zinc-200 px-2.5 py-1 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                    ดูรายละเอียด
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="text-right text-xs text-zinc-400">แสดง 1-{myRequestRows.length} จาก {myRequestSummary.total} รายการ</p>
    </div>
  );
}
