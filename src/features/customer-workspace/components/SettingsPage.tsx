"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, BellIcon, CalendarIcon, ChevronDownIcon, ClockIcon, GlobeIcon, SettingsIcon, UsersIcon } from "@/components/ui/icons";
import { currentUserName, customerStats, usageStats } from "../mock-data";
import { WorkspaceFooter } from "./WorkspaceFooter";

type SettingsTab = "general" | "access" | "connections" | "more";

const TABS: { key: SettingsTab; label: string; icon: typeof SettingsIcon; comingSoon?: boolean }[] = [
  { key: "general", label: "ทั่วไป", icon: SettingsIcon },
  { key: "access", label: "การเข้าถึงและสิทธิ์", icon: UsersIcon },
  { key: "connections", label: "การเชื่อมต่อ", icon: GlobeIcon },
  { key: "more", label: "ฟีเจอร์เพิ่มเติม", icon: ClockIcon, comingSoon: true },
];

function Toggle({ defaultChecked }: { defaultChecked?: boolean }) {
  return (
    <label className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center">
      <input type="checkbox" defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="absolute inset-0 rounded-full bg-zinc-200 transition-colors peer-checked:bg-blue-600" />
      <span className="relative ml-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
    </label>
  );
}

function FieldSelect({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-zinc-600">{label}</label>
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
      >
        {value}
        <ChevronDownIcon className="h-3.5 w-3.5 text-zinc-400" />
      </button>
    </div>
  );
}

const DESCRIPTION = "จัดการข้อมูลลูกค้า การต่ออายุ และความสัมพันธ์ เพื่อการดูแลลูกค้าอย่างต่อเนื่อง";

// This new workspace has no Core integration yet, so every field/toggle
// here is a real-shaped but inert control — same "honest preview" treatment
// CustomersPage/RenewalsPage use. Only the tab switcher itself (`tab` state)
// is real interaction; nothing here persists.
export function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("general");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Customer Workspace</p>
        <h1 className="text-2xl font-bold text-zinc-900">ตั้งค่าพื้นที่ทำงาน</h1>
        <p className="text-sm text-zinc-500">จัดการการตั้งค่าพื้นที่ทำงานลูกค้า เพื่อให้สอดคล้องกับการใช้งานขององค์กรของคุณ</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <div className="flex flex-col gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                tab === t.key ? "bg-blue-50 text-blue-600" : "text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              <t.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{t.label}</span>
              {t.comingSoon && (
                <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400">เร็ว ๆ นี้</span>
              )}
            </button>
          ))}
        </div>

        {tab !== "general" ? (
          <Card className="flex min-h-[300px] flex-col items-center justify-center gap-2 p-10 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
              {(() => {
                const Icon = TABS.find((t) => t.key === tab)!.icon;
                return <Icon className="h-4 w-4" />;
              })()}
            </span>
            <p className="text-sm font-semibold text-zinc-700">{TABS.find((t) => t.key === tab)!.label}</p>
            <p className="text-sm text-zinc-400">ฟีเจอร์นี้ยังไม่พร้อมใช้งาน</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-6">
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-zinc-900">ข้อมูลพื้นฐานของพื้นที่ทำงาน</h2>
                <Button className="px-4 text-sm">บันทึกการเปลี่ยนแปลง</Button>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="flex items-start gap-4">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <UsersIcon className="h-7 w-7" />
                  </span>
                  <div>
                    <p className="font-semibold text-zinc-900">Customer Workspace</p>
                    <p className="mb-2 text-xs text-zinc-400">{DESCRIPTION}</p>
                    <button type="button" className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50">
                      เปลี่ยนไอคอน
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm text-zinc-600">ชื่อพื้นที่ทำงาน</label>
                    <input
                      type="text"
                      defaultValue="Customer Workspace"
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm text-zinc-600">คำอธิบาย</label>
                    <textarea
                      rows={3}
                      defaultValue={DESCRIPTION}
                      maxLength={200}
                      className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 focus:border-blue-400 focus:outline-none"
                    />
                    <p className="mt-1 text-right text-xs text-zinc-400">{DESCRIPTION.length}/200</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="mb-1 text-sm font-bold text-zinc-900">การตั้งค่าทั่วไป</h2>
              <p className="mb-4 text-xs text-zinc-400">กำหนดการตั้งค่าพื้นฐานสำหรับการใช้งานพื้นที่ทำงานลูกค้า</p>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="flex flex-col gap-4">
                  <FieldSelect label="เขตเวลา" value="(GMT+7) Bangkok, Thailand" />
                  <div className="grid grid-cols-2 gap-3">
                    <FieldSelect label="ภาษาเริ่มต้น" value="ไทย" />
                    <FieldSelect label="รูปแบบวันที่" value="31 ธ.ค. 2569" />
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  {[
                    { icon: BellIcon, title: "เปิดใช้งานการแจ้งเตือนทางอีเมล", desc: "รับการแจ้งเตือนเกี่ยวกับการต่ออายุ และกิจกรรมสำคัญ", defaultChecked: true },
                    { icon: UsersIcon, title: "แสดงลูกค้ากลุ่มภายในองค์กร", desc: "รวมลูกค้าที่เป็นหน่วยงานภายในขององค์กร (ถ้ามี)", defaultChecked: false },
                    { icon: ClockIcon, title: "แสดงมูลค่าการต่ออายุ", desc: "แสดงมูลค่าข้อตกลงในการต่ออายุในรายการ", defaultChecked: true },
                  ].map((row) => (
                    <div key={row.title} className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
                          <row.icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-zinc-800">{row.title}</p>
                          <p className="text-xs text-zinc-400">{row.desc}</p>
                        </div>
                      </div>
                      <Toggle defaultChecked={row.defaultChecked} />
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="p-5">
                <h2 className="mb-1 text-sm font-bold text-zinc-900">การตั้งค่าเริ่มต้น</h2>
                <p className="mb-4 text-xs text-zinc-400">กำหนดค่าที่ใช้เป็นค่าเริ่มต้นเมื่อสร้างข้อมูลใหม่</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FieldSelect label="สถานะเริ่มต้นของการต่ออายุ" value="ใกล้ครบกำหนด" />
                  <FieldSelect label="ช่วงเวลาแจ้งเตือนล่วงหน้า" value="30 วัน" />
                  <div>
                    <label className="mb-1.5 block text-sm text-zinc-600">ผู้รับผิดชอบเริ่มต้น</label>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                    >
                      <Avatar name={currentUserName} size={20} />
                      <span className="flex-1">{currentUserName} (ตัวฉัน)</span>
                      <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    </button>
                  </div>
                  <FieldSelect label="มุมมองรายการเริ่มต้น" value="ทุกการต่ออายุ" />
                </div>
              </Card>

              <Card className="p-5">
                <h2 className="mb-4 text-sm font-bold text-zinc-900">ข้อมูลการใช้งาน</h2>
                <p className="mb-4 -mt-3 text-xs text-zinc-400">ภาพรวมการใช้งานพื้นที่ทำงานลูกค้าในองค์กรของคุณ</p>
                <div className="flex flex-col divide-y divide-zinc-100">
                  {[
                    { icon: UsersIcon, label: "ผู้ใช้งานทั้งหมด", value: usageStats.totalUsers, cta: "จัดการผู้ใช้" },
                    { icon: UsersIcon, label: "ลูกค้าทั้งหมด", value: customerStats.total, cta: "ไปที่รายการลูกค้า" },
                    { icon: CalendarIcon, label: "การต่ออายุทั้งหมด", value: usageStats.totalRenewals, cta: "ไปที่รายการการต่ออายุ" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <row.icon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm text-zinc-500">{row.label}</p>
                          <p className="text-lg font-bold text-zinc-900">{row.value}</p>
                        </div>
                      </div>
                      <button type="button" className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                        {row.cta}
                        <ArrowRightIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      <WorkspaceFooter />
    </div>
  );
}
