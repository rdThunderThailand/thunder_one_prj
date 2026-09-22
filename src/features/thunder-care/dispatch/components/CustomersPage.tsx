"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { EditIcon, EyeIcon, FilterIcon, MoreIcon } from "@/components/ui/icons";
import { customerRecords, customerSummary, type CustomerRecord } from "../mock-data";

// "ลูกค้า" — ข้อมูลลูกค้าทั้งหมดของบริษัท (ผังหน้าจอที่ผู้ใช้ส่งมา
// 2569-09-08, persona Dispatcher). แทนที่ thunder-care/service-ops's
// CustomersPage เดิม (English health-score placeholder) ทั้งหมด — โครงสร้าง
// ข้อมูลคนละชุดกันเลย (ของใหม่เป็น CRM เต็มรูปแบบ: เลขผู้เสียภาษี, ผู้ติดต่อ,
// ยอดค้างชำระ ฯลฯ) ดู mock-data.ts's `customerRecords`.
function formatCurrency(amount: number): string {
  return amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function StatsRow() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">ลูกค้าทั้งหมด</p>
        <span className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400">{customerSummary.total} ราย</span>
        <p className="text-xs text-zinc-400">
          Active {customerSummary.active} ราย · Inactive {customerSummary.inactive} ราย
        </p>
      </Card>
      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">องค์กร / บริษัท</p>
        <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{customerSummary.organizations} ราย</span>
        <p className="text-xs text-zinc-400">{Math.round((customerSummary.organizations / customerSummary.total) * 100)}% ของทั้งหมด</p>
      </Card>
      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">หน่วยงาน / สาขา</p>
        <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{customerSummary.branches} ราย</span>
        <p className="text-xs text-zinc-400">{Math.round((customerSummary.branches / customerSummary.total) * 100)}% ของทั้งหมด</p>
      </Card>
      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">ผู้ติดต่อ</p>
        <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{customerSummary.contacts} ราย</span>
        <p className="text-xs text-zinc-400">จากลูกค้าทั้งหมด</p>
      </Card>
      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">ค้างชำระ</p>
        <span className="text-2xl font-semibold text-red-600 dark:text-red-400">{customerSummary.overdueCount} ราย</span>
        <p className="text-xs text-zinc-400">รวม {formatCurrency(customerSummary.overdueTotal)} บาท</p>
      </Card>
    </div>
  );
}

function DetailPanel({ customer }: { customer: CustomerRecord }) {
  const [tab, setTab] = useState<"general" | "contacts" | "history">("general");
  return (
    <Card className="flex flex-col gap-4 p-4">
      <div>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{customer.code}</p>
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{customer.name}</p>
        <Badge variant="pill" color={customer.status === "active" ? "green" : "zinc"} className="mt-1">
          {customer.status === "active" ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="flex gap-1 border-b border-zinc-100 text-xs dark:border-zinc-800">
        {[
          { key: "general" as const, label: "ข้อมูลทั่วไป" },
          { key: "contacts" as const, label: "ผู้ติดต่อ" },
          { key: "history" as const, label: "ประวัติการใช้บริการ" },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-2 py-1.5 font-medium ${
              tab === t.key ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" : "border-transparent text-zinc-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <div className="flex flex-col gap-2.5 text-xs">
          <div>
            <p className="text-zinc-400">ประเภทลูกค้า</p>
            <p className="font-medium text-zinc-700 dark:text-zinc-200">{customer.type}</p>
          </div>
          <div>
            <p className="text-zinc-400">เลขประจำตัวผู้เสียภาษี</p>
            <p className="font-medium text-zinc-700 dark:text-zinc-200">{customer.taxId}</p>
          </div>
          <div>
            <p className="text-zinc-400">ที่อยู่</p>
            <p className="font-medium text-zinc-700 dark:text-zinc-200">{customer.address}</p>
          </div>
          <div>
            <p className="text-zinc-400">เบอร์โทรศัพท์</p>
            <p className="font-medium text-zinc-700 dark:text-zinc-200">{customer.phone}</p>
          </div>
          <div>
            <p className="text-zinc-400">อีเมล</p>
            <p className="font-medium text-zinc-700 dark:text-zinc-200">{customer.email}</p>
          </div>
          <div>
            <p className="text-zinc-400">วันที่เป็นลูกค้า</p>
            <p className="font-medium text-zinc-700 dark:text-zinc-200">{customer.customerSinceLabel}</p>
          </div>
          <div>
            <p className="text-zinc-400">ระดับความสำคัญ</p>
            <p className="font-medium text-zinc-700 dark:text-zinc-200">{customer.priorityLevel}</p>
          </div>
          <div>
            <p className="text-zinc-400">หมายเหตุ</p>
            <p className="font-medium text-zinc-700 dark:text-zinc-200">{customer.notes}</p>
          </div>
        </div>
      )}
      {tab === "contacts" && (
        <div className="text-xs text-zinc-600 dark:text-zinc-300">
          <p className="font-medium text-zinc-900 dark:text-zinc-50">{customer.contactName}</p>
          <p className="text-zinc-400">{customer.contactRole}</p>
          <p className="mt-1">{customer.phone}</p>
        </div>
      )}
      {tab === "history" && <p className="text-xs text-zinc-400">ยังไม่มีประวัติการใช้บริการที่บันทึกไว้</p>}

      <div className="flex flex-col gap-2">
        <Button variant="secondary" disabled title="ยังไม่เปิดใช้งาน">
          ดูประวัติการใช้บริการ
        </Button>
        <Button variant="primary" disabled title="ยังไม่เปิดใช้งาน">
          แก้ไขข้อมูลลูกค้า
        </Button>
      </div>
    </Card>
  );
}

export function CustomersPage() {
  const [selectedCode, setSelectedCode] = useState<string | null>(customerRecords[0]?.code ?? null);
  const selected = customerRecords.find((c) => c.code === selectedCode) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">ลูกค้า</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">ข้อมูลลูกค้าทั้งหมดของบริษัท</p>
        </div>
        <Button variant="primary" disabled title="ยังไม่เปิดใช้งาน">
          + เพิ่มลูกค้า
        </Button>
      </div>

      <StatsRow />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput placeholder="ค้นหาชื่อลูกค้า, บริษัท, เบอร์โทร, อีเมล..." className="max-w-sm" />
            {["ประเภทลูกค้า: ทั้งหมด", "สถานะ: ทั้งหมด", "พื้นที่: ทั้งหมด", "ระดับความสำคัญ: ทั้งหมด"].map((label) => (
              <select key={label} disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                <option>{label}</option>
              </select>
            ))}
            <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              <FilterIcon className="h-3.5 w-3.5" /> ตัวกรองเพิ่มเติม
            </button>
          </div>
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <tr>
                  <th className="w-8 px-2 py-2">
                    <input type="checkbox" className="rounded border-zinc-300" disabled title="ยังไม่เปิดใช้งาน" />
                  </th>
                  <th className="px-2 py-2 font-medium">รหัสลูกค้า</th>
                  <th className="px-2 py-2 font-medium">ชื่อลูกค้า</th>
                  <th className="px-2 py-2 font-medium">ประเภท</th>
                  <th className="px-2 py-2 font-medium">พื้นที่</th>
                  <th className="px-2 py-2 font-medium">ผู้ติดต่อหลัก</th>
                  <th className="px-2 py-2 font-medium">เบอร์โทร</th>
                  <th className="px-2 py-2 font-medium">สถานะ</th>
                  <th className="px-2 py-2 font-medium">ยอดค้างชำระ</th>
                  <th className="px-2 py-2 font-medium">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {customerRecords.map((row) => (
                  <tr
                    key={row.code}
                    onClick={() => setSelectedCode(row.code)}
                    className={`cursor-pointer ${selectedCode === row.code ? "bg-indigo-50/60 dark:bg-indigo-500/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"}`}
                  >
                    <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="rounded border-zinc-300" disabled title="ยังไม่เปิดใช้งาน" />
                    </td>
                    <td className="px-2 py-2 font-medium text-zinc-900 dark:text-zinc-50">{row.code}</td>
                    <td className="px-2 py-2 text-zinc-700 dark:text-zinc-200">{row.name}</td>
                    <td className="px-2 py-2 text-zinc-600 dark:text-zinc-300">{row.type}</td>
                    <td className="px-2 py-2 text-zinc-600 dark:text-zinc-300">{row.area}</td>
                    <td className="px-2 py-2 text-zinc-600 dark:text-zinc-300">
                      <p>{row.contactName}</p>
                      <p className="text-xs text-zinc-400">{row.contactRole}</p>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-xs text-zinc-500 dark:text-zinc-400">{row.phone}</td>
                    <td className="px-2 py-2">
                      <Badge variant="dot" color={row.status === "active" ? "green" : "zinc"}>
                        {row.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className={`px-2 py-2 text-xs font-medium ${row.outstandingBalance > 0 ? "text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                      {formatCurrency(row.outstandingBalance)}
                    </td>
                    <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2 text-zinc-400">
                        <EyeIcon className="h-3.5 w-3.5" />
                        <EditIcon className="h-3.5 w-3.5" />
                        <MoreIcon className="h-3.5 w-3.5" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <p className="text-right text-xs text-zinc-400">แสดง 1-{customerRecords.length} จาก {customerSummary.total} รายการ</p>
        </div>
        <div className="lg:col-span-1">{selected ? <DetailPanel customer={selected} /> : <Card className="p-10 text-center text-sm text-zinc-400">เลือกลูกค้าเพื่อดูรายละเอียด</Card>}</div>
      </div>
    </div>
  );
}
