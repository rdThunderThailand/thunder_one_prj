"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { EditIcon, FilterIcon, RepeatIcon } from "@/components/ui/icons";
import { STOCK_STATUS_COLOR, STOCK_STATUS_LABEL, inventoryItems, inventorySummary, inventoryUsageByCode, type InventoryItem } from "../mock-data";

// "คลังอะไหล่ / อุปกรณ์" — บริหารจัดการสต็อกอะไหล่และอุปกรณ์ของ Dispatcher
// (ผังหน้าจอที่ผู้ใช้ส่งมา 2569-09-08). แยกจาก Asset Intelligence's Asset —
// นี่คือ "ของที่ใช้ซ่อม" (อะไหล่/สต็อกสิ้นเปลือง) ไม่ใช่ "ของที่ติดตั้งอยู่ที่
// ลูกค้า" (asset).
function formatCurrency(amount: number): string {
  return amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const TABS = [
  { key: "all" as const, label: "ทั้งหมด" },
  { key: "available" as const, label: "พร้อมใช้งาน" },
  { key: "low" as const, label: "ใกล้หมดสต็อก" },
  { key: "out" as const, label: "หมดสต็อก" },
];

function filterItems(tab: (typeof TABS)[number]["key"]): InventoryItem[] {
  return tab === "all" ? inventoryItems : inventoryItems.filter((i) => i.status === tab);
}

function DetailPanel({ item }: { item: InventoryItem }) {
  const [tab, setTab] = useState<"general" | "history">("general");
  const usage = inventoryUsageByCode[item.code] ?? [];
  return (
    <Card className="flex flex-col gap-4 p-4">
      <div>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{item.code}</p>
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
          {item.name} <span className="text-xs text-zinc-400">{item.description}</span>
        </p>
        <Badge variant="pill" color={STOCK_STATUS_COLOR[item.status]} className="mt-1">
          {STOCK_STATUS_LABEL[item.status]}
        </Badge>
      </div>

      <div className="flex gap-1 border-b border-zinc-100 text-xs dark:border-zinc-800">
        {[
          { key: "general" as const, label: "ข้อมูลทั่วไป" },
          { key: "history" as const, label: "ประวัติการเคลื่อนไหว" },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-2 py-1.5 font-medium ${tab === t.key ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" : "border-transparent text-zinc-400"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "general" ? (
        <div className="flex flex-col gap-2.5 text-xs">
          <div>
            <p className="text-zinc-400">รหัสสินค้า</p>
            <p className="font-medium text-zinc-700 dark:text-zinc-200">{item.code}</p>
          </div>
          <div>
            <p className="text-zinc-400">หมวดหมู่</p>
            <p className="font-medium text-zinc-700 dark:text-zinc-200">{item.category}</p>
          </div>
          <div>
            <p className="text-zinc-400">คลัง</p>
            <p className="font-medium text-zinc-700 dark:text-zinc-200">{item.warehouse}</p>
          </div>
          <div>
            <p className="text-zinc-400">หน่วย</p>
            <p className="font-medium text-zinc-700 dark:text-zinc-200">{item.unit}</p>
          </div>
          <div>
            <p className="text-zinc-400">จำนวนคงเหลือ</p>
            <p className="font-medium text-zinc-700 dark:text-zinc-200">
              {item.quantity} {item.unit}
            </p>
          </div>
          <div>
            <p className="text-zinc-400">จุดสั่งซื้อใหม่ (ROP)</p>
            <p className="font-medium text-zinc-700 dark:text-zinc-200">
              {item.reorderPoint} {item.unit}
            </p>
          </div>
          <div>
            <p className="text-zinc-400">ราคา / หน่วย</p>
            <p className="font-medium text-zinc-700 dark:text-zinc-200">{formatCurrency(item.unitPrice)} บาท</p>
          </div>
          <div>
            <p className="text-zinc-400">มูลค่าคงเหลือ</p>
            <p className="font-medium text-zinc-700 dark:text-zinc-200">{formatCurrency(item.unitPrice * item.quantity)} บาท</p>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-2 text-xs">
          {usage.length === 0 ? (
            <li className="text-zinc-400">ยังไม่มีประวัติการใช้งานที่บันทึกไว้</li>
          ) : (
            usage.map((row) => (
              <li key={row.woId} className="flex items-center justify-between">
                <span className="font-medium text-indigo-600 dark:text-indigo-400">{row.woId}</span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  ใช้งาน {row.quantityUsed} {row.unit}
                </span>
                <span className="text-zinc-400">{row.dateLabel}</span>
              </li>
            ))
          )}
        </ul>
      )}

      <div className="flex flex-col gap-2">
        <Button variant="secondary" disabled title="ยังไม่เปิดใช้งาน">
          แก้ไขข้อมูล
        </Button>
        <Button variant="primary" disabled title="ยังไม่เปิดใช้งาน">
          <RepeatIcon className="h-3.5 w-3.5" /> ปรับสต็อก
        </Button>
      </div>
    </Card>
  );
}

export function InventoryPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["key"]>("all");
  const [selectedCode, setSelectedCode] = useState<string | null>(inventoryItems[0]?.code ?? null);
  const rows = filterItems(activeTab);
  const selected = inventoryItems.find((i) => i.code === selectedCode) ?? null;
  const summary = inventorySummary();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">คลังอะไหล่ / อุปกรณ์</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">บริหารจัดการสต็อกอะไหล่และอุปกรณ์ขององค์กร</p>
        </div>
        <Button variant="primary" disabled title="ยังไม่เปิดใช้งาน">
          + เพิ่มรายการ
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">มูลค่าสินค้าคงคลัง</p>
          <span className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400">{formatCurrency(summary.totalValue)}</span>
          <p className="text-xs text-zinc-400">บาท</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">รายการทั้งหมด</p>
          <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{summary.totalItems}</span>
          <p className="text-xs text-zinc-400">รายการ</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">พร้อมใช้งาน</p>
          <span className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{summary.available}</span>
          <p className="text-xs text-zinc-400">{Math.round((summary.available / summary.totalItems) * 100)}% ของทั้งหมด</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">ใกล้หมดสต็อก</p>
          <span className="text-2xl font-semibold text-amber-600 dark:text-amber-400">{summary.low}</span>
          <p className="text-xs text-zinc-400">รายการ</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">หมดสต็อก</p>
          <span className="text-2xl font-semibold text-red-600 dark:text-red-400">{summary.out}</span>
          <p className="text-xs text-zinc-400">รายการ</p>
        </Card>
      </div>

      <div className="flex gap-1 border-b border-zinc-100 dark:border-zinc-800">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {tab.label} {filterItems(tab.key).length}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput placeholder="ค้นหาอะไหล่ / อุปกรณ์, รหัสสินค้า..." className="max-w-sm" />
            {["หมวดหมู่: ทั้งหมด", "สถานะสต็อก: ทั้งหมด", "คลัง: คลังหลัก"].map((label) => (
              <select key={label} disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                <option>{label}</option>
              </select>
            ))}
            <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              <FilterIcon className="h-3.5 w-3.5" /> ตัวกรองเพิ่มเติม
            </button>
          </div>
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <tr>
                  <th className="w-8 px-2 py-2">
                    <input type="checkbox" className="rounded border-zinc-300" disabled title="ยังไม่เปิดใช้งาน" />
                  </th>
                  <th className="px-2 py-2 font-medium">รหัสสินค้า</th>
                  <th className="px-2 py-2 font-medium">รายการ / รายละเอียด</th>
                  <th className="px-2 py-2 font-medium">หมวดหมู่</th>
                  <th className="px-2 py-2 font-medium">คลัง</th>
                  <th className="px-2 py-2 font-medium">หน่วย</th>
                  <th className="px-2 py-2 font-medium">สถานะสต็อก</th>
                  <th className="px-2 py-2 font-medium">ราคา / หน่วย</th>
                  <th className="px-2 py-2 font-medium">มูลค่าคงเหลือ</th>
                  <th className="px-2 py-2 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {rows.map((item) => (
                  <tr
                    key={item.code}
                    onClick={() => setSelectedCode(item.code)}
                    className={`cursor-pointer ${selectedCode === item.code ? "bg-indigo-50/60 dark:bg-indigo-500/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"}`}
                  >
                    <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="rounded border-zinc-300" disabled title="ยังไม่เปิดใช้งาน" />
                    </td>
                    <td className="px-2 py-2 font-medium text-zinc-900 dark:text-zinc-50">{item.code}</td>
                    <td className="px-2 py-2 text-zinc-700 dark:text-zinc-200">
                      <p>{item.name}</p>
                      <p className="text-xs text-zinc-400">{item.description}</p>
                    </td>
                    <td className="px-2 py-2 text-zinc-600 dark:text-zinc-300">{item.category}</td>
                    <td className="px-2 py-2 text-zinc-600 dark:text-zinc-300">{item.warehouse}</td>
                    <td className="px-2 py-2 text-zinc-600 dark:text-zinc-300">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-2 py-2">
                      <Badge variant="pill" color={STOCK_STATUS_COLOR[item.status]}>
                        {STOCK_STATUS_LABEL[item.status]}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-xs text-zinc-500 dark:text-zinc-400">{formatCurrency(item.unitPrice)}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200">{formatCurrency(item.unitPrice * item.quantity)}</td>
                    <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                      <EditIcon className="h-3.5 w-3.5 text-zinc-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <p className="text-right text-xs text-zinc-400">แสดง 1-{rows.length} จาก {rows.length} รายการ</p>
        </div>
        <div className="lg:col-span-1">{selected ? <DetailPanel item={selected} /> : <Card className="p-10 text-center text-sm text-zinc-400">เลือกรายการเพื่อดูรายละเอียด</Card>}</div>
      </div>
    </div>
  );
}
