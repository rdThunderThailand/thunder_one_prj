"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { SearchInput } from "@/components/ui/SearchInput";
import { EnvelopeIcon, FilterIcon, PhoneIcon } from "@/components/ui/icons";
import { TECH_STATUS_COLOR, TECH_STATUS_LABEL, technicianRows, technicianTeams } from "../mock-data";

// "ช่าง / ทีมของฉัน" — จัดการข้อมูลช่างและทีมที่อยู่ในความรับผิดชอบ (ผังหน้าจอ
// ที่ผู้ใช้ส่งมา 2569-09-08, persona Dispatcher).
export function TechniciansPage() {
  const [activeTab, setActiveTab] = useState<"tech" | "team">("tech");
  const [selectedName, setSelectedName] = useState<string | null>(technicianRows[0]?.name ?? null);
  const selected = technicianRows.find((t) => t.name === selectedName) ?? null;

  const working = technicianRows.filter((t) => t.status === "working").length;
  const available = technicianRows.filter((t) => t.status === "available").length;
  const unavailable = technicianRows.filter((t) => t.status === "unavailable").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">ช่าง / ทีมของฉัน</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">จัดการข้อมูลช่างและทีมที่อยู่ในความรับผิดชอบของคุณ</p>
        </div>
        <Button variant="primary" disabled title="ยังไม่เปิดใช้งาน">
          + เพิ่มช่าง / ทีม
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">ช่างทั้งหมด</p>
          <span className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400">{technicianRows.length} คน</span>
          <p className="text-xs text-zinc-400">Active {working + available} คน</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">ทีมทั้งหมด</p>
          <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{technicianTeams.length} ทีม</span>
          <p className="text-xs text-zinc-400">Active {technicianTeams.length - 1} ทีม</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">กำลังปฏิบัติงาน</p>
          <span className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{working} คน</span>
          <p className="text-xs text-zinc-400">{Math.round((working / technicianRows.length) * 100)}% ของทั้งหมด</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">ว่างงาน</p>
          <span className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{available} คน</span>
          <p className="text-xs text-zinc-400">{Math.round((available / technicianRows.length) * 100)}% ของทั้งหมด</p>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">อบรม / ไม่พร้อม</p>
          <span className="text-2xl font-semibold text-amber-600 dark:text-amber-400">{unavailable} คน</span>
          <p className="text-xs text-zinc-400">{Math.round((unavailable / technicianRows.length) * 100)}% ของทั้งหมด</p>
        </Card>
      </div>

      <div className="flex gap-1 border-b border-zinc-100 dark:border-zinc-800">
        {[
          { key: "tech" as const, label: `ช่าง (${technicianRows.length})` },
          { key: "team" as const, label: `ทีม (${technicianTeams.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "team" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {technicianTeams.map((team) => {
            const members = technicianRows.filter((t) => t.team === team);
            return (
              <Card key={team} className="flex flex-col gap-2 p-4">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{team}</p>
                <p className="text-xs text-zinc-400">{members.length} คน</p>
                <div className="flex -space-x-2">
                  {members.map((m) => (
                    <Avatar key={m.name} name={m.name} size={28} className="ring-2 ring-white dark:ring-zinc-900" />
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-3 lg:col-span-2">
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput placeholder="ค้นหาชื่อ, เบอร์โทร, ทักษะ..." className="max-w-xs" />
              {["สถานะ: ทั้งหมด", "ทักษะ: ทั้งหมด", "ทีม: ทั้งหมด"].map((label) => (
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
                    <th className="px-2 py-2 font-medium">ช่าง</th>
                    <th className="px-2 py-2 font-medium">ทีม</th>
                    <th className="px-2 py-2 font-medium">สถานะ</th>
                    <th className="px-2 py-2 font-medium">ทักษะหลัก</th>
                    <th className="px-2 py-2 font-medium">ตำแหน่งปัจจุบัน</th>
                    <th className="px-2 py-2 font-medium">การรอสาย</th>
                    <th className="px-2 py-2 font-medium">การติดต่อ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                  {technicianRows.map((tech) => (
                    <tr
                      key={tech.name}
                      onClick={() => setSelectedName(tech.name)}
                      className={`cursor-pointer ${selectedName === tech.name ? "bg-indigo-50/60 dark:bg-indigo-500/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"}`}
                    >
                      <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" className="rounded border-zinc-300" disabled title="ยังไม่เปิดใช้งาน" />
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          <Avatar name={tech.name} size={28} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">{tech.name}</p>
                            <p className="truncate text-xs text-zinc-400">{tech.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-zinc-600 dark:text-zinc-300">{tech.team}</td>
                      <td className="px-2 py-2">
                        <Badge variant="pill" color={TECH_STATUS_COLOR[tech.status]}>
                          {TECH_STATUS_LABEL[tech.status]}
                        </Badge>
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex flex-wrap gap-1">
                          {tech.skills.map((s) => (
                            <span key={s} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-zinc-600 dark:text-zinc-300">{tech.currentLocation}</td>
                      <td className="px-2 py-2 text-xs text-zinc-500 dark:text-zinc-400">{tech.busyHoursLabel}</td>
                      <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2 text-zinc-400">
                          <PhoneIcon className="h-3.5 w-3.5" />
                          <EnvelopeIcon className="h-3.5 w-3.5" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <p className="text-right text-xs text-zinc-400">แสดง 1-{technicianRows.length} จาก {technicianRows.length} รายการ</p>
          </div>

          <div className="lg:col-span-1">
            {selected ? (
              <Card className="flex flex-col gap-4 p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={selected.name} size={48} />
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">{selected.name}</p>
                    <p className="text-xs text-zinc-400">Technician</p>
                  </div>
                </div>
                <Badge variant="pill" color={TECH_STATUS_COLOR[selected.status]} className="w-fit">
                  {TECH_STATUS_LABEL[selected.status]}
                </Badge>
                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="h-3.5 w-3.5 text-zinc-400" /> {selected.phone}
                  </div>
                  <div>
                    <p className="text-zinc-400">อีเมล</p>
                    <p className="text-zinc-700 dark:text-zinc-200">{selected.email}</p>
                  </div>
                  <div>
                    <p className="text-zinc-400">ทักษะหลัก</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selected.skills.map((s) => (
                        <span key={s} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-zinc-400">ใบรับรอง</p>
                    <p className="text-zinc-700 dark:text-zinc-200">{selected.certifications.join(", ")}</p>
                  </div>
                  <div>
                    <p className="text-zinc-400">พื้นที่รับผิดชอบ</p>
                    <p className="text-zinc-700 dark:text-zinc-200">{selected.serviceArea}</p>
                  </div>
                  <div>
                    <p className="text-zinc-400">หมายเหตุ</p>
                    <p className="text-zinc-700 dark:text-zinc-200">{selected.notes}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="secondary" disabled title="ยังไม่เปิดใช้งาน">
                    ดูตารางงาน
                  </Button>
                  <Button variant="secondary" disabled title="ยังไม่เปิดใช้งาน">
                    มอบหมายงาน
                  </Button>
                  <button type="button" disabled title="ยังไม่เปิดใช้งาน" className="cursor-not-allowed rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-400 dark:border-red-500/30">
                    ปิดใช้งาน
                  </button>
                </div>
              </Card>
            ) : (
              <Card className="p-10 text-center text-sm text-zinc-400">เลือกช่างเพื่อดูรายละเอียด</Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
