"use client";

import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { FilterIcon } from "@/components/ui/icons";
import { mapJobPins, mapNearestTech } from "../mock-data";

// "แผนที่งาน (Map View)" — ตำแหน่งงานและช่างแบบเรียลไทม์ (ผังหน้าจอที่ผู้ใช้
// ส่งมา 2569-09-08, persona Dispatcher). ยังไม่ต่อ Mapbox จริง (ตามที่ระบุใน
// "เครื่องมือใช้" ของผัง Dispatcher — Map & Route Planning) — ตำแหน่งหมุดเป็น
// พิกัดจำลอง (`xPercent`/`yPercent`) วางบนพื้นหลังจำลองเท่านั้น.
const statusColor: Record<(typeof mapJobPins)[number]["status"], string> = {
  in_progress: "bg-success text-success-foreground",
  waiting: "bg-warning text-warning-foreground",
  unassigned: "bg-primary text-primary-foreground",
};

const statusLabel: Record<(typeof mapJobPins)[number]["status"], string> = {
  in_progress: "กำลังดำเนินการ",
  waiting: "รอเริ่มงาน",
  unassigned: "รอจัดสรร",
};

export function MapViewPage() {
  const inProgress = mapJobPins.filter((p) => p.status === "in_progress").length;
  const waiting = mapJobPins.filter((p) => p.status === "waiting").length;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">แผนที่งาน</h1>
        <p className="text-sm text-muted-foreground">ดูตำแหน่งงานและช่างแบบเรียลไทม์</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">งานทั้งหมดบนแผนที่</p>
          <span className="text-2xl font-semibold text-primary">{mapJobPins.length}</span>
          <p className="text-xs text-t1-gray-400">รายการ</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">กำลังดำเนินการ</p>
          <span className="text-2xl font-semibold text-t1-green-700">{inProgress}</span>
          <p className="text-xs text-t1-gray-400">รายการ</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">รอเริ่มงาน (นัดหมายแล้ว)</p>
          <span className="text-2xl font-semibold text-t1-amber-700">{waiting}</span>
          <p className="text-xs text-t1-gray-400">รายการ</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">ช่างออนไลน์</p>
          <span className="text-2xl font-semibold text-foreground">18 คน</span>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-muted-foreground">ช่างออฟไลน์</p>
          <span className="text-2xl font-semibold text-t1-gray-400">4 คน</span>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
          <FilterIcon className="h-3.5 w-3.5" /> ตัวกรอง
        </button>
        <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <input type="checkbox" className="rounded border-border" disabled title="ยังไม่เปิดใช้งาน" defaultChecked />
          แสดงช่าง
        </label>
        <select disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
          <option>ทั้งหมด</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="relative h-[420px] overflow-hidden bg-muted lg:col-span-2">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.08),transparent_60%)]" />
          {mapJobPins.map((pin) => (
            <div
              key={pin.woId}
              title={`${pin.woId} · ${pin.title}`}
              style={{ left: `${pin.xPercent}%`, top: `${pin.yPercent}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold shadow ${statusColor[pin.status]}`}>
                {mapJobPins.indexOf(pin) + 1}
              </span>
            </div>
          ))}
          <div className="absolute bottom-3 left-3 flex gap-3 rounded-lg bg-card/90 px-3 py-1.5 text-[11px] text-muted-foreground shadow">
            {(["in_progress", "waiting", "unassigned"] as const).map((s) => (
              <span key={s} className="flex items-center gap-1">
                <span className={`h-2 w-2 rounded-full ${statusColor[s]}`} /> {statusLabel[s]}
              </span>
            ))}
          </div>
        </Card>

        <div className="flex flex-col gap-4 lg:col-span-1">
          <Card className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">งานบนแผนที่ ({mapJobPins.length})</h2>
              <span className="text-xs font-medium text-primary">ดูทั้งหมด</span>
            </div>
            <ul className="flex flex-col gap-3">
              {mapJobPins.map((pin, i) => (
                <li key={pin.woId} className="flex items-start gap-2.5">
                  <span className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold ${statusColor[pin.status]}`}>
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {pin.woId} / {pin.ticketId}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{statusLabel[pin.status]}</p>
                    <p className="truncate text-xs text-t1-gray-400">
                      {pin.mode} · ช่าง: {pin.assignee}
                    </p>
                    <p className="text-xs text-t1-gray-400">{pin.timeRangeLabel}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="flex items-center gap-3 p-4">
            <Avatar name={mapNearestTech.name} size={36} />
            <div className="min-w-0">
              <p className="text-xs text-t1-gray-400">ช่างที่ใกล้ที่สุด</p>
              <p className="truncate text-sm font-medium text-foreground">{mapNearestTech.name}</p>
              <p className="text-xs text-t1-gray-400">{mapNearestTech.distanceLabel}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
