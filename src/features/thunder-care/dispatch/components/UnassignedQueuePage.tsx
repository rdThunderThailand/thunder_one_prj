"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterIcon, RepeatIcon } from "@/components/ui/icons";
import { UNASSIGNED_STATUS_LABEL, unassignedRows, type UnassignedRow } from "../mock-data";
import { priorityBadge } from "../status-colors";

// "งานรอจัดสรร" — คิวงานที่ยังไม่ได้จัดสรรให้ช่าง/ทีม/Vendor (ผังหน้าจอที่
// ผู้ใช้ส่งมา 2569-09-08, persona Dispatcher). ปุ่มจัดการทั้งหมด (สร้าง Work
// Order, จัดสรรงาน, เปลี่ยนผู้รับผิดชอบ ฯลฯ) เป็น mock ปิดใช้งาน — ยังไม่มี
// backend จริง เหมือนทุกหน้าอื่นในชุดนี้.
const statusTagColor: Record<UnassignedRow["status"], "indigo" | "yellow" | "red"> = {
  pending_triage: "indigo",
  waiting_info: "yellow",
  duplicate: "red",
};

function StatsRow() {
  const overSla = unassignedRows.filter((r) => r.status !== "waiting_info").length; // placeholder count, mock only
  const nearSla = 2;
  const withinSla = unassignedRows.length - overSla - nearSla > 0 ? unassignedRows.length - overSla - nearSla : 13;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-muted-foreground">ทั้งหมด</p>
        <span className="text-2xl font-semibold text-primary">18</span>
        <p className="text-xs text-t1-gray-400">รายการ</p>
      </Card>
      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-muted-foreground">เกิน SLA</p>
        <span className="text-2xl font-semibold text-t1-red-700">3</span>
        <p className="text-xs text-error">รายการ · เกิน SLA &gt; 30 นาที</p>
      </Card>
      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-muted-foreground">ใกล้เกิน SLA</p>
        <span className="text-2xl font-semibold text-t1-amber-700">{nearSla}</span>
        <p className="text-xs text-warning">รายการ · ภายใน 30 นาที</p>
      </Card>
      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-muted-foreground">ภายใน SLA</p>
        <span className="text-2xl font-semibold text-foreground">{withinSla}</span>
        <p className="text-xs text-t1-gray-400">รายการ</p>
      </Card>
      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-muted-foreground">รอข้อมูลเพิ่มเติม</p>
        <span className="text-2xl font-semibold text-foreground">2</span>
        <p className="text-xs text-t1-gray-400">รายการ</p>
      </Card>
      <Card className="flex flex-col justify-between p-4">
        <p className="text-xs text-muted-foreground">อัปเดตล่าสุด</p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">09:25 น.</span>
          <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed text-t1-gray-400">
            <RepeatIcon className="h-4 w-4" />
          </button>
        </div>
      </Card>
    </div>
  );
}

function ActionBar() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
        + สร้าง Work Order
      </button>
      {["จัดสรรงาน", "เปลี่ยนผู้รับผิดชอบ", "เปลี่ยน Priority", "..."].map((label) => (
        <button key={label} type="button" disabled title="เลือกงานก่อน" className="cursor-not-allowed rounded-lg border border-border px-3 py-2 text-sm text-t1-gray-400">
          {label}
        </button>
      ))}
      <select disabled title="ยังไม่เปิดใช้งาน" className="ml-auto cursor-not-allowed rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
        <option>เรียงตาม: เวลาแจ้ง (เก่า → ใหม่)</option>
      </select>
      <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
        <FilterIcon className="h-3.5 w-3.5" /> ตัวกรอง
      </button>
    </div>
  );
}

function FilterSidebar() {
  const filters = ["Priority", "ประเภทปัญหา", "ลูกค้า", "สถานที่", "Asset / อุปกรณ์"];
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">ตัวกรองเพิ่มเติม</h2>
        <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed text-xs text-t1-gray-400">
          ล้างค่า
        </button>
      </div>
      {filters.map((label) => (
        <label key={label} className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          {label}
          <select disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
            <option>ทั้งหมด</option>
          </select>
        </label>
      ))}
      <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
        ช่วงเวลาแจ้ง
        <input disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground" value="21/05/2569 - 21/05/2569" readOnly />
      </label>
      <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
        ค้นหา
      </button>
      <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg border border-border px-4 py-2 text-sm text-t1-gray-400">
        ล้าง
      </button>
    </Card>
  );
}

export function UnassignedQueuePage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">งานรอจัดสรร</h1>
        <p className="text-sm text-muted-foreground">รายการงานที่รอการจัดสรรให้ช่าง / ทีม / Vendor</p>
      </div>

      <StatsRow />
      <ActionBar />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="flex flex-col gap-3 lg:col-span-3">
          <SearchInput placeholder="ค้นหา Ticket, Asset, Serial, สถานที่, ผู้แจ้ง..." />
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>
                  <th className="w-8 px-2 py-2">
                    <input type="checkbox" className="rounded border-border" disabled title="ยังไม่เปิดใช้งาน" />
                  </th>
                  <th className="px-2 py-2 font-medium">เลขที่เรื่อง</th>
                  <th className="px-2 py-2 font-medium">ประเภทปัญหา</th>
                  <th className="px-2 py-2 font-medium">Asset / อุปกรณ์</th>
                  <th className="px-2 py-2 font-medium">สถานที่</th>
                  <th className="px-2 py-2 font-medium">ผู้แจ้ง</th>
                  <th className="px-2 py-2 font-medium">เวลาแจ้ง</th>
                  <th className="px-2 py-2 font-medium">ความเร่งด่วน</th>
                  <th className="px-2 py-2 font-medium">SLA</th>
                  <th className="px-2 py-2 font-medium">สถานะ</th>
                  <th className="px-2 py-2 font-medium">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {unassignedRows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-2 py-2">
                      <input type="checkbox" className="rounded border-border" disabled title="ยังไม่เปิดใช้งาน" />
                    </td>
                    <td className="px-2 py-2">
                      <p className="font-medium text-foreground">{row.id}</p>
                      <p className="text-[11px] text-primary">{row.statusTagLabel}</p>
                    </td>
                    <td className="px-2 py-2 text-foreground">
                      <p>{row.issueTitle}</p>
                      <p className="text-xs text-t1-gray-400">{row.issueCategory}</p>
                    </td>
                    <td className="px-2 py-2 text-muted-foreground">
                      <p>{row.assetTag}</p>
                      <p className="text-xs text-t1-gray-400">{row.assetLabel}</p>
                    </td>
                    <td className="px-2 py-2 text-muted-foreground">{row.locationLabel}</td>
                    <td className="px-2 py-2 text-muted-foreground">{row.reporterName}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-xs text-muted-foreground">{row.reportedAtLabel}</td>
                    <td className="px-2 py-2">
                      <Badge variant="pill" color={priorityBadge[row.priority].color}>
                        {priorityBadge[row.priority].label}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-xs font-medium text-muted-foreground">{row.slaRemainingLabel}</td>
                    <td className="px-2 py-2">
                      <Badge variant="pill" color={statusTagColor[row.status]}>
                        {UNASSIGNED_STATUS_LABEL[row.status]}
                      </Badge>
                    </td>
                    <td className="px-2 py-2">
                      <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground">
                        {row.status === "waiting_info" ? "ดูรายละเอียด" : row.status === "duplicate" ? "ตรวจสอบเพิ่มเติม" : "ตรวจสอบ"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <p className="text-right text-xs text-t1-gray-400">แสดง 1-{unassignedRows.length} จาก 18 รายการ</p>
        </div>
        <div className="lg:col-span-1">
          <FilterSidebar />
        </div>
      </div>
    </div>
  );
}
